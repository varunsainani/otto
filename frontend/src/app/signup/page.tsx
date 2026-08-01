"use client";

import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand";
import { LanguageToggle, ThemeToggle } from "@/components/controls";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const t = useTranslations("signup");
  const router = useRouter();
  const { user, loading, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t("passwordShort"));
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("passwordShort"));
      setBusy(false);
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
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted">{t("name")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 text-sm text-text outline-none transition focus:border-accent/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
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
                  required
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 text-sm text-text outline-none transition focus:border-accent/60"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy || !name.trim() || !email.trim() || !password}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  t("create")
                )}
              </button>
            </form>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-accent" />
              {t("starterNote")}
            </div>

            <p className="mt-5 text-center text-sm text-muted">
              {t("haveAccount")}{" "}
              <Link href="/login" className="font-medium text-accent hover:underline">
                {t("signIn")}
              </Link>
            </p>
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
