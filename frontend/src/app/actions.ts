"use server";

import { pythonApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

// Generic Item Type (Matches Python Schema)
export interface Item {
    id: number;
    title: string;
    description?: string;
    is_active: boolean;
    owner_id: string;
    created_at: string;
}

/**
 * Fetch all items for the current user from Python backend
 */
export async function getItems(): Promise<Item[]> {
    try {
        return await pythonApi<Item[]>("/items/");
    } catch (e) {
        console.error("Failed to fetch items:", e);
        return [];
    }
}

/**
 * Create a new item via Python backend
 */
export async function createItem(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    await pythonApi("/items/", {
        method: "POST",
        body: JSON.stringify({ title, description }),
    });

    revalidatePath("/"); // Refresh the UI
}
