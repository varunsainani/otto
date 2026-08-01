"use client";

import { Check, Languages, Moon, Sun } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { locales, localeNames, type Locale } from "@/i18n/config";
import { applyTheme, currentTheme, setLocaleCookie } from "@/lib/prefs";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:text-text hover:border-accent/40"
    >
      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (next: Locale) => {
    setLocaleCookie(next);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm text-muted transition hover:text-text hover:border-accent/40"
      >
        <Languages size={16} />
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-40 overflow-hidden rounded-lg border border-line bg-surface shadow-lg glow">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => choose(l)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-text transition hover:bg-surface-2"
            >
              {localeNames[l]}
              {l === locale && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
