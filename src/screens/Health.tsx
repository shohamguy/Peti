import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Icon } from "../components/Icons";
import Sheet from "../components/Sheet";
import TopBar from "../components/TopBar";
import { ConfirmButton, Empty, SectionHead } from "../components/ui";
import { addDays, daysBetween, fmtDay, nDays, relDay, today } from "../lib/dates";
import { HEALTH_KINDS, HEALTH_KIND_IDS, HEALTH_TEMPLATES, REPEAT_OPTIONS, repeatLabel } from "../lib/data";
import { useActiveDog, useApp } from "../lib/store";
import type { HealthItem, HealthKind } from "../lib/types";

type Draft = { id?: string; kind: HealthKind; title: string; due: string; lastDone: string; repeatDays: number; note: string };

const blank = (): Draft => ({ kind: "vaccine", title: "", due: today(), lastDone: "", repeatDays: 0, note: "" });

function status(h: HealthItem, t: string) {
  if (!h.due) return { group: "done" as const, n: 0 };
  const n = daysBetween(t, h.due);
  return { group: n < 0 ? ("late" as const) : n <= 14 ? ("soon" as const) : ("later" as const), n };
}

const GROUPS = [
  { id: "late", title: "באיחור" },
  { id: "soon", title: "בשבועיים הקרובים" },
  { id: "later", title: "בהמשך" },
  { id: "done", title: "בוצע (חד־פעמי)" },
] as const;

