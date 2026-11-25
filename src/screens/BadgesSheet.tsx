import { motion } from "framer-motion";
import ProgressRing from "../components/ProgressRing";
import Sheet from "../components/Sheet";
import { dayKey, fmtDay } from "../lib/dates";
import { gFor } from "../lib/data";
import { ACHIEVEMENTS, achContext, levelInfo } from "../lib/gamify";
import { pickData, useActiveDog, useApp } from "../lib/store";

export default function BadgesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dog = useActiveDog();
  const state = useApp();
  if (!dog) return null;
  const g = gFor(dog.sex);
  const lvl = levelInfo(dog.xp);
  const ctx = achContext(pickData(state), dog);
  const got = ACHIEVEMENTS.filter((a) => dog.unlocked[a.id]).length;

  return (
    <Sheet open={open} onClose={onClose} title="רמה והישגים">
      <div className="form">
        <section className="level-card">
          <ProgressRing value={lvl.pct} size={92} stroke={10} label={`רמה ${lvl.level}`}>
            <span className="ring-big">{lvl.level}</span>
          </ProgressRing>
          <div>
            <strong className="level-title">{lvl.title}</strong>
            <span className="muted small">
              {dog.xp.toLocaleString("he-IL")} XP · עוד {(lvl.next - dog.xp).toLocaleString("he-IL")} לרמה {lvl.level + 1}
            </span>
            <span className="muted small">כל רישום, משימה, שקילה ואימון מוסיפים נקודות לצוות שלכם.</span>
          </div>
        </section>

        <p className="muted small">
          {got} מתוך {ACHIEVEMENTS.length} הישגים
        </p>
        <ul className="badge-grid">
          {ACHIEVEMENTS.map((a, i) => {
            const at = dog.unlocked[a.id];
            const v = Math.min(a.goal, a.value(ctx));
            return (
              <motion.li
                key={a.id}
                className={at ? "badge got" : "badge"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 380, damping: 22 }}
              >
                <span className="badge-emoji" aria-hidden="true">
                  {a.emoji}
                </span>
                <strong>{a.title(g)}</strong>
                <span className="muted small">{a.desc}</span>
                {at ? (
                  <span className="small got-date">✓ {fmtDay(dayKey(at))}</span>
                ) : (
                  <span className="badge-progress" role="progressbar" aria-valuemin={0} aria-valuemax={a.goal} aria-valuenow={v}>
                    <span style={{ width: `${(v / a.goal) * 100}%` }} />
                  </span>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
