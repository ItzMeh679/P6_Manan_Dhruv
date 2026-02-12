import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Universal API Client for Python Backend (BFF Pattern)
 * 
 * This utility runs on the Next.js Server. It grabs the user's session
 * and forwards the request to Python with the necessary security headers.
 */
export async function pythonApi<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    // 1. Get the current session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized: No session found");
    }

    // 2. Prepare Headers
    const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User-ID": session.user.id, // Mandatory for Python Middleware
        "X-Internal-Api-Key": process.env.INTERNAL_API_KEY || "", // Secure Shared Secret
        ...options.headers,
    };

    // 3. Inject Organization ID if it exists (For Phase 5 Multi-Tenancy)
    if (session.session.activeOrganizationId) {
        reqHeaders["X-Org-ID"] = session.session.activeOrganizationId;
    }

    // 4. Make the request to the internal Python container
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: reqHeaders,
    });

    // 5. Handle Errors
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Backend Error (${res.status}): ${errorText}`);
    }

    // 6. Return typed data
    return res.json() as Promise<T>;
}
