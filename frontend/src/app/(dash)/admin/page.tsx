"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RunStatusBadge } from "@/components/status";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { AdminOverview, AdminRunRow, RunStatus } from "@/lib/types";

export default function AdminPage() {
  const t = useTranslations("admin");
  const rt = useTranslations("run");
  const locale = useLocale();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [runs, setRuns] = useState<AdminRunRow[] | null>(null);

  const load = useCallback(async () => {
    const [o, r] = await Promise.all([
      api.get<AdminOverview>("/api/admin/overview"),
      api.get<AdminRunRow[]>("/api/admin/runs"),
    ]);
    setOverview(o);
    setRuns(r);
  }, []);

  useEffect(() => {
    load().catch(() => setRuns([]));
  }, [load]);

  const cards = overview
    ? [
        { label: t("cardUsers"), value: overview.users },
        { label: t("cardRuns"), value: overview.runs_total },
        { label: t("cardSucceeded"), value: overview.runs_succeeded },
        { label: t("cardFailed"), value: overview.runs_failed },
        { label: t("cardSteps"), value: overview.steps_total },
        { label: t("cardAgentTasks"), value: overview.tasks_by_agent },
        { label: t("cardDrafts"), value: overview.emails_drafted },
      ]
    : [];

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {!overview ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {c.label}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-text">
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-text">
            {t("runsTitle")}
          </h2>
          {runs === null ? (
            <Spinner />
          ) : runs.length === 0 ? (
            <EmptyState>{t("empty")}</EmptyState>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="hidden grid-cols-[1.4fr_2fr_auto_auto_auto] gap-4 border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
                <span>{t("colUser")}</span>
                <span>{t("colGoal")}</span>
                <span className="w-24">{t("colStatus")}</span>
                <span className="w-14 text-right">{t("colSteps")}</span>
                <span className="w-32 text-right">{t("colWhen")}</span>
              </div>
              {runs.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-1 gap-1.5 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[1.4fr_2fr_auto_auto_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{r.user_name}</p>
                    <p className="truncate text-xs text-muted">{r.user_email}</p>
                  </div>
                  <span className="truncate text-sm text-muted">{r.goal}</span>
                  <span className="sm:w-24">
                    <RunStatusBadge status={r.status as RunStatus} />
                  </span>
                  <span className="text-xs text-muted sm:w-14 sm:text-right">
                    {r.steps_used}
                  </span>
                  <span className="text-xs text-muted sm:w-32 sm:text-right">
                    {fmtDateTime(r.created_at, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
