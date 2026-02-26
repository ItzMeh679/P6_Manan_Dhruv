"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import StatsCard from "@/components/StatsCard";
import DotGrid from '@/components/ui/DotGrid';
import { BentoSection, ParticleCard } from '@/components/ui/MagicBento';

interface Item {
    id: number;
    title: string;
    description?: string;
    status?: string;
}

interface DashboardClientProps {
    items: Item[];
    createItemAction: (formData: FormData) => Promise<void>;
}

export default function DashboardClient({ items, createItemAction }: DashboardClientProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const filteredItems = items.filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusBadge = (status?: string) => {
        const s = status?.toLowerCase() || "active";
        const styles: Record<string, string> = {
            active: "bg-green-500/10 text-green-400 border-green-500/20",
            maintenance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            offline: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return styles[s] || styles.active;
    };

    const totalAssets = items.length || 0;
    const activeItems = items.filter((i) => (i.status?.toLowerCase() || "active") === "active").length;
    const operationalPercent = totalAssets > 0 ? Math.round((activeItems / totalAssets) * 100) : 100;
    const maintenanceCount = items.filter((i) => i.status?.toLowerCase() === "maintenance").length;

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
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                            Resources
                        </h1>
                        <p className="text-[var(--text-subtle)] text-sm mt-1">
                            Manage your organization&apos;s inventory.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--code-highlight)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition-colors text-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export
                        </button>
                        <button
                            type="button"
                            onClick={() => document.getElementById("new-resource-form")?.scrollIntoView({ behavior: "smooth" })}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Entry
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>}
                        iconBg="bg-blue-500/10"
                        label="Total Assets"
                        value={totalAssets.toLocaleString()}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                        iconBg="bg-green-500/10"
                        label="Operational"
                        value={`${operationalPercent}%`}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
                        iconBg="bg-yellow-500/10"
                        label="Maintenance"
                        value={maintenanceCount}
                    />
                    <StatsCard
                        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                        iconBg="bg-purple-500/10"
                        label="Deployed Today"
                        value={0}
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* New Resource */}
                    <ParticleCard id="new-resource-form" enableTilt={false} enableMagnetism={false} glowColor="255, 255, 255" className="lg:col-span-2 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]">
                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 rounded-full bg-[var(--badge-bg)] flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">New Resource</h2>
                            </div>
                            <form action={createItemAction} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Title</label>
                                    <input name="title" type="text" placeholder="e.g. Quantum Processor" className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)]" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
                                    <textarea name="description" rows={3} placeholder="Specifications and notes..." className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)] resize-none" />
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-colors">
                                    Deploy Resource
                                </button>
                            </form>
                        </div>
                    </ParticleCard>

                    {/* Table */}
                    <ParticleCard enableTilt={false} enableMagnetism={false} glowColor="255, 255, 255" className="lg:col-span-3 card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]">
                        <div className="relative z-10">
                            <div className="p-5 flex items-center justify-between border-b border-[var(--divider)]">
                                <h2 className="font-semibold text-[var(--text-main)] text-sm">Active Inventory</h2>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="pl-9 pr-4 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-muted)] w-40 focus:outline-none focus:border-[var(--border-light)] placeholder:text-[var(--text-subtle)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                                <div className="col-span-2">ID</div>
                                <div className="col-span-3">Title</div>
                                <div className="col-span-5">Description</div>
                                <div className="col-span-2 text-right">Status</div>
                            </div>

                            <div className="divide-y divide-[var(--divider)]">
                                {paginatedItems.length === 0 ? (
                                    <div className="px-5 py-12 text-center text-[var(--text-subtle)] text-sm">
                                        {items.length === 0 ? "No resources. Create one to get started." : "No matching resources."}
                                    </div>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-[var(--hover-bg)] transition-colors items-center">
                                            <div className="col-span-2 text-[var(--text-subtle)] text-sm font-mono">#{item.id}</div>
                                            <div className="col-span-3 font-medium text-[var(--text-main)] text-sm">{item.title}</div>
                                            <div className="col-span-5 text-[var(--text-subtle)] text-sm truncate">{item.description || "—"}</div>
                                            <div className="col-span-2 flex justify-end">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(item.status)}`}>
                                                    {item.status || "Active"}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {filteredItems.length > 0 && (
                                <div className="px-5 py-3 border-t border-[var(--divider)] flex items-center justify-between">
                                    <p className="text-xs text-[var(--text-subtle)]">
                                        {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                        </button>
                                        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ParticleCard>
                </div>
            </BentoSection>
        </main>
    );
}
