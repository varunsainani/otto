"use client";

import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  ListChecks,
  Loader2,
  Mail,
  Send,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { RunStatusBadge } from "@/components/status";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDateTime, money } from "@/lib/format";
import type { RunOut, RunSummary, WorkspaceSummary } from "@/lib/types";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [goal, setGoal] = useState("");
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, r] = await Promise.all([
      api.get<WorkspaceSummary>("/api/workspace/summary"),
      api.get<RunSummary[]>("/api/runs"),
    ]);
    setSummary(s);
    setRuns(r.slice(0, 5));
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const start = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || starting) return;
    setStarting(true);
    try {
      const run = await api.post<RunOut>("/api/runs", { goal: trimmed });
      router.push(`/runs/${run.id}`);
    } catch {
      setStarting(false);
    }
  };

  const examples = t.raw("examples") as string[];

  const cards = summary
    ? [
        { label: t("cardContacts"), value: summary.contacts, icon: <Users size={15} className="text-muted" /> },
        { label: t("cardOpenDeals"), value: summary.deals_open, icon: <Briefcase size={15} className="text-muted" /> },
        { label: t("cardPipeline"), value: money(summary.pipeline_cents, locale), icon: <ArrowUpRight size={15} className="text-muted" /> },
        { label: t("cardOpenTasks"), value: summary.tasks_open, icon: <ListChecks size={15} className="text-muted" /> },
        { label: t("cardDrafts"), value: summary.emails_draft, icon: <Mail size={15} className="text-muted" /> },
        { label: t("cardDocuments"), value: summary.documents, icon: <BookOpen size={15} className="text-muted" /> },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
          {t("greeting", { name: user?.name.split(" ")[0] ?? "" })}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {/* Composer */}
      <Card className="glow p-5">
        <div className="mb-3 flex items-center gap-2">
          <Send size={16} className="text-accent" />
          <h2 className="font-display text-base font-semibold text-text">
            {t("composerTitle")}
          </h2>
        </div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder={t("composerPlaceholder")}
          className="w-full resize-none rounded-lg border border-line bg-bg px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent/60"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start(goal);
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="hidden text-xs text-muted sm:block">Ctrl + Enter</p>
          <button
            type="button"
            onClick={() => start(goal)}
            disabled={!goal.trim() || starting}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong disabled:opacity-40"
          >
            {starting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t("composerStarting")}
              </>
            ) : (
              <>
                <Send size={15} />
                {t("composerRun")}
              </>
            )}
          </button>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("examplesTitle")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => start(ex)}
                disabled={starting}
                className="group rounded-lg border border-line bg-bg px-3.5 py-2.5 text-left text-sm text-muted transition hover:border-accent/40 hover:text-text disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-xl border border-line bg-surface" />
            ))
          : cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {c.label}
                  </p>
                  {c.icon}
                </div>
                <p className="mt-2 font-display text-xl font-semibold text-text">
                  {c.value}
                </p>
              </div>
            ))}
      </div>

      {/* Recent runs */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">
            {t("recentTitle")}
          </h2>
          <Link href="/runs" className="text-sm text-accent hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : runs.length === 0 ? (
          <EmptyState>{t("recentEmpty")}</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map((r) => (
              <Link
                key={r.id}
                href={`/runs/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{r.goal}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {fmtDateTime(r.created_at, locale)}
                  </p>
                </div>
                <RunStatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
