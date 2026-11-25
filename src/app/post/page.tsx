import { categories } from "@/lib/jobs";

export default function PostJob() {
  return (
    <>
      <section className="hero">
        <h1>פרסום משרה חדשה</h1>
        <p>(טופס דמה — עדיין לא נשמר לשום מקום)</p>
      </section>
      <form className="form">
        <label>שם המשרה<input name="title" required /></label>
        <label>שם החברה<input name="company" required /></label>
        <label>עיר<input name="city" required /></label>
        <label>
          תחום
          <select name="category">{categories.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>
          היקף משרה
          <select name="type">
            <option>משרה מלאה</option><option>משרה חלקית</option>
            <option>משמרות</option><option>פרילנס</option>
          </select>
        </label>
        <label>תיאור<textarea name="description" rows={5} /></label>
        <button className="btn" type="submit">פרסום</button>
      </form>
    </>
  );
}
