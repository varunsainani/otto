"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { RunStatusBadge } from "@/components/status";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { RunSummary } from "@/lib/types";

export default function RunsPage() {
  const t = useTranslations("runsList");
  const rt = useTranslations("run");
  const locale = useLocale();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);

  const load = useCallback(async () => {
    setRuns(await api.get<RunSummary[]>("/api/runs"));
  }, []);

  useEffect(() => {
    load().catch(() => setRuns([]));
  }, [load]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong"
          >
            <Plus size={15} />
            {t("newRun")}
          </Link>
        }
      />
      {runs === null ? (
        <Spinner />
      ) : runs.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span>{t("colGoal")}</span>
            <span className="w-24">{t("colStatus")}</span>
            <span className="w-16 text-right">{t("colSteps")}</span>
            <span className="w-32 text-right">{t("colWhen")}</span>
          </div>
          {runs.map((r) => (
            <Link
              key={r.id}
              href={`/runs/${r.id}`}
              className="grid grid-cols-1 gap-2 border-b border-line px-4 py-3 transition last:border-0 hover:bg-surface-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
            >
              <span className="truncate text-sm text-text">{r.goal}</span>
              <span className="sm:w-24">
                <RunStatusBadge status={r.status} />
              </span>
              <span className="text-xs text-muted sm:w-16 sm:text-right">
                {rt("stepsUsed", { count: r.steps_used })}
              </span>
              <span className="text-xs text-muted sm:w-32 sm:text-right">
                {fmtDateTime(r.created_at, locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
