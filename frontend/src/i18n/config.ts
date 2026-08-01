export const locales = ["en", "es", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";
export const THEME_COOKIE = "theme";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Espanol",
  pt: "Portugues",
};
