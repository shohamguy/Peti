export default function Offline() {
  return (
    <div className="empty" style={{ marginTop: 100 }}>
      <div className="empty-icon">📡</div>
      אין חיבור לאינטרנט כרגע.
      <p className="muted">המשרות השמורות והפרופיל שלך זמינים גם בלי חיבור.</p>
    </div>
  );
}
