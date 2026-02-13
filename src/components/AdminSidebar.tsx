"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import OrgSwitcher from "@/components/admin/OrgSwitcher";

export const navItems = [
  { href: "/admin", label: "Обзор", icon: "dashboard" },
  { href: "/admin/sites", label: "Сайты", icon: "globe" },
  { href: "/admin/popups", label: "Попапы", icon: "layers" },
  { href: "/admin/team", label: "Команда", icon: "users" },
  { href: "/admin/settings", label: "Настройки", icon: "settings" },
] as const;

export const icons: Record<string, ReactElement> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 5h7v2h-7v-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 12h16M12 4c2.5 2.7 2.5 13.3 0 16M12 4c-2.5 2.7-2.5 13.3 0 16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M12 5l7 4-7 4-7-4 7-4zm0 8l7 4-7 4-7-4 7-4z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M8 14a4 4 0 1 0-0.001-8.001A4 4 0 0 0 8 14zm8 2a3 3 0 1 0-0.001-6.001A3 3 0 0 0 16 16z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 20c0-3 2.5-5 5-5s5 2 5 5M13 20c0-2 1.5-3.5 3.5-3.5S20 18 20 20"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4a7.9 7.9 0 0 0-.1-1l2-1.5-2-3.5-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4H9.4l-.3 2.4a8 8 0 0 0-1.7 1L5 5.5 3 9l2 1.5a8 8 0 0 0 0 2L3 14l2 3.5 2.3-.7a8 8 0 0 0 1.7 1l.3 2.4h4.2l.3-2.4a8 8 0 0 0 1.7-1l2.3.7 2-3.5-2-1.5c.1-.3.1-.7.1-1z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
};

export default function AdminSidebar({
  activeOrgId,
  memberships,
}: {
  activeOrgId: string | null;
  memberships: Array<{
    organizationId: string;
    role: string;
    organization: { id: string; name: string; slug: string };
  }>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("pb_admin_sidebar");
    return stored === "collapsed";
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(
        "pb_admin_sidebar",
        next ? "collapsed" : "expanded"
      );
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={clsx(
        "hidden md:flex shrink-0 flex-col border-r bg-white dark:bg-black transition-all duration-200 ease-[var(--ease)]",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
            PB
          </div>
          {!collapsed ? (
            <div className="space-y-0.5 overflow-hidden">
              <div className="text-sm font-semibold text-black dark:text-white truncate">
                Popup Builder
              </div>
              <OrgSwitcher activeOrgId={activeOrgId} memberships={memberships} />
            </div>
          ) : null}
        </div>
        <button
          className="rounded-md p-1.5 text-black/50 hover:bg-black/[.04] hover:text-black/80 dark:text-white/50 dark:hover:bg-white/[.06] dark:hover:text-white/80 transition-colors"
          onClick={toggle}
          type="button"
          aria-label={collapsed ? "Развернуть" : "Свернуть"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            {collapsed ? (
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2 pb-6">
        <ul className="space-y-0.5 text-[13px]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  className={clsx(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors",
                    active
                      ? "bg-black/[.06] text-black dark:bg-white/[.1] dark:text-white"
                      : "text-black/60 hover:bg-black/[.04] hover:text-black dark:text-white/60 dark:hover:bg-white/[.06] dark:hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={clsx("shrink-0", active ? "text-black dark:text-white" : "text-black/50 dark:text-white/50")}>
                    {icons[item.icon]}
                  </span>
                  {!collapsed ? <span>{item.label}</span> : null}

                  {/* Tooltip for collapsed state */}
                  {collapsed ? (
                    <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-white dark:text-black whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
