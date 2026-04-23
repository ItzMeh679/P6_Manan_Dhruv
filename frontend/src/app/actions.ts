"use server";

import { pythonApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

// ==========================================
// Log Source Types
// ==========================================

export interface LogSource {
    id: number;
    name: string;
    cloud_provider: string;
    description?: string;
    is_active: boolean;
    owner_id: string;
    created_at: string;
    api_key: string;
    status: string; // "waiting" | "connected" | "inactive"
}

export interface LogSourceStatus {
    id: number;
    status: string;
    name: string;
}

// ==========================================
// Log Search Types
// ==========================================

export interface LogSearchResult {
    total: number;
    page: number;
    size: number;
    logs: Record<string, unknown>[];
}

export interface LogStats {
    total_logs: number;
    logs_by_provider: Record<string, number>;
    logs_by_source: Record<string, number>;
    recent_logs: Record<string, unknown>[];
}

export interface SourceStats {
    source_id: number;
    total_logs: number;
    error_count: number;
    last_15_min_errors: number;
}

// ==========================================
// Log Actions
// ==========================================

export async function searchLogs(
    q?: string,
    cloud_provider?: string,
    source_ip?: string,
    source_id?: number,
    source_ids?: number[],
    page: number = 1,
    size: number = 50,
): Promise<LogSearchResult> {
    try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (cloud_provider) params.set("cloud_provider", cloud_provider);
        if (source_ip) params.set("source_ip", source_ip);
        if (source_id) params.set("source_id", source_id.toString());
        if (source_ids && source_ids.length > 0) params.set("source_ids", source_ids.join(","));
        params.set("page", page.toString());
        params.set("size", size.toString());

        return await pythonApi<LogSearchResult>(`/logs/search?${params.toString()}`, {
            cache: "no-store",
        });
    } catch (e) {
        console.error("Failed to search logs:", e);
        return { total: 0, page: 1, size: 50, logs: [] };
    }
}

export async function getLogStats(): Promise<LogStats> {
    try {
        return await pythonApi<LogStats>("/logs/stats", { cache: "no-store" });
    } catch (e) {
        console.error("Failed to get log stats:", e);
        return { total_logs: 0, logs_by_provider: {}, logs_by_source: {}, recent_logs: [] };
    }
}

export async function getSourceStats(sourceId: number): Promise<SourceStats> {
    try {
        return await pythonApi<SourceStats>(`/logs/stats/${sourceId}`, { cache: "no-store" });
    } catch (e) {
        console.error("Failed to get source stats:", e);
        return { source_id: sourceId, total_logs: 0, error_count: 0, last_15_min_errors: 0 };
    }
}

// ==========================================
// Source Actions
// ==========================================

export async function getSources(): Promise<LogSource[]> {
    try {
        return await pythonApi<LogSource[]>("/sources/", { cache: "no-store" });
    } catch (e) {
        console.error("Failed to fetch sources:", e);
        return [];
    }
}

export async function getSourceStatus(sourceId: number): Promise<LogSourceStatus> {
    try {
        return await pythonApi<LogSourceStatus>(`/sources/${sourceId}/status`, { cache: "no-store" });
    } catch (e) {
        console.error("Failed to get source status:", e);
        return { id: sourceId, status: "unknown", name: "" };
    }
}

export async function createSource(data: {
    name: string;
    cloud_provider: string;
    description?: string;
}): Promise<LogSource> {
    const result = await pythonApi<LogSource>("/sources/", {
        method: "POST",
        body: JSON.stringify(data),
    });

    revalidatePath("/dashboard/sources");
    revalidatePath("/dashboard");
    return result;
}

export async function deleteSource(sourceId: number) {
    await pythonApi(`/sources/${sourceId}`, {
        method: "DELETE",
    });

    revalidatePath("/dashboard/sources");
    revalidatePath("/dashboard");
}


// ==========================================
// Cloud Connection Types
// ==========================================

export interface CloudConnection {
    id: number;
    owner_id: string;
    provider: string; // "azure" | "gcp"
    tenant_id?: string;
    created_at: string;
}

export interface CloudResource {
    id?: string;
    name: string;
    type?: string;
    location?: string;
    subscription_id?: string;
    subscription_name?: string;
    project_id?: string;
    state?: string;
}

// ==========================================
// Cloud Connection Actions
// ==========================================

export async function getCloudConnections(): Promise<CloudConnection[]> {
    try {
        return await pythonApi<CloudConnection[]>("/cloud/connections", { cache: "no-store" });
    } catch (e) {
        console.error("Failed to fetch cloud connections:", e);
        return [];
    }
}

export async function disconnectCloud(connectionId: number) {
    await pythonApi(`/cloud/connections/${connectionId}`, {
        method: "DELETE",
    });

    revalidatePath("/dashboard/sources");
}

export async function getCloudResources(provider: string): Promise<CloudResource[]> {
    try {
        const result = await pythonApi<{ provider: string; resources: CloudResource[] }>(
            `/cloud/${provider}/resources`,
            { cache: "no-store" }
        );
        return result.resources;
    } catch (e) {
        console.error(`Failed to fetch ${provider} resources:`, e);
        return [];
    }
}

export async function deployCloudLogging(
    provider: string,
    params: { subscription_id?: string; resource_uri?: string; project_id?: string }
): Promise<{ status: string; detail?: string }> {
    try {
        return await pythonApi<{ status: string; detail?: string }>(
            `/cloud/${provider}/deploy-logging`,
            {
                method: "POST",
                body: JSON.stringify(params),
            }
        );
    } catch (e) {
        console.error(`Failed to deploy ${provider} logging:`, e);
        return { status: "error", detail: String(e) };
    }
}
