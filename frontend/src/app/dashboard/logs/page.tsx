import { searchLogs } from "../../actions";
import LogExplorerClient from "./LogExplorerClient";

export default async function LogExplorerPage() {
    const initialLogs = await searchLogs();

    return <LogExplorerClient initialData={initialLogs} />;
}
