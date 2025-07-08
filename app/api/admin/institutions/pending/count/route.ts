import { getPendingInstitutionsCount } from "@/app/(admin)/admin/institutions/_lib/queries";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const count = await getPendingInstitutionsCount();
		return NextResponse.json({ count });
	} catch (error) {
		console.error("Error fetching pending institutions count:", error);
		return NextResponse.json({ count: 0 }, { status: 500 });
	}
}
