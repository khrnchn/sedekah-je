export function reviewAiConfig(config: {
	TELEGRAM_AI_PROVIDER: "gemini" | "anthropic-compatible";
	TELEGRAM_AI_API_KEY?: string;
	TELEGRAM_AI_BASE_URL?: string;
	TELEGRAM_AI_MODEL?: string;
	GEMINI_API_KEY?: string;
	GEMINI_MODEL: string;
}) {
	if (config.TELEGRAM_AI_PROVIDER === "anthropic-compatible") {
		if (
			!config.TELEGRAM_AI_API_KEY ||
			!config.TELEGRAM_AI_BASE_URL ||
			!config.TELEGRAM_AI_MODEL
		)
			return undefined;
		const baseUrl = config.TELEGRAM_AI_BASE_URL.replace(/\/$/, "");
		return {
			apiKey: config.TELEGRAM_AI_API_KEY,
			model: config.TELEGRAM_AI_MODEL,
			baseUrl,
			identity: `anthropic-compatible:${baseUrl}:${config.TELEGRAM_AI_MODEL}`,
		};
	}
	if (!config.GEMINI_API_KEY) return undefined;
	return {
		apiKey: config.GEMINI_API_KEY,
		model: config.GEMINI_MODEL,
		baseUrl: undefined,
		identity: config.GEMINI_MODEL,
	};
}
