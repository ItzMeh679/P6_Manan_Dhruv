import { getLogStats, getSources } from "../actions";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
    const [stats, sources] = await Promise.all([getLogStats(), getSources()]);

    return (
        <DashboardClient
            stats={stats}
            sources={sources}
        />
    );
}
