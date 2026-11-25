import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Tab } from "../components/BottomNav";
import { Icon } from "../components/Icons";
import { InstallBanner } from "../components/Install";
import Mascot from "../components/Mascot";
import TopBar from "../components/TopBar";
import { ConfirmButton, SectionHead } from "../components/ui";
import { kgFmt } from "../components/WeightChart";
import { dayKey, daysBetween, fmtTime, nextAnniversary, relDay } from "../lib/dates";
import { LOG_TYPES, gFor } from "../lib/data";
import { fx } from "../lib/fx";
import { ACHIEVEMENTS, activeDays, computeMood, doneKey, happiness, moodLabel, moodLines, streak } from "../lib/gamify";
import { logsForDay, useActiveDog, useApp } from "../lib/store";
import type { LogType } from "../lib/types";
import { useNow, useUI } from "../lib/ui";

function phaseOf(h: number) {
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

const QUICK: LogType[] = ["meal", "walk", "pee", "poop"];

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
  const upcoming = health
    .filter((h) => h.dogId === dog.id && h.due)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))
    .filter((h) => daysBetween(day, h.due!) <= 30)
    .slice(0, 3);
  const badges = ACHIEVEMENTS.filter((a) => dog.unlocked[a.id]).sort((a, b) => dog.unlocked[b.id].localeCompare(dog.unlocked[a.id]));
  const nextBadge = ACHIEVEMENTS.find((a) => !dog.unlocked[a.id]);

  const anniversaries = [
    dog.birth ? { kind: "birth" as const, ...nextAnniversary(dog.birth, day) } : null,
    dog.gotcha ? { kind: "gotcha" as const, ...nextAnniversary(dog.gotcha, day) } : null,
  ].filter((a): a is NonNullable<typeof a> => !!a && a.years > 0 && a.inDays <= 30);

  const celebrated = useRef(false);
  useEffect(() => {
    if (!celebrated.current && anniversaries.some((a) => a.inDays === 0)) {
      celebrated.current = true;
      setTimeout(() => fx.emit({ type: "confetti", big: true }), 600);
    }
  }, [anniversaries]);

  const pet = () => {
    const opts = ["הב הב! 🐾", "עוד ליטוף!", `אני ${g("אוהב", "אוהבת")} אתכם!`, "כיף לי איתכם!", `גררר... סתם, אני ${g("מתלהב", "מתלהבת")} 😄`];
    setPetLine(opts[Math.floor(Math.random() * opts.length)]);
    clearTimeout(petTimer.current);
    petTimer.current = setTimeout(() => setPetLine(null), 1800);
  };

  return (
    <div className="screen home">
      <TopBar />
      <InstallBanner />

      {dog.demo && (
        <div className="demo-banner">
          <span>
            {dog.name} {g("הוא כלב", "היא כלבה")} לדוגמה. כל הנתונים כאן להתנסות בלבד.
          </span>
          <div className="demo-actions">
            <button type="button" className="btn btn-primary small" onClick={startOnboarding}>
              הוספת הכלב שלי
            </button>
            <ConfirmButton className="btn btn-ghost small" label="מחיקת הדוגמה" confirmLabel="למחוק?" onConfirm={() => removeDog(dog.id)} />
          </div>
        </div>
      )}

      <section className={`scene scene-${phase}`} aria-label={`${dog.name} ${moodLabel(mood, g)}`}>
        <div className="scene-sky" aria-hidden="true">
          {phase === "night" ? (
            <>
              <span className="moon" />
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className="star" style={{ insetInlineStart: `${(i * 37) % 96}%`, top: `${(i * 23) % 52}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
              ))}
            </>
          ) : (
            <span className="sun" />
          )}
          <span className="cloud c1" />
          <span className="cloud c2" />
        </div>
        <div className="scene-hill" aria-hidden="true" />
        <div className="scene-ball" aria-hidden="true" />
        <div className="scene-dog">
          <Mascot coat={dog.coat} pattern={dog.pattern} mood={mood} size={168} interactive label={`ללטף את ${dog.name}`} onPet={pet} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={line}
            className="bubble"
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            {line}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="mood-row">
        <span className="mood-label">
          מצב רוח: <strong>{moodLabel(mood, g)}</strong>
        </span>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={happy} aria-label="מד שמחה">
          <motion.div className="meter-fill" initial={{ width: 0 }} animate={{ width: `${happy}%` }} transition={{ type: "spring", stiffness: 60, damping: 14 }} />
        </div>
      </div>

      <div className="stats">
        <button type="button" className="stat" onClick={() => go("journal")}>
          <span className="stat-value">
            <motion.span className="flame" animate={st ? { scale: [1, 1.18, 1] } : {}} transition={{ repeat: Infinity, duration: 1.6 }}>
              🔥
            </motion.span>
            {st}
          </span>
          <span className="stat-label">{st === 1 ? "יום ברצף" : "ימים ברצף"}</span>
        </button>
        <button type="button" className="stat" onClick={() => go("growth")}>
          <span className="stat-value">{lastW ? kgFmt(lastW.kg) : "—"}</span>
          <span className="stat-label">{lastW ? "ק״ג במשקל אחרון" : "עוד לא נשקל"}</span>
        </button>
        <button type="button" className="stat" onClick={() => go("tricks")}>
          <span className="stat-value">
            {mastered}/{myTricks.length}
          </span>
          <span className="stat-label">טריקים</span>
        </button>
      </div>

      <section className="card tasks">
        <div className="card-head">
          <h2>המשימות של היום</h2>
          <span className={doneCount === total && total ? "count-pill full" : "count-pill"}>
            {doneCount}/{total}
          </span>
        </div>
        <ul className="task-list">
          {dog.routine.map((t) => {
            const isDone = t.id in done;
            const entry = isDone && done[t.id] ? logs.find((l) => l.id === done[t.id]) : undefined;
            return (
              <li key={t.id}>
                <button type="button" className={isDone ? "task done" : "task"} aria-pressed={isDone} onClick={() => toggleTask(t.id)}>
                  <span className="task-check">
                    <AnimatePresence>
                      {isDone && (
                        <motion.svg viewBox="0 0 24 24" width="20" height="20" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
                          <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="task-emoji" aria-hidden="true">
                    {t.emoji}
                  </span>
                  <span className="task-title">{t.title}</span>
                  {entry && <span className="task-time">{fmtTime(entry.at)}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {!total && <p className="muted small">אין משימות קבועות. אפשר להוסיף בהגדרות הכלב.</p>}
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
                  ? `מזל טוב! ${dog.name} ${g("חוגג", "חוגגת")} היום ${a.years === 1 ? "שנה" : a.years === 2 ? "שנתיים" : `${a.years} שנים`}!`
                  : `היום ${a.years === 1 ? "שנה" : a.years === 2 ? "שנתיים" : `${a.years} שנים`} ש${dog.name} איתכם!`
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
                    <span className={n < 0 ? "pill bad" : n <= 3 ? "pill warn" : "pill"}>{n < 0 ? `באיחור של ${-n === 1 ? "יום" : `${-n} ימים`}` : relDay(h.due!, day)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>הישגים</h2>
          <button type="button" className="link-btn" onClick={() => openSheet("badges")}>
            {badges.length}/{ACHIEVEMENTS.length}
          </button>
        </div>
        {badges.length ? (
          <div className="badge-row">
            {badges.slice(0, 5).map((a, i) => (
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
        ) : null}
        {nextBadge && (
          <p className="muted small next-badge">
            <Icon name="tricks" size={16} /> ההישג הבא: <strong>{nextBadge.title(g)}</strong>
            <span aria-hidden="true">·</span> {nextBadge.desc}
          </p>
        )}
      </section>
    </div>
  );
}
