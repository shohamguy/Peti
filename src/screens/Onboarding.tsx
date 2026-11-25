import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Mascot from "../components/Mascot";
import { Paw } from "../components/Icons";
import { Segmented } from "../components/ui";
import { addDays, today } from "../lib/dates";
import { BREEDS, COATS, COAT_IDS, PATTERNS, SIZES, SIZE_IDS, gFor } from "../lib/data";
import { fx } from "../lib/fx";
import { useApp } from "../lib/store";
import { useUI } from "../lib/ui";
import type { CoatId, Pattern, Sex, Size } from "../lib/types";

const STEPS = 4; // שם, מראה, פרטים, סיום

export default function Onboarding({ mode, onDone }: { mode: "first" | "add"; onDone: () => void }) {
  const addDog = useApp((s) => s.addDog);
  const loadDemo = useApp((s) => s.loadDemo);
  const [step, setStep] = useState(mode === "first" ? 0 : 1);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [coat, setCoat] = useState<CoatId>("golden");
  const [pattern, setPattern] = useState<Pattern>("plain");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState<Size>("medium");
  const [ageMode, setAgeMode] = useState<"date" | "approx">("date");
  const [birth, setBirth] = useState("");
  const [months, setMonths] = useState("3");
  const [gotcha, setGotcha] = useState("");
  const g = gFor(sex);
  const shown = name.trim() || g("הכלב שלכם", "הכלבה שלכם");

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const onBreed = (v: string) => {
    setBreed(v);
    const hit = BREEDS.find(([b]) => b === v.trim());
    if (hit) setSize(hit[1]);
  };

  const finish = () => {
    const m = Number(months);
    const b = ageMode === "date" ? birth || undefined : Number.isFinite(m) && m > 0 ? addDays(today(), -Math.round(m * 30.44)) : undefined;
    // מסך החגיגה נשאר פתוח גם אחרי שהכלב נוסף
    useUI.getState().startOnboarding();
    const { dogs, removeDog } = useApp.getState();
    addDog({ name: name.trim(), sex, coat, pattern, breed: breed.trim() || "מעורב", size, birth: b, gotcha: gotcha || undefined });
    dogs.filter((d) => d.demo).forEach((d) => removeDog(d.id));
    go(4);
  };

  useEffect(() => {
    if (step === 4) fx.emit({ type: "confetti", big: true });
  }, [step]);

  const nameOk = name.trim().length > 0;

  return (
    <div className="onboarding">
      {step > 0 && step < 4 && (
        <div className="ob-top">
          {mode === "add" || step > 1 ? (
            <button type="button" className="link-btn" onClick={() => (step === 1 ? onDone() : go(step - 1))}>
              {step === 1 ? "ביטול" : "חזרה"}
            </button>
          ) : (
            <span />
          )}
          <div className="ob-dots" aria-label={`שלב ${step} מתוך ${STEPS - 1}`}>
            {[1, 2, 3].map((i) => (
              <motion.span key={i} className="ob-dot" animate={{ width: i === step ? 26 : 9, opacity: i <= step ? 1 : 0.35 }} />
            ))}
          </div>
          <span />
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.section
          key={step}
          className={`ob-step ob-step-${step}`}
          custom={dir}
          initial={{ opacity: 0, x: dir * -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * 60 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          {step === 0 && (
            <>
              <div className="ob-hero">
                <motion.div className="ob-logo" initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 12 }}>
                  <Paw size={26} /> Peti
                </motion.div>
                <Mascot coat="golden" pattern="patch" mood="happy" size={210} interactive label="ליטוף" />
              </div>
              <h1 className="ob-title">היומן המונפש של הכלב שלכם</h1>
              <p className="ob-sub">טיולים, ארוחות, גדילה, חיסונים וטריקים. כל יום מסמנים, צוברים נקודות, והכלב שלכם שמח איתכם על המסך.</p>
              <div className="ob-actions">
                <button type="button" className="btn btn-primary block big" onClick={() => go(1)}>
                  בואו נתחיל
                </button>
                <button
                  type="button"
                  className="btn btn-ghost block"
                  onClick={() => {
                    loadDemo();
                    onDone();
                  }}
                >
                  להציץ עם כלב לדוגמה
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="ob-preview">
                <Mascot coat={coat} pattern={pattern} mood={nameOk ? "happy" : "calm"} size={150} />
              </div>
              <h1 className="ob-title">איך קוראים לכלב?</h1>
              <label className="field">
                <span>שם</span>
                <input
                  id="ob-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: לולה, רקס, שוקו"
                  maxLength={24}
                  autoComplete="off"
                  enterKeyHint="next"
                  onKeyDown={(e) => e.key === "Enter" && nameOk && go(2)}
                />
              </label>
              <div className="field">
                <span>בן או בת?</span>
                <Segmented label="מין" value={sex} onChange={setSex} options={[{ value: "male", label: "בן 🐶" }, { value: "female", label: "בת 🐶" }]} />
              </div>
              <div className="ob-actions">
                <button type="button" className="btn btn-primary block big" disabled={!nameOk} onClick={() => go(2)}>
                  הבא
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="ob-preview">
                <Mascot coat={coat} pattern={pattern} mood="happy" size={170} interactive label="ליטוף" />
              </div>
              <h1 className="ob-title">איך {shown} {g("נראה", "נראית")}?</h1>
              <div className="field">
                <span>צבע הפרווה</span>
                <div className="swatches" role="radiogroup" aria-label="צבע הפרווה">
                  {COAT_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={coat === id}
                      aria-label={COATS[id].name}
                      className={coat === id ? "swatch on" : "swatch"}
                      style={{ background: `linear-gradient(135deg, ${COATS[id].base} 55%, ${COATS[id].dark} 55%)` }}
                      onClick={() => setCoat(id)}
                    />
                  ))}
                </div>
              </div>
              <div className="field">
                <span>דוגמה</span>
                <Segmented label="דוגמה" value={pattern} onChange={setPattern} options={PATTERNS.map((p) => ({ value: p.id, label: p.name }))} />
              </div>
              <div className="ob-actions">
                <button type="button" className="btn btn-primary block big" onClick={() => go(3)}>
                  הבא
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="ob-title">עוד כמה פרטים על {shown}</h1>
              <label className="field">
                <span>גזע</span>
                <input id="ob-breed" list="breeds" value={breed} onChange={(e) => onBreed(e.target.value)} placeholder="מעורב, כנעני, לברדור…" autoComplete="off" />
                <datalist id="breeds">
                  {BREEDS.map(([b]) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </label>
              <div className="field">
                <span>גודל בבגרות</span>
                <Segmented label="גודל" value={size} onChange={setSize} options={SIZE_IDS.map((s) => ({ value: s, label: SIZES[s].name }))} />
                <small className="muted">{SIZES[size].hint}. משפיע על לוח הזמנים של הגדילה.</small>
              </div>
              <div className="field">
                <span>תאריך לידה</span>
                <Segmented
                  label="איך להזין גיל"
                  value={ageMode}
                  onChange={setAgeMode}
                  options={[
                    { value: "date", label: "יודעים בדיוק" },
                    { value: "approx", label: "גיל משוער" },
                  ]}
                />
                {ageMode === "date" ? (
                  <input id="ob-birth" type="date" value={birth} max={today()} onChange={(e) => setBirth(e.target.value)} />
                ) : (
                  <div className="inline-field">
                    <input id="ob-months" type="number" inputMode="numeric" min={1} max={240} value={months} onChange={(e) => setMonths(e.target.value)} />
                    <span>חודשים</span>
                  </div>
                )}
              </div>
              <label className="field">
                <span>יום האימוץ (לא חובה)</span>
                <input id="ob-gotcha" type="date" value={gotcha} max={today()} onChange={(e) => setGotcha(e.target.value)} />
              </label>
              <div className="ob-actions">
                <button type="button" className="btn btn-primary block big" onClick={finish}>
                  סיום
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="ob-preview">
                <Mascot coat={coat} pattern={pattern} mood="ecstatic" size={210} interactive label="ליטוף" />
              </div>
              <h1 className="ob-title">נעים להכיר, {name.trim()}!</h1>
              <p className="ob-sub">
                {g("הוא", "היא")} כבר {g("מחכה", "מחכה")} לכם בבית. סמנו משימות, רשמו טיולים וצברו נקודות. ואפשר ללטף {g("אותו", "אותה")} על המסך בכל רגע.
              </p>
              <div className="ob-actions">
                <button type="button" className="btn btn-primary block big" onClick={onDone}>
                  יאללה, מתחילים
                </button>
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
