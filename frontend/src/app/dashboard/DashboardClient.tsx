"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import StatsCard from "@/components/StatsCard";
import DotGrid from '@/components/ui/DotGrid';
import { BentoSection, ParticleCard } from '@/components/ui/MagicBento';
import SafeDate from "@/components/ui/SafeDate";

interface LogStats {
    total_logs: number;
    logs_by_provider: Record<string, number>;
    logs_by_source: Record<string, number>;
    recent_logs: Record<string, unknown>[];
}

interface LogSource {
    id: number;
    name: string;
    cloud_provider: string;
    is_active: boolean;
    api_key: string;
    status: string;
}

interface DashboardClientProps {
    stats: LogStats;
    sources: LogSource[];
}

export default function DashboardClient({ stats, sources }: DashboardClientProps) {
    const { theme } = useTheme();

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

    return (
        <main className="relative min-h-screen">
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={4}
                    gap={15}
                    baseColor={theme === 'light' ? '#e0e0e0' : '#1f1a26'}
                    activeColor={theme === 'light' ? '#111111' : '#ffffff'}
                    proximity={150}
                    shockRadius={200}
                    shockStrength={3}
                    resistance={800}
                    returnDuration={1.5}
                />
            </div>

            <BentoSection className="relative z-10 p-6 lg:p-8" glowColor="255, 255, 255">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                        SIEM Overview
                    </h1>
                    <p className="text-[var(--text-subtle)] text-sm mt-1">
                        Multi-cloud security log monitoring dashboard.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                        iconBg="bg-blue-500/10"
                        label="Total Logs"
                        value={stats.total_logs.toLocaleString()}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                        iconBg="bg-orange-500/10"
                        label="AWS Logs"
                        value={(stats.logs_by_provider?.aws || 0).toLocaleString()}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
                        iconBg="bg-sky-500/10"
                        label="Azure Logs"
                        value={(stats.logs_by_provider?.azure || 0).toLocaleString()}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                        iconBg="bg-green-500/10"
                        label="GCP Logs"
                        value={(stats.logs_by_provider?.gcp || 0).toLocaleString()}
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Sources */}
                    <ParticleCard enableTilt={false} enableMagnetism={false} glowColor="255, 255, 255" className="lg:col-span-2 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]">
                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">Connected Sources</h2>
                            </div>
                            {sources.length === 0 ? (
                                <p className="text-[var(--text-subtle)] text-sm py-4">No sources configured yet. Go to Sources to add one.</p>
                            ) : (
                                <div className="space-y-2">
                                    {sources.map((src) => (
                                        <div key={src.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${providerColors[src.cloud_provider] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                                                    {providerLabels[src.cloud_provider] || src.cloud_provider}
                                                </span>
                                                <span className="text-sm text-[var(--text-main)]">{src.name}</span>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${src.status === "connected" ? "bg-green-400" : src.status === "waiting" ? "bg-yellow-400 animate-pulse" : "bg-gray-400"}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ParticleCard>

                    {/* Recent Logs */}
                    <ParticleCard enableTilt={false} enableMagnetism={false} glowColor="255, 255, 255" className="lg:col-span-3 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]">
                        <div className="relative z-10">
                            <div className="p-5 border-b border-[var(--divider)]">
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">Recent Logs</h2>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                                <div className="col-span-2">Provider</div>
                                <div className="col-span-2">Source IP</div>
                                <div className="col-span-4">Action</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Time</div>
                            </div>

                            <div className="divide-y divide-[var(--divider)]">
                                {stats.recent_logs.length === 0 ? (
                                    <div className="px-5 py-12 text-center text-[var(--text-subtle)] text-sm">
                                        No logs ingested yet. Send some logs via the ingest endpoints.
                                    </div>
                                ) : (
                                    stats.recent_logs.map((log, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors items-center">
                                            <div className="col-span-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${providerColors[log.cloud_provider as string] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                                                    {providerLabels[log.cloud_provider as string] || (log.cloud_provider as string)}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-sm text-[var(--text-muted)] font-mono truncate">{log.source_ip as string}</div>
                                            <div className="col-span-4 text-sm text-[var(--text-main)] truncate">{log.action as string}</div>
                                            <div className="col-span-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${(log.status as string)?.startsWith("2") || (log.status as string) === "Success"
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    }`}>
                                                    {log.status as string}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-right text-xs text-[var(--text-subtle)]">
                                                <SafeDate
                                                    date={log.timestamp as string}
                                                    mode="toLocaleTimeString"
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </ParticleCard>
                </div>
            </BentoSection>
        </main>
    );
}
