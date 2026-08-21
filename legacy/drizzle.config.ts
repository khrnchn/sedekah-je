import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
	dialect: "postgresql",
	schema: "./db/schema.ts",
	out: "./db/migrations",
	dbCredentials: {
		// Use DIRECT_URL if available (bypasses pooling for migrations)
		// Otherwise fall back to DATABASE_URL
		url: env.DIRECT_URL ?? env.DATABASE_URL,
	},
	// Enable verbose output for better debugging
	verbose: true,
	// Ensure migrations are safe
	strict: true,
});
