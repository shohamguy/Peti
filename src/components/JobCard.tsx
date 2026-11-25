"use client";

import Link from "next/link";
import { timeAgo, type Job } from "@/lib/jobs";
import SaveButton from "./SaveButton";

export function CompanyLogo({ name, size = 44 }: { name: string; size?: number }) {
  const hue = [...name].reduce((h, c) => (h + c.charCodeAt(0) * 7) % 360, 0);
  return (
    <span
      className="logo-badge"
      style={{ width: size, height: size, background: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 55% 38%)` }}
      aria-hidden
    >
      {name.replace(/["'״׳]/g, "").trim().charAt(0)}
    </span>
  );
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="card job-card">
      <Link href={`/jobs/${job.id}`} className="job-link">
        <CompanyLogo name={job.company} />
        <div className="job-body">
          <h3>{job.title}</h3>
          <div className="company">{job.company}</div>
          <div className="meta">
            <span>📍 {job.city}</span>
            <span className="tag">{job.type}</span>
            {job.salary && <span>💰 {job.salary}</span>}
          </div>
          <div className="time">{job.local ? "פורסם על ידך · " : ""}{timeAgo(job.postedAt)}</div>
        </div>
      </Link>
      <SaveButton id={job.id} />
    </div>
  );
}
