import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  return (
    <article className="card" style={{ margin: "24px 0 40px" }}>
      <Link href="/" className="meta">→ חזרה לכל המשרות</Link>
      <h2 style={{ marginTop: 12 }}>{job.title}</h2>
      <div className="meta">
        <span>{job.company}</span>
        <span>📍 {job.city}</span>
        <span className="tag">{job.type}</span>
        <span>פורסם: {new Date(job.postedAt).toLocaleDateString("he-IL")}</span>
      </div>
      <h3 style={{ marginTop: 20 }}>תיאור המשרה</h3>
      <p>{job.description}</p>
      <h3>דרישות</h3>
      <ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
      <button className="btn">הגשת מועמדות</button>
    </article>
  );
}
