# Peti

לוח משרות web (בסגנון JobMaster) — חיפוש משרות לפי תחום ועיר, עמוד משרה ופרסום משרה.

## טכנולוגיות
- Next.js (App Router) + TypeScript
- ממשק בעברית, RTL

## הרצה מקומית
```bash
npm install
npm run dev
```
ואז לפתוח http://localhost:3000

## מבנה
- `src/app/page.tsx` — עמוד בית + חיפוש
- `src/app/jobs/[id]/page.tsx` — עמוד משרה
- `src/app/post/page.tsx` — פרסום משרה (דמה)
- `src/lib/jobs.ts` — נתוני דמה (יוחלפו בבסיס נתונים)

## צעדים הבאים
- בסיס נתונים (למשל PostgreSQL / Supabase)
- הרשמה והתחברות למחפשי עבודה ולמעסיקים
- הגשת קורות חיים
- התראות על משרות חדשות
