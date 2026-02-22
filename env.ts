import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Database
		DATABASE_URL: z.string().url().min(1),
		// Optional: Direct URL for migrations (bypasses connection pooling)
		DIRECT_URL: z.string().url().optional(),

		// Supabase (optional, for additional integrations)
		SUPABASE_URL: z.string().url().optional(),
		SUPABASE_ANON_KEY: z.string().optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

		// MailerSend (optional, for institution approval emails)
		MAILERSEND_API_KEY: z.string().min(1).optional(),
		MAILERSEND_FROM_EMAIL: z.string().email().optional(),
		MAILERSEND_FROM_NAME: z.string().optional(),
		MAILERSEND_APPROVAL_TEMPLATE_ID: z.string().min(1).optional(),

		// Cloudflare R2 Storage
		R2_ENDPOINT: z.string().url(),
		R2_ACCESS_KEY_ID: z.string(),
		R2_SECRET_ACCESS_KEY: z.string(),
		R2_BUCKET_NAME: z.string(),
		R2_PUBLIC_URL: z.string().url(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "NEXT_PUBLIC_",

	client: {
		// Supabase public configuration
		NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: process.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
