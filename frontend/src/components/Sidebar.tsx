"use client";

import Link from "next/link";

interface SidebarProps {
    activePage?: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export default function Sidebar({ activePage = "dashboard", isCollapsed, onToggleCollapse }: SidebarProps) {
    const navItems = [
        {
            name: "Overview",
            href: "/dashboard",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
            ),
            id: "dashboard",
        },
        {
            name: "Log Explorer",
            href: "/dashboard/logs",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
            id: "logs",
        },
        {
            name: "AI Insights",
            href: "/dashboard/ai-insights",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            ),
            id: "ai-insights",
        },
        {
            name: "Sources",
            href: "/dashboard/sources",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            ),
            id: "sources",
        },
    ];

    return (
        <aside className={`fixed left-0 top-0 h-full bg-[var(--background-subtle)] border-r border-[var(--divider)] flex flex-col transition-all duration-300 z-40 ${isCollapsed ? "w-16" : "w-56"}`}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[var(--divider)]">
                <div className="flex items-center justify-center w-7 h-7 bg-[var(--logo-bg)] rounded-md flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--logo-fg)">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                {!isCollapsed && (
                    <span className="font-semibold text-[var(--text-main)] text-sm tracking-tight">Pinnacle SIEM</span>
                )}
            </div>

            {/* Section Label */}
            {!isCollapsed && (
                <div className="px-4 pt-4 pb-1">
                    <span className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-widest">Security</span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 py-2 px-2">
                {navItems.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm ${isActive ? "bg-[var(--hover-bg)] text-[var(--text-main)]" : "text-[var(--text-subtle)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-muted)]"}`}
                        >
                            <span className={isActive ? "text-[var(--text-main)]" : "text-[var(--text-subtle)]"}>{item.icon}</span>
                            {!isCollapsed && <span className="font-medium">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={onToggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--surface-light)] transition-colors"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[var(--text-subtle)] transition-transform ${isCollapsed ? "rotate-180" : ""}`}>
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </aside>
    );
}
