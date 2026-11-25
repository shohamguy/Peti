import { addDays, dayKey, today } from "./dates";
import type { G } from "./data";
import type { Data, Dog, Mood } from "./types";

export const XP = { log: 5, task: 10, weight: 15, health: 20, practice: 5, master: 50, photo: 10, badge: 25 };

const threshold = (level: number) => 25 * (level - 1) * (level + 2);

const LEVEL_TITLES = [
  "גור חדש בבית",
  "חברים טובים",
  "צוות מגובש",
  "מאלפים בהתהוות",
  "לוחשים לכלבים",
  "אלופי השכונה",
  "צמד אגדי",
  "מאסטרים של הפארק",
  "אגדה חיה",
  "הכלב הכי מאושר בעולם",
];

export function levelInfo(xp: number) {
  let level = 1;
  while (threshold(level + 1) <= xp) level++;
  const cur = threshold(level);
  const next = threshold(level + 1);
  return {
    level,
    cur,
    next,
    pct: Math.min(1, (xp - cur) / (next - cur)),
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
  };
}

export const doneKey = (dogId: string, day: string = today()) => `${dogId}|${day}`;

/** כל הימים שבהם נרשמה פעילות לכלב */
export function activeDays(d: Pick<Data, "logs" | "taskDone">, dogId: string) {
  const days = new Set<string>();
  for (const l of d.logs) if (l.dogId === dogId) days.add(dayKey(l.at));
  for (const k in d.taskDone) {
    const [id, day] = k.split("|");
    if (id === dogId && Object.keys(d.taskDone[k]).length) days.add(day);
  }
  return days;
}

