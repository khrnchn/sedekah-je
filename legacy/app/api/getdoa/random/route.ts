import { type NextRequest, NextResponse } from "next/server";

const GETDOA_API_BASE = "https://getdoa.com/api";

function transformDoaResponse(apiData: {
	nameMy?: string;
	nameEn?: string;
	content?: string;
	referenceMy?: string;
	referenceEn?: string;
	meaningMy?: string;
	meaningEn?: string;
	categoryNames?: string[];
}) {
	return {
		name_my: apiData.nameMy ?? "",
		name_en: apiData.nameEn ?? "",
		content: apiData.content ?? "",
		reference_my: apiData.referenceMy ?? "",
		reference_en: apiData.referenceEn ?? "",
		meaning_my: apiData.meaningMy ?? "",
		meaning_en: apiData.meaningEn ?? "",
		category_names: apiData.categoryNames ?? [],
	};
}

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

	const doaData = json.data;
	if (!doaData) {
		console.error("GetDoa API response missing data field", json);
		return NextResponse.json(
			{ error: "Invalid GetDoa API response" },
			{ status: 500 },
		);
	}

	return NextResponse.json(transformDoaResponse(doaData), {
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
