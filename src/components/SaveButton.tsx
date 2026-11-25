"use client";

import { actions, useStore } from "@/lib/store";

export default function SaveButton({ id, large }: { id: string; large?: boolean }) {
  const { saved } = useStore();
  const on = saved.includes(id);
  return (
    <button
      type="button"
      className={`save-btn${on ? " on" : ""}${large ? " large" : ""}`}
      aria-pressed={on}
      aria-label={on ? "הסרה מהשמורות" : "שמירת משרה"}
      onClick={() => actions.toggleSave(id)}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.6 1.2 4.4 2.5h2C13.8 6.2 15.3 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  );
}
