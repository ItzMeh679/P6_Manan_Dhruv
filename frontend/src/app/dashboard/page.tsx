import { getItems, createItem } from "../actions";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
    // Fetch data from Python backend
    const items = await getItems();

    return (
        <DashboardClient
            items={items}
            createItemAction={createItem}
        />
    );
}
