import { type NextRequest, NextResponse } from "next/server";
import type { Doa } from "../types";

const GETDOA_API_BASE = "https://getdoa.com/api";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const category = url.searchParams.get("category") || undefined;
	const count = url.searchParams.get("count") || undefined;

	const apiUrl = new URL(`${GETDOA_API_BASE}/doa/random`);
	if (category) {
		apiUrl.searchParams.set("category", category);
	}
	if (count) {
		apiUrl.searchParams.set("count", count);
	}

	const response = await fetch(apiUrl.toString(), {
		cache: "no-store",
	});

	if (!response.ok) {
		console.error("Failed to fetch GetDoa API", response);
		return NextResponse.json(
			{ error: "Failed to fetch GetDoa API" },
			{ status: 500 },
		);
	}

	const json = await response.json();

	return NextResponse.json(json);
}
