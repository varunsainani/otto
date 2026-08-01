export function OttoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[9px] shadow-sm"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)",
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="12" y1="12" x2="5.5" y2="6" />
        <line x1="12" y1="12" x2="18.5" y2="7" />
        <line x1="12" y1="12" x2="12" y2="19.5" />
        <circle cx="12" cy="12" r="2.1" fill="#ffffff" stroke="none" />
        <circle cx="5.5" cy="6" r="1.7" />
        <circle cx="18.5" cy="7" r="1.7" />
        <circle cx="12" cy="19.5" r="1.7" />
      </svg>
    </span>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <OttoMark size={size} />
      <span className="font-display text-lg font-semibold tracking-tight text-text">
        Otto
      </span>
    </span>
  );
}
