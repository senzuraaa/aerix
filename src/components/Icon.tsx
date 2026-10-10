import type { ReactNode } from 'react';

const P = {
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.5 7.5a6 6 0 000 9M16.5 7.5a6 6 0 010 9M4.5 4.5a10 10 0 000 15M19.5 4.5a10 10 0 010 15" />
    </>
  ),
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 13h6M9 17h6" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  drone: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="5" cy="5" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M7 7l3.2 3.2M17 7l-3.2 3.2M7 17l3.2-3.2M17 17l-3.2-3.2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  scan: (
    <>
      <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </>
  ),
  qr: <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3M8 12h8" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />,
  send: (
    <>
      <path d="M21 3L3 10.5l7 2.5 2.5 7z" />
      <path d="M10 13l11-10" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  checks: <path d="M2 12.5l4.5 4.5L14 8M10 15l2 2L22 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  wind: <path d="M3 8h11a3 3 0 10-3-3M3 12h16a3 3 0 11-3 3M3 16h8" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path d="M22 11v2" />
    </>
  ),
  signal: (
    <>
      <path d="M5 19a10 10 0 0114 0M8 16a6 6 0 018 0" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  lidar: <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
  cloud: (
    <>
      <path d="M7 16a4 4 0 010-8 5 5 0 019.6 1.5A3.3 3.3 0 0117 16z" />
      <path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2" />
    </>
  ),
  cloudOff: <path d="M3 3l18 18M17 17H7a4 4 0 01-.9-7.9M9.5 5.7A5 5 0 0116.6 9.5 3.5 3.5 0 0121 13" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M8 5l11 7-11 7z" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </>
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 11h6M9 15h4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

export default function Icon({ name, size = 20, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}

export function Brand({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#0B6E78" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <circle cx="25" cy="7" r="4.5" />
      <circle cx="7" cy="25" r="4.5" />
      <circle cx="25" cy="25" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5M21.5 10.5L18.5 13.5M10.5 21.5L13.5 18.5M21.5 21.5L18.5 18.5" stroke="#0F2A43" />
      <circle cx="16" cy="16" r="3.2" fill="#0F2A43" stroke="#0F2A43" />
    </svg>
  );
}
