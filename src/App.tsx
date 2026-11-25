import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import BottomNav, { TABS, type Tab } from "./components/BottomNav";
import FxLayer from "./components/FxLayer";
import Dog3D from "./components/Dog3D";
import { Paw } from "./components/Icons";
import TopBar from "./components/TopBar";
import { boot } from "./lib/boot";
import { daysBetween, today } from "./lib/dates";
import { IS_ARTIFACT } from "./lib/persist";
import { useActiveDog, useApp } from "./lib/store";
import { useUI } from "./lib/ui";
import BadgesSheet from "./screens/BadgesSheet";
import DogSheet from "./screens/DogSheet";
import Growth from "./screens/Growth";
import Health from "./screens/Health";
import Home from "./screens/Home";
import Journal from "./screens/Journal";
import Onboarding from "./screens/Onboarding";
import Tricks from "./screens/Tricks";

const VALID = new Set<string>(TABS.map((t) => t.id));
const TITLES: Record<Tab, string | undefined> = { home: undefined, journal: "יומן", growth: "גדילה", health: "בריאות", tricks: "טריקים" };
const readHash = (): Tab => {
  const h = location.hash.slice(1);
  return (VALID.has(h) ? h : "home") as Tab;
};

function Splash() {
  return (
    <div className="splash" aria-busy="true" aria-label="טוען">
      <div className="splash-logo">
        <Paw size={28} /> Peti
      </div>
      <div className="splash-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function LoadError() {
  return (
    <div className="splash">
      <div className="ob-dog small">
        <Dog3D coat="golden" pattern="plain" mood="bored" framing="full" />
      </div>
      <h1 className="ob-title">לא הצלחנו להגיע לנתונים השמורים</h1>
      <p className="ob-sub">כנראה בעיית חיבור. הנתונים שלכם לא נמחקו.</p>
      <div className="ob-actions">
        <button type="button" className="btn btn-primary block" onClick={() => void boot()}>
          לנסות שוב
        </button>
        <button type="button" className="btn btn-ghost block" onClick={() => void boot(true)}>
          להמשיך בלי סנכרון (שמירה בדפדפן הזה)
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const ready = useApp((s) => s.ready);
  const loadError = useApp((s) => s.loadError);
  const hasDogs = useApp((s) => s.dogs.length > 0);
  const theme = useApp((s) => s.theme);
  const health = useApp((s) => s.health);
  const dog = useActiveDog();
  const { sheet, openSheet, onboarding, endOnboarding } = useUI();
  const [tab, setTab] = useState<Tab>(readHash);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHash = () => setTab(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (IS_ARTIFACT) return;
    const el = document.documentElement;
    if (theme === "auto") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
  }, [theme]);

  const go = (t: Tab) => {
    if (t === tab) {
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    location.hash = t;
    setTab(t);
  };

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [tab]);

  const t = today();
  const lateHealth = dog ? health.filter((h) => h.dogId === dog.id && h.due && daysBetween(t, h.due) < 0).length : 0;

  let body;
  if (loadError) body = <LoadError />;
  else if (!ready) body = <Splash />;
  else if (!hasDogs || onboarding)
    body = (
      <Onboarding
        mode={hasDogs ? "add" : "first"}
        onDone={() => {
          endOnboarding();
          setTab("home");
          location.hash = "home";
        }}
      />
    );
  else {
    const screen =
      tab === "journal" ? <Journal /> : tab === "growth" ? <Growth /> : tab === "health" ? <Health /> : tab === "tricks" ? <Tricks /> : <Home go={go} />;
    body = (
      <>
        <TopBar title={TITLES[tab]} />
        <main className="main" ref={mainRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab + (dog?.id ?? "")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {screen}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav tab={tab} onChange={go} alerts={{ health: lateHealth }} />
        <DogSheet open={sheet === "dog"} onClose={() => openSheet(null)} />
        <BadgesSheet open={sheet === "badges"} onClose={() => openSheet(null)} />
      </>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">{body}</div>
      <FxLayer />
    </MotionConfig>
  );
}
