"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ConfirmProvider } from "@/components/confirm-dialog";
import type { Me } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/cabinet/formats",
    label: "Форматы встреч",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/cabinet/meetings",
    label: "Все встречи",
    icon: (
      <svg {...iconProps}>
        <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
      </svg>
    ),
  },
  {
    href: "/cabinet/notes",
    label: "AI-конспекты",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4.5h16v12H8l-4 4z" />
        <path d="M8 9h8M8 12.5h5" />
      </svg>
    ),
  },
  {
    href: "/cabinet/calendars",
    label: "Календари",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </svg>
    ),
  },
  {
    href: "/cabinet/sources",
    label: "Источники",
    icon: (
      <svg {...iconProps}>
        <path d="M3 3v18h18" />
        <path d="M7 14l3-4 3 3 5-7" />
      </svg>
    ),
  },
  {
    href: "/cabinet/team",
    label: "Команда",
    icon: (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/cabinet/integrations",
    label: "Интеграции",
    icon: (
      <svg {...iconProps}>
        <path d="M6 3v5M18 3v5" />
        <rect x="4" y="8" width="16" height="7" rx="2" />
        <path d="M12 15v4a3 3 0 0 0 3 3" />
      </svg>
    ),
  },
  {
    href: "/cabinet/billing",
    label: "Оплата",
    icon: (
      <svg {...iconProps}>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
      </svg>
    ),
  },
  {
    href: "/cabinet/settings",
    label: "Настройки",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04z" />
      </svg>
    ),
  },
];

const PLAN_LABELS: Record<Me["plan"], string> = {
  free: "Бесплатный",
  standard: "Стандарт",
  pro: "Про",
};

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function Avatar({ user, size }: { user: Me; size: number }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name ?? user.slug}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        boxShadow: "0 0 0 1.5px var(--color-primary)",
        background: "rgba(255,255,255,.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        color: "var(--color-link)",
        fontWeight: 700,
        fontSize: size * 0.36,
      }}
    >
      {initialsOf(user.name)}
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
            style={
              active
                ? { background: "rgba(80,148,240,.12)", color: "var(--color-link)", fontWeight: 600 }
                : { color: "var(--color-text-secondary)" }
            }
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CabinetLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const needsOnboarding = !!user?.slug.startsWith("tmp-");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [isLoading, user, needsOnboarding, router]);

  if (isLoading || !user || needsOnboarding) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <div className="glass-card px-6 py-4 text-sm" style={{ color: "var(--color-muted)" }}>
          Загрузка…
        </div>
      </div>
    );
  }

  const bookingPath = `/${user.slug}`;
  const bookingDisplay = `${typeof window !== "undefined" ? window.location.host : "slotix.ru"}${bookingPath}`;

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}${bookingPath}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard access can be denied by the browser — silently ignore, the link is
      // still visible on screen for the user to copy manually
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row lg:gap-4 lg:p-4">
      {/* mobile top bar */}
      <header className="glass-card sticky top-0 z-30 flex items-center gap-3 rounded-none rounded-b-3xl px-4 py-2.5 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/slotix/slotix-icon.png" alt="" className="h-7 w-7 flex-none rounded-lg" />
        <div className="text-lg font-bold tracking-wide" style={{ color: "var(--color-ink)" }}>
          SLOTIX
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: "var(--color-link)", background: "rgba(80,148,240,.12)" }}
        >
          {PLAN_LABELS[user.plan]}
        </span>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="ml-auto flex h-9 w-9 flex-none items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,.7)", boxShadow: "0 0 0 1px rgba(20,30,45,.08)", color: "var(--color-ink)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden"
          style={{ background: "rgba(12, 22, 38, .45)" }}
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Не .glass-card: сквозь полупрозрачную панель просвечивала страница и меню
              становилось нечитаемым. Навигация должна быть непрозрачной. */}
          <div
            className="m-2 flex max-h-[85vh] flex-col gap-3 overflow-y-auto rounded-2xl p-4"
            style={{
              background: "#F7FAFD",
              border: "1px solid rgba(20,30,45,.08)",
              boxShadow: "0 -8px 40px rgba(20,40,70,.28)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-1 pb-2">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {user.name ?? user.slug}
                </div>
                <div className="truncate text-xs" style={{ color: "var(--color-muted)" }}>
                  {bookingDisplay}
                </div>
              </div>
            </div>
            <NavList pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
            <button type="button" onClick={handleCopy} className="btn-secondary justify-start">
              {copied ? "Ссылка скопирована" : "Скопировать ссылку на бронирование"}
            </button>
            <button type="button" onClick={handleLogout} className="btn-secondary justify-start" style={{ color: "var(--color-danger)" }}>
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* desktop sidebar */}
      <aside
        className="glass-card sticky top-4 hidden h-[calc(100vh-32px)] w-60 flex-none flex-col p-4 lg:flex"
        style={{ boxSizing: "border-box" }}
      >
        <div className="flex items-center gap-2.5 px-1 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slotix/slotix-icon.png" alt="" className="h-7.5 w-7.5 flex-none rounded-lg" style={{ width: 30, height: 30 }} />
          <div className="text-lg font-bold tracking-wide" style={{ color: "var(--color-ink)" }}>
            SLOTIX
          </div>
          <span
            className="ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: "var(--color-link)", background: "rgba(80,148,240,.12)" }}
          >
            {PLAN_LABELS[user.plan]}
          </span>
        </div>

        <NavList pathname={pathname} />

        <div className="mt-auto flex flex-col gap-3.5 pt-4">
          <div className="glass-card flex flex-col gap-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,.5)" }}>
            <div className="truncate text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              {bookingDisplay}
            </div>
            <button type="button" onClick={handleCopy} className="btn-secondary py-1.5 text-xs">
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push("/cabinet/settings")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/cabinet/settings");
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl p-1.5 text-left"
            style={{ borderTop: "1px solid rgba(20,30,45,.07)", paddingTop: 14 }}
          >
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold" style={{ color: "var(--color-ink)" }}>
                {user.name ?? user.slug}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-[11px] font-medium"
                style={{ color: "var(--color-muted)" }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-3 pb-10 pt-3 lg:px-3 lg:pt-0">
        <ConfirmProvider>{children}</ConfirmProvider>
      </main>

    </div>
  );
}
