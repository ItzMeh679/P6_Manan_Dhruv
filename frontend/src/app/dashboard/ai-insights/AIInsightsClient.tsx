"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DotGrid from "@/components/ui/DotGrid";
import { BentoSection } from "@/components/ui/MagicBento";
import SafeDate from "@/components/ui/SafeDate";
import {
    getAIAlerts,
    getAIAlertStats,
    getAIMonitorStatus,
    dismissAIAlert,
    type AIAlert,
    type AIAlertSearchResult,
    type AIAlertStats,
    type AIMonitorStatus,
} from "../../actions";

interface AIInsightsClientProps {
    initialAlerts: AIAlertSearchResult;
    initialStats: AIAlertStats;
    initialStatus: AIMonitorStatus;
}

// ─── Severity Config ──────────────────────────────────────────
const severityConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; dot: string }> = {
    critical: { label: "Critical", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/25", dot: "bg-red-500" },
    high: { label: "High", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/25", dot: "bg-orange-500" },
    medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/25", dot: "bg-yellow-500" },
    low: { label: "Low", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/25", dot: "bg-blue-500" },
    info: { label: "Info", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/25", dot: "bg-gray-500" },
};

const categoryLabels: Record<string, string> = {
    security: "Security",
    website_failure: "Website Failure",
    performance: "Performance",
    authentication: "Authentication",
    infrastructure: "Infrastructure",
    data_integrity: "Data Integrity",
    compliance: "Compliance",
    deployment: "Deployment",
};

const categoryIcons: Record<string, React.ReactNode> = {
    security: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    website_failure: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
    ),
    performance: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    authentication: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    ),
    infrastructure: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    data_integrity: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    compliance: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    deployment: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
    ),
};

export default function AIInsightsClient({ initialAlerts, initialStats, initialStatus }: AIInsightsClientProps) {
    const { theme } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [alerts, setAlerts] = useState(initialAlerts);
    const [stats, setStats] = useState(initialStats);
    const [monitorStatus, setMonitorStatus] = useState(initialStatus);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [severityFilter, setSeverityFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [showDismissed, setShowDismissed] = useState(false);

    // Auto-refresh
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch alerts
    const fetchAlerts = (page: number = 1) => {
        startTransition(async () => {
            const [alertData, statsData, statusData] = await Promise.all([
                getAIAlerts(
                    severityFilter || undefined,
                    categoryFilter || undefined,
                    showDismissed ? undefined : false,
                    page,
                    50,
                ),
                getAIAlertStats(),
                getAIMonitorStatus(),
            ]);
            setAlerts(alertData);
            setStats(statsData);
            setMonitorStatus(statusData);
            setCurrentPage(page);
        });
    };

    // Re-fetch when filters change
    useEffect(() => {
        fetchAlerts(1);
    }, [severityFilter, categoryFilter, showDismissed]);

    // Auto-refresh every 30s
    useEffect(() => {
        if (isAutoRefresh) {
            refreshIntervalRef.current = setInterval(() => {
                fetchAlerts(currentPage);
            }, 30000);
        } else {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        }
        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [isAutoRefresh, currentPage, severityFilter, categoryFilter, showDismissed]);

    // Dismiss handler
    const handleDismiss = (alertId: string, index: string) => {
        startTransition(async () => {
            const success = await dismissAIAlert(alertId, index);
            if (success) {
                fetchAlerts(currentPage);
            }
        });
    };

    const totalPages = Math.ceil(alerts.total / alerts.size);

    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <DotGrid
                    dotSize={4}
                    gap={15}
                    baseColor={theme === "light" ? "#e0e0e0" : "#1f1a26"}
                    activeColor={theme === "light" ? "#111111" : "#ffffff"}
                    proximity={150}
                    shockRadius={200}
                    shockStrength={3}
                    resistance={800}
                    returnDuration={1.5}
                />
            </div>

            <BentoSection className="relative z-10 p-6 lg:p-8 flex-1 flex flex-col min-h-0" glowColor="255, 255, 255">
                {/* ═══════ Header ═══════ */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                                AI Insights
                            </h1>
                        </div>
                        <p className="text-[var(--text-subtle)] text-sm mt-1 ml-11">
                            AI-powered security & infrastructure monitoring via Gemini.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Monitor Status Pill */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border ${monitorStatus.active
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : monitorStatus.api_key_configured
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${monitorStatus.active ? "bg-green-500 animate-pulse" : monitorStatus.api_key_configured ? "bg-yellow-500" : "bg-red-500"}`} />
                            {monitorStatus.active ? "Monitoring Active" : monitorStatus.api_key_configured ? "Starting..." : "API Key Missing"}
                        </div>

                        {/* Auto-refresh Toggle */}
                        <button
                            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isAutoRefresh
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-[var(--surface)] text-[var(--text-subtle)] border-[var(--border)] hover:border-[var(--border-light)]"
                                }`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isAutoRefresh ? "animate-spin" : ""} style={isAutoRefresh ? { animationDuration: "3s" } : {}}>
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                            </svg>
                            {isAutoRefresh ? "Live" : "Paused"}
                        </button>

                        {isPending && (
                            <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        )}
                    </div>
                </div>

                {/* ═══════ Stats Strip ═══════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                    <div className="px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--divider)] backdrop-blur-[20px]">
                        <div className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider font-medium mb-1">Active Alerts</div>
                        <div className="text-xl font-bold text-[var(--text-main)]">{stats.total_active}</div>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--divider)] backdrop-blur-[20px]">
                        <div className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider font-medium mb-1">Last 24h</div>
                        <div className="text-xl font-bold text-[var(--text-main)]">{stats.last_24h}</div>
                    </div>
                    {(["critical", "high", "medium", "low"] as const).map((sev) => {
                        const cfg = severityConfig[sev];
                        return (
                            <div key={sev} className={`px-4 py-3 rounded-xl border backdrop-blur-[20px] ${cfg.bgColor} ${cfg.borderColor}`}>
                                <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${cfg.color}`}>{cfg.label}</div>
                                <div className={`text-xl font-bold ${cfg.color}`}>{stats.by_severity[sev] || 0}</div>
                            </div>
                        );
                    })}
                </div>

                {/* ═══════ Filter Bar ═══════ */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {/* Severity filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-[var(--card-bg)] border border-[var(--divider)] text-[var(--text-main)] focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
                    >
                        <option value="">All Severities</option>
                        {Object.entries(severityConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-[var(--card-bg)] border border-[var(--divider)] text-[var(--text-main)] focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Show dismissed toggle */}
                    <button
                        onClick={() => setShowDismissed(!showDismissed)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${showDismissed
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-[var(--surface)] text-[var(--text-subtle)] border-[var(--border)]"
                            }`}
                    >
                        {showDismissed ? "Showing All" : "Hiding Dismissed"}
                    </button>

                    <div className="flex-1" />

                    {/* Last analysis info */}
                    {monitorStatus.timestamp && (
                        <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-2">
                            <span>Last scan:</span>
                            <SafeDate date={monitorStatus.timestamp} mode="toLocaleTimeString" />
                            <span className="text-[var(--text-muted)]">•</span>
                            <span>{monitorStatus.logs_analyzed} logs analyzed</span>
                        </div>
                    )}
                </div>

                {/* ═══════ Alert Cards ═══════ */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {alerts.alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="text-[var(--text-main)] font-semibold mb-1">All Clear</h3>
                            <p className="text-[var(--text-subtle)] text-sm max-w-md">
                                {monitorStatus.active
                                    ? "No issues detected. The AI monitor is actively analyzing your logs every 60 seconds."
                                    : monitorStatus.api_key_configured
                                        ? "AI monitor is starting up. Alerts will appear here once analysis begins."
                                        : "Set the GEMINI_API_KEY environment variable to enable AI-powered log monitoring."
                                }
                            </p>
                        </div>
                    ) : (
                        alerts.alerts.map((alert) => {
                            const sev = severityConfig[alert.severity] || severityConfig.info;
                            const catIcon = categoryIcons[alert.category];
                            const catLabel = categoryLabels[alert.category] || alert.category;

                            return (
                                <div
                                    key={`${alert._index}-${alert._id}`}
                                    className={`group rounded-xl border backdrop-blur-[20px] transition-all hover:shadow-lg ${alert.dismissed
                                        ? "opacity-50 bg-[var(--card-bg)] border-[var(--divider)]"
                                        : `bg-[var(--card-bg)] ${sev.borderColor}`
                                        }`}
                                >
                                    <div className="p-5">
                                        {/* Top Row: Severity + Category + Time + Dismiss */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Severity badge */}
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sev.bgColor} ${sev.color} ${sev.borderColor}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                                    {sev.label}
                                                </span>

                                                {/* Category badge */}
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                                                    {catIcon}
                                                    {catLabel}
                                                </span>

                                                {/* Dismissed badge */}
                                                {alert.dismissed && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                        Dismissed
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                <span className="text-[11px] text-[var(--text-subtle)]">
                                                    <SafeDate date={alert.timestamp} options={{ month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }} />
                                                </span>
                                                {!alert.dismissed && (
                                                    <button
                                                        onClick={() => handleDismiss(alert._id, alert._index)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--hover-bg)] text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                                                        title="Dismiss alert"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2">{alert.title}</h3>

                                        {/* Description */}
                                        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">{alert.description}</p>

                                        {/* Bottom details */}
                                        <div className="flex items-start gap-6 text-[12px]">
                                            {alert.affected_resources && (
                                                <div className="flex-1">
                                                    <span className="text-[var(--text-subtle)] font-medium">Affected: </span>
                                                    <span className="text-[var(--text-muted)] font-mono">{alert.affected_resources}</span>
                                                </div>
                                            )}
                                            {alert.recommended_action && (
                                                <div className="flex-1">
                                                    <span className="text-[var(--text-subtle)] font-medium">Action: </span>
                                                    <span className="text-[var(--text-muted)]">{alert.recommended_action}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ═══════ Pagination ═══════ */}
                {alerts.total > 0 && (
                    <div className="pt-4 mt-2 border-t border-[var(--divider)] flex items-center justify-between">
                        <p className="text-[11px] text-[var(--text-subtle)]">
                            Page {currentPage} of {totalPages} ({alerts.total.toLocaleString()} total alerts)
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchAlerts(currentPage - 1)}
                                disabled={currentPage === 1 || isPending}
                                className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={() => fetchAlerts(currentPage + 1)}
                                disabled={currentPage >= totalPages || isPending}
                                className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </BentoSection>
        </main>
    );
}
