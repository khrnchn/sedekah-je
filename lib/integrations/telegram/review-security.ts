import { timingSafeEqual } from "node:crypto";

export function isAuthorizedTelegramActor(
	expectedPrivateChatId: string,
	fromId: number,
	chatId: number,
): boolean {
	return (
		String(fromId) === expectedPrivateChatId &&
		String(chatId) === expectedPrivateChatId
	);
}

export function telegramSecretsMatch(
	actual: string | null,
	expected: string,
): boolean {
	if (!actual) return false;
	const actualBuffer = Buffer.from(actual);
	const expectedBuffer = Buffer.from(expected);
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	);
}
