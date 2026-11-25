export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  category: string;
  type: "משרה מלאה" | "משרה חלקית" | "משמרות" | "פרילנס";
  postedAt: string; // ISO date
  description: string;
  requirements: string[];
};

// נתוני דמה — יוחלפו בבסיס נתונים בהמשך
export const jobs: Job[] = [
  {
    id: "1",
    title: "מפתח/ת Full Stack",
    company: "טק-ליין בע\"מ",
    city: "תל אביב",
    category: "הייטק ותוכנה",
    type: "משרה מלאה",
    postedAt: "2026-11-20",
    description: "פיתוח מערכות web בצוות קטן ודינמי, עבודה עם React ו-Node.js.",
    requirements: ["3+ שנות ניסיון", "React / TypeScript", "Node.js"],
  },
  {
    id: "2",
    title: "נציג/ת שירות לקוחות",
    company: "שירות פלוס",
    city: "חיפה",
    category: "שירות לקוחות",
    type: "משמרות",
    postedAt: "2026-11-22",
    description: "מענה טלפוני ובצ'אט ללקוחות החברה, עבודה במשמרות גמישות.",
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
    postedAt: "2026-11-24",
    description: "עיצוב חומרים שיווקיים לרשתות חברתיות ולדפוס.",
    requirements: ["שליטה ב-Figma / Adobe", "תיק עבודות"],
  },
];

export const categories = Array.from(new Set(jobs.map((j) => j.category)));
export const cities = Array.from(new Set(jobs.map((j) => j.city)));

export function getJob(id: string) {
  return jobs.find((j) => j.id === id);
}

export function searchJobs(q = "", category = "", city = "") {
  const term = q.trim().toLowerCase();
  return jobs.filter(
    (j) =>
      (!term ||
        j.title.toLowerCase().includes(term) ||
        j.company.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term)) &&
      (!category || j.category === category) &&
      (!city || j.city === city),
  );
}
