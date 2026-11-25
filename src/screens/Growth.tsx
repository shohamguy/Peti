import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { Icon, Paw } from "../components/Icons";
import Sheet from "../components/Sheet";
import { ConfirmButton, Empty, SectionHead } from "../components/ui";
import WeightChart, { kgFmt } from "../components/WeightChart";
import { ageText, daysBetween, diffYMD, fmtDay, fmtLong, today } from "../lib/dates";
import { SIZES, gFor } from "../lib/data";
import { fx } from "../lib/fx";
import { imageToDataUrl } from "../lib/image";
import { useActiveDog, useApp } from "../lib/store";
import type { Dog, PhotoMeta } from "../lib/types";
import { usePhoto, useUI } from "../lib/ui";

function stages(dog: Dog) {
  const g = gFor(dog.sex);
  const s = SIZES[dog.size];
  const senior = s.seniorYears * 12;
  return [
    { name: "גור", from: 0, to: 6 },
    { name: g("מתבגר", "מתבגרת"), from: 6, to: s.mature[1] },
    { name: g("בוגר", "בוגרת"), from: s.mature[1], to: senior },
    { name: "גיל הזהב", from: senior, to: senior + 60 },
  ];
}

function StageTrack({ dog }: { dog: Dog }) {
  if (!dog.birth) return null;
  const st = stages(dog);
  const months = diffYMD(dog.birth, today()).months;
  const idx = Math.max(0, st.findIndex((s) => months >= s.from && months < s.to));
  const cur = st[idx];
  const within = Math.min(1, (months - cur.from) / (cur.to - cur.from));
  const pos = ((idx + within) / st.length) * 100;
  const [m1, m2] = SIZES[dog.size].mature;
  return (
    <div className="stage">
      <div className="stage-track">
        {st.map((s, i) => (
          <div key={s.name} className={i < idx ? "stage-seg past" : i === idx ? "stage-seg now" : "stage-seg"}>
            <span>{s.name}</span>
          </div>
        ))}
        <motion.div className="stage-marker" initial={{ insetInlineStart: "0%" }} animate={{ insetInlineStart: `${pos}%` }} transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.2 }}>
          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
            <Paw size={16} />
          </motion.span>
        </motion.div>
      </div>
      <p className="muted small">
        {idx < 2 ? `כלבים בגודל ${SIZES[dog.size].name} מגיעים בדרך כלל לגודל מלא בגיל ${m1}–${m2} חודשים.` : `השלב הבא: ${st[idx + 1]?.name ?? ""}.`}
      </p>
    </div>
  );
}

function PhotoCard({ p, birth, onOpen, i }: { p: PhotoMeta; birth?: string; onOpen: () => void; i: number }) {
  const src = usePhoto(p.id);
  return (
    <motion.button
      type="button"
      className="polaroid"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: i % 2 ? 2 : -2 }}
      whileTap={{ scale: 0.95, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.04 }}
    >
      <span className="polaroid-img">{src ? <img src={src} alt={p.caption ?? ""} loading="lazy" /> : <span className="ph-loading" />}</span>
      <span className="polaroid-cap">
        <strong>{birth && p.date >= birth ? `בגיל ${ageText(birth, p.date)}` : fmtDay(p.date)}</strong>
        {p.caption && <span>{p.caption}</span>}
      </span>
    </motion.button>
  );
}

function PhotoView({ p, onClose }: { p: PhotoMeta; onClose: () => void }) {
  const src = usePhoto(p.id);
  const { updatePhoto, removePhoto } = useApp.getState();
  const [cap, setCap] = useState(p.caption ?? "");
  return (
    <div className="form">
      {src && <img className="photo-big" src={src} alt={p.caption ?? ""} />}
      <p className="muted small">צולם ב־{fmtLong(p.date)}</p>
      <label className="field">
        <span>כיתוב</span>
        <input id="photo-cap" value={cap} onChange={(e) => setCap(e.target.value)} maxLength={60} placeholder="היום הראשון בבית" />
      </label>
      <button
        type="button"
        className="btn btn-primary block"
        onClick={() => {
          updatePhoto(p.id, cap.trim());
          onClose();
        }}
      >
        שמירה
      </button>
      <ConfirmButton
        label={
          <>
            <Icon name="trash" size={18} /> מחיקת התמונה
          </>
        }
        onConfirm={() => {
          removePhoto(p.id);
          onClose();
        }}
      />
    </div>
  );
}

