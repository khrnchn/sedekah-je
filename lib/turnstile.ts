interface TurnstileVerificationResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export interface TurnstileResult {
	success: boolean;
	error?: string;
}

/**
 * Verify Turnstile token with Cloudflare
 * This function can be used both in API routes and server actions
 */
export async function verifyTurnstileToken(
	token: string,
): Promise<TurnstileResult> {
	// Bypass Turnstile verification in development
	if (process.env.NODE_ENV === "development") {
		return { success: true };
	}

	if (!token) {
		return { success: false, error: "Token diperlukan" };
	}

	const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
	if (!secretKey) {
		console.error("TURNSTILE_SECRET_KEY not configured");
		return { success: false, error: "Konfigurasi pelayan tidak lengkap" };
	}

	try {
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
			return { success: true };
		}

		console.error("Turnstile verification failed:", result["error-codes"]);
		return {
			success: false,
			error: "Pengesahan keselamatan gagal. Sila cuba lagi.",
		};
	} catch (error) {
		console.error("Turnstile verification error:", error);
		return { success: false, error: "Ralat pelayan dalaman" };
	}
}
