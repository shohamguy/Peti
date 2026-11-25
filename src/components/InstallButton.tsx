"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BIPEvent | null = null;
const subs = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    subs.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    subs.forEach((f) => f());
  });
}

function useInstallState() {
  const [, force] = useState(0);
  const [env, setEnv] = useState({ standalone: false, ios: false, mounted: false });
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setEnv({ standalone, ios, mounted: true });
    return () => {
      subs.delete(f);
    };
  }, []);
  return { ...env, canPrompt: !!deferred };
}

/** באנר התקנה — מופיע רק כשאפשר להתקין ועוד לא הותקן */
export function InstallBanner() {
  const { standalone, ios, mounted, canPrompt } = useInstallState();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem("peti-install-dismissed") === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (!mounted || standalone || hidden || (!canPrompt && !ios)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem("peti-install-dismissed", "1");
    } catch {}
  };

  return (
    <div className="install-banner" role="region" aria-label="התקנת האפליקציה">
      <img src="/icons/icon-192.png" alt="" width={40} height={40} />
      <div className="install-text">
        <strong>התקינו את Peti בנייד</strong>
        <span>{ios ? "לחצו על כפתור השיתוף ⬆️ ואז \"הוספה למסך הבית\"" : "גישה מהירה מהמסך הראשי, גם בלי אינטרנט"}</span>
      </div>
      {!ios && (
        <button className="btn small" onClick={() => deferred?.prompt()}>
          התקנה
        </button>
      )}
      <button className="close" aria-label="סגירה" onClick={dismiss}>
        ✕
      </button>
    </div>
  );
}

/** כפתור התקנה לעמוד הפרופיל */
export function InstallCard() {
  const { standalone, ios, mounted, canPrompt } = useInstallState();
  if (!mounted) return null;
  if (standalone) return <p className="muted">✅ האפליקציה מותקנת במכשיר הזה</p>;
  if (canPrompt)
    return (
      <button className="btn block" onClick={() => deferred?.prompt()}>
        📲 התקנת האפליקציה בנייד
      </button>
    );
  return (
    <div className="muted install-help">
      {ios ? (
        <>באייפון (Safari): לחצו על כפתור השיתוף ⬆️ ובחרו <b>"הוספה למסך הבית"</b>.</>
      ) : (
        <>באנדרואיד (Chrome): פתחו את התפריט ⋮ ובחרו <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b>.</>
      )}
    </div>
  );
}
