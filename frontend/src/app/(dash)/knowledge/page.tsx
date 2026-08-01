"use client";

import { BookOpen, FileText, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { DocumentDetail, DocumentItem } from "@/lib/types";

export default function KnowledgePage() {
  const t = useTranslations("knowledge");
  const [rows, setRows] = useState<DocumentItem[] | null>(null);
  const [active, setActive] = useState<DocumentDetail | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const load = useCallback(async () => {
    setRows(await api.get<DocumentItem[]>("/api/documents"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const open = async (id: number) => {
    setLoadingDoc(true);
    try {
      setActive(await api.get<DocumentDetail>(`/api/documents/${id}`));
    } finally {
      setLoadingDoc(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => open(doc.id)}
              className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left transition hover:border-accent/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <FileText size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-text">{doc.title}</p>
                {doc.category && (
                  <div className="mt-1.5">
                    <Badge tone="neutral">{doc.category}</Badge>
                  </div>
                )}
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs text-accent">
                <BookOpen size={13} />
                {t("read")}
              </span>
            </button>
          ))}
        </div>
      )}

      {(active || loadingDoc) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />
          <div className="scroll-thin relative z-10 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-line bg-surface p-6 glow">
            {loadingDoc && !active ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={22} />
              </div>
            ) : active ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-text">
                      {active.title}
                    </h2>
                    {active.category && (
                      <div className="mt-1.5">
                        <Badge tone="neutral">{active.category}</Badge>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:text-text"
                    aria-label={t("close")}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/85">
                  {active.content}
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
