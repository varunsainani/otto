"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  Badge,
  CONTACT_STATUS_TONE,
  SEGMENT_TONE,
} from "@/components/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate, initials } from "@/lib/format";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const st = useTranslations("segment");
  const cst = useTranslations("contactStatus");
  const locale = useLocale();
  const [rows, setRows] = useState<Contact[] | null>(null);

  const load = useCallback(async () => {
    setRows(await api.get<Contact[]>("/api/contacts"));
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
          {rows.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted"
              >
                {initials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {c.title ? `${c.title} · ` : ""}
                  {c.company}
                </p>
              </div>
              <Badge tone={SEGMENT_TONE[c.segment] ?? "neutral"}>{st(c.segment)}</Badge>
              <Badge tone={CONTACT_STATUS_TONE[c.status] ?? "neutral"}>
                {cst(c.status)}
              </Badge>
              <span className="w-full text-xs text-muted sm:w-28 sm:text-right">
                {c.last_activity_at ? fmtDate(c.last_activity_at, locale) : t("never")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
