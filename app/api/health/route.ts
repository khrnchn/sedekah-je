import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/db";
import { checkReadiness } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
	const result = await checkReadiness(checkDatabaseConnection);

	return NextResponse.json(result, {
		status: result.status === "ok" ? 200 : 503,
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
