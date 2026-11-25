import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Tab } from "../components/BottomNav";
import DogVideo, { type Phase } from "../components/DogVideo";
import { Icon } from "../components/Icons";
import { InstallBanner } from "../components/Install";
import ProgressRing from "../components/ProgressRing";
import { ConfirmButton, SectionHead } from "../components/ui";
import { kgFmt } from "../components/WeightChart";
import { dayKey, daysBetween, fmtTime, nDays, nextAnniversary, relDay } from "../lib/dates";
import { LOG_TYPES, gFor } from "../lib/data";
import { fx } from "../lib/fx";
import { ACHIEVEMENTS, activeDays, computeMood, doneKey, happiness, levelInfo, moodLabel, moodLines, streak } from "../lib/gamify";
import { logsForDay, useActiveDog, useApp } from "../lib/store";
import type { LogType } from "../lib/types";
import { useNow, useUI } from "../lib/ui";

function phaseOf(h: number): Phase {
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

const QUICK: LogType[] = ["meal", "walk", "pee", "poop"];
const years = (n: number) => (n === 1 ? "שנה" : n === 2 ? "שנתיים" : `${n} שנים`);

export function quickLog(type: LogType) {
  const { log, deleteLog } = useApp.getState();
  const e = log(type);
  if (e)
    fx.emit({
      type: "toast",
      emoji: LOG_TYPES[type].emoji,
      text: `נרשם: ${LOG_TYPES[type].label}, ${fmtTime(e.at)}`,
      action: { label: "ביטול", run: () => deleteLog(e.id, true) },
    });
}

export default function Home({ go }: { go: (t: Tab) => void }) {
  const dog = useActiveDog()!;
  const logs = useApp((s) => s.logs);
  const taskDone = useApp((s) => s.taskDone);
  const weights = useApp((s) => s.weights);
  const tricks = useApp((s) => s.tricks);
  const health = useApp((s) => s.health);
  const toggleTask = useApp((s) => s.toggleTask);
  const removeDog = useApp((s) => s.removeDog);
  const { openSheet, startOnboarding } = useUI();
  const now = useNow();
  const day = dayKey(now);
  const g = gFor(dog.sex);

  const done = taskDone[doneKey(dog.id, day)] ?? {};
  const doneCount = dog.routine.filter((t) => t.id in done).length;
  const total = dog.routine.length;
  const todayLogs = logsForDay(logs, dog.id, day);
  const mood = computeMood({
    hour: now.getHours(),
    done: doneCount,
    total,
    mealToday: todayLogs.some((l) => l.type === "meal"),
    activeToday: todayLogs.some((l) => l.type === "walk" || l.type === "play" || l.type === "train"),
  });
  const lines = moodLines(mood, g);
  const [petLine, setPetLine] = useState<string | null>(null);
  const petTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const line = petLine ?? lines[(now.getDate() + now.getHours()) % lines.length];
  const happy = happiness(mood, doneCount, total);
  const phase = phaseOf(now.getHours());

  const st = useMemo(() => streak(activeDays({ logs, taskDone }, dog.id), day), [logs, taskDone, dog.id, day]);
  const myWeights = weights.filter((w) => w.dogId === dog.id).sort((a, b) => a.date.localeCompare(b.date));
  const lastW = myWeights[myWeights.length - 1];
  const myTricks = tricks.filter((t) => t.dogId === dog.id);
  const mastered = myTricks.filter((t) => t.level === 3).length;
  const lvl = levelInfo(dog.xp);
  const upcoming = health
    .filter((h) => h.dogId === dog.id && h.due && daysBetween(day, h.due) <= 30)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))
    .slice(0, 3);
  const badges = ACHIEVEMENTS.filter((a) => dog.unlocked[a.id]).sort((a, b) => dog.unlocked[b.id].localeCompare(dog.unlocked[a.id]));
  const nextBadge = ACHIEVEMENTS.find((a) => !dog.unlocked[a.id]);

  const anniversaries = [
    dog.birth ? { kind: "birth" as const, ...nextAnniversary(dog.birth, day) } : null,
    dog.gotcha ? { kind: "gotcha" as const, ...nextAnniversary(dog.gotcha, day) } : null,
  ].filter((a): a is NonNullable<typeof a> => !!a && a.years > 0 && a.inDays <= 30);
  const partyToday = anniversaries.some((a) => a.inDays === 0);

  const celebrated = useRef(false);
  useEffect(() => {
    if (!celebrated.current && partyToday) {
      celebrated.current = true;
      setTimeout(() => fx.emit({ type: "confetti", big: true }), 700);
    }
  }, [partyToday]);

  const pet = () => {
    const opts = ["הב הב! 🐾", "עוד ליטוף!", `אני ${g("אוהב", "אוהבת")} אתכם!`, "כיף לי איתכם!", `ממממ, ${g("מפנק", "מפנקת")} אותי 😊`];
    setPetLine(opts[Math.floor(Math.random() * opts.length)]);
    clearTimeout(petTimer.current);
    petTimer.current = setTimeout(() => setPetLine(null), 2000);
  };

  return (
    <div className="page home">
      <InstallBanner />

      {dog.demo && (
        <div className="demo-banner">
          <span>
            {dog.name} {g("הוא כלב", "היא כלבה")} לדוגמה. אפשר לנסות הכל ולמחוק אחר כך.
          </span>
          <div className="demo-actions">
            <button type="button" className="btn btn-primary small" onClick={startOnboarding}>
              הוספת הכלב שלי
            </button>
            <ConfirmButton className="btn btn-ghost small" label="מחיקת הדוגמה" confirmLabel="למחוק?" onConfirm={() => removeDog(dog.id)} />
          </div>
        </div>
      )}

      <section className={`home-stage phase-${phase}`} aria-label={`${dog.name}: ${moodLabel(mood, g)}`}>
        <DogVideo mood={mood} phase={phase} interactive onPet={pet} label={`ללטף את ${dog.name}`} />
      </section>

      <div className="speech">
        <AnimatePresence mode="wait">
          <motion.p
            key={line}
            className="speech-line"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            {line}
          </motion.p>
        </AnimatePresence>
        <div className="speech-mood">
          <strong>{moodLabel(mood, g)}</strong>
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={happy} aria-label="מד שמחה">
            <motion.div className="meter-fill" initial={{ width: 0 }} animate={{ width: `${happy}%` }} transition={{ type: "spring", stiffness: 60, damping: 14 }} />
          </div>
          <span className="num">{happy}%</span>
        </div>
      </div>

      <div className="stats-row">
        <button type="button" className="stat-chip" onClick={() => go("journal")}>
          <motion.span animate={st ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1.6 }} aria-hidden="true">
            🔥
          </motion.span>
          <strong>{st}</strong>
          <span>{st === 1 ? "יום ברצף" : "ימים ברצף"}</span>
        </button>
        <button type="button" className="stat-chip" onClick={() => go("growth")}>
          <span aria-hidden="true">⚖️</span>
          <strong>{lastW ? kgFmt(lastW.kg) : "—"}</strong>
          <span>{lastW ? "ק״ג" : "לא נשקל"}</span>
        </button>
        <button type="button" className="stat-chip" onClick={() => go("tricks")}>
          <span aria-hidden="true">⭐</span>
          <strong>
            {mastered}/{myTricks.length}
          </strong>
          <span>טריקים</span>
        </button>
      </div>

      <section className="card today">
        <div className="today-head">
          <ProgressRing value={total ? doneCount / total : 0} size={46} stroke={5} label={`${doneCount} מתוך ${total}`}>
            <span className="level-num">{doneCount}</span>
          </ProgressRing>
          <div className="today-text">
            <h2>המשימות של היום</h2>
            <span className="muted small">
              {total === 0 ? "אין משימות קבועות" : doneCount === total ? "הכל בוצע. יום מושלם!" : `נשארו ${total - doneCount} מתוך ${total}`}
            </span>
          </div>
        </div>
        <ul className="task-grid">
          {dog.routine.map((t) => {
            const isDone = t.id in done;
            const entry = isDone && done[t.id] ? logs.find((l) => l.id === done[t.id]) : undefined;
            return (
              <li key={t.id}>
                <motion.button type="button" className={isDone ? "task-tile done" : "task-tile"} aria-pressed={isDone} onClick={() => toggleTask(t.id)} whileTap={{ scale: 0.93 }}>
                  <AnimatePresence>
                    {isDone && (
                      <motion.span className="task-check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                        <Icon name="check" size={13} strokeWidth={3.2} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="task-emoji" aria-hidden="true">
                    {t.emoji}
                  </span>
                  <span className="task-title">{t.title}</span>
                  {entry && <span className="task-time">{fmtTime(entry.at)}</span>}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="quick">
        <SectionHead title="רישום מהיר">
          <button type="button" className="link-btn" onClick={() => go("journal")}>
            ליומן המלא
          </button>
        </SectionHead>
        <div className="quick-row">
          {QUICK.map((type) => (
            <motion.button key={type} type="button" className="quick-btn" whileTap={{ scale: 0.88, rotate: -4 }} onClick={() => quickLog(type)}>
              <span className="quick-emoji" style={{ background: LOG_TYPES[type].tint }}>
                {LOG_TYPES[type].emoji}
              </span>
              <span>{LOG_TYPES[type].label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {anniversaries.map((a) => (
        <section key={a.kind} className={a.inDays === 0 ? "card party today" : "card party"}>
          <span className="party-emoji" aria-hidden="true">
            {a.kind === "birth" ? "🎂" : "🏠"}
          </span>
          <div>
            <strong>
              {a.inDays === 0
                ? a.kind === "birth"
                  ? `מזל טוב! ${dog.name} ${g("חוגג", "חוגגת")} היום ${years(a.years)}!`
                  : `היום ${years(a.years)} ש${dog.name} איתכם!`
                : a.kind === "birth"
                  ? `יום הולדת ${a.years} ${relDay(a.day, day)}`
                  : `יום אימוץ ${relDay(a.day, day)}`}
            </strong>
            <span className="muted small">{a.kind === "birth" ? "תכננו מסיבה עם עוגה לכלבים 🦴" : "יום השנה להגעה הביתה"}</span>
          </div>
        </section>
      ))}

      {upcoming.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>בריאות בקרוב</h2>
            <button type="button" className="link-btn" onClick={() => go("health")}>
              הכל
            </button>
          </div>
          <ul className="mini-list">
            {upcoming.map((h) => {
              const n = daysBetween(day, h.due!);
              return (
                <li key={h.id}>
                  <button type="button" className="mini-row" onClick={() => go("health")}>
                    <span className="mini-title">{h.title}</span>
                    <span className={n < 0 ? "pill bad" : n <= 3 ? "pill warn" : "pill"}>{n < 0 ? `באיחור של ${nDays(-n)}` : relDay(h.due!, day)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>
            רמה {lvl.level}: {lvl.title}
          </h2>
          <button type="button" className="link-btn" onClick={() => openSheet("badges")}>
            {badges.length}/{ACHIEVEMENTS.length}
          </button>
        </div>
        {badges.length > 0 && (
          <div className="badge-row">
            {badges.slice(0, 6).map((a, i) => (
              <motion.button
                key={a.id}
                type="button"
                className="badge-chip"
                title={a.title(g)}
                onClick={() => openSheet("badges")}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 380, damping: 14 }}
              >
                <span aria-hidden="true">{a.emoji}</span>
                <span className="sr-only">{a.title(g)}</span>
              </motion.button>
            ))}
          </div>
        )}
        {nextBadge && (
          <p className="muted small next-badge">
            ההישג הבא: <strong>{nextBadge.title(g)}</strong>
            <span aria-hidden="true">·</span> {nextBadge.desc}
          </p>
        )}
      </section>
    </div>
  );
}
