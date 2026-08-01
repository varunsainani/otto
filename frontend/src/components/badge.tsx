type Tone =
  | "neutral"
  | "accent"
  | "lime"
  | "amber"
  | "danger"
  | "violet"
  | "blue";

const TONES: Record<Tone, string> = {
  neutral: "text-muted bg-surface-2 border-line",
  accent: "text-accent bg-accent/10 border-accent/30",
  lime: "text-lime bg-lime/10 border-lime/30",
  amber: "text-amber bg-amber/10 border-amber/30",
  danger: "text-danger bg-danger/10 border-danger/30",
  violet: "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/30",
  blue: "text-[#60a5fa] bg-[#60a5fa]/10 border-[#60a5fa]/30",
};

export const STAGE_TONE: Record<string, Tone> = {
  prospect: "neutral",
  qualified: "blue",
  proposal: "amber",
  won: "lime",
  lost: "danger",
};

export const SEGMENT_TONE: Record<string, Tone> = {
  enterprise: "accent",
  startup: "violet",
  smb: "neutral",
};

export const CONTACT_STATUS_TONE: Record<string, Tone> = {
  lead: "amber",
  active: "lime",
  churned: "neutral",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
