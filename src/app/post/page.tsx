"use client";

import { useRouter } from "next/navigation";
import { categories, cities, jobTypes, type JobType } from "@/lib/jobs";
import { actions } from "@/lib/store";

export default function PostJob() {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const id = actions.postJob({
      title: s("title"),
      company: s("company"),
      city: s("city"),
      category: s("category"),
      type: s("type") as JobType,
      salary: s("salary") || undefined,
      description: s("description"),
      requirements: s("requirements").split("\n").map((r) => r.trim()).filter(Boolean),
    });
    router.push(`/jobs/${id}`);
  };

  return (
    <>
      <header className="page-title">
        <h1>פרסום משרה</h1>
        <p className="muted">המשרה תופיע מיד ברשימה (כרגע נשמרת במכשיר הזה בלבד)</p>
      </header>
      <form className="form section" onSubmit={onSubmit}>
        <label className="field">שם המשרה<input name="title" required placeholder="למשל: נציג/ת שירות" /></label>
        <label className="field">שם החברה<input name="company" required /></label>
        <div className="row">
          <label className="field">
            עיר
            <select name="city" required>{cities.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="field">
            היקף
            <select name="type">{jobTypes.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
        </div>
        <label className="field">
          תחום
          <select name="category">{categories.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="field">שכר (לא חובה)<input name="salary" placeholder="למשל: 50 ₪ לשעה" /></label>
        <label className="field">תיאור<textarea name="description" rows={4} required /></label>
        <label className="field">דרישות (שורה לכל דרישה)<textarea name="requirements" rows={3} /></label>
        <button className="btn block" type="submit">פרסום המשרה</button>
      </form>
    </>
  );
}
