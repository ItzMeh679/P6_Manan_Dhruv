import { getSources } from "../../actions";
import SourcesClient from "./SourcesClient";

export default async function SourcesPage() {
    const sources = await getSources();

    return <SourcesClient sources={sources} />;
}
