"use client";

import { useState } from "react";
import StatsCard from "@/components/StatsCard";

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

export default function DashboardClient({
    items,
    createItemAction,
}: DashboardClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Filter items based on search
    const filteredItems = items.filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Get status badge styling
    const getStatusBadge = (status?: string) => {
        const statusLower = status?.toLowerCase() || "active";
        const styles: Record<string, string> = {
            active: "bg-green-100 text-green-700",
            maintenance: "bg-yellow-100 text-yellow-700",
            offline: "bg-red-100 text-red-700",
        };
        return styles[statusLower] || styles.active;
    };

    // Calculate stats
    const totalAssets = items.length || 0;
    const activeItems = items.filter((i) => (i.status?.toLowerCase() || "active") === "active").length;
    const operationalPercent = totalAssets > 0 ? Math.round((activeItems / totalAssets) * 100) : 100;
    const maintenanceCount = items.filter((i) => i.status?.toLowerCase() === "maintenance").length;

    return (
        <main className="p-8">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Resource Management
                    </h1>
                    <p className="text-gray-500">
                        Create, track, and manage your organization's inventory assets.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                    </button>
                    <button
                        type="button"
                        onClick={() => document.getElementById("new-resource-form")?.scrollIntoView({ behavior: "smooth" })}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Entry
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                {/* New Resource Card */}
                <div
                    id="new-resource-form"
                    className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                        <h2 className="font-semibold text-gray-900">New Resource</h2>
                    </div>

                    <form action={createItemAction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Resource Title
                            </label>
                            <input
                                name="title"
                                type="text"
                                placeholder="e.g. Quantum Processor Unit"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Category
                                </label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none">
                                    <option>Hardware</option>
                                    <option>Software</option>
                                    <option>Service</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    defaultValue={0}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Enter technical specifications and usage notes..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Deploy Resource
                        </button>
                    </form>
                </div>

                {/* Active Inventory Table */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
                    <div className="p-6 flex items-center justify-between border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Active Inventory</h2>
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                                placeholder="Search resources..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <div className="col-span-2">ID</div>
                        <div className="col-span-3">Title</div>
                        <div className="col-span-5">Description</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {paginatedItems.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                {items.length === 0
                                    ? "No resources found. Create one to get started!"
                                    : "No matching resources found."}
                            </div>
                        ) : (
                            paginatedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                                >
                                    <div className="col-span-2 text-gray-500 text-sm">
                                        #{item.id}
                                    </div>
                                    <div className="col-span-3 font-medium text-gray-900 text-sm">
                                        {item.title}
                                    </div>
                                    <div className="col-span-5 text-gray-500 text-sm truncate">
                                        {item.description || "-"}
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                                item.status
                                            )}`}
                                        >
                                            {item.status || "Active"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {filteredItems.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-
                                {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
                                {filteredItems.length} resources
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    icon={
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    }
                    iconBg="bg-blue-100"
                    label="Total Assets"
                    value={totalAssets.toLocaleString()}
                />
                <StatsCard
                    icon={
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    }
                    iconBg="bg-green-100"
                    label="Operational"
                    value={`${operationalPercent}%`}
                />
                <StatsCard
                    icon={
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                    }
                    iconBg="bg-yellow-100"
                    label="Maintenance"
                    value={maintenanceCount}
                />
                <StatsCard
                    icon={
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    }
                    iconBg="bg-purple-100"
                    label="Deployed Today"
                    value={0}
                />
            </div>
        </main>
    );
}
