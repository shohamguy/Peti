import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icons";
import { InstallCard } from "../components/Install";
import Mascot from "../components/Mascot";
import Sheet from "../components/Sheet";
import { ConfirmButton, DogAvatar, Segmented, useDogImage } from "../components/ui";
import { today } from "../lib/dates";
import { BREEDS, COATS, COAT_IDS, LOG_TYPES, PATTERNS, QUICK_TYPES, SIZES, SIZE_IDS, gFor } from "../lib/data";
import { fx } from "../lib/fx";
import { imageToDataUrl } from "../lib/image";
import { IS_ARTIFACT, loadPhoto, savePhoto } from "../lib/persist";
import { pickData, uid, useActiveDog, useApp } from "../lib/store";
import type { Data, Dog, LogType, Theme } from "../lib/types";
import { useUI } from "../lib/ui";

type Form = Pick<Dog, "name" | "sex" | "breed" | "size" | "coat" | "pattern"> & { birth: string; gotcha: string; avatar?: string };

const toForm = (d: Dog): Form => ({
  name: d.name,
  sex: d.sex,
  breed: d.breed,
  size: d.size,
  coat: d.coat,
  pattern: d.pattern,
  birth: d.birth ?? "",
  gotcha: d.gotcha ?? "",
  avatar: d.avatar,
});

const TASK_EMOJIS = ["🥣", "🦮", "💧", "🎾", "🦷", "🪮", "💊", "🧸", "🛏️", "🐾"];

