export type JobType = "משרה מלאה" | "משרה חלקית" | "משמרות" | "פרילנס";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  category: string;
  type: JobType;
  postedAt: string; // ISO date
  salary?: string;
  description: string;
  requirements: string[];
  local?: boolean; // משרה שפורסמה מהמכשיר הזה
};

export const jobTypes: JobType[] = ["משרה מלאה", "משרה חלקית", "משמרות", "פרילנס"];

export const categories = [
  "הייטק ותוכנה",
  "שירות לקוחות",
  "מכירות",
  "כספים",
  "עיצוב",
  "לוגיסטיקה",
  "מסעדנות",
  "חינוך",
  "בריאות",
  "סטודנטים",
];

export const cities = [
  "תל אביב",
  "ירושלים",
  "חיפה",
  "באר שבע",
  "ראשון לציון",
  "פתח תקווה",
  "נתניה",
  "מודיעין",
  "עבודה מהבית",
];

// נתוני דמה — יוחלפו בבסיס נתונים בהמשך
export const jobs: Job[] = [
  {
    id: "1",
    title: "מפתח/ת Full Stack",
    company: "טק-ליין בע\"מ",
    city: "תל אביב",
    category: "הייטק ותוכנה",
    type: "משרה מלאה",
    postedAt: "2026-11-24",
    salary: "25,000–32,000 ₪",
    description: "פיתוח מערכות web בצוות קטן ודינמי, עבודה עם React ו-Node.js. אפשרות ליום עבודה מהבית בשבוע.",
    requirements: ["3+ שנות ניסיון", "React / TypeScript", "Node.js"],
  },
  {
    id: "2",
    title: "נציג/ת שירות לקוחות",
    company: "שירות פלוס",
    city: "חיפה",
    category: "שירות לקוחות",
    type: "משמרות",
    postedAt: "2026-11-25",
    salary: "45 ₪ לשעה",
    description: "מענה טלפוני ובצ'אט ללקוחות החברה, עבודה במשמרות גמישות. מתאים גם לסטודנטים.",
    requirements: ["עברית ברמה גבוהה", "יחסי אנוש מצוינים"],
  },
  {
    id: "3",
    title: "מנהל/ת חשבונות",
    company: "רו\"ח כהן ושות'",
    city: "ירושלים",
    category: "כספים",
    type: "משרה חלקית",
    postedAt: "2026-11-18",
    description: "הנהלת חשבונות סוג 3 למשרד רואי חשבון.",
    requirements: ["תעודת הנהלת חשבונות סוג 3", "ניסיון בחשבשבת"],
  },
  {
    id: "4",
    title: "מעצב/ת גרפי/ת",
    company: "סטודיו קו",
    city: "עבודה מהבית",
    category: "עיצוב",
    type: "פרילנס",
    postedAt: "2026-11-23",
    description: "עיצוב חומרים שיווקיים לרשתות חברתיות ולדפוס.",
    requirements: ["שליטה ב-Figma / Adobe", "תיק עבודות"],
  },
  {
    id: "5",
    title: "נציג/ת מכירות שטח",
    company: "מגה סחר",
    city: "פתח תקווה",
    category: "מכירות",
    type: "משרה מלאה",
    postedAt: "2026-11-21",
    salary: "בסיס + עמלות + רכב",
    description: "מכירה ללקוחות עסקיים באזור המרכז, בניית קשרים ארוכי טווח עם לקוחות.",
    requirements: ["רישיון נהיגה", "ניסיון במכירות — יתרון", "ראש גדול"],
  },
  {
    id: "6",
    title: "מחסנאי/ת",
    company: "לוגיסטיקה ישירה",
    city: "ראשון לציון",
    category: "לוגיסטיקה",
    type: "משמרות",
    postedAt: "2026-11-25",
    salary: "42 ₪ לשעה",
    description: "ליקוט, אריזה וקבלת סחורה במרכז הפצה מודרני. הסעות מאורגנות.",
    requirements: ["רישיון מלגזה — יתרון", "זמינות למשמרות"],
  },
  {
    id: "7",
    title: "מלצר/ית",
    company: "מסעדת הים",
    city: "נתניה",
    category: "מסעדנות",
    type: "משרה חלקית",
    postedAt: "2026-11-22",
    salary: "טיפים גבוהים",
    description: "מסעדת שף על חוף הים מחפשת מלצרים/ות לצוות צעיר ואנרגטי.",
    requirements: ["ניסיון — יתרון", "זמינות לסופי שבוע"],
  },
  {
    id: "8",
    title: "מורה למתמטיקה",
    company: "תיכון אופק",
    city: "מודיעין",
    category: "חינוך",
    type: "משרה חלקית",
    postedAt: "2026-11-19",
    description: "הוראת מתמטיקה בכיתות י'–י\"ב, הכנה לבגרות 5 יח\"ל.",
    requirements: ["תעודת הוראה", "תואר במתמטיקה או תחום רלוונטי"],
  },
  {
    id: "9",
    title: "אח/ות מוסמך/ת",
    company: "מרכז רפואי הנגב",
    city: "באר שבע",
    category: "בריאות",
    type: "משמרות",
    postedAt: "2026-11-20",
    description: "עבודה במחלקה פנימית, תנאים מצוינים ומענק התמדה.",
    requirements: ["רישיון אח/ות מוסמך/ת", "נכונות למשמרות"],
  },
  {
    id: "10",
    title: "סטודנט/ית QA",
    company: "קוד-וויב",
    city: "תל אביב",
    category: "סטודנטים",
    type: "משרה חלקית",
    postedAt: "2026-11-24",
    salary: "55 ₪ לשעה",
    description: "בדיקות ידניות ואוטומטיות לאפליקציות מובייל, 2–3 ימים בשבוע.",
    requirements: ["סטודנט/ית בשנה א'–ב'", "אנגלית טובה"],
  },
];

export function filterJobs(list: Job[], q = "", category = "", city = "", type = "") {
  const term = q.trim().toLowerCase();
  return list
    .filter(
      (j) =>
        (!term ||
          j.title.toLowerCase().includes(term) ||
          j.company.toLowerCase().includes(term) ||
          j.description.toLowerCase().includes(term)) &&
        (!category || j.category === category) &&
        (!city || j.city === city) &&
        (!type || j.type === type),
    )
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}
