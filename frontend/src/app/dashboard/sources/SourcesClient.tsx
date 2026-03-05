"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import DotGrid from "@/components/ui/DotGrid";
import { BentoSection, ParticleCard } from "@/components/ui/MagicBento";
import {
    createSource,
    deleteSource,
    getSourceStatus,
    type LogSource,
} from "../../actions";

interface SourcesClientProps {
    sources: LogSource[];
}

// ==========================================
// Environment options with icons
// ==========================================
const ENVIRONMENTS = [
    { id: "aws", label: "AWS", color: "orange" },
    { id: "azure", label: "Azure", color: "blue" },
    { id: "gcp", label: "GCP", color: "green" },
    { id: "python", label: "Python", color: "yellow" },
    { id: "nodejs", label: "Node.js", color: "emerald" },
    { id: "docker", label: "Docker", color: "cyan" },
    { id: "curl", label: "cURL", color: "purple" },
] as const;

const providerColors: Record<string, string> = {
    aws: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    azure: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    gcp: "bg-green-500/10 text-green-400 border-green-500/20",
    python: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    nodejs: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    docker: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    curl: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const statusColors: Record<string, string> = {
    waiting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    connected: "bg-green-500/10 text-green-400 border-green-500/20",
    inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
    waiting: "Waiting",
    connected: "Connected",
    inactive: "Inactive",
};

// ==========================================
// Code snippet generators
// ==========================================
function getSnippets(apiKey: string, backendUrl: string, provider: string) {
    const snippets: Record<string, { label: string; language: string; code: string }[]> = {
        python: [
            {
                label: "Python (requests)",
                language: "python",
                code: `import requests, json
from datetime import datetime

API_KEY = "${apiKey}"
URL = "${backendUrl}/api/py/ingest/generic"

log = {
    "timestamp": datetime.utcnow().isoformat(),
    "message": "User login successful",
    "level": "info",
    "source_ip": "192.168.1.100",
    "status": "200"
}

resp = requests.post(URL,
    json={"logs": [log]},
    headers={"X-API-Key": API_KEY, "Content-Type": "application/json"}
)
print(resp.json())`,
            },
        ],
        nodejs: [
            {
                label: "Node.js (fetch)",
                language: "javascript",
                code: `const API_KEY = "${apiKey}";
const URL = "${backendUrl}/api/py/ingest/generic";

const log = {
  timestamp: new Date().toISOString(),
  message: "Request processed",
  level: "info",
  source_ip: "10.0.0.1",
  status: "200"
};

fetch(URL, {
  method: "POST",
  headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ logs: [log] })
})
.then(r => r.json())
.then(console.log);`,
            },
        ],
        docker: [
            {
                label: "Docker / Shell",
                language: "bash",
                code: `curl -X POST ${backendUrl}/api/py/ingest/generic \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"logs": [{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "message": "Container started", "level": "info", "status": "200"}]}'`,
            },
        ],
        curl: [
            {
                label: "cURL",
                language: "bash",
                code: `curl -X POST ${backendUrl}/api/py/ingest/generic \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"logs": [{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "message": "Health check OK", "level": "info", "status": "200"}]}'`,
            },
        ],
        aws: [
            {
                label: "Filebeat / Shell",
                language: "bash",
                code: `curl -X POST ${backendUrl}/api/py/ingest/aws \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"logs": ["192.168.1.1 - - [05/Mar/2026:10:00:00 +0000] \\"GET /api/health HTTP/1.1\\" 200 45"]}'`,
            },
        ],
        azure: [
            {
                label: "Azure Webhook",
                language: "bash",
                code: `curl -X POST ${backendUrl}/api/py/ingest/azure \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"records": [{"time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "callerIpAddress": "10.0.0.5", "operationName": "Microsoft.Web/sites/Read", "resultType": "Success"}]}'`,
            },
        ],
        gcp: [
            {
                label: "GCP Pub/Sub Sink",
                language: "bash",
                code: `curl -X POST ${backendUrl}/api/py/ingest/gcp \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": {"data": "'$(echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","protoPayload":{"methodName":"storage.objects.get","requestMetadata":{"callerIp":"35.220.1.1"},"status":"ok"}}' | base64)'"}}'`,
            },
        ],
    };
    return snippets[provider] || snippets.curl;
}

// ==========================================
// Main Component
// ==========================================
export default function SourcesClient({ sources }: SourcesClientProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [sourceName, setSourceName] = useState("");
    const [sourceDescription, setSourceDescription] = useState("");
    const [createdSource, setCreatedSource] = useState<LogSource | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [copied, setCopied] = useState(false);

    // Poll for connection status
    useEffect(() => {
        if (wizardStep !== 4 || !createdSource || isConnected) return;

        const interval = setInterval(async () => {
            try {
                const status = await getSourceStatus(createdSource.id);
                if (status.status === "connected") {
                    setIsConnected(true);
                    clearInterval(interval);
                }
            } catch { }
        }, 3000);

        return () => clearInterval(interval);
    }, [wizardStep, createdSource, isConnected]);

    const resetWizard = () => {
        setWizardOpen(false);
        setWizardStep(1);
        setSelectedProvider(null);
        setSourceName("");
        setSourceDescription("");
        setCreatedSource(null);
        setIsConnected(false);
        setCopied(false);
    };

    const handleCreate = () => {
        if (!selectedProvider || !sourceName.trim()) return;
        startTransition(async () => {
            try {
                const result = await createSource({
                    name: sourceName.trim(),
                    cloud_provider: selectedProvider,
                    description: sourceDescription.trim() || undefined,
                });
                setCreatedSource(result);
                setWizardStep(3);
            } catch (e) {
                console.error("Failed to create source:", e);
            }
        });
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        startTransition(async () => {
            await deleteSource(id);
            setDeletingId(null);
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const backendUrl = typeof window !== "undefined" ? window.location.origin : "https://your-backend-url";

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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-main)] font-[family-name:var(--font-space-grotesk)]">
                            Log Sources
                        </h1>
                        <p className="text-[var(--text-subtle)] text-sm mt-1">
                            Connect your applications and cloud services. Each source gets a unique API key.
                        </p>
                    </div>
                    <button
                        onClick={() => { resetWizard(); setWizardOpen(true); }}
                        className="px-5 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Source
                    </button>
                </div>

                {/* ========== WIZARD MODAL ========== */}
                {wizardOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-[var(--card-bg)] border border-[var(--divider)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            {/* Wizard Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[var(--divider)]">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--text-main)]">
                                        {wizardStep === 1 && "Select Environment"}
                                        {wizardStep === 2 && "Name Your Source"}
                                        {wizardStep === 3 && "Integration Setup"}
                                        {wizardStep === 4 && (isConnected ? "Connected!" : "Listening...")}
                                    </h2>
                                    <p className="text-[var(--text-subtle)] text-xs mt-0.5">
                                        Step {Math.min(wizardStep, 4)} of 4
                                    </p>
                                </div>
                                <button onClick={resetWizard} className="text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors p-1">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Step Progress */}
                            <div className="px-6 pt-4">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1 flex-1 rounded-full transition-colors ${step <= wizardStep ? "bg-blue-500" : "bg-[var(--divider)]"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* ---- STEP 1: Select environment ---- */}
                                {wizardStep === 1 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {ENVIRONMENTS.map((env) => (
                                            <button
                                                key={env.id}
                                                onClick={() => {
                                                    setSelectedProvider(env.id);
                                                    setWizardStep(2);
                                                }}
                                                className={`p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] ${selectedProvider === env.id
                                                    ? `${providerColors[env.id]} border-current`
                                                    : "border-[var(--divider)] hover:border-[var(--border-light)] bg-[var(--surface)]"
                                                    }`}
                                            >
                                                <span className="text-sm font-semibold text-[var(--text-main)]">{env.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ---- STEP 2: Name the source ---- */}
                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${providerColors[selectedProvider!]}`}>
                                                {ENVIRONMENTS.find((e) => e.id === selectedProvider)?.label}
                                            </span>
                                            <button
                                                onClick={() => setWizardStep(1)}
                                                className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] underline"
                                            >
                                                Change
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                                Source Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Production Billing Service"
                                                value={sourceName}
                                                onChange={(e) => setSourceName(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)]"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                                Description <span className="text-[var(--text-subtle)]">(optional)</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="What does this source do?"
                                                value={sourceDescription}
                                                onChange={(e) => setSourceDescription(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--border-light)] resize-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            disabled={!sourceName.trim() || isPending}
                                            className="w-full py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
                                        >
                                            {isPending ? "Creating..." : "Create Source"}
                                        </button>
                                    </div>
                                )}

                                {/* ---- STEP 3: Integration snippets ---- */}
                                {wizardStep === 3 && createdSource && (
                                    <div className="space-y-4">
                                        {/* API Key display */}
                                        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-[var(--text-muted)]">Your API Key</span>
                                                <button
                                                    onClick={() => handleCopy(createdSource.api_key)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    {copied ? "✓ Copied!" : "Copy"}
                                                </button>
                                            </div>
                                            <code className="text-sm font-mono text-[var(--text-main)] bg-[var(--input-bg)] px-3 py-2 rounded-lg block break-all select-all">
                                                {createdSource.api_key}
                                            </code>
                                        </div>

                                        {/* Code snippets */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">Quick Start Code</h3>
                                            {getSnippets(createdSource.api_key, backendUrl, createdSource.cloud_provider).map(
                                                (snippet, i) => (
                                                    <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden mb-3">
                                                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
                                                            <span className="text-xs font-semibold text-[var(--text-muted)]">{snippet.label}</span>
                                                            <button
                                                                onClick={() => handleCopy(snippet.code)}
                                                                className="text-[11px] text-blue-400 hover:text-blue-300"
                                                            >
                                                                Copy
                                                            </button>
                                                        </div>
                                                        <pre className="p-4 text-xs font-mono text-[var(--text-main)] bg-[var(--input-bg)] overflow-x-auto leading-relaxed">
                                                            <code>{snippet.code}</code>
                                                        </pre>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setWizardStep(4)}
                                            className="w-full py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] rounded-lg font-medium text-sm hover:opacity-90 transition-colors"
                                        >
                                            I{"'"}ve deployed the code — Listen for logs
                                        </button>
                                    </div>
                                )}

                                {/* ---- STEP 4: Listening / Connected ---- */}
                                {wizardStep === 4 && (
                                    <div className="text-center py-8">
                                        {!isConnected ? (
                                            <>
                                                {/* Pulsing radar animation */}
                                                <div className="relative mx-auto w-24 h-24 mb-6">
                                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                                    <div className="absolute inset-2 rounded-full bg-blue-500/30 animate-ping" style={{ animationDelay: "0.5s" }} />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/40 flex items-center justify-center">
                                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">
                                                    Listening for incoming logs...
                                                </h3>
                                                <p className="text-sm text-[var(--text-subtle)] max-w-md mx-auto">
                                                    Deploy your code with the API key above and we{"'"}ll automatically detect data arriving.
                                                </p>
                                                <button
                                                    onClick={resetWizard}
                                                    className="mt-6 text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] underline"
                                                >
                                                    Skip — I{"'"}ll connect later
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Success state */}
                                                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-green-400 mb-2">Connection Established!</h3>
                                                <p className="text-sm text-[var(--text-subtle)] mb-6">
                                                    First log received from <strong className="text-[var(--text-main)]">{createdSource?.name}</strong>.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        resetWizard();
                                                        router.push(`/dashboard/logs?source_id=${createdSource?.id}`);
                                                    }}
                                                    className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition-colors"
                                                >
                                                    View Logs →
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== SOURCE LIST ========== */}
                <ParticleCard
                    enableTilt={false}
                    enableMagnetism={false}
                    glowColor="255, 255, 255"
                    className="card--border-glow bg-[var(--card-bg)] backdrop-blur-[20px] rounded-xl border border-[var(--divider)]"
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
                            <div className="col-span-2">Type</div>
                            <div className="col-span-3">Name</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">API Key</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-[var(--divider)]">
                            {sources.length === 0 ? (
                                <div className="px-5 py-12 text-center text-[var(--text-subtle)] text-sm">
                                    No sources registered yet. Click <strong>Add Source</strong> to get started.
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
                                                {src.cloud_provider}
                                            </span>
                                        </div>
                                        <div className="col-span-3 font-medium text-[var(--text-main)] text-sm">
                                            {src.name}
                                        </div>
                                        <div className="col-span-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[src.status] || statusColors.inactive
                                                    }`}
                                            >
                                                {statusLabels[src.status] || src.status}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-[11px] text-[var(--text-subtle)] font-mono truncate" title={src.api_key}>
                                            {src.api_key.slice(0, 12)}...
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
            </BentoSection>
        </main>
    );
}
