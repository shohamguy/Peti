import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Icon } from "../components/Icons";
import ProgressRing from "../components/ProgressRing";
import Sheet from "../components/Sheet";
import TopBar from "../components/TopBar";
import { ConfirmButton, Segmented } from "../components/ui";
import { fmtDay } from "../lib/dates";
import { gFor } from "../lib/data";
import { useActiveDog, useApp } from "../lib/store";
import type { TrickLevel } from "../lib/types";

const EMOJIS = ["⭐", "🎾", "🦴", "🐾", "🎩", "🏃", "🤸", "🔔", "🎯", "👋"];

export default function Tricks() {
  const dog = useActiveDog()!;
  const all = useApp((s) => s.tricks);
  const { practiceTrick, setTrickLevel, deleteTrick, addTrick } = useApp.getState();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);
  const g = gFor(dog.sex);
  const LEVELS = ["עוד לא", "מתחילים", "כמעט", g("יודע!", "יודעת!")];

  const tricks = all.filter((t) => t.dogId === dog.id);
  const mastered = tricks.filter((t) => t.level === 3).length;
  const next = tricks.filter((t) => t.level > 0 && t.level < 3).sort((a, b) => b.level - a.level)[0] ?? tricks.find((t) => t.level === 0);
  const open = tricks.find((t) => t.id === openId);

  return (
    <div className="screen tricks">
      <TopBar title="טריקים" />

      <section className="card tricks-head">
        <ProgressRing value={tricks.length ? mastered / tricks.length : 0} size={84} stroke={9} label={`${mastered} מתוך ${tricks.length}`}>
          <span className="ring-big">
            {mastered}
            <small>/{tricks.length}</small>
          </span>
        </ProgressRing>
        <div>
          <strong>
            {dog.name} {g("יודע", "יודעת")} {mastered === 1 ? "טריק אחד" : `${mastered} טריקים`}
          </strong>
          {next && (
            <span className="muted small">
              הבא בתור: {next.emoji} {next.name}
            </span>
          )}
          <span className="muted small">5 דקות אימון ביום, עם הרבה שבחים וחטיפים.</span>
        </div>
      </section>

      <div className="trick-grid">
        {tricks.map((t, i) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            className={t.level === 3 ? "trick mastered" : "trick"}
            onClick={() => setOpenId(t.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.94 }}
            transition={{ delay: i * 0.025, type: "spring", stiffness: 360, damping: 26 }}
          >
            {t.level === 3 && (
              <motion.span className="trick-star" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} aria-hidden="true">
                ⭐
              </motion.span>
            )}
            <span className="trick-emoji" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="trick-name">{t.name}</span>
            <span className="trick-level" aria-label={LEVELS[t.level]}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={n <= t.level ? "lv on" : "lv"} />
              ))}
            </span>
            <span className="trick-label">{LEVELS[t.level]}</span>
          </motion.button>
        ))}
        <button type="button" className="trick add" onClick={() => setAdding(true)}>
          <span className="trick-emoji" aria-hidden="true">
            ➕
          </span>
          <span className="trick-name">טריק משלכם</span>
        </button>
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open ? `${open.emoji} ${open.name}` : ""}>
        {open && (
          <div className="form">
            {open.tip && <p className="tip">{open.tip}</p>}
            <div className="field">
              <span>איפה אנחנו?</span>
              <Segmented label="רמה" value={open.level} onChange={(v) => setTrickLevel(open.id, v as TrickLevel)} options={LEVELS.map((l, i) => ({ value: i, label: l }))} />
            </div>
            <p className="muted small">
              {open.sessions ? `${open.sessions === 1 ? "אימון אחד" : `${open.sessions} אימונים`}` : "עוד לא התאמנו"}
              {open.lastPracticed ? ` · אחרון: ${fmtDay(open.lastPracticed)}` : ""}
              {open.masteredAt ? ` · נלמד ${fmtDay(open.masteredAt)}` : ""}
            </p>
            <AnimatePresence mode="wait">
              <motion.button key={open.sessions} type="button" className="btn btn-primary block" initial={{ scale: 0.9 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }} onClick={() => practiceTrick(open.id)}>
                🎯 התאמנו עכשיו
              </motion.button>
            </AnimatePresence>
            <ConfirmButton
              label={
                <>
                  <Icon name="trash" size={18} /> הסרה מהרשימה
                </>
              }
              onConfirm={() => {
                deleteTrick(open.id);
                setOpenId(null);
              }}
            />
          </div>
        )}
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title="טריק חדש">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            addTrick(newName.trim(), newEmoji);
            setNewName("");
            setAdding(false);
          }}
        >
          <label className="field">
            <span>שם הטריק</span>
            <input id="t-name" data-autofocus value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30} placeholder="למשל: לסגור דלת" required />
          </label>
          <div className="field">
            <span>אייקון</span>
            <div className="emoji-pick" role="radiogroup" aria-label="אייקון">
              {EMOJIS.map((em) => (
                <button key={em} type="button" role="radio" aria-checked={newEmoji === em} className={newEmoji === em ? "on" : ""} onClick={() => setNewEmoji(em)}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary block">
            הוספה
          </button>
        </form>
      </Sheet>
    </div>
  );
}
