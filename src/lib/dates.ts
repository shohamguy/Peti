export const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD לפי שעון המכשיר */
export function dayKey(d: Date | string = new Date()): string {
  if (typeof d === "string") {
    if (d.length === 10) return d;
    d = new Date(d);
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const today = () => dayKey();

export function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY);
}

// ---- רבים בעברית ----
export const nDays = (n: number) => (n === 1 ? "יום אחד" : n === 2 ? "יומיים" : `${n} ימים`);
export const nWeeks = (n: number) => (n === 1 ? "שבוע" : n === 2 ? "שבועיים" : `${n} שבועות`);
export const nMonths = (n: number) => (n === 1 ? "חודש" : n === 2 ? "חודשיים" : `${n} חודשים`);
export const nYears = (n: number) => (n === 1 ? "שנה" : n === 2 ? "שנתיים" : `${n} שנים`);

/** "4 חודשים" + "12 ימים" => "4 חודשים ו־12 ימים" */
export function andJoin(a: string, b: string) {
  return `${a} ו${/^\d/.test(b) ? "־" : ""}${b}`;
}

export function diffYMD(from: string, to: string) {
  const a = parseDay(from);
  const b = parseDay(to);
  let y = b.getFullYear() - a.getFullYear();
  let m = b.getMonth() - a.getMonth();
  let d = b.getDate() - a.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d, days: daysBetween(from, to), months: y * 12 + m + d / 30.44 };
}

/** גיל קריא: "9 שבועות", "5 חודשים ו־3 ימים", "שנה ו־2 חודשים" */
export function ageText(birth: string, at: string = today()): string {
  const { y, m, d, days } = diffYMD(birth, at);
  if (days < 0) return "";
  if (days === 0) return "יום אחד";
  if (days < 14) return nDays(days);
  if (days < 7 * 16) return nWeeks(Math.floor(days / 7));
  if (y < 1) return d ? andJoin(nMonths(m), nDays(d)) : nMonths(m);
  if (y < 5) return m ? andJoin(nYears(y), nMonths(m)) : nYears(y);
  return nYears(y);
}

export function relDay(day: string, now: string = today()): string {
  const n = daysBetween(now, day);
  if (n === 0) return "היום";
  if (n === 1) return "מחר";
  if (n === -1) return "אתמול";
  if (n === 2) return "מחרתיים";
  if (n === -2) return "שלשום";
  const a = Math.abs(n);
  const span = a < 14 ? `${a} ימים` : a < 60 ? nWeeks(Math.round(a / 7)) : a < 365 ? nMonths(Math.round(a / 30.44)) : nYears(Math.round(a / 365));
  return n > 0 ? `בעוד ${span}` : `לפני ${span}`;
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("he-IL", o);
const fDayMonth = fmt({ day: "numeric", month: "short" });
const fDayMonthYear = fmt({ day: "numeric", month: "short", year: "numeric" });
const fLong = fmt({ day: "numeric", month: "long" });
const fWeekday = fmt({ weekday: "long" });
const fTime = fmt({ hour: "2-digit", minute: "2-digit" });

export function fmtDay(day: string) {
  const d = parseDay(day);
  return d.getFullYear() === new Date().getFullYear() ? fDayMonth.format(d) : fDayMonthYear.format(d);
}
export const fmtLong = (day: string) => fLong.format(parseDay(day));
export const fmtTime = (iso: string) => fTime.format(new Date(iso));

export function dayHeader(day: string) {
  const n = daysBetween(today(), day);
  if (n === 0) return "היום";
  if (n === -1) return "אתמול";
  return `${fWeekday.format(parseDay(day))}, ${fmtDay(day)}`;
}

export function greeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 22) return "ערב טוב";
  return "לילה טוב";
}

/** ISO של היום, בשעה hh:mm לפי שעון המכשיר */
export function isoAt(day: string, hh: number, mm: number) {
  const d = parseDay(day);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/** ערך ל-<input type="time"> מתוך ISO */
export function timeValue(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** יום השנה הבא (יום הולדת / יום אימוץ) */
export function nextAnniversary(day: string, now: string = today()) {
  const d = parseDay(day);
  const n = parseDay(now);
  let next = new Date(n.getFullYear(), d.getMonth(), d.getDate());
  if (next < n) next = new Date(n.getFullYear() + 1, d.getMonth(), d.getDate());
  const key = dayKey(next);
  return { day: key, inDays: daysBetween(now, key), years: next.getFullYear() - d.getFullYear() };
}
