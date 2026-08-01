"use client";

import { ArrowLeft, Loader2, Shield, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand";
import { LanguageToggle, ThemeToggle } from "@/components/controls";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const { user, loading, login, demoLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const doDemo = async (role: Role) => {
    setError(null);
    setBusy(role);
    try {
      await demoLogin(role);
      router.replace("/dashboard");
    } catch {
      setError(t("invalid"));
      setBusy(null);
    }
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy("manual");
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("invalid"));
      setBusy(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 grid-backdrop opacity-60" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 glow">
            <p className="mb-1 text-sm font-semibold text-text">{t("demoTitle")}</p>
            <p className="mb-4 text-xs text-muted">{t("demoSubtitle")}</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => doDemo("member")}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong disabled:opacity-50"
              >
                {busy === "member" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <User size={15} />
                )}
                {t("asMember")}
              </button>
              <button
                type="button"
                onClick={() => doDemo("admin")}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:border-accent/40 disabled:opacity-50"
              >
                {busy === "admin" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Shield size={15} />
                )}
                {t("asAdmin")}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              {t("or")}
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={doLogin} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 text-sm text-text outline-none transition focus:border-accent/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 text-sm text-text outline-none transition focus:border-accent/60"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy !== null || !email || !password}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-text transition hover:border-accent/40 disabled:opacity-50"
              >
                {busy === "manual" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  t("signIn")
                )}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text"
            >
              <ArrowLeft size={14} />
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
