import { useEffect, useState } from "react";
import { IS_ARTIFACT } from "../lib/persist";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BIP | null = null;
const subs = new Set<() => void>();
if (typeof window !== "undefined" && !IS_ARTIFACT) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIP;
    subs.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    subs.forEach((f) => f());
  });
}

export function useInstall() {
  const [, force] = useState(0);
  const [env] = useState(() => ({
    standalone:
      typeof window !== "undefined" &&
      (matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true),
    ios: typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent),
  }));
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return {
    ...env,
    canPrompt: !!deferred,
    prompt: async () => {
      if (!deferred) return;
      await deferred.prompt();
      deferred = null;
      subs.forEach((f) => f());
    },
  };
}

/** כרטיס התקנה להגדרות */
export function InstallCard() {
  const { standalone, ios, canPrompt, prompt } = useInstall();
  if (IS_ARTIFACT)
    return (
      <p className="muted small">
        זו גרסת התצוגה של Peti בתוך Claude. כדי להתקין את האפליקציה בטלפון, פתחו את הכתובת של Peti ב־GitHub Pages והוסיפו אותה למסך הבית.
      </p>
    );
  if (standalone) return <p className="muted small">✅ Peti מותקנת במכשיר הזה.</p>;
  if (canPrompt)
    return (
      <button type="button" className="btn btn-primary block" onClick={prompt}>
        התקנת Peti בטלפון
      </button>
    );
  return (
    <p className="muted small">
      {ios ? (
        <>באייפון (Safari): לחצו על כפתור השיתוף ובחרו ״הוספה למסך הבית״.</>
      ) : (
        <>באנדרואיד (Chrome): פתחו את תפריט ⋮ ובחרו ״התקנת אפליקציה״ או ״הוספה למסך הבית״.</>
      )}
    </p>
  );
}

/** באנר עדין שמציע להתקין (רק כשהדפדפן מאפשר ועוד לא הותקן) */
export function InstallBanner() {
  const { standalone, ios, canPrompt, prompt } = useInstall();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("peti-install-dismissed") === "1";
    } catch {
      return false;
    }
  });
  if (IS_ARTIFACT || standalone || hidden || (!canPrompt && !ios)) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem("peti-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="install-banner card">
      <img src="./icons/icon-192.png" alt="" width={40} height={40} />
      <div className="install-text">
        <strong>להתקין את Peti בטלפון?</strong>
        <span>{ios ? "כפתור השיתוף ואז ״הוספה למסך הבית״" : "גישה מהירה מהמסך הראשי, גם בלי אינטרנט"}</span>
      </div>
      {!ios && (
        <button type="button" className="btn btn-primary small" onClick={prompt}>
          התקנה
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="סגירה" onClick={dismiss}>
        ✕
      </button>
    </div>
  );
}
