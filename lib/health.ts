export type ReadinessResult = { status: "ok" } | { status: "unavailable" };

type CancellableDatabaseCheck = Promise<unknown> & { cancel?: () => void };

export const READINESS_TIMEOUT_MS = 3_000;

export async function checkReadiness(
	checkDatabase: () => CancellableDatabaseCheck,
	timeoutMs = READINESS_TIMEOUT_MS,
): Promise<ReadinessResult> {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	try {
		const databaseCheck = checkDatabase();
		await Promise.race([
			databaseCheck,
			new Promise<never>((_, reject) => {
				timeout = setTimeout(() => {
					try {
						void Promise.resolve(databaseCheck.cancel?.()).catch(
							() => undefined,
						);
					} catch {
						// A broken cancellation hook must not prevent a bounded response.
					}
					reject(new Error("Database readiness check timed out."));
				}, timeoutMs);
			}),
		]);
		return { status: "ok" };
	} catch {
		return { status: "unavailable" };
	} finally {
		clearTimeout(timeout);
	}
}
