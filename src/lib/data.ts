import type { CoatId, HealthKind, LogType, Pattern, Sex, Size, Task } from "./types";

/** עזר לדקדוק: ממיר מחרוזת לפי מין הכלב */
export type G = (male: string, female: string) => string;
export const gFor = (sex: Sex | undefined): G => (m, f) => (sex === "female" ? f : m);

export const COATS: Record<CoatId, { name: string; base: string; dark: string; light: string }> = {
  golden: { name: "זהוב", base: "#E9A957", dark: "#B5733A", light: "#FFF0DA" },
  choco: { name: "שוקולד", base: "#8D5A3A", dark: "#5A3522", light: "#EBCFB4" },
  black: { name: "שחור", base: "#3A3740", dark: "#211F26", light: "#E9E1D5" },
  white: { name: "לבן", base: "#F8F4EE", dark: "#D6C3AA", light: "#FFFFFF" },
  gray: { name: "אפור", base: "#A7B0BC", dark: "#6F7885", light: "#EEF1F5" },
  ginger: { name: "ג׳ינג׳י", base: "#E5853F", dark: "#A95321", light: "#FFE9D5" },
  cream: { name: "קרם", base: "#EDDCBC", dark: "#C6A472", light: "#FFFAF0" },
};
export const COAT_IDS = Object.keys(COATS) as CoatId[];

export const PATTERNS: { id: Pattern; name: string }[] = [
  { id: "plain", name: "חלק" },
  { id: "patch", name: "כתם על העין" },
  { id: "spots", name: "נקודות" },
];

export const SIZES: Record<Size, { name: string; hint: string; mature: [number, number]; seniorYears: number }> = {
  small: { name: "קטן", hint: "עד 10 ק״ג", mature: [9, 12], seniorYears: 10 },
  medium: { name: "בינוני", hint: "10–25 ק״ג", mature: [12, 15], seniorYears: 8 },
  large: { name: "גדול", hint: "25–45 ק״ג", mature: [15, 18], seniorYears: 7 },
  giant: { name: "ענק", hint: "מעל 45 ק״ג", mature: [18, 24], seniorYears: 6 },
};
export const SIZE_IDS = Object.keys(SIZES) as Size[];

export const BREEDS: [string, Size][] = [
  ["מעורב", "medium"],
  ["כלב כנעני", "medium"],
  ["לברדור רטריבר", "large"],
  ["גולדן רטריבר", "large"],
  ["רועה גרמני", "large"],
  ["רועה בלגי (מלינואה)", "large"],
  ["בורדר קולי", "medium"],
  ["רועה אוסטרלי", "medium"],
  ["האסקי סיבירי", "medium"],
  ["ביגל", "medium"],
  ["קוקר ספנייל", "medium"],
  ["אמסטף", "medium"],
  ["בולדוג אנגלי", "medium"],
  ["בולדוג צרפתי", "small"],
  ["פאג", "small"],
  ["שיצו", "small"],
  ["מלטז", "small"],
  ["צ׳יוואווה", "small"],
  ["יורקשייר טרייר", "small"],
  ["פומרניאן", "small"],
  ["קאבליר קינג צ׳ארלס", "small"],
  ["ג׳ק ראסל טרייר", "small"],
  ["שנאוצר מיניאטורי", "small"],
  ["תחש", "small"],
  ["שיבא אינו", "small"],
  ["פודל טוי", "small"],
  ["פודל סטנדרטי", "large"],
  ["בוקסר", "large"],
  ["דוברמן", "large"],
  ["רוטווילר", "large"],
  ["ויימרנר", "large"],
  ["אקיטה", "large"],
  ["ברנזי", "giant"],
  ["דני ענק", "giant"],
  ["סנט ברנרד", "giant"],
];

export const LOG_TYPES: Record<LogType, { label: string; emoji: string; tint: string }> = {
  meal: { label: "ארוחה", emoji: "🥣", tint: "#FFE3B8" },
  walk: { label: "טיול", emoji: "🦮", tint: "#CFE6FF" },
  pee: { label: "פיפי", emoji: "💧", tint: "#FFF2A0" },
  poop: { label: "קקי", emoji: "💩", tint: "#EBD8C6" },
  play: { label: "משחק", emoji: "🎾", tint: "#DDF6C8" },
  train: { label: "אימון", emoji: "🎯", tint: "#E6DCFF" },
  treat: { label: "חטיף", emoji: "🦴", tint: "#FFDCD3" },
  bath: { label: "מקלחת", emoji: "🛁", tint: "#CDF2EF" },
  groom: { label: "טיפוח", emoji: "✂️", tint: "#FFDDF1" },
  meds: { label: "תרופה", emoji: "💊", tint: "#FFD7D7" },
  vet: { label: "וטרינר", emoji: "🩺", tint: "#D5EEFF" },
  note: { label: "פתק", emoji: "📝", tint: "#EDEBF3" },
};
export const QUICK_TYPES: LogType[] = ["meal", "walk", "pee", "poop", "play", "train", "treat", "bath", "groom", "meds", "vet", "note"];

let taskSeq = 0;
const tid = (p: string) => `${p}-${Date.now().toString(36)}${(taskSeq++).toString(36)}`;

export function defaultRoutine(puppy: boolean): Task[] {
  return [
    { id: tid("t"), title: "ארוחת בוקר", emoji: "🥣", logType: "meal" },
    { id: tid("t"), title: "טיול בוקר", emoji: "🦮", logType: "walk" },
    ...(puppy ? [{ id: tid("t"), title: "ארוחת צהריים", emoji: "🥣", logType: "meal" as LogType }] : []),
    { id: tid("t"), title: "משחק או אימון", emoji: "🎾", logType: "play" },
    { id: tid("t"), title: "ארוחת ערב", emoji: "🥣", logType: "meal" },
    { id: tid("t"), title: "טיול ערב", emoji: "🦮", logType: "walk" },
    { id: tid("t"), title: "מים טריים בקערה", emoji: "💧" },
  ];
}

