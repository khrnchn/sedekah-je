interface TelegramMessage {
	chat_id: string;
	text: string;
	parse_mode?: "Markdown" | "HTML";
	disable_web_page_preview?: boolean;
}

export type LogLevel = "info" | "warning" | "error" | "success";

export interface LogEventData {
	[key: string]: string | number | boolean | null | undefined;
}

interface LogEvent {
	level: LogLevel;
	title: string;
	description?: string;
	data?: LogEventData;
	emoji?: string;
}

const levelEmojis: Record<LogLevel, string> = {
	info: "ℹ️",
	warning: "⚠️",
	error: "❌",
	success: "✅",
};

async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
	const botToken = process.env.TELEGRAM_BOT_TOKEN;

	if (!botToken) {
		console.warn(
			"TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification",
		);
		return false;
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			console.error("Failed to send Telegram message:", error);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error sending Telegram message:", error);
		return false;
	}
}

function formatLogMessage(event: LogEvent): string {
	const emoji = event.emoji || levelEmojis[event.level];
	const timestamp = new Date().toLocaleString("en-MY", {
		timeZone: "Asia/Kuala_Lumpur",
	});

	let message = `${emoji} *${event.title}*\n`;

	if (event.description) {
		message += `\n${event.description}\n`;
	}

	if (event.data) {
		message += "\n";
		for (const [key, value] of Object.entries(event.data)) {
			if (value !== null && value !== undefined) {
				const formattedKey =
					key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
				message += `*${formattedKey}:* ${value}\n`;
			}
		}
	}

	message += `\n🕐 *Time:* ${timestamp}`;

	return message;
}

export async function logToTelegram(event: LogEvent): Promise<void> {
	const chatId = process.env.TELEGRAM_CHAT_ID;

	if (!chatId) {
		console.warn("TELEGRAM_CHAT_ID not configured, skipping Telegram log");
		return;
	}

	const message = formatLogMessage(event);

	await sendTelegramMessage({
		chat_id: chatId,
		text: message,
		parse_mode: "Markdown",
		disable_web_page_preview: true,
	});
}

export async function logNewUser(user: {
	id: string;
	name: string;
	email: string;
	role: string;
}): Promise<void> {
	await logToTelegram({
		level: "success",
		title: "New User Registered",
		description: "Welcome to sedekah.je! 🇲🇾",
		emoji: "🆕",
		data: {
			name: user.name,
			email: user.email,
			role: user.role,
		},
	});
}

export async function logNewInstitution(institution: {
	id: string;
	name: string;
	category: string;
	state: string;
	city: string;
	contributorName: string;
	contributorEmail: string;
}): Promise<void> {
	const categoryEmoji =
		{
			mosque: "🕌",
			surau: "🏢",
			others: "🏛️",
		}[institution.category] || "🏛️";

	await logToTelegram({
		level: "info",
		title: "New Institution Submitted",
		description: "Awaiting admin review... ⏳",
		emoji: categoryEmoji,
		data: {
			name: institution.name,
			category: institution.category,
			location: `${institution.city}, ${institution.state}`,
			contributor: institution.contributorName,
			email: institution.contributorEmail,
		},
	});
}

export async function logInstitutionClaim(claim: {
	institutionId: string;
	institutionName: string;
	category: string;
	state: string;
	city: string;
	claimerName: string;
	claimerEmail: string;
	sourceUrl?: string;
	description?: string;
}): Promise<void> {
	await logToTelegram({
		level: "warning",
		title: "Institution Claim Request",
		description: "User requesting to claim institution ownership... 🔄",
		emoji: "🏷️",
		data: {
			institution: claim.institutionName,
			category: claim.category,
			location: `${claim.city}, ${claim.state}`,
			claimer: claim.claimerName,
			email: claim.claimerEmail,
			sourceUrl: claim.sourceUrl || "Not provided",
			description: claim.description || "Not provided",
		},
	});
}

export async function logRejectedInstitutionUpdate(update: {
	institutionId: string;
	institutionName: string;
	category: string;
	state: string;
	city: string;
	contributorName: string;
	contributorEmail: string;
	previousName: string;
}): Promise<void> {
	await logToTelegram({
		level: "info",
		title: "Rejected Institution Updated",
		description:
			"User updated their rejected submission. Resubmitted for review... 🔄",
		emoji: "📝",
		data: {
			institution: update.institutionName,
			previousName: update.previousName,
			category: update.category,
			location: `${update.city}, ${update.state}`,
			contributor: update.contributorName,
			email: update.contributorEmail,
		},
	});
}

export async function logInstitutionSubmissionFailure(failure: {
	error: string;
	institutionName?: string;
	category?: string;
	state?: string;
	city?: string;
	contributorName?: string;
	contributorEmail?: string;
	errorType: string;
}): Promise<void> {
	await logToTelegram({
		level: "error",
		title: "Institution Submission Failed",
		description: `Submission error: ${failure.errorType} 💥`,
		emoji: "🚨",
		data: {
			error: failure.error,
			institutionName: failure.institutionName || "Not provided",
			category: failure.category || "Not provided",
			location:
				failure.state && failure.city
					? `${failure.city}, ${failure.state}`
					: "Not provided",
			contributor: failure.contributorName || "Not provided",
			email: failure.contributorEmail || "Not provided",
			errorType: failure.errorType,
		},
	});
}
