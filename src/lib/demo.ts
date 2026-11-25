import { addDays, isoAt, today } from "./dates";
import { DEFAULT_TRICKS, defaultRoutine } from "./data";
import { doneKey } from "./gamify";
import type { Data, Dog, HealthItem, LogEntry, LogType, Trick, Weight } from "./types";

/** כלב לדוגמה, כדי לראות איך האפליקציה נראית עם נתונים. מסומן demo. */
export function makeDemo(): Pick<Data, "dogs" | "logs" | "weights" | "health" | "tricks" | "taskDone"> & { dog: Dog } {
  const now = new Date();
  const t = today();
  const id = "demo-" + Date.now().toString(36);
  const birth = addDays(t, -152);
  const routine = defaultRoutine(true);
  const dog: Dog = {
    id,
    name: "בונו",
    sex: "male",
    breed: "לברדור רטריבר",
    size: "large",
    birth,
    gotcha: addDays(birth, 63),
    coat: "golden",
    pattern: "patch",
    routine,
    clinic: "מרפאה וטרינרית לדוגמה",
    vetPhone: "03-0000000",
    xp: 0,
    unlocked: {},
    createdAt: now.toISOString(),
    demo: true,
  };

  let seq = 0;
  const nid = () => `${id}-${(seq++).toString(36)}`;
  const logs: LogEntry[] = [];
  const taskDone: Data["taskDone"] = {};
  const add = (day: string, type: LogType, hh: number, mm: number, extra: Partial<LogEntry> = {}) => {
    const at = isoAt(day, hh, mm);
    if (new Date(at) > now) return null;
    const e: LogEntry = { id: nid(), dogId: id, type, at, ...extra };
    logs.push(e);
    return e;
  };

  // שבועיים אחרונים של יומן
  const mealTask = routine.filter((r) => r.logType === "meal");
  const walkTask = routine.filter((r) => r.logType === "walk");
  const playTask = routine.find((r) => r.logType === "play");
  const waterTask = routine.find((r) => !r.logType);
  for (let back = 13; back >= 0; back--) {
    const day = addDays(t, -back);
    const done: Record<string, string> = {};
    const skipEvening = back % 5 === 3; // כמה ימים לא מושלמים
    const plan: [LogType, number, number, Partial<LogEntry>, string | undefined][] = [
      ["pee", 6, 40, {}, undefined],
      ["meal", 7, 5, {}, mealTask[0]?.id],
      ["walk", 7, 30, { minutes: 25 + (back % 3) * 5 }, walkTask[0]?.id],
      ["poop", 7, 45, {}, undefined],
      ["meal", 12, 30, {}, mealTask[1]?.id],
      ["pee", 13, 10, {}, undefined],
      ["play", 16, 0, { note: back % 2 ? "כדור טניס בגינה" : "משיכת חבל" }, playTask?.id],
      ...(skipEvening
        ? []
        : ([
            ["meal", 18, 30, {}, mealTask[2]?.id],
            ["walk", 19, 15, { minutes: 35 + (back % 4) * 5 }, walkTask[1]?.id],
            ["poop", 19, 30, {}, undefined],
          ] as [LogType, number, number, Partial<LogEntry>, string | undefined][])),
      ["pee", 21, 45, {}, undefined],
    ];
    if (back % 3 === 0) plan.push(["train", 17, 20, { note: "תרגול: שב, ארצה" }, undefined]);
    if (back === 6) plan.push(["bath", 11, 0, {}, undefined]);
    if (back === 9) plan.push(["treat", 15, 0, { note: "מקל לעיסה" }, undefined]);
    for (const [type, hh, mm, extra, taskId] of plan) {
      const e = add(day, type, hh, mm, taskId ? { ...extra, taskId } : extra);
      if (e && taskId) done[taskId] = e.id;
    }
    if (waterTask && new Date(isoAt(day, 8, 0)) < now) done[waterTask.id] = "";
    if (Object.keys(done).length) taskDone[doneKey(id, day)] = done;
  }

  // שקילות שבועיות מגיל 9 שבועות
  const kgs = [4.1, 5.0, 6.2, 7.3, 8.6, 9.7, 10.9, 12.0, 13.2, 14.1, 15.3, 16.2, 17.1];
  const weights: Weight[] = kgs.map((kg, i) => ({ id: nid(), dogId: id, date: addDays(birth, 63 + i * 7), kg })).filter((w) => w.date <= t);

  const health: HealthItem[] = [
    { id: nid(), dogId: id, kind: "parasite", title: "טיפול נגד פרעושים וקרציות", lastDone: addDays(t, -32), due: addDays(t, -2), repeatDays: 30 },
    { id: nid(), dogId: id, kind: "vaccine", title: "חיסון משושה (מנת דחף)", lastDone: addDays(t, -25), due: addDays(t, 4), repeatDays: 0, note: "לפי הלוח שקבע הווטרינר" },
    { id: nid(), dogId: id, kind: "vaccine", title: "חיסון כלבת", due: addDays(t, 12), repeatDays: 365, note: "בישראל זה חיסון חובה שנתי" },
    { id: nid(), dogId: id, kind: "deworm", title: "טיפול נגד תולעים", lastDone: addDays(t, -20), due: addDays(t, 70), repeatDays: 90 },
    { id: nid(), dogId: id, kind: "license", title: "חידוש רישיון כלב", due: addDays(t, 58), repeatDays: 365, note: "ברשות המקומית" },
  ];

  const levels: Record<string, Trick["level"]> = { name: 3, sit: 3, paw: 2, down: 1, come: 1, leave: 1 };
  const tricks: Trick[] = DEFAULT_TRICKS.map((tr) => {
    const level = levels[tr.key] ?? 0;
    return {
      id: nid(),
      dogId: id,
      key: tr.key,
      name: tr.name,
      emoji: tr.emoji,
      tip: tr.tip,
      level,
      sessions: level ? level * 4 + 1 : 0,
      masteredAt: level === 3 ? addDays(t, -10) : undefined,
      lastPracticed: level ? addDays(t, -1) : undefined,
    };
  });

  const doneTasks = Object.values(taskDone).reduce((n, m) => n + Object.keys(m).length, 0);
  dog.xp = logs.filter((l) => !l.taskId).length * 5 + doneTasks * 10 + weights.length * 15 + 2 * 50 + 30 * 5;

  return { dog, dogs: [dog], logs, weights, health, tricks, taskDone };
}
