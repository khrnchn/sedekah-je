import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({ ok: true, service: "meta-deauthorize" });
}

export async function POST() {
	return NextResponse.json({ success: true });
}
