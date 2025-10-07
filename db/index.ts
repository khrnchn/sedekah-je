import { env } from "@/env";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { cache } from "react";
import * as schema from "./schema";

// Create a new database client per request (Cloudflare Workers compatible)
// Using React cache() to deduplicate within a single request
// Using @neondatabase/serverless which is optimized for edge environments
export const getDb = cache(() => {
	const pool = new Pool({ connectionString: env.DATABASE_URL });
	return drizzle(pool, { schema });
});

// For backwards compatibility and convenience
// This creates a new client per request via getDb()
export const db = getDb();
