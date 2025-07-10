import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create postgres client with Supabase-compatible settings
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DATABASE_URL, {
	prepare: false,
	// Increased connection pool settings for better performance
	max: 25, // Increased from 10 to handle concurrent dashboard queries
	idle_timeout: 20, // Close idle connections after 20 seconds
	max_lifetime: 60 * 30, // Close connections after 30 minutes
	connection: {
		application_name: "sedekahje_app", // For monitoring/debugging
	},
});

export const db = drizzle(client, { schema });
