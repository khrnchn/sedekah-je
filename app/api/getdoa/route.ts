import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const response = await fetch("https://getdoa.com/api/random-doa", {
		cache: "no-cache",
	});

	if (!response.ok) {
		console.error("Failed to fetch GetDoa API", response);
		return NextResponse.json("Failed to fetch GetDoa API", { status: 500 });
	}

	const json = await response.json();

	return NextResponse.json(json, { status: 200 });
}
