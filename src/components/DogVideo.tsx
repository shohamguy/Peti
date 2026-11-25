import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { fx, reducedMotion } from "../lib/fx";
import type { Mood } from "../lib/types";

export type Phase = "morning" | "day" | "evening" | "night";

const BASE = import.meta.env.BASE_URL;
export const DOG_FACE = `${BASE}peti/face.jpg`;
export const DOG_POSTER = `${BASE}peti/idle.jpg`;

/**
 * הקליפים של Peti (וידאו שנוצר ב-Gemini, חתוך ללולאה חלקה).
 * קליף חדש = קובץ ב-public/peti ושורה כאן, ואז מחברים אותו למצב רוח ב-clipFor.
 */
const CLIPS = {
  idle: { src: `${BASE}peti/idle.mp4`, poster: DOG_POSTER },
} as const;
type Clip = keyof typeof CLIPS;

// כרגע יש רק קליף מנוחה; כשיגיעו "שמח", "ישן", "רעב" וכו׳ הם יתחברו כאן
const clipFor = (_mood: Mood): Clip => "idle";

type Heart = { id: number; x: number; e: string };
const HEARTS = ["❤️", "💛", "🧡", "🐾", "💖"];

interface Props {
  mood?: Mood;
  phase?: Phase;
  interactive?: boolean;
  onPet?: () => void;
  label?: string;
  className?: string;
}

export default function DogVideo({ mood = "calm", phase, interactive = false, onPet, label, className = "" }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [hearts, setHearts] = useState<Heart[]>([]);
  const seq = useRef(0);
  const clip = CLIPS[clipFor(mood)];

  // מנגנים רק כשרואים את הכלב (חוסך סוללה), ובלי תנועה למי שביקש
  useEffect(() => {
    const v = video.current;
    const el = wrap.current;
    if (!v || !el) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    const still = reducedMotion();
    let onScreen = true;
    const sync = () => {
      if (!still && onScreen && document.visibilityState === "visible") void v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [clip.src]);

  const burst = () => {
    if (reducedMotion()) return;
    void controls.start({ scale: [1, 1.04, 0.985, 1], transition: { duration: 0.5, ease: "easeOut" } });
    const batch = Array.from({ length: 5 }, () => ({ id: seq.current++, x: 24 + Math.random() * 52, e: HEARTS[Math.floor(Math.random() * HEARTS.length)] }));
    setHearts((h) => [...h, ...batch]);
    setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 1500);
  };

  useEffect(() => {
    if (!interactive) return;
    return fx.on((e) => {
      if (e.type === "cheer") burst();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  const pet = () => {
    burst();
    onPet?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pet();
    }
  };

  return (
    <div
      ref={wrap}
      className={`dog-video ${interactive ? "interactive" : ""} ${className}`}
      {...(interactive ? { role: "button", tabIndex: 0, "aria-label": label ?? "ליטוף", onClick: pet, onKeyDown: onKey } : { "aria-hidden": true })}
    >
      <motion.div className="dog-video-inner" animate={controls}>
        <video ref={video} src={clip.src} poster={clip.poster} muted playsInline autoPlay loop preload="auto" disablePictureInPicture />
      </motion.div>
      {phase && <div className={`dog-tint tint-${phase}`} aria-hidden="true" />}
      {phase === "night" && (
        <div className="stars" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 94}%`, top: `${(i * 23) % 30}%`, animationDelay: `${(i % 4) * 0.6}s` }} />
          ))}
        </div>
      )}
      {hearts.map((h) => (
        <span key={h.id} className="heart" style={{ left: `${h.x}%` }} aria-hidden="true">
          {h.e}
        </span>
      ))}
      {mood === "sleepy" && (
        <span className="zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      )}
    </div>
  );
}
