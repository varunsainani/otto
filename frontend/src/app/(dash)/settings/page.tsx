"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, PageHeader } from "@/components/ui";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { applyTheme, currentTheme, setLocaleCookie } from "@/lib/prefs";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.patch<User>("/api/auth/me", { name: name.trim() });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const changeLocale = (next: Locale) => {
    setLocaleCookie(next);
    api.patch("/api/auth/me", { locale: next }).catch(() => {});
    router.refresh();
  };

  const changeTheme = (next: "light" | "dark") => {
    applyTheme(next);
    setTheme(next);
    api.patch("/api/auth/me", { theme: next }).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card className="mb-5 p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-text">
          {t("account")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">{t("displayName")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 text-sm text-text outline-none transition focus:border-accent/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-muted">{t("email")}</label>
              <p className="rounded-lg border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">{t("role")}</label>
              <p className="rounded-lg border border-line bg-surface-2 px-3.5 py-2 text-sm capitalize text-muted">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04222b] transition hover:bg-accent-strong disabled:opacity-40"
            >
              {saving ? t("saving") : t("save")}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-lime">
                <Check size={15} />
                {t("saved")}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-text">
          {t("preferences")}
        </h2>
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-muted">{t("language")}</label>
            <div className="flex flex-wrap gap-2">
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => changeLocale(l)}
                  className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                    l === locale
                      ? "border-accent/50 bg-accent/10 text-text"
                      : "border-line text-muted hover:text-text"
                  }`}
                >
                  {localeNames[l]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">{t("theme")}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => changeTheme("light")}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition ${
                  theme === "light"
                    ? "border-accent/50 bg-accent/10 text-text"
                    : "border-line text-muted hover:text-text"
                }`}
              >
                <Sun size={15} />
                {t("themeLight")}
              </button>
              <button
                type="button"
                onClick={() => changeTheme("dark")}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition ${
                  theme === "dark"
                    ? "border-accent/50 bg-accent/10 text-text"
                    : "border-line text-muted hover:text-text"
                }`}
              >
                <Moon size={15} />
                {t("themeDark")}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
