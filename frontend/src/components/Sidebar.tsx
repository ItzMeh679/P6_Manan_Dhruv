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
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
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
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${isCollapsed ? "w-16" : "w-56"
                }`}
        >
            {/* Logo Header */}
            <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-100">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="white"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                {!isCollapsed && (
                    <span className="font-semibold text-gray-900 text-lg">
                        Pinnacle
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2">
                {navItems.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <span className={isActive ? "text-blue-600" : "text-gray-500"}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className="font-medium text-sm">{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Need Help Section */}
            {!isCollapsed && (
                <div className="mx-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">Need Help?</p>
                    <p className="text-gray-500 text-xs mb-2">
                        Check our documentation for guides.
                    </p>
                    <a
                        href="#"
                        className="text-blue-600 text-sm font-medium hover:text-blue-700 inline-flex items-center gap-1"
                    >
                        View Docs
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            )}

            {/* Collapse Toggle */}
            <button
                onClick={onToggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </aside>
    );
}
