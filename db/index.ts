import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create postgres client with Supabase-compatible settings
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DATABASE_URL, {
	prepare: false,
	// Additional settings for better performance and compatibility
	max: 10,
});

export const db = drizzle(client, { schema });
