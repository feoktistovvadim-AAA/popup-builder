"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navItems, icons } from "@/components/AdminSidebar";
import OrgSwitcher from "@/components/admin/OrgSwitcher";

export default function MobileNav({
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
    const [open, setOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <>
            <header className="flex h-14 items-center justify-between bg-white px-4 dark:bg-black md:hidden" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                        PB
                    </div>
                    <span className="font-semibold text-black dark:text-white">Popup Builder</span>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="rounded-md p-2 text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10 transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                        <path
                            d="M4 6h16M4 12h16M4 18h16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </header>

            {/* Drawer */}
            {open && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Sidebar Panel */}
                    <div className="relative flex w-64 flex-col bg-white px-4 py-6 shadow-xl dark:bg-black h-full animate-in slide-in-from-left duration-200">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                                    PB
                                </div>
                                <span className="font-semibold text-black dark:text-white">Popup Builder</span>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5 text-black/50 dark:text-white/50" fill="none">
                                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <OrgSwitcher activeOrgId={activeOrgId} memberships={memberships} />
                        </div>

                        <nav className="flex-1 space-y-0.5">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={clsx(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                                            active
                                                ? "bg-black/[.06] text-black dark:bg-white/[.1] dark:text-white"
                                                : "text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                                        )}
                                    >
                                        <span className={clsx("shrink-0", active ? "text-black dark:text-white" : "text-black/50 dark:text-white/50")}>
                                            {icons[item.icon]}
                                        </span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
                                <div>
                                    <p className="text-sm font-medium text-black dark:text-white">Admin User</p>
                                    <p className="text-xs text-black/40 dark:text-white/40">admin@example.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
