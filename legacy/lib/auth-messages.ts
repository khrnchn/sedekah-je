export const AUTH_REASON_COPY = {
	submit_qr:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
	view_submissions:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
	login_required:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
} as const;

export type AuthReason = keyof typeof AUTH_REASON_COPY;
