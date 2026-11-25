/** אפיק אירועים לאפקטים בממשק: טוסטים, XP, קונפטי, תגובת המסקוט */
export type FxEvent =
  | { type: "xp"; amount: number }
  | { type: "cheer" }
  | { type: "confetti"; big?: boolean }
  | { type: "toast"; text: string; emoji?: string; action?: { label: string; run: () => void } }
  | { type: "badge"; emoji: string; title: string; text: string };

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export const fx = {
  emit(e: FxEvent) {
    listeners.forEach((l) => l(e));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const reducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
