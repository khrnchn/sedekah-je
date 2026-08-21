import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Returns a lazy singleton pg Pool for the Umami analytics database.
 * Returns `null` when `UMAMI_DATABASE_URL` is not set (e.g. local dev).
 */
export function getUmamiPool(): Pool | null {
	const url = process.env.UMAMI_DATABASE_URL;
	if (!url) return null;

	if (!pool) {
		pool = new Pool({
			connectionString: url,
			max: 3,
			idleTimeoutMillis: 30_000,
			connectionTimeoutMillis: 30_000,
		});
	}

	return pool;
}
