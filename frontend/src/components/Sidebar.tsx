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
            name: "Dashboard",
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
                    <span className="font-semibold text-[var(--text-main)] text-sm tracking-tight">Pinnacle</span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-2">
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
