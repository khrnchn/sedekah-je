import { type NextRequest, NextResponse } from "next/server";
import type { Doa, PaginatedDoaResponse } from "./types";

const GETDOA_API_BASE = "https://getdoa.com/api";

export async function GET(request: NextRequest) {
	const { pathname } = new URL(request.url);
	const url = new URL(request.url);

	if (pathname.endsWith("/api/getdoa")) {
		return handleDoaList(request);
	}

	if (pathname.endsWith("/api/getdoa/random")) {
		return handleRandomDoa(request);
	}

	return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleDoaList(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const page = url.searchParams.get("page") || "1";
	const limit = url.searchParams.get("limit") || "10";
	const search = url.searchParams.get("search") || undefined;

	const apiUrl = new URL(`${GETDOA_API_BASE}/doa`);
	apiUrl.searchParams.set("page", page);
	apiUrl.searchParams.set("limit", limit);
	if (search) {
		apiUrl.searchParams.set("search", search);
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

	const json = (await response.json()) as PaginatedDoaResponse;

	return NextResponse.json(json);
}

async function handleRandomDoa(request: NextRequest): Promise<NextResponse> {
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
