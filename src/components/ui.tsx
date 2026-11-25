import { motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { Dog } from "../lib/types";
import { DOG_FACE } from "./DogVideo";

/** תמונת הכלב: התמונה שהעליתם, או הפנים של Peti */
export function DogAvatar({ dog, size = 40 }: { dog: Dog; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <img src={dog.avatar ?? DOG_FACE} alt="" width={size} height={size} />
    </span>
  );
}

/** כפתור מחיקה בשני שלבים (בלי חלונות confirm של הדפדפן) */
export function ConfirmButton({
  label,
  confirmLabel = "בטוח? לחצו שוב",
  onConfirm,
  className = "btn btn-danger-ghost",
}: {
  label: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={className + (armed ? " armed" : "")} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmLabel : label}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} className={on ? "on" : ""} onClick={() => onChange(o.value)}>
            {on && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <motion.div className="empty-emoji" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
        {emoji}
      </motion.div>
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
