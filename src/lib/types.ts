export type Sex = "male" | "female";
export type Size = "small" | "medium" | "large" | "giant";
export type CoatId = "golden" | "choco" | "black" | "white" | "gray" | "ginger" | "cream";
export type Pattern = "plain" | "patch" | "spots";
export type LogType =
  | "meal"
  | "walk"
  | "pee"
  | "poop"
  | "play"
  | "train"
  | "treat"
  | "bath"
  | "groom"
  | "meds"
  | "vet"
  | "note";
export type HealthKind = "vaccine" | "parasite" | "deworm" | "vet" | "meds" | "license" | "grooming" | "other";
export type Mood = "sleepy" | "ecstatic" | "happy" | "calm" | "hungry" | "bored";
export type Theme = "auto" | "light" | "dark";
export type TrickLevel = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  emoji: string;
  logType?: LogType;
}

export interface Dog {
  id: string;
  name: string;
  sex: Sex;
  breed: string;
  size: Size;
  birth?: string; // YYYY-MM-DD
  gotcha?: string; // יום האימוץ, YYYY-MM-DD
  coat: CoatId;
  pattern: Pattern;
  avatar?: string; // data URL קטן
  routine: Task[];
  clinic?: string;
  vetPhone?: string;
  chip?: string;
  license?: string;
  xp: number;
  unlocked: Record<string, string>; // achievement id -> ISO
  createdAt: string;
  demo?: boolean;
}

export interface LogEntry {
  id: string;
  dogId: string;
  type: LogType;
  at: string; // ISO
  minutes?: number;
  note?: string;
  taskId?: string;
}

export interface Weight {
  id: string;
  dogId: string;
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface HealthItem {
  id: string;
  dogId: string;
  kind: HealthKind;
  title: string;
  lastDone?: string;
  due?: string;
  repeatDays: number; // 0 = חד־פעמי
  note?: string;
}

export interface Trick {
  id: string;
  dogId: string;
  key?: string;
  name: string;
  emoji: string;
  tip?: string;
  level: TrickLevel;
  sessions: number;
  masteredAt?: string;
  lastPracticed?: string;
}

export interface PhotoMeta {
  id: string;
  dogId: string;
  date: string;
  caption?: string;
}

export interface Data {
  v: 1;
  dogs: Dog[];
  activeDogId?: string;
  logs: LogEntry[];
  weights: Weight[];
  health: HealthItem[];
  tricks: Trick[];
  photos: PhotoMeta[];
  /** `${dogId}|${day}` -> taskId -> id של הרישום ביומן ("" אם אין) */
  taskDone: Record<string, Record<string, string>>;
  theme: Theme;
}

export const emptyData = (): Data => ({
  v: 1,
  dogs: [],
  logs: [],
  weights: [],
  health: [],
  tricks: [],
  photos: [],
  taskDone: {},
  theme: "auto",
});
