"use client";

import { Check, Plus, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const t = useTranslations("tasks");
  const cb = useTranslations("createdBy");
  const locale = useLocale();
  const [rows, setRows] = useState<Task[] | null>(null);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setRows(await api.get<Task[]>("/api/tasks"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const add = async () => {
    const value = title.trim();
    if (!value || adding) return;
    setAdding(true);
    try {
      await api.post<Task>("/api/tasks", { title: value });
      setTitle("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (task: Task) => {
    const next = task.status === "done" ? "open" : "done";
    setRows((prev) =>
      (prev ?? []).map((r) => (r.id === task.id ? { ...r, status: next } : r)),
    );
    await api.patch<Task>(`/api/tasks/${task.id}`, { status: next });
  };

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("newPlaceholder")}
          className="flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim() || adding}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong disabled:opacity-40"
        >
          <Plus size={15} />
          {t("add")}
        </button>
      </div>

      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <button
                type="button"
                onClick={() => toggle(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                  task.status === "done"
                    ? "border-lime bg-lime/20 text-lime"
                    : "border-line text-transparent hover:border-accent"
                }`}
                aria-label={task.status === "done" ? t("reopen") : t("markDone")}
              >
                <Check size={13} />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    task.status === "done"
                      ? "text-muted line-through"
                      : "text-text"
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted">
                  {task.due_date ? fmtDate(task.due_date, locale) : t("noDue")}
                </p>
              </div>
              {task.created_by === "agent" ? (
                <Badge tone="accent">
                  <Sparkles size={11} className="mr-1" />
                  {cb("agent")}
                </Badge>
              ) : (
                <Badge tone="neutral">{cb("user")}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
