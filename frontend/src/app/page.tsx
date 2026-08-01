"use client";

import {
  ArrowRight,
  Database,
  Eye,
  Gauge,
  ListPlus,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Logo } from "@/components/brand";
import { LanguageToggle, ThemeToggle } from "@/components/controls";
import { ToolIcon } from "@/components/tool-visual";

const TOOL_KEYS = [
  "query_records",
  "search_knowledge",
  "web_search",
  "draft_email",
  "create_task",
  "update_deal",
  "add_note",
  "calculate",
  "summarize",
  "finish",
];

function MockTrace() {
  const t = useTranslations();
  const steps = [
    { tool: "query_records", thought: t("landing.mockThought1"), obs: '{ "count": 3, "results": [ … ] }' },
    { tool: "draft_email", thought: t("landing.mockThought2"), obs: '{ "created": "email_draft", "to": "amara@…" }' },
    { tool: "create_task", thought: t("landing.mockThought3"), obs: '{ "created": "task", "id": 42 }' },
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 glow">
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-3">
        <Sparkles size={14} className="text-accent" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          {t("run.traceTitle")}
        </span>
      </div>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg">
              <ToolIcon tool={s.tool} size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{s.thought}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-text">
                  {t(`tools.${s.tool}`)}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] text-text/50">{s.obs}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const t = useTranslations("landing");
  const tt = useTranslations();

  const features = [
    { icon: Database, title: t("feature1Title"), body: t("feature1Body") },
    { icon: Eye, title: t("feature2Title"), body: t("feature2Body") },
    { icon: Gauge, title: t("feature3Title"), body: t("feature3Body") },
    { icon: ShieldCheck, title: t("feature4Title"), body: t("feature4Body") },
  ];
  const steps = [
    { icon: ListPlus, title: t("how1Title"), body: t("how1Body") },
    { icon: Sparkles, title: t("how2Title"), body: t("how2Body") },
    { icon: Mail, title: t("how3Title"), body: t("how3Body") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <a
              href="#how"
              className="hidden px-3 text-sm text-muted transition hover:text-text md:block"
            >
              {t("navFeatures")}
            </a>
            <a
              href="#tools"
              className="hidden px-3 text-sm text-muted transition hover:text-text md:block"
            >
              {t("navTools")}
            </a>
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text sm:block"
            >
              {t("navSignIn")}
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong"
            >
              {t("navTryDemo")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-70" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles size={12} />
              {t("heroBadge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-text sm:text-5xl">
              {t("heroTitle")}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(100deg,#0e7490,#22d3ee 60%,#a3e635)",
                }}
              >
                {t("heroTitleAccent")}
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              {t("heroSubtitle")}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong"
              >
                {t("heroCtaPrimary")}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/40 hover:bg-surface-2"
              >
                {t("heroCtaSecondary")}
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">{t("heroNote")}</p>
          </div>
          <div className="lg:pl-6">
            <MockTrace />
          </div>
        </div>
      </section>

      {/* Trust line */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className="text-center font-display text-sm text-muted sm:text-base">
            {t("trustLine")}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            {t("featuresSubtitle")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-line bg-surface p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon size={19} />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-text">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              {t("howTitle")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative rounded-xl border border-line bg-surface p-5">
                  <span className="absolute right-4 top-4 font-display text-3xl font-bold text-line">
                    {i + 1}
                  </span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold text-text">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("toolsTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            {t("toolsSubtitle")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <ToolIcon tool={key} size={17} />
              </span>
              <div>
                <p className="font-mono text-sm font-medium text-text">
                  {tt(`tools.${key}`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {tt(`toolDesc.${key}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-10 text-center glow">
          <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-40" />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t("ctaBody")}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong"
            >
              {t("ctaButton")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
          <Logo size={24} />
          <p className="text-center text-xs text-muted">{t("footerNote")}</p>
        </div>
      </footer>
    </div>
  );
}