export default function Health() {
  const dog = useActiveDog()!;
  const all = useApp((s) => s.health);
  const { saveHealth, markHealthDone, deleteHealth, updateDog } = useApp.getState();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [vetOpen, setVetOpen] = useState(false);
  const [vet, setVet] = useState({ clinic: "", vetPhone: "", chip: "", license: "" });
  const t = today();

  const items = all.filter((h) => h.dogId === dog.id).sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  const withStatus = items.map((h) => ({ h, s: status(h, t) }));
  const late = withStatus.filter((x) => x.s.group === "late").length;
  const soon = withStatus.filter((x) => x.s.group === "soon").length;

  const openEdit = (h?: HealthItem) =>
    setDraft(h ? { id: h.id, kind: h.kind, title: h.title, due: h.due ?? "", lastDone: h.lastDone ?? "", repeatDays: h.repeatDays, note: h.note ?? "" } : blank());

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const due = draft.due || (draft.lastDone && draft.repeatDays ? addDays(draft.lastDone, draft.repeatDays) : undefined);
    saveHealth({
      id: draft.id,
      kind: draft.kind,
      title: draft.title.trim(),
      due,
      lastDone: draft.lastDone || undefined,
      repeatDays: draft.repeatDays,
      note: draft.note.trim() || undefined,
    });
    setDraft(null);
  };

  return (
    <div className="screen health">
      <TopBar title="בריאות" />

      <motion.section className={late ? "status-card bad" : soon ? "status-card warn" : "status-card good"} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <span className="status-icon" aria-hidden="true">
          {late ? "⏰" : soon ? "📅" : "💚"}
        </span>
        <div>
          <strong>{late ? `${late === 1 ? "טיפול אחד" : `${late} טיפולים`} באיחור` : soon ? `${soon === 1 ? "טיפול אחד" : `${soon} טיפולים`} בשבועיים הקרובים` : items.length ? "הכל מעודכן" : "עוד אין תזכורות"}</strong>
          <span className="small">{items.length ? "לחצו ״בוצע״ אחרי כל טיפול, והתזכורת הבאה תתעדכן לבד." : "הוסיפו חיסונים וטיפולים, ונזכיר לכם בזמן."}</span>
        </div>
      </motion.section>

      <button type="button" className="btn btn-primary block" onClick={() => openEdit()}>
        <Icon name="plus" size={20} /> תזכורת חדשה
      </button>

      {items.length === 0 ? (
        <Empty emoji="🩺" title="אין תזכורות עדיין">
          <span className="muted small">התחילו מחיסון כלבת, טיפול נגד פרעושים וקרציות ותילוע.</span>
        </Empty>
      ) : (
        GROUPS.map((grp) => {
          const list = withStatus.filter((x) => x.s.group === grp.id);
          if (!list.length) return null;
          return (
            <section key={grp.id} className="h-group">
              <SectionHead title={grp.title} />
              <ul className="h-list">
                <AnimatePresence initial={false}>
                  {list.map(({ h, s }) => (
                    <motion.li key={h.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
                      <div className="h-item card">
                        <button type="button" className="h-main" onClick={() => openEdit(h)}>
                          <span className="h-emoji" aria-hidden="true">
                            {HEALTH_KINDS[h.kind].emoji}
                          </span>
                          <span className="h-text">
                            <strong>{h.title}</strong>
                            <span className="muted small">
                              {h.lastDone ? `בוצע ${fmtDay(h.lastDone)}` : HEALTH_KINDS[h.kind].label}
                              {h.repeatDays ? ` · ${repeatLabel(h.repeatDays)}` : ""}
                            </span>
                            {h.note && <span className="muted small">{h.note}</span>}
                          </span>
                          {h.due && (
                            <span className={s.group === "late" ? "pill bad" : s.n <= 3 ? "pill warn" : "pill"}>
                              {s.group === "late" ? `באיחור של ${nDays(-s.n)}` : relDay(h.due, t)}
                            </span>
                          )}
                        </button>
                        {h.due && (
                          <motion.button type="button" className="btn btn-primary small done-btn" whileTap={{ scale: 0.9 }} onClick={() => markHealthDone(h.id)}>
                            <Icon name="check" size={18} /> בוצע
                          </motion.button>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })
      )}

      <section className="card vet-card">
        <div className="card-head">
          <h2>וטרינר ותעודות</h2>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setVet({ clinic: dog.clinic ?? "", vetPhone: dog.vetPhone ?? "", chip: dog.chip ?? "", license: dog.license ?? "" });
              setVetOpen(true);
            }}
          >
            עריכה
          </button>
        </div>
        <dl className="kv">
          <dt>מרפאה</dt>
          <dd>{dog.clinic || "—"}</dd>
          <dt>טלפון</dt>
          <dd>{dog.vetPhone ? <a href={`tel:${dog.vetPhone.replace(/[^\d+]/g, "")}`}>{dog.vetPhone}</a> : "—"}</dd>
          <dt>מספר שבב</dt>
          <dd className="num">{dog.chip || "—"}</dd>
          <dt>מספר רישיון</dt>
          <dd className="num">{dog.license || "—"}</dd>
        </dl>
      </section>

      <p className="muted small disclaimer">התזכורות כאן נועדו לעזור לזכור. את לוח החיסונים והטיפולים קובעים יחד עם הווטרינר.</p>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "עריכת תזכורת" : "תזכורת חדשה"}>
        {draft && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {!draft.id && (
              <div className="field">
                <span>בחירה מהירה</span>
                <div className="chips">
                  {HEALTH_TEMPLATES.map((tp) => (
                    <button
                      key={tp.title}
                      type="button"
                      className={draft.title === tp.title ? "chip on" : "chip"}
                      onClick={() => setDraft({ ...draft, kind: tp.kind, title: tp.title, repeatDays: tp.repeatDays, note: tp.note ?? "" })}
                    >
                      {HEALTH_KINDS[tp.kind].emoji} {tp.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="field">
              <span>שם</span>
              <input id="h-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required maxLength={60} placeholder="למשל: חיסון כלבת" />
            </label>
            <label className="field">
              <span>סוג</span>
              <select id="h-kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as HealthKind })}>
                {HEALTH_KIND_IDS.map((k) => (
                  <option key={k} value={k}>
                    {HEALTH_KINDS[k].emoji} {HEALTH_KINDS[k].label}
                  </option>
                ))}
              </select>
            </label>
            <div className="row2">
              <label className="field">
                <span>מועד הבא</span>
                <input id="h-due" type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
              </label>
              <label className="field">
                <span>בוצע לאחרונה</span>
                <input id="h-last" type="date" value={draft.lastDone} max={t} onChange={(e) => setDraft({ ...draft, lastDone: e.target.value })} />
              </label>
            </div>
            <label className="field">
              <span>חוזר</span>
              <select id="h-repeat" value={draft.repeatDays} onChange={(e) => setDraft({ ...draft, repeatDays: Number(e.target.value) })}>
                {REPEAT_OPTIONS.map((o) => (
                  <option key={o.days} value={o.days}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>הערה</span>
              <input id="h-note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} maxLength={80} placeholder="שם התכשיר, מינון…" />
            </label>
            <button type="submit" className="btn btn-primary block">
              שמירה
            </button>
            {draft.id && (
              <ConfirmButton
                label={
                  <>
                    <Icon name="trash" size={18} /> מחיקת התזכורת
                  </>
                }
                onConfirm={() => {
                  deleteHealth(draft.id!);
                  setDraft(null);
                }}
              />
            )}
          </form>
        )}
      </Sheet>

      <Sheet open={vetOpen} onClose={() => setVetOpen(false)} title="וטרינר ותעודות">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            updateDog(dog.id, {
              clinic: vet.clinic.trim() || undefined,
              vetPhone: vet.vetPhone.trim() || undefined,
              chip: vet.chip.trim() || undefined,
              license: vet.license.trim() || undefined,
            });
            setVetOpen(false);
          }}
        >
          <label className="field">
            <span>שם המרפאה</span>
            <input id="v-clinic" value={vet.clinic} onChange={(e) => setVet({ ...vet, clinic: e.target.value })} maxLength={60} />
          </label>
          <label className="field">
            <span>טלפון</span>
            <input id="v-phone" type="tel" inputMode="tel" value={vet.vetPhone} onChange={(e) => setVet({ ...vet, vetPhone: e.target.value })} maxLength={20} dir="ltr" />
          </label>
          <label className="field">
            <span>מספר שבב</span>
            <input id="v-chip" inputMode="numeric" value={vet.chip} onChange={(e) => setVet({ ...vet, chip: e.target.value })} maxLength={20} dir="ltr" />
          </label>
          <label className="field">
            <span>מספר רישיון</span>
            <input id="v-license" value={vet.license} onChange={(e) => setVet({ ...vet, license: e.target.value })} maxLength={20} dir="ltr" />
          </label>
          <button type="submit" className="btn btn-primary block">
            שמירה
          </button>
        </form>
      </Sheet>
    </div>
  );
}
