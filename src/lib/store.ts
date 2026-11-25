import { create } from "zustand";
import { addDays, dayKey, diffYMD, today } from "./dates";
import { DEFAULT_TRICKS, LOG_TYPES, defaultRoutine, gFor, healthLogType } from "./data";
import { makeDemo } from "./demo";
import { fx } from "./fx";
import { ACHIEVEMENTS, XP, achContext, doneKey, levelInfo } from "./gamify";
import { deletePhoto, savePhoto, scheduleSave, wipeAll, type StorageKind } from "./persist";
import type { Data, Dog, HealthItem, LogEntry, LogType, Trick, TrickLevel } from "./types";
import { emptyData } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);

type DogInput = Pick<Dog, "name" | "sex" | "breed" | "size" | "coat" | "pattern"> & Partial<Pick<Dog, "birth" | "gotcha" | "avatar">>;

interface UI {
  ready: boolean;
  loadError: boolean;
  storage: StorageKind;
}

interface Actions {
  hydrate(data: Data | null, storage: StorageKind): void;
  addDog(input: DogInput): string;
  updateDog(id: string, patch: Partial<Dog>): void;
  removeDog(id: string): void;
  setActiveDog(id: string): void;
  log(type: LogType, opts?: Partial<Pick<LogEntry, "at" | "minutes" | "note">>): LogEntry | null;
  updateLog(id: string, patch: Partial<LogEntry>): void;
  /** refund=true מחזיר את ה-XP (לכפתור "ביטול" מיד אחרי רישום) */
  deleteLog(id: string, refund?: boolean): void;
  toggleTask(taskId: string): void;
  addWeight(kg: number, date: string): void;
  deleteWeight(id: string): void;
  saveHealth(item: Omit<HealthItem, "id" | "dogId"> & { id?: string }): void;
  markHealthDone(id: string): void;
  deleteHealth(id: string): void;
  addTrick(name: string, emoji: string): void;
  practiceTrick(id: string): void;
  setTrickLevel(id: string, level: TrickLevel): void;
  deleteTrick(id: string): void;
  addPhoto(dataUrl: string, date: string, caption?: string): Promise<void>;
  updatePhoto(id: string, caption: string): void;
  removePhoto(id: string): void;
  setTheme(theme: Data["theme"]): void;
  loadDemo(): void;
  importData(data: Data): void;
  resetAll(): Promise<void>;
}

export type Store = Data & UI & Actions;

const DATA_KEYS: (keyof Data)[] = ["v", "dogs", "activeDogId", "logs", "weights", "health", "tricks", "photos", "taskDone", "theme"];
export const pickData = (s: Store): Data => Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as Data;

