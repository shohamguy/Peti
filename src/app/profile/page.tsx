"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InstallCard } from "@/components/InstallButton";
import { categories, cities } from "@/lib/jobs";
import { actions, useStore, type Profile } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const store = useStore();
  const [form, setForm] = useState<Profile>(store.profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store.ready) setForm(store.profile);
  }, [store.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.saveProfile(form);
    const next = new URLSearchParams(location.search).get("next");
    if (next?.startsWith("/")) router.push(next);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <>
      <header className="page-title">
        <h1>הפרופיל שלי</h1>
        <p className="muted">הפרטים ישמשו להגשת מועמדות בלחיצה אחת</p>
      </header>
      <form className="form section" onSubmit={onSubmit}>
        <label className="field">שם מלא<input value={form.name} onChange={upd("name")} autoComplete="name" required /></label>
        <label className="field">טלפון<input value={form.phone} onChange={upd("phone")} type="tel" autoComplete="tel" inputMode="tel" /></label>
        <label className="field">אימייל<input value={form.email} onChange={upd("email")} type="email" autoComplete="email" /></label>
        <div className="row">
          <label className="field">
            אזור מועדף
            <select value={form.city} onChange={upd("city")}>
              <option value="">—</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            תחום מועדף
            <select value={form.category} onChange={upd("category")}>
              <option value="">—</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <button className="btn block" type="submit">{saved ? "✓ נשמר" : "שמירה"}</button>
      </form>

      <div className="section">
        <div className="card stats">
          <div><b>{store.saved.length}</b>שמורות</div>
          <div><b>{store.applications.length}</b>הגשות</div>
          <div><b>{store.postedJobs.length}</b>פרסמתי</div>
        </div>
        <h2 className="sub">התקנה בנייד</h2>
        <InstallCard />
      </div>
    </>
  );
}
