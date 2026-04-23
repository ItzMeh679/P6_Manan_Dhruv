import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    // Only manage tables defined in the Drizzle schema.
    // Prevents drizzle-kit push from dropping Alembic-managed tables
    // (cloud_connections, log_sources, alembic_version).
    tablesFilter: [
        "user",
        "session",
        "account",
        "verification",
        "organization",
        "member",
        "invitation",
    ],
});
