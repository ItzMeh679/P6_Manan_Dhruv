"use client";

import { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ParticleCard } from "@/components/ui/MagicBento";
import {
    getCloudResources,
    deployCloudLogging,
    type CloudConnection,
    type CloudResource,
} from "../../actions";

interface CloudResourcesClientProps {
    connections: CloudConnection[];
}

const providerConfig: Record<string, { label: string; gradient: string; icon: string }> = {
    azure: {
        label: "Microsoft Azure",
        gradient: "from-blue-600 to-blue-400",
        icon: "M14.65 3.65L8.34 14.99h5.27l-.86 5.36 6.31-11.34h-5.27l.86-5.36z",
    },
    gcp: {
        label: "Google Cloud Platform",
        gradient: "from-green-500 to-emerald-400",
        icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    },
};

type DeployStatus = "idle" | "deploying" | "success" | "error";

export default function CloudResourcesClient({ connections }: CloudResourcesClientProps) {
    const { theme } = useTheme();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [resources, setResources] = useState<CloudResource[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deployStatuses, setDeployStatuses] = useState<Record<string, DeployStatus>>({});

    // Set the first connected provider as default tab
    useEffect(() => {
        if (connections.length > 0 && !activeTab) {
            setActiveTab(connections[0].provider);
        }
    }, [connections, activeTab]);

    // Fetch resources when tab changes
    const fetchResources = (provider: string) => {
        setLoading(true);
        setResources([]);
        setError(null);
        getCloudResources(provider)
            .then((res) => {
                setResources(res);
                if (res.length === 0) {
                    console.log(`[CloudResources] No resources returned for ${provider}`);
                }
            })
            .catch((err) => {
                console.error(`[CloudResources] Fetch failed for ${provider}:`, err);
                setError(String(err?.message || err || "Failed to load resources"));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!activeTab) return;
        fetchResources(activeTab);
    }, [activeTab]);

    const handleDeploy = (resource: CloudResource) => {
        const key = resource.id || resource.project_id || resource.name;
        if (!key || !activeTab) return;

        setDeployStatuses((prev) => ({ ...prev, [key]: "deploying" }));

        startTransition(async () => {
            let params: { subscription_id?: string; resource_uri?: string; project_id?: string } = {};

            if (activeTab === "azure") {
                params = {
                    subscription_id: resource.subscription_id || "",
                    resource_uri: resource.id || "",
                };
            } else if (activeTab === "gcp") {
                params = { project_id: resource.project_id || "" };
            }

            const result = await deployCloudLogging(activeTab, params);
            setDeployStatuses((prev) => ({
                ...prev,
                [key]: result.status === "success" ? "success" : "error",
            }));
        });
    };

    if (connections.length === 0) return null;

    return (
        <ParticleCard
            enableTilt={false}
            enableMagnetism={false}
            glowColor="255, 255, 255"
            className="card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)] mt-6"
        >
            <div className="relative z-10">
                {/* Header */}
                <div className="p-5 border-b border-[var(--divider)]">
                    <h2 className="font-semibold text-[var(--text-main)] text-sm flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Cloud Resources
                        <span className="text-[var(--text-subtle)] font-normal text-xs">
                            — Click &quot;Connect to SIEM&quot; to deploy log forwarding
                        </span>
                    </h2>
                </div>

                {/* Provider Tabs */}
                <div className="flex border-b border-[var(--divider)]">
                    {connections.map((conn) => {
                        const config = providerConfig[conn.provider];
                        const isActive = activeTab === conn.provider;
                        return (
                            <button
                                key={conn.id}
                                onClick={() => setActiveTab(conn.provider)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${isActive
                                    ? "border-blue-500 text-[var(--text-main)]"
                                    : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
                                    }`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity={isActive ? 1 : 0.5}>
                                    <path d={config?.icon || ""} />
                                </svg>
                                {config?.label || conn.provider}
                            </button>
                        );
                    })}
                </div>

                {/* Resource Table */}
                <div className="min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-sm text-[var(--text-subtle)]">Discovering resources...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <p className="text-sm text-red-400 mb-1">Failed to load resources</p>
                                <p className="text-xs text-[var(--text-subtle)] mb-3 max-w-md">{error}</p>
                                <button
                                    onClick={() => activeTab && fetchResources(activeTab)}
                                    className="px-4 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <p className="text-sm text-[var(--text-subtle)] mb-1">No resources found</p>
                                <p className="text-xs text-[var(--text-subtle)]">
                                    Make sure the connected account has access to resources.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            {activeTab === "azure" ? (
                                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                                    <div className="col-span-3">Name</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Location</div>
                                    <div className="col-span-3">Subscription</div>
                                    <div className="col-span-2 text-right">Action</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider border-b border-[var(--divider)]">
                                    <div className="col-span-4">Project Name</div>
                                    <div className="col-span-3">Project ID</div>
                                    <div className="col-span-3">State</div>
                                    <div className="col-span-2 text-right">Action</div>
                                </div>
                            )}

                            {/* Table Rows */}
                            <div className="divide-y divide-[var(--divider)]">
                                {resources.map((resource, idx) => {
                                    const key = resource.id || resource.project_id || resource.name;
                                    const status = deployStatuses[key || idx] || "idle";

                                    return activeTab === "azure" ? (
                                        <div
                                            key={key || idx}
                                            className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors items-center"
                                        >
                                            <div className="col-span-3 font-medium text-[var(--text-main)] text-sm truncate" title={resource.name}>
                                                {resource.name}
                                            </div>
                                            <div className="col-span-2 text-xs text-[var(--text-subtle)] truncate" title={resource.type}>
                                                {resource.type?.split("/").pop() || resource.type}
                                            </div>
                                            <div className="col-span-2 text-xs text-[var(--text-subtle)]">
                                                {resource.location}
                                            </div>
                                            <div className="col-span-3 text-xs text-[var(--text-subtle)] truncate" title={resource.subscription_name}>
                                                {resource.subscription_name}
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <DeployButton status={status} onClick={() => handleDeploy(resource)} isPending={isPending} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            key={key || idx}
                                            className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors items-center"
                                        >
                                            <div className="col-span-4 font-medium text-[var(--text-main)] text-sm">
                                                {resource.name}
                                            </div>
                                            <div className="col-span-3 text-xs text-[var(--text-subtle)] font-mono">
                                                {resource.project_id}
                                            </div>
                                            <div className="col-span-3">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    {resource.state}
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <DeployButton status={status} onClick={() => handleDeploy(resource)} isPending={isPending} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ParticleCard>
    );
}


// ==========================================
// Deploy Button Sub-Component
// ==========================================
function DeployButton({
    status,
    onClick,
    isPending,
}: {
    status: DeployStatus;
    onClick: () => void;
    isPending: boolean;
}) {
    if (status === "success") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                Connected
            </span>
        );
    }

    if (status === "error") {
        return (
            <button
                onClick={onClick}
                className="px-3 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors"
            >
                Retry
            </button>
        );
    }

    if (status === "deploying") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
                <div className="w-3 h-3 border border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                Deploying...
            </span>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
            Connect to SIEM
        </button>
    );
}
