"use client";

import { useState } from "react";
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

    const getActivePage = () => {
        if (pathname === "/dashboard") return "dashboard";
        const segments = pathname.split("/").filter(Boolean);
        return segments[1] || "dashboard";
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/sign-in");
    };

    return (
        <div className="h-screen flex overflow-hidden bg-[var(--background)] transition-colors duration-300">
            <Sidebar
                activePage={getActivePage()}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-56"}`}>
                <TopNav
                    userName={userName}
                    userEmail={userEmail}
                    userImage={userImage}
                    organizationName={organizationId || "Personal Workspace"}
                    onSignOut={handleSignOut}
                />
                <div className="flex-1 overflow-auto flex flex-col min-h-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
