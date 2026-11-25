import { clear as idbClear, createStore, del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import type { Data, LogEntry } from "./types";

/**
 * שכבת שמירה.
 * - באפליקציה המותקנת (PWA): IndexedDB במכשיר.
 * - בגרסת ה-Artifact ב-claude.ai: מסמכים פרטיים למשתמש (db capability),
 *   כך שהנתונים מסונכרנים בין המכשירים. אם זה לא זמין — IndexedDB.
 *
 * הנתונים מחולקים ל"דליים": core (כל מה שאינו יומן), logs-YYYY-MM לכל חודש
 * של רישומי יומן, ו-photo-<id> לכל תמונה. כל דלי נשמר רק כשהוא משתנה.
 */

export type StorageKind = "cloud" | "local" | "memory";

interface KV {
  kind: StorageKind;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

declare const __TARGET__: "pwa" | "artifact";
export const IS_ARTIFACT = __TARGET__ === "artifact";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function memoryKV(): KV {
  const m = new Map<string, unknown>();
  return {
    kind: "memory",
    get: async (k) => m.get(k),
    set: async (k, v) => void m.set(k, v),
    del: async (k) => void m.delete(k),
  };
}

async function localKV(): Promise<KV> {
  try {
    const store = createStore("peti", "kv");
    await withTimeout(idbSet("probe", 1, store), 4000);
    return {
      kind: "local",
      get: (k) => idbGet(k, store),
      set: (k, v) => idbSet(k, v, store),
      del: (k) => idbDel(k, store),
    };
  } catch {
    return memoryKV();
  }
}

type DbErr = { code?: string };
type DocSnap = { exists: boolean; data(): Record<string, unknown> | undefined };
type DocRef = { get(): Promise<DocSnap>; set(v: Record<string, unknown>): Promise<void>; delete(): Promise<void> };
type DB = { doc(path: string): DocRef };
type User = { id(): Promise<string | null> };
type ClaudeRuntime = { use(name: string): Promise<unknown> };

async function cloudKV(): Promise<KV | null> {
  const claude = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (!claude?.use) return null;
  const [db, user] = (await Promise.all([claude.use("db"), claude.use("user")])) as [DB | null, User | null];
  if (!db || !user) return null;
  const uid = await user.id();
  if (!uid) return null;
  const ref = (k: string) => db.doc(`data/users/${uid}/${k}`);
  // ניסיון חוזר אחד על תקלה זמנית
  const call = async <T,>(f: () => Promise<T>): Promise<T> => {
    try {
      return await f();
    } catch (e) {
      if ((e as DbErr)?.code !== "unavailable") throw e;
      await sleep(400 + Math.random() * 600);
      return f();
    }
  };
  return {
    kind: "cloud",
    get: async (k) => {
      const snap = await withTimeout(call(() => ref(k).get()), 10_000);
      return snap.exists ? snap.data()?.v : undefined;
    },
    set: (k, v) => call(() => ref(k).set({ v })),
    del: (k) => call(() => ref(k).delete()),
  };
}

// ---- דליים ----

type Core = Omit<Data, "logs"> & { logMonths?: string[] };

function buckets(d: Data) {
  const map = new Map<string, unknown>();
  const byMonth = new Map<string, LogEntry[]>();
  for (const l of d.logs) {
    const k = "logs-" + l.at.slice(0, 7);
    const arr = byMonth.get(k);
    if (arr) arr.push(l);
    else byMonth.set(k, [l]);
  }
  const { logs: _logs, ...core } = d;
  map.set("core", { ...core, logMonths: [...byMonth.keys()].map((k) => k.slice(5)).sort() });
  for (const [k, arr] of byMonth) map.set(k, arr);
  return map;
}

// ---- מצב ----

let kv: KV = memoryKV();
const saved = new Map<string, string>(); // מפתח -> JSON שנשמר לאחרונה
let pending: Data | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;
let onError: ((e: unknown) => void) | undefined;

export const storageKind = () => kv.kind;
export const setSaveErrorHandler = (f: (e: unknown) => void) => (onError = f);

export type LoadResult = { ok: true; data: Data | null; kind: StorageKind } | { ok: false };

async function loadFrom(store: KV): Promise<Data | null> {
  const core = (await store.get("core")) as Core | undefined;
  if (!core || !Array.isArray(core.dogs)) return null;
  const months = core.logMonths ?? [];
  const parts = await Promise.all(months.map((m) => store.get("logs-" + m)));
  const logs = parts.flatMap((p) => (Array.isArray(p) ? (p as LogEntry[]) : []));
  const { logMonths: _m, ...rest } = core;
  const data: Data = { ...rest, logs };
  // מה שנטען כבר שמור — לא נכתוב אותו שוב
  saved.clear();
  for (const [k, v] of buckets(data)) saved.set(k, JSON.stringify(v));
  return data;
}

/** טעינה ראשונית. ב-Artifact מנסה קודם את השמירה בענן. */
export async function initPersistence(forceLocal = false): Promise<LoadResult> {
  if (IS_ARTIFACT && !forceLocal) {
    let cloud: KV | null = null;
    try {
      cloud = await withTimeout(cloudKV(), 12_000);
    } catch {
      cloud = null;
    }
    if (cloud) {
      try {
        const data = await loadFrom(cloud);
        kv = cloud;
        return { ok: true, data, kind: "cloud" };
      } catch {
        // אסור להמשיך עם נתונים ריקים — זה ידרוס את הנתונים בענן
        return { ok: false };
      }
    }
  }
  kv = await localKV();
  try {
    return { ok: true, data: await loadFrom(kv), kind: kv.kind };
  } catch {
    kv = memoryKV();
    return { ok: true, data: null, kind: "memory" };
  }
}

export function scheduleSave(d: Data) {
  pending = d;
  clearTimeout(timer);
  timer = setTimeout(flush, 500);
}

let retryDelay = 4000;

export async function flush() {
  clearTimeout(timer);
  if (running) return;
  running = true;
  try {
    while (pending) {
      const d = pending;
      pending = null;
      try {
        const b = buckets(d);
        for (const [k, v] of b) {
          const s = JSON.stringify(v);
          if (saved.get(k) !== s) {
            await kv.set(k, JSON.parse(s));
            saved.set(k, s);
          }
        }
        for (const k of [...saved.keys()]) {
          if (k.startsWith("logs-") && !b.has(k)) {
            await kv.del(k);
            saved.delete(k);
          }
        }
        retryDelay = 4000;
      } catch (e) {
        // נשמור שוב בהמשך, עם המתנה שהולכת וגדלה
        pending = pending ?? d;
        onError?.(e);
        timer = setTimeout(flush, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60_000);
        return;
      }
    }
  } finally {
    running = false;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}

// ---- תמונות ----

const photoCache = new Map<string, string>();

export async function savePhoto(id: string, dataUrl: string) {
  photoCache.set(id, dataUrl);
  await kv.set("photo-" + id, dataUrl);
}

export async function loadPhoto(id: string): Promise<string | null> {
  const hit = photoCache.get(id);
  if (hit) return hit;
  try {
    const v = await kv.get("photo-" + id);
    if (typeof v === "string") {
      photoCache.set(id, v);
      return v;
    }
  } catch {
    /* תמונה לא זמינה */
  }
  return null;
}

export async function deletePhoto(id: string) {
  photoCache.delete(id);
  try {
    await kv.del("photo-" + id);
  } catch {
    /* ignore */
  }
}

/** מחיקת כל הנתונים השמורים */
export async function wipeAll(photoIds: string[]) {
  pending = null;
  for (const k of saved.keys()) await kv.del(k).catch(() => {});
  for (const id of photoIds) await deletePhoto(id);
  saved.clear();
  if (kv.kind === "local") {
    try {
      await idbClear(createStore("peti", "kv"));
    } catch {
      /* ignore */
    }
  }
}
