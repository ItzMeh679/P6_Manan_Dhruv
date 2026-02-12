import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <DashboardLayoutClient
            userName={session.user.name || "User"}
            userEmail={session.user.email}
            userImage={session.user.image}
            organizationId={session.session.activeOrganizationId}
        >
            {children}
        </DashboardLayoutClient>
    );
}
