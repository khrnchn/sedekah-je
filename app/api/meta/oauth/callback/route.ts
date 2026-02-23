import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const errorReason = searchParams.get("error_reason");
	const errorDescription = searchParams.get("error_description");

	if (error) {
		return NextResponse.json(
			{
				ok: false,
				error,
				error_reason: errorReason,
				error_description: errorDescription,
			},
			{ status: 400 },
		);
	}

	return NextResponse.json({
		ok: true,
		message: "OAuth callback received. Exchange this code for a token.",
		code,
	});
}
