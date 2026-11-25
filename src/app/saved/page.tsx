"use client";

import Link from "next/link";
import { useState } from "react";
import JobCard from "@/components/JobCard";
import { allJobs, useStore } from "@/lib/store";

export default function Saved() {
  const store = useStore();
  const [tab, setTab] = useState<"saved" | "applied">("saved");
  const jobs = allJobs(store);
  const saved = store.saved.map((id) => jobs.find((j) => j.id === id)).filter((j) => !!j);
  const applied = store.applications.map((a) => jobs.find((j) => j.id === a.jobId)).filter((j) => !!j);
  const list = tab === "saved" ? saved : applied;

  return (
    <>
      <header className="page-title">
        <h1>המשרות שלי</h1>
        <div className="segmented">
          <button className={tab === "saved" ? "on" : ""} onClick={() => setTab("saved")}>שמורות ({saved.length})</button>
          <button className={tab === "applied" ? "on" : ""} onClick={() => setTab("applied")}>הגשתי ({applied.length})</button>
        </div>
      </header>
      <div className="section list">
        {store.ready && list.map((j) => <JobCard key={j.id} job={j} />)}
        {store.ready && list.length === 0 && (
          <div className="empty">
            <div className="empty-icon">{tab === "saved" ? "🤍" : "📨"}</div>
            {tab === "saved" ? "עוד לא שמרת משרות. לחצו על הלב כדי לשמור." : "עוד לא הגשת מועמדות לאף משרה."}
            <p><Link href="/" className="btn">לחיפוש משרות</Link></p>
          </div>
        )}
      </div>
    </>
  );
}
