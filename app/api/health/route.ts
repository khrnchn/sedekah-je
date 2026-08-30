import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkReadiness } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
	const result = await checkReadiness(() => db.execute(sql`select 1`));

	return NextResponse.json(result, {
		status: result.status === "ok" ? 200 : 503,
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
