import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { fx, reducedMotion } from "../lib/fx";
import type { CoatId, Mood, Pattern } from "../lib/types";
import { DogScene, webglSupported, type Framing } from "../three/DogScene";
import Mascot from "./Mascot";

export type Phase = "morning" | "day" | "evening" | "night";

interface Props {
  coat: CoatId;
  pattern: Pattern;
  mood?: Mood;
  framing?: Framing;
  phase?: Phase;
  /** מגיב ללחיצה (קפיצה ולבבות), לאירועי "cheer" ועוקב במבט אחרי האצבע */
  interactive?: boolean;
  onPet?: () => void;
  label?: string;
  className?: string;
}

type Heart = { id: number; x: number; e: string };
const HEARTS = ["❤️", "💛", "🧡", "🐾", "💖"];

/** הכלב התלת־ממדי. אם אין WebGL — הכלב המצויר */
export default function Dog3D({ coat, pattern, mood = "calm", framing = "stage", phase, interactive = false, onPet, label, className = "" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DogScene | null>(null);
  const [failed, setFailed] = useState(() => !webglSupported());
  const [hearts, setHearts] = useState<Heart[]>([]);
  const seq = useRef(0);

  const burst = () => {
    if (reducedMotion()) return;
    const batch = Array.from({ length: 5 }, () => ({ id: seq.current++, x: 28 + Math.random() * 44, e: HEARTS[Math.floor(Math.random() * HEARTS.length)] }));
    setHearts((h) => [...h, ...batch]);
    setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 1500);
  };

  useEffect(() => {
    if (failed || !canvas.current || !wrap.current) return;
    let scene: DogScene;
    try {
      scene = new DogScene(canvas.current, { coat, pattern }, { framing });
    } catch {
      setFailed(true);
      return;
    }
    sceneRef.current = scene;
    if (import.meta.env.DEV) ((window as unknown as { __dogs: DogScene[] }).__dogs ??= []).push(scene);
    scene.setReducedMotion(reducedMotion());
    scene.setMood(mood);
    if (phase) scene.setPhase(phase);
    const el = wrap.current;
    const size = () => scene.resize(el.clientWidth, el.clientHeight);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    let onScreen = true;
    const vis = () => scene.setVisible(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      vis();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", vis);
    scene.start();

    // המבט עוקב אחרי האצבע או העכבר בכל המסך
    let release: ReturnType<typeof setTimeout> | undefined;
    const onMove = (e: PointerEvent) => {
      if (!interactive) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const y = -(e.clientY - (r.top + r.height * 0.36)) / (r.height / 2);
      scene.lookAt(x, y);
      clearTimeout(release);
      release = setTimeout(() => scene.lookAt(null), e.pointerType === "mouse" ? 2500 : 1200);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    const off = fx.on((e) => {
      if (interactive && e.type === "cheer") {
        scene.pet();
        burst();
      }
    });
    return () => {
      off();
      clearTimeout(release);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("visibilitychange", vis);
      ro.disconnect();
      io.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
    // הסצנה נבנית פעם אחת; שינויים בהמשך מועברים בפונקציות set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, framing, interactive]);

  useEffect(() => {
    sceneRef.current?.setLook({ coat, pattern });
  }, [coat, pattern]);
  useEffect(() => {
    sceneRef.current?.setMood(mood);
  }, [mood]);
  useEffect(() => {
    if (phase) sceneRef.current?.setPhase(phase);
  }, [phase]);

  if (failed) {
    return (
      <div className={`dog3d fallback ${className}`}>
        <Mascot coat={coat} pattern={pattern} mood={mood} size={framing === "face" ? 120 : 190} interactive={interactive} onPet={onPet} label={label} />
      </div>
    );
  }

  const pet = () => {
    sceneRef.current?.pet();
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
      className={`dog3d ${interactive ? "interactive" : ""} ${className}`}
      {...(interactive ? { role: "button", tabIndex: 0, "aria-label": label ?? "ליטוף", onClick: pet, onKeyDown: onKey } : { "aria-hidden": true })}
    >
      <canvas ref={canvas} />
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
