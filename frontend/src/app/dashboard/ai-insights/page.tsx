import { getAIAlerts, getAIAlertStats, getAIMonitorStatus } from "../../actions";
import AIInsightsClient from "./AIInsightsClient";

export default async function AIInsightsPage() {
    const [initialAlerts, stats, monitorStatus] = await Promise.all([
        getAIAlerts(undefined, undefined, false),
        getAIAlertStats(),
        getAIMonitorStatus(),
    ]);

    return (
        <AIInsightsClient
            initialAlerts={initialAlerts}
            initialStats={stats}
            initialStatus={monitorStatus}
        />
    );
}
