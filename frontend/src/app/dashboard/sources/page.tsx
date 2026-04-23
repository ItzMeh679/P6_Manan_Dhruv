import { Suspense } from "react";
import { getSources, getCloudConnections } from "../../actions";
import SourcesClient from "./SourcesClient";
import CloudResourcesClient from "./CloudResourcesClient";

// Always fetch fresh data — never serve stale cached connections
export const dynamic = "force-dynamic";

export default async function SourcesPage() {
    const [sources, connections] = await Promise.all([
        getSources(),
        getCloudConnections(),
    ]);

    return (
        <Suspense>
            <SourcesClient sources={sources} connections={connections}>
                <div className="relative z-10 px-6 lg:px-8 -mt-4 pb-8">
                    <CloudResourcesClient connections={connections} />
                </div>
            </SourcesClient>
        </Suspense>
    );
}
