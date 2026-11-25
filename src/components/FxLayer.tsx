import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fx, reducedMotion, type FxEvent } from "../lib/fx";

type Toast = Extract<FxEvent, { type: "toast" | "badge" }> & { id: number };
type Xp = { id: number; amount: number };

const COLORS = ["#D7F24A", "#FF6B57", "#8EC5FF", "#6CCB7F", "#FFC94A", "#B79CFF", "#FF8FC8"];

/** טוסטים, בועות XP וקונפטי — כל האפקטים הגלובליים */
export default function FxLayer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [xps, setXps] = useState<Xp[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const seq = useRef(0);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; life: number }[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const tick = () => {
      const cv = canvas.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const dpr = window.devicePixelRatio || 1;
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < cv.height / dpr + 40);
      for (const p of parts.current) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf.current = parts.current.length ? requestAnimationFrame(tick) : 0;
    };

    const burst = (big?: boolean) => {
      if (reducedMotion()) return;
      const cv = canvas.current;
      if (!cv) return;
      const dpr = window.devicePixelRatio || 1;
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      const n = big ? 140 : 60;
      for (let i = 0; i < n; i++) {
        const fromSide = big && i % 2;
        parts.current.push({
          x: fromSide ? (i % 4 === 1 ? -10 : innerWidth + 10) : innerWidth / 2 + (Math.random() - 0.5) * 60,
          y: fromSide ? innerHeight * 0.55 : innerHeight * 0.42,
          vx: fromSide ? (i % 4 === 1 ? 1 : -1) * (4 + Math.random() * 7) : (Math.random() - 0.5) * 14,
          vy: -(7 + Math.random() * 9),
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          w: 6 + Math.random() * 6,
          h: 4 + Math.random() * 5,
          c: COLORS[i % COLORS.length],
          life: 110 + Math.random() * 50,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    const off = fx.on((e) => {
      if (e.type === "confetti") burst(e.big);
      else if (e.type === "xp") {
        const id = seq.current++;
        setXps((x) => [...x, { id, amount: e.amount }]);
        setTimeout(() => setXps((x) => x.filter((v) => v.id !== id)), 1200);
      } else if (e.type === "toast" || e.type === "badge") {
        const id = seq.current++;
        setToasts((t) => [...t.slice(-2), { ...e, id }]);
        setTimeout(() => setToasts((t) => t.filter((v) => v.id !== id)), e.type === "badge" ? 3600 : e.action ? 4500 : 2800);
      }
    });
    return () => {
      off();
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((v) => v.id !== id));

  return (
    <>
      <canvas ref={canvas} className="confetti" aria-hidden="true" />
      <div className="xp-layer" aria-hidden="true">
        <AnimatePresence>
          {xps.map((x) => (
            <motion.span
              key={x.id}
              className="xp-bubble"
              style={{ x: "-50%" }}
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{ opacity: 1, y: -46, scale: 1 }}
              exit={{ opacity: 0, y: -70 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              +{x.amount} XP
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="toast-layer" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={t.type === "badge" ? "toast badge-toast" : "toast"}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              {t.type === "badge" ? (
                <>
                  <motion.span className="badge-medal" initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 10, delay: 0.1 }}>
                    {t.emoji}
                  </motion.span>
                  <span className="toast-text">
                    <strong>{t.title}</strong>
                    <span>{t.text}</span>
                  </span>
                </>
              ) : (
                <>
                  {t.emoji && <span className="toast-emoji">{t.emoji}</span>}
                  <span className="toast-text">{t.text}</span>
                  {t.action && (
                    <button
                      type="button"
                      className="toast-action"
                      onClick={() => {
                        t.action?.run();
                        dismiss(t.id);
                      }}
                    >
                      {t.action.label}
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
