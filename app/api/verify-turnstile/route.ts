import { verifyTurnstileToken } from "@/lib/turnstile";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json();
		const result = await verifyTurnstileToken(token);

		if (result.success) {
			return NextResponse.json({ success: true });
		}

		return NextResponse.json(
			{
				success: false,
				error: result.error || "Pengesahan keselamatan gagal",
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error("Turnstile API route error:", error);
		return NextResponse.json(
			{ success: false, error: "Ralat pelayan dalaman" },
			{ status: 500 },
		);
	}
}
