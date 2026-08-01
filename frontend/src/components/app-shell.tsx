"use client";

import {
  BookOpen,
  Briefcase,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Send,
  Settings,
  Shield,
  Sparkles,
  Users,
  Waypoints,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand";
import { LanguageToggle, ThemeToggle } from "@/components/controls";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

type NavItem = { href: string; key: string; icon: React.ElementType };

const AGENT: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/runs", key: "runs", icon: Waypoints },
];
const WORKSPACE: NavItem[] = [
  { href: "/contacts", key: "contacts", icon: Users },
  { href: "/deals", key: "deals", icon: Briefcase },
  { href: "/tasks", key: "tasks", icon: ListChecks },
  { href: "/outbox", key: "outbox", icon: Send },
  { href: "/knowledge", key: "knowledge", icon: BookOpen },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const t = useTranslations("nav");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-accent/10 text-text font-medium"
          : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      <Icon size={17} className={active ? "text-accent" : ""} />
      {t(item.key)}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-accent" size={26} />
      </div>
    );
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted/70">
          {t("agent")}
        </p>
        {AGENT.map((i) => (
          <NavLink key={i.href} item={i} active={isActive(i.href)} onClick={() => setOpen(false)} />
        ))}
        <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted/70">
          {t("workspace")}
        </p>
        {WORKSPACE.map((i) => (
          <NavLink key={i.href} item={i} active={isActive(i.href)} onClick={() => setOpen(false)} />
        ))}
        <div className="mt-auto flex flex-col gap-1 pt-4">
          <NavLink
            item={{ href: "/settings", key: "settings", icon: Settings }}
            active={isActive("/settings")}
            onClick={() => setOpen(false)}
          />
          {user.role === "admin" && (
            <NavLink
              item={{ href: "/admin", key: "admin", icon: Shield }}
              active={isActive("/admin")}
              onClick={() => setOpen(false)}
            />
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted lg:hidden"
              aria-label="Open menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted sm:inline-flex">
              <Sparkles size={12} className="text-accent" />
              Demo workspace
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)" }}
              >
                {initials(user.name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-text">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:text-danger hover:border-danger/40"
                aria-label={t("dashboard")}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
