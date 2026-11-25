import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { COATS } from "../lib/data";
import { fx, reducedMotion } from "../lib/fx";
import type { CoatId, Mood, Pattern } from "../lib/types";

const OUT = "#1D1B33";

interface Props {
  coat: CoatId;
  pattern: Pattern;
  mood?: Mood;
  size?: number;
  /** מגיב ללחיצה ולאירועי "cheer" */
  interactive?: boolean;
  onPet?: () => void;
  label?: string;
}

type Heart = { id: number; x: number; e: string };

/** הכלב המצויר של Peti: מכשכש, ממצמץ, מטה ראש וקופץ כשמלטפים אותו */
export default function Mascot({ coat, pattern, mood = "calm", size = 180, interactive = false, onPet, label }: Props) {
  const c = COATS[coat];
  const body = useAnimationControls();
  const shadow = useAnimationControls();
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [excited, setExcited] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const jump = (withHearts = true) => {
    setExcited(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setExcited(false), 1600);
    if (reducedMotion()) return;
    void body.start({
      y: [0, -34, 0, -10, 0],
      scaleY: [1, 1.06, 0.92, 1.02, 1],
      scaleX: [1, 0.96, 1.06, 0.99, 1],
      transition: { duration: 0.75, ease: "easeOut", times: [0, 0.32, 0.6, 0.8, 1] },
    });
    void shadow.start({ scale: [1, 0.7, 1, 0.9, 1], opacity: [1, 0.55, 1, 0.85, 1], transition: { duration: 0.75, times: [0, 0.32, 0.6, 0.8, 1] } });
    if (withHearts) {
      const emojis = ["❤️", "💛", "🧡", "🐾", "💖"];
      const batch = Array.from({ length: 4 }, () => ({ id: seq.current++, x: 20 + Math.random() * 60, e: emojis[Math.floor(Math.random() * emojis.length)] }));
      setHearts((h) => [...h, ...batch]);
      setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 1400);
    }
  };

  useEffect(() => {
    if (!interactive) return;
    return fx.on((e) => {
      if (e.type === "cheer") jump();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const m: Mood = excited && mood !== "sleepy" ? "ecstatic" : mood;
  const happy = m === "ecstatic" || m === "happy";
  const wag = m === "sleepy" ? "0s" : m === "ecstatic" ? ".22s" : m === "happy" ? ".4s" : m === "bored" ? "1.6s" : ".8s";

  const svg = (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} aria-hidden="true" className={`mascot-svg mood-${m}`} style={{ ["--wag" as string]: wag }}>
      <g className="m-all">
        {/* זנב */}
        <g className="m-tail">
          <path d="M134 178 C 160 176, 174 160, 170 134" stroke={OUT} strokeWidth="21" fill="none" strokeLinecap="round" />
          <path d="M134 178 C 160 176, 174 160, 170 134" stroke={c.base} strokeWidth="13" fill="none" strokeLinecap="round" />
        </g>
        {/* ירכיים */}
        <ellipse cx="64" cy="192" rx="25" ry="16" fill={c.base} stroke={OUT} strokeWidth="3.5" />
        <ellipse cx="136" cy="192" rx="25" ry="16" fill={c.base} stroke={OUT} strokeWidth="3.5" />
        {/* גוף */}
        <path d="M100 112 C 141 112, 151 150, 147 178 C 144 200, 126 208, 100 208 C 74 208, 56 200, 53 178 C 49 150, 59 112, 100 112 Z" fill={c.base} stroke={OUT} strokeWidth="3.5" />
        <path d="M100 128 C 119 128, 126 158, 121 184 C 117 199, 83 199, 79 184 C 74 158, 81 128, 100 128 Z" fill={c.light} />
        {pattern === "spots" && (
          <g fill={c.dark}>
            <ellipse cx="68" cy="158" rx="7" ry="6" />
            <ellipse cx="134" cy="168" rx="6" ry="5" />
            <ellipse cx="60" cy="184" rx="4.5" ry="4" />
          </g>
        )}
        {/* רגליים קדמיות */}
        <rect x="77" y="164" width="19" height="40" rx="9.5" fill={c.base} stroke={OUT} strokeWidth="3.5" />
        <rect x="104" y="164" width="19" height="40" rx="9.5" fill={c.base} stroke={OUT} strokeWidth="3.5" />
        <ellipse cx="86" cy="205" rx="14" ry="7.5" fill={c.light} stroke={OUT} strokeWidth="3.5" />
        <ellipse cx="114" cy="205" rx="14" ry="7.5" fill={c.light} stroke={OUT} strokeWidth="3.5" />
        <path d="M82 201 v6 M90 201 v6 M110 201 v6 M118 201 v6" stroke={OUT} strokeWidth="2" strokeLinecap="round" />
        {/* קולר ותג */}
        <path d="M63 121 Q100 140 137 121" stroke={OUT} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M63 121 Q100 140 137 121" stroke="#FF6B57" strokeWidth="7.5" fill="none" strokeLinecap="round" />
        <g className="m-tag">
          <circle cx="100" cy="139" r="8.5" fill="#F6C744" stroke={OUT} strokeWidth="3" />
          <path d="M97 138.5 h6" stroke={OUT} strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* ראש */}
        <g className="m-head">
          <ellipse cx="100" cy="76" rx="53" ry="46" fill={c.base} stroke={OUT} strokeWidth="3.5" />
          {pattern === "patch" && <ellipse cx="122" cy="70" rx="18" ry="16" fill={c.dark} />}
          {pattern === "spots" && <ellipse cx="74" cy="48" rx="7" ry="5.5" fill={c.dark} />}
          <ellipse cx="100" cy="96" rx="29" ry="21" fill={c.light} />
          <circle cx="71" cy="93" r="7" fill="#FF8FA3" opacity=".45" />
          <circle cx="129" cy="93" r="7" fill="#FF8FA3" opacity=".45" />

          {/* עיניים */}
          {m === "sleepy" ? (
            <g stroke={OUT} strokeWidth="4" fill="none" strokeLinecap="round">
              <path d="M72 72 Q80 79 88 72" />
              <path d="M112 72 Q120 79 128 72" />
            </g>
          ) : happy ? (
            <g stroke={OUT} strokeWidth="4.5" fill="none" strokeLinecap="round">
              <path d="M72 75 Q80 63 88 75" />
              <path d="M112 75 Q120 63 128 75" />
            </g>
          ) : (
            <g className="m-eyes">
              <ellipse cx="80" cy="71" rx="7.5" ry="9" fill={OUT} />
              <ellipse cx="120" cy="71" rx="7.5" ry="9" fill={OUT} />
              <circle cx="82.5" cy="67.5" r="2.7" fill="#fff" />
              <circle cx="122.5" cy="67.5" r="2.7" fill="#fff" />
            </g>
          )}
          {(m === "bored" || m === "hungry") && (
            <g stroke={OUT} strokeWidth="3.5" strokeLinecap="round">
              <path d="M70 58 L86 53" />
              <path d="M130 58 L114 53" />
            </g>
          )}

          {/* אף */}
          <path d="M89 85 Q100 79 111 85 Q109 96 100 98 Q91 96 89 85 Z" fill={OUT} />
          <ellipse cx="96" cy="86" rx="3.2" ry="1.8" fill="#fff" opacity=".6" />

          {/* פה */}
          {happy || m === "hungry" ? (
            <g>
              <path d="M86 103 Q100 109 114 103 Q112 123 100 123 Q88 123 86 103 Z" fill="#7A2335" stroke={OUT} strokeWidth="3" strokeLinejoin="round" />
              <path className="m-tongue" d="M92 112 Q100 131 108 112 Q104 109 100 111 Q96 109 92 112 Z" fill="#FF7C93" stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          ) : m === "bored" ? (
            <path d="M100 98 V104 M89 110 Q100 104 111 110" stroke={OUT} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          ) : m === "sleepy" ? (
            <path d="M100 98 V103 M94 107 Q100 110 106 107" stroke={OUT} strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M100 98 V104 M100 104 Q93 111 87 105 M100 104 Q107 111 113 105" stroke={OUT} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* אוזניים */}
          <g className="m-ear-l">
            <path d="M58 44 C 34 48, 22 88, 32 114 C 40 132, 60 126, 63 106 C 66 86, 72 56, 58 44 Z" fill={c.dark} stroke={OUT} strokeWidth="3.5" strokeLinejoin="round" />
          </g>
          <g className="m-ear-r">
            <path d="M142 44 C 166 48, 178 88, 168 114 C 160 132, 140 126, 137 106 C 134 86, 128 56, 142 44 Z" fill={c.dark} stroke={OUT} strokeWidth="3.5" strokeLinejoin="round" />
          </g>
        </g>
      </g>
      {m === "sleepy" && (
        <g className="m-zzz" fill={OUT} fontFamily="Fredoka, Rubik, sans-serif" fontWeight="700">
          <text x="150" y="40" fontSize="18">z</text>
          <text x="164" y="24" fontSize="14">z</text>
          <text x="176" y="12" fontSize="10">z</text>
        </g>
      )}
    </svg>
  );

  const content = (
    <>
      <motion.div className="mascot-shadow" animate={shadow} style={{ width: size * 0.62 }} />
      <motion.div className="mascot-body" animate={body} style={{ transformOrigin: "50% 100%" }}>
        {svg}
      </motion.div>
      {hearts.map((h) => (
        <span key={h.id} className="heart" style={{ insetInlineStart: `${h.x}%` }} aria-hidden="true">
          {h.e}
        </span>
      ))}
    </>
  );

  if (!interactive) return <div className="mascot">{content}</div>;
  return (
    <button
      type="button"
      className="mascot mascot-btn"
      aria-label={label ?? "ליטוף"}
      onClick={() => {
        jump();
        onPet?.();
      }}
    >
      {content}
    </button>
  );
}

/** רק הראש — לאווטר */
export function MascotFace({ coat, pattern, size = 40 }: { coat: CoatId; pattern: Pattern; size?: number }) {
  const c = COATS[coat];
  return (
    <svg viewBox="22 26 156 112" width={size} height={size} aria-hidden="true" className="mascot-face">
      <ellipse cx="100" cy="76" rx="53" ry="46" fill={c.base} stroke={OUT} strokeWidth="4" />
      {pattern === "patch" && <ellipse cx="122" cy="70" rx="18" ry="16" fill={c.dark} />}
      <ellipse cx="100" cy="96" rx="29" ry="21" fill={c.light} />
      <ellipse cx="80" cy="71" rx="7.5" ry="9" fill={OUT} />
      <ellipse cx="120" cy="71" rx="7.5" ry="9" fill={OUT} />
      <circle cx="82.5" cy="67.5" r="2.7" fill="#fff" />
      <circle cx="122.5" cy="67.5" r="2.7" fill="#fff" />
      <path d="M89 85 Q100 79 111 85 Q109 96 100 98 Q91 96 89 85 Z" fill={OUT} />
      <path d="M100 98 V104 M100 104 Q93 111 87 105 M100 104 Q107 111 113 105" stroke={OUT} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M58 44 C 34 48, 22 88, 32 114 C 40 132, 60 126, 63 106 C 66 86, 72 56, 58 44 Z" fill={c.dark} stroke={OUT} strokeWidth="4" />
      <path d="M142 44 C 166 48, 178 88, 168 114 C 160 132, 140 126, 137 106 C 134 86, 128 56, 142 44 Z" fill={c.dark} stroke={OUT} strokeWidth="4" />
    </svg>
  );
}
