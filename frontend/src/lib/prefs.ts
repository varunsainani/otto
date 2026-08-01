import { LOCALE_COOKIE, THEME_COOKIE, type Locale } from "@/i18n/config";

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${
    60 * 60 * 24 * 365
  }; samesite=lax`;
}

export function setLocaleCookie(locale: Locale): void {
  setCookie(LOCALE_COOKIE, locale);
}

export function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  setCookie(THEME_COOKIE, theme);
}

export function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
