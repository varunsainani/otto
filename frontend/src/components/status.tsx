"use client";

import { useTranslations } from "next-intl";

import type { RunStatus } from "@/lib/types";

const STYLES: Record<RunStatus, string> = {
  running: "text-accent border-accent/40 bg-accent/10",
  succeeded: "text-lime border-lime/40 bg-lime/10",
  failed: "text-danger border-danger/40 bg-danger/10",
  stopped: "text-muted border-line bg-surface-2",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const t = useTranslations("run");
  const label: Record<RunStatus, string> = {
    running: t("statusRunning"),
    succeeded: t("statusSucceeded"),
    failed: t("statusFailed"),
    stopped: t("statusStopped"),
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status === "running" && (
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
      )}
      {label[status]}
    </span>
  );
}
