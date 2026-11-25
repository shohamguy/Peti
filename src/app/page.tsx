import JobCard from "@/components/JobCard";
import { categories, cities, searchJobs } from "@/lib/jobs";

type Props = { searchParams: Promise<{ q?: string; category?: string; city?: string }> };

export default async function Home({ searchParams }: Props) {
  const { q = "", category = "", city = "" } = await searchParams;
  const results = searchJobs(q, category, city);

  return (
    <>
      <section className="hero">
        <h1>העבודה הבאה שלך מחכה כאן</h1>
        <p>חיפוש משרות לפי תחום, עיר ומילות מפתח</p>
      </section>

      <form className="search" action="/">
        <input name="q" placeholder="מה מחפשים? (תפקיד, חברה...)" defaultValue={q} />
        <select name="category" defaultValue={category}>
          <option value="">כל התחומים</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="city" defaultValue={city}>
          <option value="">כל האזורים</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn" type="submit">חיפוש</button>
      </form>

      <p className="meta">נמצאו {results.length} משרות</p>
      <div className="list">
        {results.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </>
  );
}
