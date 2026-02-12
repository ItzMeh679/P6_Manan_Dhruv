"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { authClient } from "@/lib/auth-client";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    userName: string;
    userEmail?: string;
    userImage?: string | null;
    organizationId?: string | null;
}

export default function DashboardLayoutClient({
    children,
    userName,
    userEmail,
    userImage,
    organizationId,
}: DashboardLayoutClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Determine active page from pathname
    const getActivePage = () => {
        if (pathname === "/dashboard") return "dashboard";
        // Extract the first segment after /dashboard/
        const segments = pathname.split("/").filter(Boolean);
        return segments[1] || "dashboard";
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/sign-in");
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            {/* Sidebar */}
            <Sidebar
                activePage={getActivePage()}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Content Wrapper */}
            <div className={`transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-56"}`}>
                {/* Top Navigation */}
                <TopNav
                    userName={userName}
                    userEmail={userEmail}
                    userImage={userImage}
                    organizationName={organizationId || "Personal Workspace"}
                    onSignOut={handleSignOut}
                />

                {/* Page Content */}
                {children}
            </div>
        </div>
    );
}
