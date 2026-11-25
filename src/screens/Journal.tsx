import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Icon } from "../components/Icons";
import Sheet from "../components/Sheet";
import { ConfirmButton, Empty, SectionHead } from "../components/ui";
import { dayHeader, dayKey, fmtTime, timeValue, today } from "../lib/dates";
import { LOG_TYPES, QUICK_TYPES } from "../lib/data";
import { useActiveDog, useApp } from "../lib/store";
import type { LogEntry, LogType } from "../lib/types";
import { quickLog } from "./Home";

const WITH_MINUTES: LogType[] = ["walk", "play", "train"];

type Draft = { id?: string; type: LogType; date: string; time: string; minutes: string; note: string };

const toDraft = (e?: LogEntry, type: LogType = "walk"): Draft => {
  const at = e?.at ?? new Date().toISOString();
  return { id: e?.id, type: e?.type ?? type, date: dayKey(at), time: timeValue(at), minutes: e?.minutes ? String(e.minutes) : "", note: e?.note ?? "" };
};

export default function Journal() {
  const dog = useActiveDog()!;
  const logs = useApp((s) => s.logs);
  const { log, updateLog, deleteLog } = useApp.getState();
  const [days, setDays] = useState(10);
  const [draft, setDraft] = useState<Draft | null>(null);

  const mine = useMemo(() => logs.filter((l) => l.dogId === dog.id).sort((a, b) => b.at.localeCompare(a.at)), [logs, dog.id]);
  const groups = useMemo(() => {
    const m = new Map<string, LogEntry[]>();
    for (const l of mine) {
      const k = dayKey(l.at);
      const arr = m.get(k);
      if (arr) arr.push(l);
      else m.set(k, [l]);
    }
    return [...m.entries()];
  }, [mine]);

  const t = today();
  const todays = mine.filter((l) => dayKey(l.at) === t);
  const count = (type: LogType) => todays.filter((l) => l.type === type).length;
  const walkMin = todays.filter((l) => l.type === "walk").reduce((n, l) => n + (l.minutes ?? 0), 0);

  const save = () => {
    if (!draft) return;
    const [hh, mm] = draft.time.split(":").map(Number);
    const d = new Date(draft.date + "T00:00:00");
    d.setHours(hh || 0, mm || 0, 0, 0);
    const orig = draft.id ? logs.find((l) => l.id === draft.id) : undefined;
    const sameTime = orig && dayKey(orig.at) === draft.date && timeValue(orig.at) === draft.time;
    const at = sameTime ? orig.at : d.toISOString();
    const minutes = WITH_MINUTES.includes(draft.type) && Number(draft.minutes) > 0 ? Math.round(Number(draft.minutes)) : undefined;
    const note = draft.note.trim() || undefined;
    if (draft.id) updateLog(draft.id, { type: draft.type, at, minutes, note });
    else log(draft.type, { at, minutes, note });
    setDraft(null);
  };

  return (
    <div className="page journal">

      <div className="today-sum" aria-label="סיכום היום">
        <span className="sum-chip">
          🦮 {count("walk")} טיולים{walkMin ? ` · ${walkMin} דק׳` : ""}
        </span>
        <span className="sum-chip">🥣 {count("meal")} ארוחות</span>
        <span className="sum-chip">💧 {count("pee")}</span>
        <span className="sum-chip">💩 {count("poop")}</span>
      </div>

      <section className="card">
        <SectionHead title="מה קרה עכשיו?">
          <button type="button" className="link-btn" onClick={() => setDraft(toDraft())}>
            רישום עם פרטים
          </button>
        </SectionHead>
        <div className="quick-grid">
          {QUICK_TYPES.map((type) => (
            <motion.button key={type} type="button" className="quick-btn" whileTap={{ scale: 0.86, rotate: 4 }} onClick={() => quickLog(type)}>
              <span className="quick-emoji" style={{ background: LOG_TYPES[type].tint }}>
                {LOG_TYPES[type].emoji}
              </span>
              <span>{LOG_TYPES[type].label}</span>
            </motion.button>
          ))}
        </div>
        <p className="muted small">לחיצה רושמת מיד. כדי להוסיף דקות או הערה, לחצו על הרישום ביומן.</p>
      </section>

      {groups.length === 0 ? (
        <Empty emoji="📒" title="היומן עוד ריק">
          <span className="muted">לחצו על אחת הפעולות למעלה כדי לרשום את הדבר הראשון.</span>
        </Empty>
      ) : (
        <div className="timeline">
          {groups.slice(0, days).map(([day, items]) => (
            <section key={day} className="tl-day">
              <h3 className="tl-head">
                <span>{dayHeader(day)}</span>
                <span className="muted small">{items.length} רישומים</span>
              </h3>
              <ul className="tl-list">
                <AnimatePresence initial={false}>
                  {items.map((l) => (
                    <motion.li key={l.id} layout initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 400, damping: 32 }}>
                      <button type="button" className="tl-item" onClick={() => setDraft(toDraft(l))}>
                        <span className="tl-time">{fmtTime(l.at)}</span>
                        <span className="tl-dot" style={{ background: LOG_TYPES[l.type].tint }} aria-hidden="true">
                          {LOG_TYPES[l.type].emoji}
                        </span>
                        <span className="tl-text">
                          <strong>
                            {LOG_TYPES[l.type].label}
                            {l.minutes ? ` · ${l.minutes} דק׳` : ""}
                          </strong>
                          {l.note && <span className="muted small">{l.note}</span>}
                        </span>
                        <Icon name="edit" size={16} className="tl-edit" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
          {groups.length > days && (
            <button type="button" className="btn btn-ghost block" onClick={() => setDays((d) => d + 14)}>
              להציג ימים קודמים
            </button>
          )}
        </div>
      )}

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "עריכת רישום" : "רישום חדש"}>
        {draft && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="type-grid" role="radiogroup" aria-label="סוג">
              {QUICK_TYPES.map((type) => (
                <button key={type} type="button" role="radio" aria-checked={draft.type === type} className={draft.type === type ? "type-btn on" : "type-btn"} onClick={() => setDraft({ ...draft, type })}>
                  <span aria-hidden="true">{LOG_TYPES[type].emoji}</span>
                  {LOG_TYPES[type].label}
                </button>
              ))}
            </div>
            <div className="row2">
              <label className="field">
                <span>תאריך</span>
                <input id="log-date" type="date" value={draft.date} max={today()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
              </label>
              <label className="field">
                <span>שעה</span>
                <input id="log-time" type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} required />
              </label>
            </div>
            {WITH_MINUTES.includes(draft.type) && (
              <label className="field">
                <span>כמה דקות?</span>
                <input id="log-minutes" type="number" inputMode="numeric" min={1} max={600} value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: e.target.value })} placeholder="למשל 30" />
              </label>
            )}
            <label className="field">
              <span>הערה</span>
              <input id="log-note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="פגשנו את רקי בגינה…" maxLength={140} />
            </label>
            <button type="submit" className="btn btn-primary block">
              שמירה
            </button>
            {draft.id && (
              <ConfirmButton
                label={
                  <>
                    <Icon name="trash" size={18} /> מחיקת הרישום
                  </>
                }
                onConfirm={() => {
                  deleteLog(draft.id!);
                  setDraft(null);
                }}
              />
            )}
          </form>
        )}
      </Sheet>
    </div>
  );
}
