"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge, STAGE_TONE } from "@/components/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate, money } from "@/lib/format";
import type { Deal } from "@/lib/types";

function isOverdue(deal: Deal): boolean {
  if (!deal.close_date || deal.stage === "won" || deal.stage === "lost") return false;
  return new Date(`${deal.close_date}T00:00:00`) < new Date();
}

export default function DealsPage() {
  const t = useTranslations("deals");
  const stg = useTranslations("stage");
  const locale = useLocale();
  const [rows, setRows] = useState<Deal[] | null>(null);

  const load = useCallback(async () => {
    setRows(await api.get<Deal[]>("/api/deals"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{d.title}</p>
                <p className="truncate text-xs text-muted">{d.contact_name ?? "—"}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-text">
                {money(d.amount_cents, locale)}
              </span>
              <Badge tone={STAGE_TONE[d.stage] ?? "neutral"}>{stg(d.stage)}</Badge>
              <span className="flex w-full items-center gap-2 text-xs sm:w-32 sm:justify-end">
                <span className={isOverdue(d) ? "text-danger" : "text-muted"}>
                  {d.close_date ? fmtDate(d.close_date, locale) : "—"}
                </span>
                {isOverdue(d) && (
                  <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                    {t("overdue")}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
