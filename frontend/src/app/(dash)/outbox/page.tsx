"use client";

import { Info, Send, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { Email } from "@/lib/types";

export default function OutboxPage() {
  const t = useTranslations("outbox");
  const cb = useTranslations("createdBy");
  const locale = useLocale();
  const [rows, setRows] = useState<Email[] | null>(null);

  const load = useCallback(async () => {
    setRows(await api.get<Email[]>("/api/emails"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const markSent = async (email: Email) => {
    setRows((prev) =>
      (prev ?? []).map((r) => (r.id === email.id ? { ...r, status: "sent" } : r)),
    );
    await api.patch<Email>(`/api/emails/${email.id}`, { status: "sent" });
  };

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
        <Info size={14} className="shrink-0 text-accent" />
        {t("simulatedNote")}
      </div>

      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((email) => (
            <div key={email.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">
                    {email.subject}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {t("to")}: {email.to_email || (email.contact_name ?? "—")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {email.created_by === "agent" && (
                    <Badge tone="accent">
                      <Sparkles size={11} className="mr-1" />
                      {cb("agent")}
                    </Badge>
                  )}
                  <Badge tone={email.status === "sent" ? "lime" : "neutral"}>
                    {email.status === "sent" ? t("sent") : t("draft")}
                  </Badge>
                </div>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-bg p-3 text-sm leading-relaxed text-text/80">
                {email.body}
              </p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {fmtDateTime(email.created_at, locale)}
                </span>
                {email.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => markSent(email)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-text"
                  >
                    <Send size={13} />
                    {t("markSent")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
