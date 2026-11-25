import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ageText, fmtDay, parseDay } from "../lib/dates";
import type { Weight } from "../lib/types";

const H = 214;
const PAD = { l: 40, r: 26, t: 22, b: 30 };

export const kgFmt = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 1 });

function niceScale(min: number, max: number, count = 4) {
  const raw = Math.max((max - min) / count, 0.1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag);
  const lo = Math.floor(min / step) * step;
  let hi = Math.ceil(max / step) * step;
  if (hi <= lo) hi = lo + step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { lo, hi, ticks };
}

/** גרף משקל: קו אחד, סמן צולב שנצמד לשקילה הקרובה, וניווט במקלדת */
export default function WeightChart({ points, birth }: { points: Weight[]; birth?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width) || 320);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 320));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const ts = points.map((p) => parseDay(p.date).getTime());
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    const kgs = points.map((p) => p.kg);
    const max = Math.max(...kgs);
    const min = Math.min(...kgs);
    const { lo, hi, ticks } = niceScale(min < max * 0.45 ? 0 : min * 0.9, max);
    const innerW = w - PAD.l - PAD.r;
    const X = (t: number) => (t1 === t0 ? PAD.l + innerW / 2 : PAD.l + ((t - t0) / (t1 - t0)) * innerW);
    const Y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const xy = points.map((p, i) => ({ x: X(ts[i]), y: Y(p.kg), p }));
    const line = xy.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
    const base = Y(lo);
    const area = xy.length > 1 ? `${line} L${xy[xy.length - 1].x.toFixed(1)} ${base} L${xy[0].x.toFixed(1)} ${base} Z` : "";
    return { xy, line, area, ticks, Y };
  }, [points, w]);

  if (!points.length) return null;
  const { xy, line, area, ticks, Y } = geo;
  const last = xy[xy.length - 1];
  const first = xy[0];
  const mid = xy.length >= 3 ? xy[Math.floor(xy.length / 2)] : null;
  const a = active !== null ? xy[active] : null;

  const nearest = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    let best = 0;
    xy.forEach((q, i) => {
      if (Math.abs(q.x - x) < Math.abs(xy[best].x - x)) best = i;
    });
    setActive(best);
  };

  const onKey = (e: KeyboardEvent) => {
    const i = active ?? xy.length - 1;
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? xy.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setActive(Math.max(0, Math.min(xy.length - 1, next)));
  };

  const summary = `גרף משקל: ${kgFmt(first.p.kg)} ק״ג ב־${fmtDay(first.p.date)}, ${kgFmt(last.p.kg)} ק״ג ב־${fmtDay(last.p.date)}. חיצים ימינה ושמאלה לעבור בין השקילות.`;

  return (
    <div className="wchart" ref={wrap}>
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerDown={(e: PointerEvent) => nearest(e.clientX)}
        onPointerMove={(e: PointerEvent) => (e.pointerType === "mouse" || e.buttons) && nearest(e.clientX)}
        onPointerLeave={(e: PointerEvent) => e.pointerType === "mouse" && setActive(null)}
        onKeyDown={onKey}
        onFocus={() => setActive((v) => v ?? xy.length - 1)}
        onBlur={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="wc-grid" x1={PAD.l} x2={w - PAD.r} y1={Y(t)} y2={Y(t)} />
            <text className="wc-label" x={PAD.l - 8} y={Y(t) + 4} textAnchor="end">
              {kgFmt(t)}
            </text>
          </g>
        ))}
        <text className="wc-label" x={first.x} y={H - 8} textAnchor={xy.length > 1 ? "start" : "middle"}>
          {fmtDay(first.p.date)}
        </text>
        {mid && w > 300 && (
          <text className="wc-label" x={mid.x} y={H - 8} textAnchor="middle">
            {fmtDay(mid.p.date)}
          </text>
        )}
        {xy.length > 1 && (
          <text className="wc-label" x={last.x} y={H - 8} textAnchor="end">
            {fmtDay(last.p.date)}
          </text>
        )}

        {area && <motion.path className="wc-area" d={area} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />}
        {xy.length > 1 && (
          <motion.path className="wc-line" d={line} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
        )}
        {a && <line className="wc-cross" x1={a.x} x2={a.x} y1={PAD.t - 6} y2={H - PAD.b} />}
        {xy.map((q, i) => (
          <motion.circle
            key={q.p.id}
            className="wc-dot"
            cx={q.x}
            cy={q.y}
            r={active === i ? 6.5 : 4.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15 + (i / xy.length) * 0.9, type: "spring", stiffness: 400, damping: 15 }}
          />
        ))}
        {active !== xy.length - 1 && (
          <text className="wc-end" x={last.x} y={last.y - 12} textAnchor="end">
            {kgFmt(last.p.kg)}
          </text>
        )}
      </svg>
      <div className="wc-tip" aria-live="polite" style={{ opacity: a ? 1 : 0, left: a ? Math.max(62, Math.min(w - 62, a.x)) : 0, top: a ? Math.max(0, a.y - 66) : 0 }}>
        {a && (
          <>
            <strong>{kgFmt(a.p.kg)} ק״ג</strong>
            <span>
              {fmtDay(a.p.date)}
              {birth ? ` · גיל ${ageText(birth, a.p.date)}` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