export const DEFAULT_TRICKS: { key: string; name: string; emoji: string; tip: string }[] = [
  { key: "name", name: "תגובה לשם", emoji: "👂", tip: "אמרו את השם בקול שמח, וברגע של קשר עין תנו חטיף. חזרו על זה כמה פעמים ביום, בכל פעם ממקום אחר בבית." },
  { key: "sit", name: "שב", emoji: "🐕", tip: "החזיקו חטיף מעל האף והזיזו אותו לאט אחורה. ברגע שהישבן נוגע ברצפה אמרו ״שב״, שבחו ותנו את החטיף." },
  { key: "down", name: "ארצה", emoji: "⬇️", tip: "מתנוחת ״שב״, הורידו חטיף מהאף אל הרצפה ומשכו אותו לאט קדימה. כשהמרפקים על הרצפה אמרו ״ארצה״ ותגמלו." },
  { key: "come", name: "בוא", emoji: "📣", tip: "התחילו בבית: התכופפו, אמרו ״בוא״ בקול שמח ותגמלו בגדול על כל הגעה. לעולם אל תקראו ״בוא״ כדי לנזוף." },
  { key: "stay", name: "הישאר", emoji: "✋", tip: "בקשו ״שב״, הראו כף יד פתוחה ואמרו ״הישאר״. התחילו משנייה אחת ומטר אחד, והאריכו בהדרגה. חזרו אתם לתגמל." },
  { key: "paw", name: "תן יד", emoji: "🤝", tip: "החזיקו חטיף באגרוף סגור ליד הכפה. כשהכפה נוגעת ביד אמרו ״תן יד״ ופתחו את האגרוף." },
  { key: "leave", name: "עזוב", emoji: "🚫", tip: "הראו חטיף ביד סגורה. ברגע שמפסיקים לנסות להגיע אליו אמרו ״עזוב״ ותגמלו מהיד השנייה." },
  { key: "heel", name: "הליכה ליד", emoji: "🦮", tip: "עצרו בכל פעם שהרצועה נמתחת, והמשיכו רק כשהיא רפויה. תגמלו על כל כמה צעדים צמודים לרגל." },
  { key: "place", name: "למקום", emoji: "🛏️", tip: "זרקו חטיף למיטה ואמרו ״למקום״. תגמלו שוב על שכיבה שם. בהמשך שלחו למיטה ממרחק גדל." },
  { key: "spin", name: "סיבוב", emoji: "🔄", tip: "הובילו עם חטיף בעיגול רחב סביב הגוף. כשהסיבוב מלא אמרו ״סיבוב״ ותגמלו. בהדרגה הקטינו את תנועת היד." },
  { key: "bang", name: "בנג!", emoji: "🎬", tip: "מתנוחת ״ארצה״, הובילו עם חטיף לכיוון הכתף עד להתגלגלות על הצד. אמרו ״בנג!״ ותגמלו בזמן השכיבה." },
  { key: "five", name: "כיף!", emoji: "🙌", tip: "אחרי ש״תן יד״ יושב טוב, הרימו את כף היד גבוה יותר ואמרו ״כיף!״. תגמלו על כל מגע." },
];

export const HEALTH_KINDS: Record<HealthKind, { label: string; emoji: string }> = {
  vaccine: { label: "חיסון", emoji: "💉" },
  parasite: { label: "פרעושים וקרציות", emoji: "🛡️" },
  deworm: { label: "תילוע", emoji: "🪱" },
  vet: { label: "ביקור וטרינר", emoji: "🩺" },
  meds: { label: "תרופה", emoji: "💊" },
  license: { label: "רישיון", emoji: "📄" },
  grooming: { label: "טיפוח", emoji: "✂️" },
  other: { label: "אחר", emoji: "📌" },
};
export const HEALTH_KIND_IDS = Object.keys(HEALTH_KINDS) as HealthKind[];

export const HEALTH_TEMPLATES: { kind: HealthKind; title: string; repeatDays: number; note?: string }[] = [
  { kind: "vaccine", title: "חיסון כלבת", repeatDays: 365, note: "בישראל זה חיסון חובה שנתי" },
  { kind: "vaccine", title: "חיסון משושה", repeatDays: 365 },
  { kind: "parasite", title: "טיפול נגד פרעושים וקרציות", repeatDays: 30 },
  { kind: "deworm", title: "טיפול נגד תולעים", repeatDays: 90 },
  { kind: "parasite", title: "מניעת תולעת הפארק", repeatDays: 30 },
  { kind: "license", title: "חידוש רישיון כלב", repeatDays: 365, note: "ברשות המקומית" },
  { kind: "vet", title: "בדיקה שגרתית אצל הווטרינר", repeatDays: 365 },
  { kind: "grooming", title: "גזירת ציפורניים", repeatDays: 30 },
];

export const REPEAT_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: "חד־פעמי" },
  { days: 14, label: "כל שבועיים" },
  { days: 30, label: "כל חודש" },
  { days: 90, label: "כל 3 חודשים" },
  { days: 182, label: "כל חצי שנה" },
  { days: 365, label: "כל שנה" },
];
export const repeatLabel = (days: number) => REPEAT_OPTIONS.find((o) => o.days === days)?.label ?? `כל ${days} ימים`;

export const healthLogType = (kind: HealthKind): LogType =>
  kind === "vaccine" || kind === "vet" ? "vet" : kind === "grooming" ? "groom" : kind === "license" || kind === "other" ? "note" : "meds";
