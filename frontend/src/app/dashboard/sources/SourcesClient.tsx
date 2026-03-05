"use client";

import { useState, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DotGrid from "@/components/ui/DotGrid";
import { BentoSection, ParticleCard } from "@/components/ui/MagicBento";
import { createSource, deleteSource, type LogSource } from "../../actions";

interface SourcesClientProps {
    sources: LogSource[];
}

const providerColors: Record<string, string> = {
    aws: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    azure: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    gcp: "bg-green-500/10 text-green-400 border-green-500/20",
};

const providerLabels: Record<string, string> = {
    aws: "Amazon Web Services",
    azure: "Microsoft Azure",
    gcp: "Google Cloud Platform",
};

const providerShort: Record<string, string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "GCP",
};

export default function SourcesClient({ sources }: SourcesClientProps) {
    const { theme } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setDeletingId(id);
        startTransition(async () => {
            await deleteSource(id);
            setDeletingId(null);
        });
    };

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
                        Log Sources
                    </h1>
                    <p className="text-[var(--text-subtle)] text-sm mt-1">
                        Manage your cloud log sources. Each source represents a connection to AWS, Azure, or GCP.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Add New Source Form */}
                    <ParticleCard
                        enableTilt={false}
                        enableMagnetism={false}
                        glowColor="255, 255, 255"
                        className="lg:col-span-2 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]"
                    >
                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 rounded-full bg-[var(--badge-bg)] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">Add Source</h2>
                            </div>
                            <form action={createSource} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Source Name
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="e.g. Production Web Server"
                                        className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Cloud Provider
                                    </label>
                                    <select
                                        name="cloud_provider"
                                        className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-light)]"
                                        required
                                    >
                                        <option value="aws">Amazon Web Services (AWS)</option>
                                        <option value="azure">Microsoft Azure</option>
                                        <option value="gcp">Google Cloud Platform (GCP)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="Details about this log source..."
                                        className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)] resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-colors"
                                >
                                    Register Source
                                </button>
                            </form>

                            {/* Ingest API Info */}
                            <div className="mt-6 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                                <h3 className="text-xs font-semibold text-[var(--text-main)] mb-2">Ingest Endpoint</h3>
                                <p className="text-[11px] text-[var(--text-subtle)] mb-2">
                                    Use these endpoints to push logs from your cloud agents:
                                </p>
                                <div className="space-y-1 font-mono text-[11px] text-[var(--text-muted)]">
                                    <p><span className="text-orange-400">AWS:</span> POST /ingest/aws</p>
                                    <p><span className="text-blue-400">Azure:</span> POST /ingest/azure</p>
                                    <p><span className="text-green-400">GCP:</span> POST /ingest/gcp</p>
                                </div>
                                <p className="text-[11px] text-[var(--text-subtle)] mt-2">
                                    Set <code className="text-[var(--text-muted)]">X-Ingest-Api-Key</code> header for auth.
                                </p>
                            </div>
                        </div>
                    </ParticleCard>

                    {/* Source List */}
                    <ParticleCard
                        enableTilt={false}
                        enableMagnetism={false}
                        glowColor="255, 255, 255"
                        className="lg:col-span-3 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]"
                    >
                        <div className="relative z-10">
                            <div className="p-5 border-b border-[var(--divider)]">
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">
                                    Registered Sources
                                    <span className="ml-2 text-[var(--text-subtle)] font-normal">
                                        ({sources.length})
                                    </span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                                <div className="col-span-1">ID</div>
                                <div className="col-span-2">Provider</div>
                                <div className="col-span-3">Name</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            <div className="divide-y divide-[var(--divider)]">
                                {sources.length === 0 ? (
                                    <div className="px-5 py-12 text-center text-[var(--text-subtle)] text-sm">
                                        No sources registered yet. Create one to get started.
                                    </div>
                                ) : (
                                    sources.map((src) => (
                                        <div
                                            key={src.id}
                                            className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors items-center"
                                        >
                                            <div className="col-span-1 text-[var(--text-subtle)] text-sm font-mono">
                                                #{src.id}
                                            </div>
                                            <div className="col-span-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${providerColors[src.cloud_provider] ||
                                                        "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                        }`}
                                                >
                                                    {providerShort[src.cloud_provider] || src.cloud_provider}
                                                </span>
                                            </div>
                                            <div className="col-span-3 font-medium text-[var(--text-main)] text-sm">
                                                {src.name}
                                            </div>
                                            <div className="col-span-3 text-[var(--text-subtle)] text-sm truncate">
                                                {src.description || "—"}
                                            </div>
                                            <div className="col-span-1">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${src.is_active
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                        }`}
                                                >
                                                    {src.is_active ? "Active" : "Off"}
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <button
                                                    onClick={() => handleDelete(src.id)}
                                                    disabled={deletingId === src.id || isPending}
                                                    className="px-3 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === src.id ? "..." : "Delete"}
                                                </button>
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
