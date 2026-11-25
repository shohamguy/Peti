"use client";

import { useMemo, useState } from "react";
import JobCard from "@/components/JobCard";
import { categories, cities, filterJobs, jobTypes } from "@/lib/jobs";
import { allJobs, useStore } from "@/lib/store";

export default function Home() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  const results = useMemo(() => filterJobs(allJobs(store), q, category, city, type), [store, q, category, city, type]);
  const hello = store.profile.name ? `היי ${store.profile.name.split(" ")[0]} 👋` : "היי 👋";

  return (
    <>
      <header className="top">
        <div className="top-row">
          <span className="brand">Peti</span>
          <span className="hello">{store.ready ? hello : ""}</span>
        </div>
        <h1>העבודה הבאה שלך מחכה כאן</h1>
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path fill="currentColor" d="M10.5 4a6.5 6.5 0 1 0 4 11.6l4.4 4.4 1.4-1.4-4.4-4.4A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="תפקיד, חברה או מילת מפתח"
            aria-label="חיפוש משרות"
            enterKeyHint="search"
          />
        </div>
        <div className="filters">
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="אזור">
            <option value="">📍 כל האזורים</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="היקף משרה">
            <option value="">⏱ כל ההיקפים</option>
            {jobTypes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <div className="chips" role="tablist" aria-label="תחומים">
        <button className={!category ? "chip on" : "chip"} onClick={() => setCategory("")}>הכל</button>
        {categories.map((c) => (
          <button key={c} className={category === c ? "chip on" : "chip"} onClick={() => setCategory(category === c ? "" : c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="section">
        <p className="count">נמצאו {results.length} משרות</p>
        <div className="list">
          {results.map((job) => <JobCard key={job.id} job={job} />)}
          {results.length === 0 && (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              לא נמצאו משרות. נסו לשנות את החיפוש או הסינון.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
