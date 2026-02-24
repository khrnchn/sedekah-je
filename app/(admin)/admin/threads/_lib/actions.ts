"use server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { r2Storage } from "@/lib/r2-client";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";
const MAX_POST_LENGTH = 500;

export type ThreadsPostActionState = {
	status: "idle" | "success" | "error";
	message?: string;
	postId?: string;
	containerId?: string;
	replyToId?: string;
	mediaType?: "TEXT" | "IMAGE";
};

type ThreadsCreateContainerResponse = {
	id: string;
};

type ThreadsPublishResponse = {
	id: string;
};

type ThreadsErrorResponse = {
	error?: {
		message?: string;
	};
	error_message?: string;
};

function hasId(payload: unknown): payload is { id: string } {
	return Boolean(
		payload &&
			typeof payload === "object" &&
			"id" in payload &&
			typeof payload.id === "string",
	);
}

function getThreadsErrorMessage(
	payload: ThreadsErrorResponse | null,
	status: number,
): string {
	const apiMessage = payload?.error?.message ?? payload?.error_message;
	if (apiMessage) {
		return apiMessage;
	}
	return `Threads API request failed with status ${status}.`;
}

export async function createThreadsPostAction(
	_: ThreadsPostActionState,
	formData: FormData,
): Promise<ThreadsPostActionState> {
	await requireAdminSession();

	const userId = process.env.THREADS_USER_ID;
	const accessToken = process.env.THREADS_ACCESS_TOKEN;
	const rawText = String(formData.get("text") ?? "");
	const rawReplyToId = String(formData.get("reply_to_id") ?? "");
	const imageFile = formData.get("image");

	if (!userId || !accessToken) {
		return {
			status: "error",
			message:
				"Missing THREADS_USER_ID or THREADS_ACCESS_TOKEN in environment variables.",
		};
	}

	const text = rawText.trim();
	const hasImageFile =
		imageFile instanceof File && imageFile.size > 0 && !!imageFile.type;

	if (!text && !hasImageFile) {
		return {
			status: "error",
			message: "Post text or image is required.",
		};
	}

	if (text.length > MAX_POST_LENGTH) {
		return {
			status: "error",
			message: `Post text must be ${MAX_POST_LENGTH} characters or fewer.`,
		};
	}

	const replyToId = rawReplyToId.trim();
	const createParams = new URLSearchParams({
		access_token: accessToken,
	});

	let mediaType: "TEXT" | "IMAGE" = "TEXT";
	if (hasImageFile) {
		const file = imageFile as File;
		if (!file.type.startsWith("image/")) {
			return {
				status: "error",
				message: "Attached file must be an image.",
			};
		}

		if (file.size > 10 * 1024 * 1024) {
			return {
				status: "error",
				message: "Image size must be 10MB or less.",
			};
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const uploadedImageUrl = await r2Storage.uploadFile(
			buffer,
			file.name || "threads-image.png",
		);

		mediaType = "IMAGE";
		createParams.set("media_type", "IMAGE");
		createParams.set("image_url", uploadedImageUrl);
		if (text) {
			createParams.set("text", text);
		}
	} else {
		createParams.set("media_type", "TEXT");
		createParams.set("text", text);
	}

	if (replyToId) {
		createParams.set("reply_to_id", replyToId);
	}

	try {
		const createRes = await fetch(`${THREADS_API_BASE}/${userId}/threads`, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			body: createParams,
		});

		const createPayload = (await createRes.json().catch(() => null)) as
			| ThreadsCreateContainerResponse
			| ThreadsErrorResponse
			| null;
		if (!createRes.ok || !hasId(createPayload)) {
			return {
				status: "error",
				message: getThreadsErrorMessage(
					createPayload as ThreadsErrorResponse | null,
					createRes.status,
				),
			};
		}

		const publishParams = new URLSearchParams({
			creation_id: createPayload.id,
			access_token: accessToken,
		});

		const publishRes = await fetch(
			`${THREADS_API_BASE}/${userId}/threads_publish`,
			{
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
				body: publishParams,
			},
		);

		const publishPayload = (await publishRes.json().catch(() => null)) as
			| ThreadsPublishResponse
			| ThreadsErrorResponse
			| null;
		if (!publishRes.ok || !hasId(publishPayload)) {
			return {
				status: "error",
				message: getThreadsErrorMessage(
					publishPayload as ThreadsErrorResponse | null,
					publishRes.status,
				),
			};
		}

		return {
			status: "success",
			message:
				mediaType === "IMAGE"
					? "Image post published successfully."
					: "Post published successfully.",
			postId: publishPayload.id,
			containerId: createPayload.id,
			replyToId: replyToId || undefined,
			mediaType,
		};
	} catch (error) {
		return {
			status: "error",
			message: error instanceof Error ? error.message : "Unexpected error.",
		};
	}
}
