import type { SVGProps } from "react";

const paths = {
  home: "M3.5 11.2 12 4l8.5 7.2M6 9.6V20h12V9.6M10 20v-5.2h4V20",
  journal: "M6.5 3.5h10.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6.5zM6.5 3.5v17M10 8.5h5.5M10 12h5.5M10 15.5h3",
  growth: "M4 20h16M6 16.5l4-5 3 3 5-6.5M14.5 8h3.5v3.5",
  health: "M12 20s-7-4.3-8.6-8.4C2.3 8.7 4.3 5.4 7.4 5.4c2 0 3.3 1 4.6 2.6 1.3-1.6 2.6-2.6 4.6-2.6 3.1 0 5.1 3.3 4 6.2C19 15.7 12 20 12 20zM12 9.6v5M9.5 12.1h5",
  tricks: "M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.6l-5.1 2.6 1-5.6-4.1-4 5.7-.8z",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  chevron: "M6.5 9.5l5.5 5.5 5.5-5.5",
  back: "M9.5 6l6 6-6 6",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5",
  camera: "M4 8.5h3.2l1.8-3h6l1.8 3H20V19H4zM12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
  edit: "M4.5 19.5h4l10.2-10.2-4-4L4.5 15.5zM13 7l4 4",
  bell: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5h4",
  phone: "M5 4.5h4l1.5 4-2.3 1.6a11 11 0 0 0 5.7 5.7l1.6-2.3 4 1.5v4A1.5 1.5 0 0 1 18 20.5 15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5z",
  download: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14",
  upload: "M12 15.5V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.6-1.5L14 2.6h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3 1 2-3.4z",
  share: "M12 15V4M8 7.5 12 3.5l4 4M6 11v8.5h12V11",
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={paths[name]} />
    </svg>
  );
}

export function Paw({ size = 18, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...rest}>
      <ellipse cx="12" cy="16" rx="5" ry="4.2" />
      <ellipse cx="6" cy="10.5" rx="2.1" ry="2.6" />
      <ellipse cx="9.6" cy="6.4" rx="2.1" ry="2.7" />
      <ellipse cx="14.4" cy="6.4" rx="2.1" ry="2.7" />
      <ellipse cx="18" cy="10.5" rx="2.1" ry="2.6" />
    </svg>
  );
}