/** רצף ימים פעילים שמסתיים היום (או אתמול, אם היום עוד לא נרשם כלום) */
export function streak(days: Set<string>, now: string = today()) {
  let d = days.has(now) ? now : addDays(now, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function perfectDays(d: Data, dog: Dog) {
  if (!dog.routine.length) return 0;
  let n = 0;
  for (const k in d.taskDone) {
    if (k.startsWith(dog.id + "|") && Object.keys(d.taskDone[k]).length >= dog.routine.length) n++;
  }
  return n;
}

export interface AchCtx {
  logs: number;
  walks: number;
  weights: number;
  streak: number;
  mastered: number;
  perfect: number;
  health: number;
  photos: number;
  level: number;
}

export function achContext(d: Data, dog: Dog): AchCtx {
  const logs = d.logs.filter((l) => l.dogId === dog.id);
  return {
    logs: logs.length,
    walks: logs.filter((l) => l.type === "walk").length,
    weights: d.weights.filter((w) => w.dogId === dog.id).length,
    streak: streak(activeDays(d, dog.id)),
    mastered: d.tricks.filter((t) => t.dogId === dog.id && t.level === 3).length,
    perfect: perfectDays(d, dog),
    health: d.health.filter((h) => h.dogId === dog.id).length,
    photos: d.photos.filter((p) => p.dogId === dog.id).length,
    level: levelInfo(dog.xp).level,
  };
}

export interface Achievement {
  id: string;
  emoji: string;
  title: (g: G) => string;
  desc: string;
  goal: number;
  value: (c: AchCtx) => number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-log", emoji: "📝", title: () => "צעד ראשון", desc: "רישום ראשון ביומן", goal: 1, value: (c) => c.logs },
  { id: "weigh-1", emoji: "⚖️", title: () => "על המשקל", desc: "שקילה ראשונה", goal: 1, value: (c) => c.weights },
  { id: "streak-3", emoji: "🔥", title: () => "שלושה ברצף", desc: "3 ימים ברצף עם פעילות", goal: 3, value: (c) => c.streak },
  { id: "perfect", emoji: "💯", title: () => "יום מושלם", desc: "כל המשימות של יום אחד", goal: 1, value: (c) => c.perfect },
  { id: "trick-1", emoji: "🎓", title: (g) => g("תלמיד מצטיין", "תלמידה מצטיינת"), desc: "טריק ראשון שנלמד עד הסוף", goal: 1, value: (c) => c.mastered },
  { id: "walks-10", emoji: "🦮", title: () => "מטיילים", desc: "10 טיולים", goal: 10, value: (c) => c.walks },
  { id: "health-3", emoji: "🩺", title: () => "בריאות קודם", desc: "3 תזכורות בריאות", goal: 3, value: (c) => c.health },
  { id: "photo-1", emoji: "📸", title: () => "פוזה!", desc: "תמונה ראשונה באלבום", goal: 1, value: (c) => c.photos },
  { id: "streak-7", emoji: "🌟", title: () => "שבוע מושלם", desc: "7 ימים ברצף", goal: 7, value: (c) => c.streak },
  { id: "weigh-5", emoji: "📈", title: () => "עוקבים אחרי הגדילה", desc: "5 שקילות", goal: 5, value: (c) => c.weights },
  { id: "tricks-5", emoji: "🧠", title: (g) => g("גאון", "גאונה"), desc: "5 טריקים שנלמדו", goal: 5, value: (c) => c.mastered },
  { id: "photos-5", emoji: "🖼️", title: () => "אלבום משפחתי", desc: "5 תמונות באלבום", goal: 5, value: (c) => c.photos },
  { id: "level-5", emoji: "👑", title: () => "צוות מנצח", desc: "הגעה לרמה 5", goal: 5, value: (c) => c.level },
  { id: "walks-50", emoji: "🏃", title: () => "מרתון שכונתי", desc: "50 טיולים", goal: 50, value: (c) => c.walks },
  { id: "streak-30", emoji: "🏆", title: () => "חודש של אהבה", desc: "30 ימים ברצף", goal: 30, value: (c) => c.streak },
];

// ---- מצב רוח ----

export interface MoodInput {
  hour: number;
  done: number;
  total: number;
  mealToday: boolean;
  activeToday: boolean;
}

export function computeMood({ hour, done, total, mealToday, activeToday }: MoodInput): Mood {
  if (hour >= 22 || hour < 6) return "sleepy";
  if (total > 0 && done >= total) return "ecstatic";
  if (!mealToday && hour >= 10) return "hungry";
  if (!activeToday && hour >= 13) return "bored";
  return total > 0 && done / total >= 0.5 ? "happy" : "calm";
}

export function moodLines(mood: Mood, g: G): string[] {
  switch (mood) {
    case "sleepy":
      return [`זזז... ${g("חולם", "חולמת")} על עצמות`, "לילה טוב! מחר נשחק עוד"];
    case "ecstatic":
      return [`יום מושלם! אני ${g("הכי מאושר", "הכי מאושרת")} בעולם`, "עשינו הכל היום. אתם אלופים!"];
    case "hungry":
      return [`אני ${g("רעב", "רעבה")}! מתי אוכלים?`, "הבטן מקרקרת... ארוחה?"];
    case "bored":
      return ["משעמם לי... יוצאים לטיול?", "אולי נשחק קצת בכדור?"];
    case "happy":
      return ["איזה כיף לי איתכם!", "עוד קצת ועשינו את כל המשימות"];
    default:
      return ["מה עושים היום?", `${g("מוכן", "מוכנה")} להרפתקה הבאה!`];
  }
}

export function moodLabel(mood: Mood, g: G) {
  return {
    sleepy: g("ישן", "ישנה"),
    ecstatic: "בעננים",
    happy: g("שמח", "שמחה"),
    calm: g("רגוע", "רגועה"),
    hungry: g("רעב", "רעבה"),
    bored: g("משועמם", "משועממת"),
  }[mood];
}

export function happiness(mood: Mood, done: number, total: number) {
  const base = total ? done / total : 0.5;
  if (mood === "ecstatic") return 100;
  if (mood === "sleepy") return Math.round(60 + base * 40);
  return Math.round(30 + base * 65);
}
