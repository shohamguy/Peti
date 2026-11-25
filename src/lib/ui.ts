import { useEffect, useState } from "react";
import { create } from "zustand";
import { loadPhoto } from "./persist";

type SheetName = "dog" | "badges" | null;

interface UIState {
  sheet: SheetName;
  onboarding: boolean;
  openSheet(s: SheetName): void;
  startOnboarding(): void;
  endOnboarding(): void;
}

export const useUI = create<UIState>()((set) => ({
  sheet: null,
  onboarding: false,
  openSheet: (sheet) => set({ sheet }),
  startOnboarding: () => set({ onboarding: true, sheet: null }),
  endOnboarding: () => set({ onboarding: false }),
}));

/** שעה נוכחית שמתעדכנת כל דקה (למצב רוח, סצנת יום/לילה, "היום") */
export function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function usePhoto(id: string | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (id) void loadPhoto(id).then((s) => alive && setSrc(s));
    return () => {
      alive = false;
    };
  }, [id]);
  return src;
}
