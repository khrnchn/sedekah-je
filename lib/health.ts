export type ReadinessResult = { status: "ok" } | { status: "unavailable" };

export async function checkReadiness(
	checkDatabase: () => Promise<unknown>,
): Promise<ReadinessResult> {
	try {
		await checkDatabase();
		return { status: "ok" };
	} catch {
		return { status: "unavailable" };
	}
}
