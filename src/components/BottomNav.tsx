import { motion } from "framer-motion";
import { Icon, type IconName } from "./Icons";

export type Tab = "home" | "journal" | "growth" | "health" | "tricks";

export const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "בית", icon: "home" },
  { id: "journal", label: "יומן", icon: "journal" },
  { id: "growth", label: "גדילה", icon: "growth" },
  { id: "health", label: "בריאות", icon: "health" },
  { id: "tricks", label: "טריקים", icon: "tricks" },
];

export default function BottomNav({ tab, onChange, alerts }: { tab: Tab; onChange: (t: Tab) => void; alerts: Partial<Record<Tab, number>> }) {
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      <div className="bottom-nav-inner">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button key={t.id} type="button" className={on ? "nav-btn on" : "nav-btn"} aria-current={on ? "page" : undefined} onClick={() => onChange(t.id)}>
              {on && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
              <motion.span className="nav-icon" animate={on ? { y: [0, -5, 0], rotate: [0, -8, 0] } : { y: 0 }} transition={{ duration: 0.4 }}>
                <Icon name={t.icon} size={23} />
                {!!alerts[t.id] && <span className="nav-dot" aria-label={`${alerts[t.id]} דורשים תשומת לב`} />}
              </motion.span>
              <span className="nav-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
