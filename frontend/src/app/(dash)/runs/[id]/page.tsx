"use client";

import { ArrowLeft, ChevronRight, Loader2, Sparkles, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Markdown } from "@/components/markdown";
import { RunStatusBadge } from "@/components/status";
import { ToolIcon, toolVisual } from "@/components/tool-visual";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { RunOut, StepOut } from "@/lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function StepRow({ step, index }: { step: StepOut; index: number }) {
  const t = useTranslations();
  const { color } = toolVisual(step.tool);
  const [showArgs, setShowArgs] = useState(false);
  const hasArgs = step.args && Object.keys(step.args).length > 0;
  const isError = step.status === "error";

  return (
    <div className="fade-up relative flex gap-3.5">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface"
          style={{ borderColor: `${color}55` }}
        >
          <ToolIcon tool={step.tool} size={16} />
        </span>
        <span className="my-1 w-px flex-1 bg-line" />
      </div>

      {/* content */}
      <div className="flex-1 pb-5">
        {step.thought && (
          <p className="mb-2 text-sm leading-relaxed text-muted">{step.thought}</p>
        )}
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm font-medium text-text">
                {t(`tools.${step.tool}`)}
              </span>
              {isError && (
                <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                  error
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-muted/70">{step.latency_ms}ms</span>
          </div>

          {hasArgs && (
            <button
              type="button"
              onClick={() => setShowArgs((v) => !v)}
              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-muted transition hover:text-text"
            >
              <ChevronRight
                size={13}
                className={`transition ${showArgs ? "rotate-90" : ""}`}
              />
              {t("run.arguments")}
            </button>
          )}
          {hasArgs && showArgs && (
            <pre className="scroll-thin mx-3 mb-2 max-h-40 overflow-auto rounded bg-bg p-2.5 font-mono text-[11px] leading-relaxed text-muted">
              {JSON.stringify(step.args, null, 2)}
            </pre>
          )}

          <div className="px-3 pb-2.5 pt-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
              {t("run.observation")}
            </p>
            <pre
              className={`scroll-thin max-h-52 overflow-auto rounded bg-bg p-2.5 font-mono text-[11px] leading-relaxed ${
                isError ? "text-danger" : "text-text/80"
              }`}
            >
              {prettyJson(step.observation)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const t = useTranslations("run");

  const [run, setRun] = useState<RunOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [connLost, setConnLost] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  const userStopRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    userStopRef.current = false;
    setConnLost(false);

    (async () => {
      let current: RunOut | null = null;
      try {
        current = await api.get<RunOut>(`/api/runs/${id}`);
      } catch {
        if (!cancelled) setLoading(false);
        return;
      }
      if (cancelled) return;
      setRun(current);
      setLoading(false);

      let fails = 0;
      while (current.status === "running" && !cancelled && !userStopRef.current) {
        await sleep(400);
        if (cancelled || userStopRef.current) break;
        try {
          current = await api.post<RunOut>(`/api/runs/${id}/advance`);
          fails = 0;
          if (cancelled) break;
          setRun(current);
        } catch {
          // Transient network blip mid-run: retry the step a few times before
          // giving up, so one dropped request does not strand the whole run.
          fails += 1;
          if (fails >= 3) {
            if (!cancelled) setConnLost(true);
            break;
          }
          await sleep(1200);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, resumeKey]);

  const toolSteps = (run?.steps ?? []).filter(
    (s) => s.tool && s.tool !== "finish",
  );

  useEffect(() => {
    if (run?.status === "running") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [toolSteps.length, run?.status]);

  const stopRun = async () => {
    userStopRef.current = true;
    try {
      const updated = await api.post<RunOut>(`/api/runs/${id}/stop`);
      setRun(updated);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-24 text-center text-sm text-muted">{t("emptyAnswer")}</div>
    );
  }

  const running = run.status === "running";
  const errorMessage =
    run.status === "failed"
      ? run.error?.startsWith("step_limit")
        ? t("stepLimit")
        : t("llmError")
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text"
        >
          <ArrowLeft size={15} />
          {t("backToRuns")}
        </Link>
        {running && (
          <button
            type="button"
            onClick={stopRun}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:border-danger/40 hover:text-danger"
          >
            <Square size={13} />
            {t("stop")}
          </button>
        )}
      </div>

      <Card className="mb-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted/70">
              {t("goal")}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-text">{run.goal}</p>
          </div>
          <RunStatusBadge status={run.status} />
        </div>
      </Card>

      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-accent" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">
          {t("traceTitle")}
        </h2>
      </div>

      {toolSteps.length === 0 && running ? (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          <Loader2 size={15} className="animate-spin text-accent" />
          {t("waitingFirst")}
        </div>
      ) : (
        <div>
          {toolSteps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} />
          ))}
          {running && !connLost && (
            <div className="flex items-center gap-2 pl-1 text-sm text-muted">
              <Loader2 size={15} className="animate-spin text-accent" />
              {t("thinking")}
            </div>
          )}
          {running && connLost && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
              {t("connectionLost")}
              <button
                type="button"
                onClick={() => {
                  setConnLost(false);
                  setResumeKey((k) => k + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber/50 px-3 py-1.5 font-medium transition hover:bg-amber/10"
              >
                {t("resume")}
              </button>
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {run.final_answer && (
        <Card className="glow mt-6 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)" }}
            >
              <Sparkles size={13} className="text-white" />
            </span>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {t("finalAnswer")}
            </h3>
          </div>
          <Markdown>{run.final_answer}</Markdown>
        </Card>
      )}
    </div>
  );
}
