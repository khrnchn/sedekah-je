import { type NextRequest, NextResponse } from "next/server";

interface TurnstileVerificationResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json();

		// Bypass Turnstile verification in development
		if (process.env.NODE_ENV === "development") {
			return NextResponse.json({ success: true });
		}

		if (!token) {
			return NextResponse.json(
				{ success: false, error: "Token diperlukan" },
				{ status: 400 },
			);
		}

		const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
		if (!secretKey) {
			console.error("TURNSTILE_SECRET_KEY not configured");
			return NextResponse.json(
				{ success: false, error: "Konfigurasi pelayan tidak lengkap" },
				{ status: 500 },
			);
		}

		// Verify token with Cloudflare Turnstile
		const formData = new FormData();
		formData.append("secret", secretKey);
		formData.append("response", token);

		const verificationResponse = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: formData,
			},
		);

		const result: TurnstileVerificationResponse =
			await verificationResponse.json();

		if (result.success) {
			return NextResponse.json({ success: true });
		}
		console.error("Turnstile verification failed:", result["error-codes"]);
		return NextResponse.json(
			{
				success: false,
				error: "Pengesahan keselamatan gagal. Sila cuba lagi.",
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error("Turnstile verification error:", error);
		return NextResponse.json(
			{ success: false, error: "Ralat pelayan dalaman" },
			{ status: 500 },
		);
	}
}
