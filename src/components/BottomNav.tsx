"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const icons = {
  search: "M10.5 4a6.5 6.5 0 1 0 4 11.6l4.4 4.4 1.4-1.4-4.4-4.4A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z",
  heart: "M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.6 1.2 4.4 2.5h2C13.8 6.2 15.3 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
  user: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c4.4 0 8 2 8 4.5V20H4v-1.5C4 16 7.6 14 12 14z",
};

const tabs = [
  { href: "/", label: "משרות", icon: icons.search },
  { href: "/saved", label: "שמורות", icon: icons.heart },
  { href: "/post", label: "פרסום", icon: icons.plus },
  { href: "/profile", label: "פרופיל", icon: icons.user },
];

export default function BottomNav() {
  const path = usePathname();
  const { saved } = useStore();
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" || path.startsWith("/jobs") : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="icon-wrap">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
                <path d={t.icon} fill="currentColor" />
              </svg>
              {t.href === "/saved" && saved.length > 0 && <span className="badge">{saved.length}</span>}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