export default function DogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dog = useActiveDog();
  const dogs = useApp((s) => s.dogs);
  const theme = useApp((s) => s.theme);
  const storage = useApp((s) => s.storage);
  const { updateDog, setActiveDog, removeDog, setTheme, resetAll, importData } = useApp.getState();
  const startOnboarding = useUI((s) => s.startOnboarding);
  const [form, setForm] = useState<Form | null>(dog ? toForm(dog) : null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEmoji, setTaskEmoji] = useState(TASK_EMOJIS[0]);
  const [taskType, setTaskType] = useState<LogType | "">("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const preview = useDogImage(form?.coat ?? "golden", form?.pattern ?? "plain", "full", 360);

  useEffect(() => {
    if (open && dog) setForm(toForm(dog));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dog?.id]);

  if (!dog || !form) return null;
  const g = gFor(form.sex);
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(dog));

  const saveProfile = () => {
    if (!form.name.trim()) return;
    updateDog(dog.id, {
      name: form.name.trim(),
      sex: form.sex,
      breed: form.breed.trim() || "מעורב",
      size: form.size,
      coat: form.coat,
      pattern: form.pattern,
      birth: form.birth || undefined,
      gotcha: form.gotcha || undefined,
      avatar: form.avatar,
    });
    fx.emit({ type: "toast", emoji: "🐶", text: "הפרופיל נשמר" });
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    try {
      const url = await imageToDataUrl(file, 256, true, 60_000);
      setForm((f) => (f ? { ...f, avatar: url } : f));
    } catch {
      fx.emit({ type: "toast", emoji: "⚠️", text: "לא הצלחנו לקרוא את התמונה" });
    } finally {
      if (avatarRef.current) avatarRef.current.value = "";
    }
  };

  const addTask = () => {
    if (!taskTitle.trim()) return;
    updateDog(dog.id, { routine: [...dog.routine, { id: "t-" + uid(), title: taskTitle.trim(), emoji: taskEmoji, ...(taskType ? { logType: taskType } : {}) }] });
    setTaskTitle("");
  };

  const exportData = async () => {
    const data = pickData(useApp.getState());
    const photos: Record<string, string> = {};
    for (const p of data.photos) {
      const src = await loadPhoto(p.id);
      if (src) photos[p.id] = src;
    }
    const blob = new Blob([JSON.stringify({ app: "peti", version: 1, exportedAt: new Date().toISOString(), data, photos })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `peti-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text()) as { app?: string; data?: Data; photos?: Record<string, string> };
      if (json.app !== "peti" || !json.data || !Array.isArray(json.data.dogs)) throw new Error("bad file");
      for (const [id, src] of Object.entries(json.photos ?? {})) await savePhoto(id, src);
      importData(json.data);
      fx.emit({ type: "toast", emoji: "📦", text: "הגיבוי שוחזר" });
      onClose();
    } catch {
      fx.emit({ type: "toast", emoji: "⚠️", text: "הקובץ הזה לא נראה כמו גיבוי של Peti" });
    }
  };

  const storageText =
    storage === "cloud"
      ? "הנתונים נשמרים בחשבון Claude שלך ומסתנכרנים בין המכשירים."
      : storage === "local"
        ? "הנתונים נשמרים במכשיר הזה בלבד. כדאי לשמור גיבוי מדי פעם."
        : "הדפדפן הזה לא מאפשר שמירה (אולי חלון פרטי). השינויים יימחקו כשתסגרו את הדף.";

  return (
    <Sheet open={open} onClose={onClose} title="הכלב וההגדרות">
      <div className="form">
        <section className="dogs-row" aria-label="הכלבים שלי">
          {dogs.map((d) => (
            <button key={d.id} type="button" className={d.id === dog.id ? "dog-pick on" : "dog-pick"} onClick={() => setActiveDog(d.id)} aria-pressed={d.id === dog.id}>
              <DogAvatar dog={d} size={52} />
              <span>{d.name}</span>
            </button>
          ))}
          <button type="button" className="dog-pick add" onClick={startOnboarding}>
            <span className="avatar add-avatar">
              <Icon name="plus" size={24} />
            </span>
            <span>כלב נוסף</span>
          </button>
        </section>

        <section className="profile">
          <div className="profile-preview">
            {form.avatar ? (
              <img className="avatar-big" src={form.avatar} alt={`התמונה של ${form.name}`} />
            ) : preview ? (
              <img className="dog-preview" src={preview} alt={`${form.name} בציור`} />
            ) : (
              <Mascot coat={form.coat} pattern={form.pattern} mood="happy" size={120} />
            )}
            <div className="profile-photo-btns">
              <label className="btn btn-ghost small">
                <Icon name="camera" size={18} /> {form.avatar ? "החלפת תמונה" : "תמונת פרופיל"}
                <input ref={avatarRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onAvatar(e.target.files?.[0])} />
              </label>
              {form.avatar && (
                <button type="button" className="btn btn-ghost small" onClick={() => setForm({ ...form, avatar: undefined })}>
                  חזרה לציור
                </button>
              )}
            </div>
          </div>

          <label className="field">
            <span>שם</span>
            <input id="d-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={24} required />
          </label>
          <div className="field">
            <span>בן או בת</span>
            <Segmented label="מין" value={form.sex} onChange={(sex) => setForm({ ...form, sex })} options={[{ value: "male", label: "בן" }, { value: "female", label: "בת" }]} />
          </div>
          <label className="field">
            <span>גזע</span>
            <input
              id="d-breed"
              list="breeds-edit"
              value={form.breed}
              onChange={(e) => {
                const hit = BREEDS.find(([b]) => b === e.target.value.trim());
                setForm({ ...form, breed: e.target.value, ...(hit ? { size: hit[1] } : {}) });
              }}
            />
            <datalist id="breeds-edit">
              {BREEDS.map(([b]) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>
          <div className="field">
            <span>גודל בבגרות</span>
            <Segmented label="גודל" value={form.size} onChange={(size) => setForm({ ...form, size })} options={SIZE_IDS.map((s) => ({ value: s, label: SIZES[s].name }))} />
          </div>
          <div className="row2">
            <label className="field">
              <span>תאריך לידה</span>
              <input id="d-birth" type="date" value={form.birth} max={today()} onChange={(e) => setForm({ ...form, birth: e.target.value })} />
            </label>
            <label className="field">
              <span>יום האימוץ</span>
              <input id="d-gotcha" type="date" value={form.gotcha} max={today()} onChange={(e) => setForm({ ...form, gotcha: e.target.value })} />
            </label>
          </div>
          <div className="field">
            <span>צבע הפרווה בציור</span>
            <div className="swatches" role="radiogroup" aria-label="צבע הפרווה">
              {COAT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={form.coat === id}
                  aria-label={COATS[id].name}
                  className={form.coat === id ? "swatch on" : "swatch"}
                  style={{ background: `linear-gradient(135deg, ${COATS[id].base} 55%, ${COATS[id].dark} 55%)` }}
                  onClick={() => setForm({ ...form, coat: id })}
                />
              ))}
            </div>
          </div>
          <div className="field">
            <span>דוגמה</span>
            <Segmented label="דוגמה" value={form.pattern} onChange={(pattern) => setForm({ ...form, pattern })} options={PATTERNS.map((p) => ({ value: p.id, label: p.name }))} />
          </div>
          <button type="button" className="btn btn-primary block" disabled={!dirty || !form.name.trim()} onClick={saveProfile}>
            {dirty ? "שמירת הפרופיל" : "הפרופיל שמור"}
          </button>
        </section>

        <section className="settings-block">
          <h3>המשימות הקבועות של {dog.name}</h3>
          <ul className="routine-list">
            {dog.routine.map((t) => (
              <li key={t.id}>
                <span aria-hidden="true">{t.emoji}</span>
                <span className="grow">{t.title}</span>
                <button
                  type="button"
                  className="icon-btn small"
                  aria-label={`הסרת ${t.title}`}
                  onClick={() => updateDog(dog.id, { routine: dog.routine.filter((x) => x.id !== t.id) })}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="add-task">
            <select id="task-emoji" aria-label="אייקון" value={taskEmoji} onChange={(e) => setTaskEmoji(e.target.value)}>
              {TASK_EMOJIS.map((em) => (
                <option key={em}>{em}</option>
              ))}
            </select>
            <input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="משימה חדשה, למשל: צחצוח שיניים" maxLength={30} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())} />
          </div>
          <div className="add-task">
            <select id="task-type" aria-label="נרשם ביומן בתור" value={taskType} onChange={(e) => setTaskType(e.target.value as LogType | "")}>
              <option value="">בלי רישום ביומן</option>
              {QUICK_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  נרשם ביומן: {LOG_TYPES[tp].label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost small" onClick={addTask} disabled={!taskTitle.trim()}>
              <Icon name="plus" size={18} /> הוספה
            </button>
          </div>
        </section>

        <section className="settings-block">
          <h3>האפליקציה</h3>
          {!IS_ARTIFACT && (
            <div className="field">
              <span>מראה</span>
              <Segmented<Theme>
                label="מראה"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "auto", label: "אוטומטי" },
                  { value: "light", label: "בהיר" },
                  { value: "dark", label: "כהה" },
                ]}
              />
            </div>
          )}
          <InstallCard />
          <p className="muted small">{storageText}</p>
          {!IS_ARTIFACT && (
            <div className="row2">
              <button type="button" className="btn btn-ghost small" onClick={() => void exportData()}>
                <Icon name="download" size={18} /> שמירת גיבוי
              </button>
              <label className="btn btn-ghost small">
                <Icon name="upload" size={18} /> שחזור מגיבוי
                <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void importFile(e.target.files?.[0])} />
              </label>
            </div>
          )}
        </section>

        <section className="settings-block danger-zone">
          <ConfirmButton
            label={`מחיקת ${dog.name} וכל הנתונים ${g("שלו", "שלה")}`}
            confirmLabel={`בטוח? כל היומן של ${dog.name} יימחק`}
            onConfirm={() => {
              removeDog(dog.id);
              onClose();
            }}
          />
          <ConfirmButton
            label="מחיקת כל הנתונים באפליקציה"
            confirmLabel="בטוח? אין דרך לשחזר"
            onConfirm={() => {
              onClose();
              void resetAll();
            }}
          />
        </section>
      </div>
    </Sheet>
  );
}