export const useApp = create<Store>()((set, get) => {
  const active = () => {
    const s = get();
    return s.dogs.find((d) => d.id === s.activeDogId) ?? s.dogs[0];
  };
  const patchDog = (id: string, patch: (d: Dog) => Partial<Dog>) =>
    set((s) => ({ dogs: s.dogs.map((d) => (d.id === id ? { ...d, ...patch(d) } : d)) }));

  /** הוספת XP, עלייה ברמה ובדיקת הישגים */
  const gain = (amount: number, quiet = false) => {
    const dog = active();
    if (!dog || !amount) return;
    const before = levelInfo(dog.xp).level;
    patchDog(dog.id, (d) => ({ xp: Math.max(0, d.xp + amount) }));
    if (amount > 0 && !quiet) fx.emit({ type: "xp", amount });
    const after = levelInfo(Math.max(0, dog.xp + amount));
    if (after.level > before) {
      fx.emit({ type: "badge", emoji: "⭐", title: `עליתם לרמה ${after.level}!`, text: after.title });
      fx.emit({ type: "confetti", big: true });
    }
    checkAchievements(dog.id);
  };

  const checkAchievements = (dogId: string, quiet = false) => {
    for (let round = 0; round < 3; round++) {
      const s = get();
      const dog = s.dogs.find((d) => d.id === dogId);
      if (!dog) return;
      const ctx = achContext(s, dog);
      const fresh = ACHIEVEMENTS.filter((a) => !dog.unlocked[a.id] && a.value(ctx) >= a.goal);
      if (!fresh.length) return;
      const now = new Date().toISOString();
      const g = gFor(dog.sex);
      patchDog(dogId, (d) => ({
        unlocked: { ...d.unlocked, ...Object.fromEntries(fresh.map((a) => [a.id, now])) },
        xp: d.xp + (quiet ? 0 : fresh.length * XP.badge),
      }));
      if (quiet) continue;
      for (const a of fresh) fx.emit({ type: "badge", emoji: a.emoji, title: a.title(g), text: `הישג חדש: ${a.desc}` });
      fx.emit({ type: "confetti", big: true });
    }
  };

  const makeLog = (type: LogType, extra: Partial<LogEntry> = {}): LogEntry | null => {
    const dog = active();
    if (!dog) return null;
    const entry: LogEntry = { id: uid(), dogId: dog.id, type, at: new Date().toISOString(), ...extra };
    for (const k of ["minutes", "note", "taskId"] as const) if (entry[k] === undefined || entry[k] === "") delete entry[k];
    set((s) => ({ logs: [...s.logs, entry] }));
    return entry;
  };

  return {
    ...emptyData(),
    ready: false,
    loadError: false,
    storage: "memory",

    hydrate(data, storage) {
      set({ ...(data ?? emptyData()), ready: true, loadError: false, storage });
    },

    addDog(input) {
      const id = uid();
      const puppy = input.birth ? diffYMD(input.birth, today()).months < 6 : false;
      const dog: Dog = {
        ...input,
        id,
        routine: defaultRoutine(puppy),
        xp: 0,
        unlocked: {},
        createdAt: new Date().toISOString(),
      };
      const tricks: Trick[] = DEFAULT_TRICKS.map((t) => ({ id: uid(), dogId: id, key: t.key, name: t.name, emoji: t.emoji, tip: t.tip, level: 0, sessions: 0 }));
      set((s) => ({ dogs: [...s.dogs, dog], tricks: [...s.tricks, ...tricks], activeDogId: id }));
      return id;
    },

    updateDog(id, patch) {
      patchDog(id, () => patch);
    },

    removeDog(id) {
      const s = get();
      const photos = s.photos.filter((p) => p.dogId === id);
      photos.forEach((p) => void deletePhoto(p.id));
      const keep = <T extends { dogId: string }>(arr: T[]) => arr.filter((x) => x.dogId !== id);
      const dogs = s.dogs.filter((d) => d.id !== id);
      set({
        dogs,
        logs: keep(s.logs),
        weights: keep(s.weights),
        health: keep(s.health),
        tricks: keep(s.tricks),
        photos: keep(s.photos),
        taskDone: Object.fromEntries(Object.entries(s.taskDone).filter(([k]) => !k.startsWith(id + "|"))),
        activeDogId: s.activeDogId === id ? dogs[0]?.id : s.activeDogId,
      });
    },

    setActiveDog(id) {
      set({ activeDogId: id });
    },

    log(type, opts = {}) {
      const e = makeLog(type, opts);
      if (!e) return null;
      gain(XP.log);
      if (type === "meal" || type === "walk" || type === "play" || type === "treat" || type === "train") fx.emit({ type: "cheer" });
      return e;
    },

    updateLog(id, patch) {
      set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    },

    deleteLog(id, refund = false) {
      const s = get();
      const entry = s.logs.find((l) => l.id === id);
      if (!entry) return;
      if (refund) gain(-XP.log, true);
      // אם הרישום הגיע ממשימה — מבטלים גם את הסימון שלה
      const key = doneKey(entry.dogId, dayKey(entry.at));
      const tasks = s.taskDone[key];
      const taskDone = { ...s.taskDone };
      if (entry.taskId && tasks?.[entry.taskId] === id) {
        const rest = { ...tasks };
        delete rest[entry.taskId];
        taskDone[key] = rest;
      }
      set({ logs: s.logs.filter((l) => l.id !== id), taskDone });
    },

    toggleTask(taskId) {
      const dog = active();
      if (!dog) return;
      const task = dog.routine.find((t) => t.id === taskId);
      if (!task) return;
      const key = doneKey(dog.id);
      const s = get();
      const cur = { ...(s.taskDone[key] ?? {}) };
      if (taskId in cur) {
        const logId = cur[taskId];
        delete cur[taskId];
        set({ taskDone: { ...s.taskDone, [key]: cur }, logs: logId ? s.logs.filter((l) => l.id !== logId) : s.logs });
        gain(-XP.task, true);
        return;
      }
      const e = task.logType ? makeLog(task.logType, { taskId }) : null;
      cur[taskId] = e?.id ?? "";
      set((st) => ({ taskDone: { ...st.taskDone, [key]: cur } }));
      fx.emit({ type: "cheer" });
      const all = dog.routine.every((t) => t.id in cur);
      if (all) {
        fx.emit({ type: "confetti", big: true });
        fx.emit({ type: "toast", emoji: "💯", text: `כל המשימות של היום בוצעו! ${dog.name} ${gFor(dog.sex)("מאושר", "מאושרת")}` });
      }
      gain(XP.task);
    },

    addWeight(kg, date) {
      const dog = active();
      if (!dog) return;
      set((s) => ({ weights: [...s.weights, { id: uid(), dogId: dog.id, date, kg }] }));
      fx.emit({ type: "toast", emoji: "⚖️", text: `נרשם משקל: ${kg.toLocaleString("he-IL")} ק״ג` });
      gain(XP.weight);
    },

    deleteWeight(id) {
      set((s) => ({ weights: s.weights.filter((w) => w.id !== id) }));
    },

    saveHealth(item) {
      const dog = active();
      if (!dog) return;
      if (item.id) {
        const id = item.id;
        set((s) => ({ health: s.health.map((h) => (h.id === id ? { ...h, ...item, id } : h)) }));
        return;
      }
      set((s) => ({ health: [...s.health, { ...item, id: uid(), dogId: dog.id }] }));
      checkAchievements(dog.id);
    },

    markHealthDone(id) {
      const s = get();
      const h = s.health.find((x) => x.id === id);
      if (!h) return;
      const t = today();
      set({
        health: s.health.map((x) => (x.id === id ? { ...x, lastDone: t, due: x.repeatDays ? addDays(t, x.repeatDays) : undefined } : x)),
      });
      makeLog(healthLogType(h.kind), { note: h.title });
      fx.emit({ type: "confetti" });
      fx.emit({ type: "toast", emoji: "✅", text: `${h.title}: סומן כבוצע` });
      gain(XP.health);
    },

    deleteHealth(id) {
      set((s) => ({ health: s.health.filter((h) => h.id !== id) }));
    },

    addTrick(name, emoji) {
      const dog = active();
      if (!dog) return;
      set((s) => ({ tricks: [...s.tricks, { id: uid(), dogId: dog.id, name, emoji, level: 0, sessions: 0 }] }));
    },

    practiceTrick(id) {
      const s = get();
      const t = s.tricks.find((x) => x.id === id);
      if (!t) return;
      set({
        tricks: s.tricks.map((x) =>
          x.id === id ? { ...x, sessions: x.sessions + 1, lastPracticed: today(), level: (x.level === 0 ? 1 : x.level) as TrickLevel } : x,
        ),
      });
      makeLog("train", { note: `תרגול: ${t.name}` });
      fx.emit({ type: "cheer" });
      gain(XP.practice);
    },

    setTrickLevel(id, level) {
      const s = get();
      const t = s.tricks.find((x) => x.id === id);
      if (!t || t.level === level) return;
      const mastered = level === 3 && t.level < 3;
      set({
        tricks: s.tricks.map((x) => (x.id === id ? { ...x, level, masteredAt: level === 3 ? x.masteredAt ?? today() : undefined } : x)),
      });
      if (mastered) {
        const dog = active();
        const g = gFor(dog?.sex);
        fx.emit({ type: "confetti", big: true });
        fx.emit({ type: "toast", emoji: t.emoji, text: `${dog?.name ?? ""} ${g("למד", "למדה")}: ${t.name}!` });
        gain(XP.master);
      }
    },

    deleteTrick(id) {
      set((s) => ({ tricks: s.tricks.filter((t) => t.id !== id) }));
    },

    async addPhoto(dataUrl, date, caption) {
      const dog = active();
      if (!dog) return;
      const id = uid();
      await savePhoto(id, dataUrl);
      set((s) => ({ photos: [...s.photos, { id, dogId: dog.id, date, ...(caption ? { caption } : {}) }] }));
      gain(XP.photo);
    },

    updatePhoto(id, caption) {
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, caption: caption || undefined } : p)) }));
    },

    removePhoto(id) {
      void deletePhoto(id);
      set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
    },

    setTheme(theme) {
      set({ theme });
    },

    loadDemo() {
      const demo = makeDemo();
      set((s) => ({
        dogs: [...s.dogs.filter((d) => !d.demo), demo.dog],
        logs: [...s.logs, ...demo.logs],
        weights: [...s.weights, ...demo.weights],
        health: [...s.health, ...demo.health],
        tricks: [...s.tricks, ...demo.tricks],
        taskDone: { ...s.taskDone, ...demo.taskDone },
        activeDogId: demo.dog.id,
      }));
      checkAchievements(demo.dog.id, true);
    },

    importData(data) {
      set({ ...emptyData(), ...data });
    },

    async resetAll() {
      const s = get();
      await wipeAll(s.photos.map((p) => p.id));
      set({ ...emptyData() });
    },
  };
});

// שמירה אוטומטית אחרי כל שינוי בנתונים
useApp.subscribe((s, prev) => {
  if (!s.ready) return;
  if (DATA_KEYS.some((k) => s[k] !== prev[k])) scheduleSave(pickData(s));
});

export const useActiveDog = () => useApp((s) => s.dogs.find((d) => d.id === s.activeDogId) ?? s.dogs[0]);

export function logsForDay(logs: LogEntry[], dogId: string, day: string) {
  return logs.filter((l) => l.dogId === dogId && dayKey(l.at) === day);
}

export const logLabel = (type: LogType) => LOG_TYPES[type].label;
