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
    recent_logs: Record<string, unknown>[];
}

// ==========================================
// Log Actions
// ==========================================

export async function searchLogs(
    q?: string,
    cloud_provider?: string,
    source_ip?: string,
    page: number = 1,
    size: number = 50,
): Promise<LogSearchResult> {
    try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (cloud_provider) params.set("cloud_provider", cloud_provider);
        if (source_ip) params.set("source_ip", source_ip);
        params.set("page", page.toString());
        params.set("size", size.toString());

        return await pythonApi<LogSearchResult>(`/logs/search?${params.toString()}`);
    } catch (e) {
        console.error("Failed to search logs:", e);
        return { total: 0, page: 1, size: 50, logs: [] };
    }
}

export async function getLogStats(): Promise<LogStats> {
    try {
        return await pythonApi<LogStats>("/logs/stats");
    } catch (e) {
        console.error("Failed to get log stats:", e);
        return { total_logs: 0, logs_by_provider: {}, recent_logs: [] };
    }
}

// ==========================================
// Source Actions
// ==========================================

export async function getSources(): Promise<LogSource[]> {
    try {
        return await pythonApi<LogSource[]>("/sources/");
    } catch (e) {
        console.error("Failed to fetch sources:", e);
        return [];
    }
}

export async function createSource(formData: FormData) {
    const name = formData.get("name") as string;
    const cloud_provider = formData.get("cloud_provider") as string;
    const description = formData.get("description") as string;

    await pythonApi("/sources/", {
        method: "POST",
        body: JSON.stringify({ name, cloud_provider, description }),
    });

    revalidatePath("/dashboard/sources");
}

export async function deleteSource(sourceId: number) {
    await pythonApi(`/sources/${sourceId}`, {
        method: "DELETE",
    });

    revalidatePath("/dashboard/sources");
}
