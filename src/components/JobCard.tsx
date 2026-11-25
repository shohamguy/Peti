import Link from "next/link";
import type { Job } from "@/lib/jobs";

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="card">
      <h3>{job.title}</h3>
      <div className="meta">
        <span>{job.company}</span>
        <span>📍 {job.city}</span>
        <span className="tag">{job.type}</span>
        <span className="tag">{job.category}</span>
      </div>
    </Link>
  );
}
