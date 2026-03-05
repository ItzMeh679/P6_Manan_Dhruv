import { searchLogs, getSources } from "../../actions";
import LogExplorerClient from "./LogExplorerClient";

export default async function LogExplorerPage() {
    const [initialLogs, sources] = await Promise.all([
        searchLogs(),
        getSources(),
    ]);

    return <LogExplorerClient initialData={initialLogs} sources={sources} />;
}