export default function Growth() {
  const dog = useActiveDog()!;
  const allWeights = useApp((s) => s.weights);
  const allPhotos = useApp((s) => s.photos);
  const { addWeight, deleteWeight, addPhoto } = useApp.getState();
  const openSheet = useUI((s) => s.openSheet);
  const g = gFor(dog.sex);
  const weights = allWeights.filter((w) => w.dogId === dog.id).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const photos = allPhotos.filter((p) => p.dogId === dog.id).sort((a, b) => b.date.localeCompare(a.date));
  const last = weights[weights.length - 1];
  const prev = weights[weights.length - 2];

  const [wOpen, setWOpen] = useState(false);
  const [kg, setKg] = useState("");
  const [wDate, setWDate] = useState(today());
  const [newPhoto, setNewPhoto] = useState<{ url: string; date: string; caption: string } | null>(null);
  const [viewing, setViewing] = useState<PhotoMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rate = last && prev ? (last.kg - prev.kg) / Math.max(1, daysBetween(prev.date, last.date) / 7) : null;

  const openWeight = () => {
    setKg(last ? String(last.kg) : "");
    setWDate(today());
    setWOpen(true);
  };
  const step = (d: number) => setKg((v) => String(Math.max(0, Math.round(((Number(v) || 0) + d) * 10) / 10)));

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await imageToDataUrl(file, 720);
      const fileDay = file.lastModified ? new Date(file.lastModified) : new Date();
      const d = fileDay.toISOString().slice(0, 10);
      setNewPhoto({ url, date: d <= today() ? d : today(), caption: "" });
    } catch {
      fx.emit({ type: "toast", emoji: "⚠️", text: "לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="page growth">

      <section className="card age-card">
        {dog.birth ? (
          <>
            <p className="age-line">
              {dog.name} {g("בן", "בת")}
            </p>
            <motion.p className="age-big" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
              {ageText(dog.birth)}
            </motion.p>
            <StageTrack dog={dog} />
          </>
        ) : (
          <Empty emoji="🎂" title="מתי נולד הכלב?">
            <button type="button" className="btn btn-ghost small" onClick={() => openSheet("dog")}>
              הוספת תאריך לידה
            </button>
          </Empty>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>משקל</h2>
          <button type="button" className="btn btn-primary small" onClick={openWeight}>
            <Icon name="plus" size={18} /> שקילה
          </button>
        </div>
        {last ? (
          <>
            <div className="weight-hero">
              <span className="weight-num">{kgFmt(last.kg)}</span>
              <span className="weight-unit">ק״ג</span>
              {rate !== null && (
                <span className={rate >= 0 ? "pill good" : "pill warn"}>
                  {rate >= 0 ? "+" : "−"}
                  {kgFmt(Math.abs(rate))} ק״ג בשבוע
                </span>
              )}
            </div>
            <p className="muted small">נשקל {fmtLong(last.date)}</p>
            {weights.length > 1 ? <WeightChart points={weights} birth={dog.birth} /> : <p className="muted small">עוד שקילה אחת והגרף יתחיל לצמוח.</p>}
          </>
        ) : (
          <Empty emoji="⚖️" title="עוד לא נשקל">
            <span className="muted small">שקילה פעם בשבוע עוזרת לראות שהגדילה בקצב טוב.</span>
          </Empty>
        )}
      </section>

      {weights.length > 0 && (
        <section className="card">
          <SectionHead title="כל השקילות" />
          <table className="wtable">
            <thead>
              <tr>
                <th scope="col">תאריך</th>
                {dog.birth && <th scope="col">גיל</th>}
                <th scope="col">משקל</th>
                <th scope="col">
                  <span className="sr-only">מחיקה</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...weights].reverse().map((w) => (
                <tr key={w.id}>
                  <td>{fmtDay(w.date)}</td>
                  {dog.birth && <td className="muted">{w.date >= dog.birth ? ageText(dog.birth, w.date) : "—"}</td>}
                  <td className="num">{kgFmt(w.kg)} ק״ג</td>
                  <td>
                    <ConfirmButton className="icon-btn small" label={<Icon name="trash" size={16} />} confirmLabel="למחוק?" onConfirm={() => deleteWeight(w.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="album">
        <SectionHead title="אלבום גדילה">
          <label className={busy ? "btn btn-ghost small busy" : "btn btn-ghost small"}>
            <Icon name="camera" size={18} /> {busy ? "רגע…" : "תמונה"}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </SectionHead>
        {photos.length ? (
          <div className="polaroids">
            <AnimatePresence>
              {photos.map((p, i) => (
                <PhotoCard key={p.id} p={p} i={i} birth={dog.birth} onOpen={() => setViewing(p)} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Empty emoji="📸" title="אלבום ריק">
            <span className="muted small">תמונה בכל חודש, ובעוד שנה תראו כמה {dog.name} {g("גדל", "גדלה")}.</span>
          </Empty>
        )}
      </section>

      <Sheet open={wOpen} onClose={() => setWOpen(false)} title="שקילה חדשה">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(kg);
            if (!(v > 0 && v < 150)) return;
            addWeight(Math.round(v * 10) / 10, wDate);
            setWOpen(false);
          }}
        >
          <div className="stepper">
            <button type="button" className="icon-btn big" onClick={() => step(-0.1)} aria-label="פחות 0.1">
              −
            </button>
            <label className="stepper-field">
              <input id="w-kg" data-autofocus type="number" inputMode="decimal" step="0.1" min="0.1" max="150" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="0.0" required />
              <span>ק״ג</span>
            </label>
            <button type="button" className="icon-btn big" onClick={() => step(0.1)} aria-label="עוד 0.1">
              +
            </button>
          </div>
          <label className="field">
            <span>תאריך</span>
            <input id="w-date" type="date" value={wDate} max={today()} onChange={(e) => setWDate(e.target.value)} required />
          </label>
          <p className="muted small">טיפ: עולים על המשקל עם הכלב בידיים, ומחסירים את המשקל שלכם.</p>
          <button type="submit" className="btn btn-primary block">
            שמירה
          </button>
        </form>
      </Sheet>

      <Sheet open={!!newPhoto} onClose={() => setNewPhoto(null)} title="תמונה חדשה לאלבום">
        {newPhoto && (
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addPhoto(newPhoto.url, newPhoto.date, newPhoto.caption.trim() || undefined);
                setNewPhoto(null);
              } catch {
                fx.emit({ type: "toast", emoji: "⚠️", text: "לא הצלחנו לשמור את התמונה. נסו שוב." });
              }
            }}
          >
            <img className="photo-big" src={newPhoto.url} alt="" />
            <div className="row2">
              <label className="field">
                <span>מתי צולם?</span>
                <input id="np-date" type="date" value={newPhoto.date} max={today()} onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })} required />
              </label>
              <label className="field">
                <span>כיתוב</span>
                <input id="np-cap" value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} maxLength={60} placeholder="לא חובה" />
              </label>
            </div>
            <button type="submit" className="btn btn-primary block">
              הוספה לאלבום
            </button>
          </form>
        )}
      </Sheet>

      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={viewing?.caption || "תמונה"}>
        {viewing && <PhotoView key={viewing.id} p={viewing} onClose={() => setViewing(null)} />}
      </Sheet>
    </div>
  );
}
