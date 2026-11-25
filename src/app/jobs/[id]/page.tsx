"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CompanyLogo } from "@/components/JobCard";
import SaveButton from "@/components/SaveButton";
import { timeAgo } from "@/lib/jobs";
import { actions, allJobs, useStore } from "@/lib/store";

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState("");

  const job = allJobs(store).find((j) => j.id === id);
  if (!job) {
    if (!store.ready) return null;
    return (
      <div className="empty" style={{ marginTop: 80 }}>
        <div className="empty-icon">🤷</div>
        המשרה לא נמצאה
        <p><Link href="/" className="btn">לכל המשרות</Link></p>
      </div>
    );
  }

  const applied = store.applications.find((a) => a.jobId === job.id);
  const p = store.profile;
  const profileOk = p.name && (p.phone || p.email);

  const share = async () => {
    const data = { title: job.title, text: `${job.title} ב${job.company} — ${job.city}`, url: location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard?.writeText(location.href);
  };

  return (
    <>
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="חזרה">→</button>
        <div className="spacer" />
        <button className="icon-btn" onClick={share} aria-label="שיתוף">⤴</button>
        <SaveButton id={job.id} large />
      </div>

      <article className="detail">
        <div className="detail-head">
          <CompanyLogo name={job.company} size={64} />
          <h1>{job.title}</h1>
          <div className="company">{job.company}</div>
        </div>

        <div className="facts">
          <div><span>מיקום</span>{job.city}</div>
          <div><span>היקף</span>{job.type}</div>
          <div><span>תחום</span>{job.category}</div>
          {job.salary && <div><span>שכר</span>{job.salary}</div>}
        </div>

        <h2>תיאור המשרה</h2>
        <p>{job.description}</p>
        {job.requirements.length > 0 && (
          <>
            <h2>דרישות</h2>
            <ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          </>
        )}
        <p className="muted">פורסם {timeAgo(job.postedAt)}</p>
        {job.local && (
          <button className="btn ghost block" onClick={() => { actions.deleteJob(job.id); router.push("/"); }}>
            מחיקת המשרה שפרסמתי
          </button>
        )}
      </article>

      <div className="cta-bar">
        {applied ? (
          <button className="btn block done" disabled>✓ הגשת מועמדות {timeAgo(applied.appliedAt)}</button>
        ) : (
          <button className="btn block" onClick={() => setSheet(true)}>הגשת מועמדות</button>
        )}
      </div>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" role="dialog" aria-label="הגשת מועמדות" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <h2>הגשת מועמדות ל{job.title}</h2>
            {profileOk ? (
              <>
                <div className="applicant">
                  <strong>{p.name}</strong>
                  <span>{[p.phone, p.email].filter(Boolean).join(" · ")}</span>
                  <Link href="/profile" className="link">עריכת פרטים</Link>
                </div>
                <label className="field">
                  הודעה למעסיק (לא חובה)
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="כמה מילים עליך..." />
                </label>
                <button
                  className="btn block"
                  onClick={() => {
                    actions.apply(job.id, note.trim() || undefined);
                    setSheet(false);
                  }}
                >
                  שליחת מועמדות
                </button>
              </>
            ) : (
              <>
                <p className="muted">כדי להגיש מועמדות צריך קודם למלא שם וטלפון או מייל בפרופיל.</p>
                <Link href={`/profile?next=/jobs/${job.id}`} className="btn block">מילוי פרופיל</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
