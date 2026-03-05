"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useSearchParams } from "next/navigation";
import DotGrid from "@/components/ui/DotGrid";
import { BentoSection } from "@/components/ui/MagicBento";
import {
    searchLogs,
    getSourceStats,
    type LogSearchResult,
    type LogSource,
    type SourceStats,
} from "../../actions";
import SafeDate from "@/components/ui/SafeDate";

interface LogExplorerClientProps {
    initialData: LogSearchResult;
    sources: LogSource[];
}

const providerColors: Record<string, string> = {
    aws: "text-orange-400",
    azure: "text-blue-400",
    gcp: "text-green-400",
    python: "text-yellow-400",
    nodejs: "text-emerald-400",
    docker: "text-cyan-400",
    curl: "text-purple-400",
};

const statusBadge = (status: string) => {
    const s = String(status);
    if (s.startsWith("2") || s === "Success" || s === "info" || s === "debug") {
        return "text-green-400";
    }
    if (s.startsWith("4") || s === "warning" || s === "warn") {
        return "text-yellow-400";
    }
    if (s.startsWith("5") || s === "error" || s === "critical" || s === "fatal") {
        return "text-red-400";
    }
    return "text-[var(--text-muted)]";
};

export default function LogExplorerClient({ initialData, sources }: LogExplorerClientProps) {
    const { theme } = useTheme();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState(initialData);
    const [query, setQuery] = useState("");
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    // Live tailing
    const [isLive, setIsLive] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Source stats
    const [activeSourceStats, setActiveSourceStats] = useState<SourceStats | null>(null);

    // Initialize from URL params
    useEffect(() => {
        const sourceIdParam = searchParams.get("source_id");
        if (sourceIdParam) {
            const id = parseInt(sourceIdParam);
            if (!isNaN(id)) {
                setSelectedSourceIds(new Set([id]));
            }
        }
    }, [searchParams]);

    // Fetch source stats when a single source is selected
    useEffect(() => {
        if (selectedSourceIds.size === 1) {
            const sourceId = Array.from(selectedSourceIds)[0];
            startTransition(async () => {
                const stats = await getSourceStats(sourceId);
                setActiveSourceStats(stats);
            });
        } else {
            setActiveSourceStats(null);
        }
    }, [selectedSourceIds]);

    // Search function
    const doSearch = (page: number = 1) => {
        startTransition(async () => {
            const ids = Array.from(selectedSourceIds);
            const result = await searchLogs(
                query || undefined,
                undefined,
                undefined,
                ids.length === 1 ? ids[0] : undefined,
                ids.length > 1 ? ids : undefined,
                page,
                50,
            );
            setData(result);
            setCurrentPage(page);
        });
    };

    // Auto-search when source selection changes
    useEffect(() => {
        doSearch(1);
    }, [selectedSourceIds]);

    // Live tailing
    useEffect(() => {
        if (isLive) {
            liveIntervalRef.current = setInterval(() => {
                doSearch(1);
            }, 4000);
        } else {
            if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        }
        return () => {
            if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        };
    }, [isLive, selectedSourceIds, query]);

    // Auto-scroll when live and new data arrives
    useEffect(() => {
        if (isLive && logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [data, isLive]);

    const toggleSource = (id: number) => {
        const next = new Set(selectedSourceIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedSourceIds(next);
    };

    const toggleRow = (idx: number) => {
        const next = new Set(expandedRows);
        if (next.has(idx)) {
            next.delete(idx);
        } else {
            next.add(idx);
        }
        setExpandedRows(next);
    };

    const totalPages = Math.ceil(data.total / data.size);

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
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                            Log Explorer
                        </h1>
                        <p className="text-[var(--text-subtle)] text-sm mt-1">
                            Real-time log streaming across all connected sources.
                        </p>
                    </div>

                    {/* Live Toggle */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isLive
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-[var(--surface)] text-[var(--text-subtle)] border-[var(--border)] hover:border-[var(--border-light)]"
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                        {isLive ? "Live" : "Paused"}
                    </button>
                </div>

                {/* Source Stats Strip */}
                {activeSourceStats && (
                    <div className="mb-4 flex items-center gap-6 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--divider)] backdrop-blur-[20px]">
                        <span className="text-xs text-[var(--text-subtle)]">
                            <strong className="text-[var(--text-main)]">{sources.find(s => s.id === activeSourceStats.source_id)?.name}</strong> stats:
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            Total: <strong className="text-[var(--text-main)]">{activeSourceStats.total_logs.toLocaleString()}</strong>
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            Errors: <strong className="text-red-400">{activeSourceStats.error_count.toLocaleString()}</strong>
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            15m Errors: <strong className="text-red-400">{activeSourceStats.last_15_min_errors}</strong>
                        </span>
                    </div>
                )}

                {/* Split Pane Layout */}
                <div className="flex-1 flex gap-4 min-h-0">
                    {/* ========== LEFT SIDEBAR: Source List ========== */}
                    <div className="w-56 flex-shrink-0 bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)] overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-[var(--divider)]">
                            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sources</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto py-1">
                            {/* All Sources option */}
                            <button
                                onClick={() => setSelectedSourceIds(new Set())}
                                className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${selectedSourceIds.size === 0
                                    ? "bg-[var(--hover-bg)] text-[var(--text-main)]"
                                    : "text-[var(--text-subtle)] hover:bg-[var(--hover-bg)]"
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${selectedSourceIds.size === 0 ? "bg-blue-400" : "bg-gray-500"}`} />
                                <span className="font-medium">All Sources</span>
                            </button>

                            {sources.map((src) => (
                                <button
                                    key={src.id}
                                    onClick={() => toggleSource(src.id)}
                                    className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${selectedSourceIds.has(src.id)
                                        ? "bg-[var(--hover-bg)] text-[var(--text-main)]"
                                        : "text-[var(--text-subtle)] hover:bg-[var(--hover-bg)]"
                                        }`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${src.status === "connected"
                                            ? "bg-green-400"
                                            : src.status === "waiting"
                                                ? "bg-yellow-400 animate-pulse"
                                                : "bg-gray-500"
                                            }`}
                                    />
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{src.name}</div>
                                        <div className={`text-[10px] uppercase font-bold ${providerColors[src.cloud_provider] || "text-gray-400"}`}>
                                            {src.cloud_provider}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ========== MAIN PANE: Terminal Log View ========== */}
                    <div className="flex-1 flex flex-col bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)] overflow-hidden">
                        {/* Search Bar */}
                        <div className="px-4 py-3 border-b border-[var(--divider)] flex items-center gap-3">
                            <svg
                                className="text-[var(--text-subtle)] flex-shrink-0"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                                className="flex-1 bg-transparent text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none"
                            />
                            <span className="text-[11px] text-[var(--text-subtle)]">
                                {data.total.toLocaleString()} logs
                            </span>
                            {isPending && (
                                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                            )}
                        </div>

                        {/* Terminal Log Rows */}
                        <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed">
                            {data.logs.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[var(--text-subtle)] text-sm">
                                    {data.total === 0
                                        ? "No logs found. Connect a source and start sending logs."
                                        : "No logs match your filters."}
                                </div>
                            ) : (
                                data.logs.map((log, idx) => (
                                    <div key={idx}>
                                        {/* Log Line */}
                                        <div
                                            onClick={() => toggleRow(idx)}
                                            className={`flex items-start gap-3 px-4 py-1.5 cursor-pointer transition-colors hover:bg-[var(--hover-bg)] ${expandedRows.has(idx) ? "bg-[var(--hover-bg)]" : ""
                                                }`}
                                        >
                                            {/* Expand Arrow */}
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className={`flex-shrink-0 mt-1 text-[var(--text-subtle)] transition-transform ${expandedRows.has(idx) ? "rotate-90" : ""}`}
                                            >
                                                <path d="M9 18l6-6-6-6" />
                                            </svg>

                                            {/* Timestamp */}
                                            <SafeDate
                                                date={log.timestamp as string}
                                                className="text-[var(--text-subtle)] flex-shrink-0 w-[145px]"
                                                options={{
                                                    month: "short",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: false,
                                                }}
                                            />

                                            {/* Status badge */}
                                            <span className={`flex-shrink-0 w-[55px] font-bold text-[12px] ${statusBadge(log.status as string)}`}>
                                                {(log.status as string) || "—"}
                                            </span>

                                            {/* Source Name */}
                                            {(log.source_name as string) && (
                                                <span className={`flex-shrink-0 text-[11px] px-1.5 py-0 rounded ${providerColors[log.cloud_provider as string] || "text-gray-400"}`}>
                                                    [{log.source_name as string}]
                                                </span>
                                            )}

                                            {/* Action */}
                                            <span className="text-[var(--text-main)] truncate">
                                                {log.action as string}
                                            </span>
                                        </div>

                                        {/* Expanded Raw JSON */}
                                        {expandedRows.has(idx) && (
                                            <div className="mx-4 mb-2 ml-11 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] overflow-x-auto">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">Raw Log</span>
                                                    <div className="flex gap-3 text-[10px] text-[var(--text-subtle)]">
                                                        <span>IP: <strong className="text-[var(--text-muted)]">{log.source_ip as string}</strong></span>
                                                        <span>Provider: <strong className={providerColors[log.cloud_provider as string] || "text-gray-400"}>{(log.cloud_provider as string)?.toUpperCase()}</strong></span>
                                                        {!!log.source_id && <span>Source ID: <strong className="text-[var(--text-muted)]">#{log.source_id as number}</strong></span>}
                                                    </div>
                                                </div>
                                                <pre className="text-[12px] text-[var(--text-muted)] whitespace-pre-wrap break-words">
                                                    {JSON.stringify(log.raw_log, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {data.total > 0 && !isLive && (
                            <div className="px-4 py-2 border-t border-[var(--divider)] flex items-center justify-between">
                                <p className="text-[11px] text-[var(--text-subtle)]">
                                    Page {currentPage} of {totalPages} ({data.total.toLocaleString()} total)
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => doSearch(currentPage - 1)}
                                        disabled={currentPage === 1 || isPending}
                                        className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <button
                                        onClick={() => doSearch(currentPage + 1)}
                                        disabled={currentPage >= totalPages || isPending}
                                        className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </BentoSection>
        </main>
    );
}
