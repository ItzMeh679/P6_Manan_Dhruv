"use client";

import { useState, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DotGrid from "@/components/ui/DotGrid";
import { BentoSection, ParticleCard } from "@/components/ui/MagicBento";
import { searchLogs, type LogSearchResult } from "../../actions";

interface LogExplorerClientProps {
    initialData: LogSearchResult;
}

const providerColors: Record<string, string> = {
    aws: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    azure: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    gcp: "bg-green-500/10 text-green-400 border-green-500/20",
};

const providerLabels: Record<string, string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "GCP",
};

export default function LogExplorerClient({ initialData }: LogExplorerClientProps) {
    const { theme } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState(initialData);
    const [query, setQuery] = useState("");
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [sourceIpFilter, setSourceIpFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const handleSearch = (page: number = 1) => {
        startTransition(async () => {
            const result = await searchLogs(
                query || undefined,
                selectedProvider || undefined,
                sourceIpFilter || undefined,
                page,
                50,
            );
            setData(result);
            setCurrentPage(page);
        });
    };

    const totalPages = Math.ceil(data.total / data.size);

    return (
        <main className="relative min-h-screen">
            <div className="absolute inset-0 z-0">
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

            <BentoSection className="relative z-10 p-6 lg:p-8" glowColor="255, 255, 255">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                        Log Explorer
                    </h1>
                    <p className="text-[var(--text-subtle)] text-sm mt-1">
                        Search and filter security logs across AWS, Azure, and GCP.
                    </p>
                </div>

                {/* Search + Filters */}
                <ParticleCard
                    enableTilt={false}
                    enableMagnetism={false}
                    glowColor="255, 255, 255"
                    className="card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)] mb-6"
                >
                    <div className="p-5 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                                    width="16"
                                    height="16"
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
                                    placeholder="Search logs by IP, action, status..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)]"
                                />
                            </div>

                            {/* IP Filter */}
                            <input
                                type="text"
                                placeholder="Filter by IP..."
                                value={sourceIpFilter}
                                onChange={(e) => setSourceIpFilter(e.target.value)}
                                className="w-40 px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)]"
                            />

                            {/* Search Button */}
                            <button
                                onClick={() => handleSearch()}
                                disabled={isPending}
                                className="px-6 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                                {isPending ? "Searching..." : "Search"}
                            </button>
                        </div>

                        {/* Provider Filter Chips */}
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-xs text-[var(--text-subtle)] font-medium">Cloud:</span>
                            {["aws", "azure", "gcp"].map((provider) => (
                                <button
                                    key={provider}
                                    onClick={() => {
                                        setSelectedProvider(selectedProvider === provider ? null : provider);
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors uppercase ${selectedProvider === provider
                                            ? providerColors[provider]
                                            : "bg-[var(--surface)] text-[var(--text-subtle)] border-[var(--border)] hover:bg-[var(--hover-bg)]"
                                        }`}
                                >
                                    {providerLabels[provider]}
                                </button>
                            ))}
                            {selectedProvider && (
                                <button
                                    onClick={() => setSelectedProvider(null)}
                                    className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors underline"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </ParticleCard>

                {/* Results */}
                <ParticleCard
                    enableTilt={false}
                    enableMagnetism={false}
                    glowColor="255, 255, 255"
                    className="card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]"
                >
                    <div className="relative z-10">
                        <div className="p-5 border-b border-[var(--divider)] flex items-center justify-between">
                            <h2 className="font-semibold text-[var(--text-main)] text-sm">
                                Results
                                <span className="ml-2 text-[var(--text-subtle)] font-normal">
                                    ({data.total.toLocaleString()} logs)
                                </span>
                            </h2>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                            <div className="col-span-2">Provider</div>
                            <div className="col-span-2">Source IP</div>
                            <div className="col-span-4">Action</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Timestamp</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-[var(--divider)]">
                            {data.logs.length === 0 ? (
                                <div className="px-5 py-12 text-center text-[var(--text-subtle)] text-sm">
                                    {data.total === 0
                                        ? "No logs found. Ingest logs via the API to see them here."
                                        : "No logs match your search criteria."}
                                </div>
                            ) : (
                                data.logs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors items-center"
                                    >
                                        <div className="col-span-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${providerColors[log.cloud_provider as string] ||
                                                    "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                    }`}
                                            >
                                                {providerLabels[log.cloud_provider as string] || (log.cloud_provider as string)}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-sm text-[var(--text-muted)] font-mono truncate">
                                            {log.source_ip as string}
                                        </div>
                                        <div className="col-span-4 text-sm text-[var(--text-main)] truncate">
                                            {log.action as string}
                                        </div>
                                        <div className="col-span-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${(log.status as string)?.startsWith("2") ||
                                                        (log.status as string) === "Success"
                                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    }`}
                                            >
                                                {log.status as string}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-right text-xs text-[var(--text-subtle)]">
                                            {log.timestamp
                                                ? new Date(log.timestamp as string).toLocaleString()
                                                : "—"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {data.total > 0 && (
                            <div className="px-5 py-3 border-t border-[var(--divider)] flex items-center justify-between">
                                <p className="text-xs text-[var(--text-subtle)]">
                                    Page {currentPage} of {totalPages} ({data.total.toLocaleString()} total)
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSearch(currentPage - 1)}
                                        disabled={currentPage === 1 || isPending}
                                        className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleSearch(currentPage + 1)}
                                        disabled={currentPage >= totalPages || isPending}
                                        className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </ParticleCard>
            </BentoSection>
        </main>
    );
}
