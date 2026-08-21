import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { headers } from "next/headers";

const resolveBaseURL = (allHeaders?: Headers) => {
	const host =
		allHeaders?.get("x-forwarded-host") ?? allHeaders?.get("host") ?? "";
	if (host) {
		const proto =
			allHeaders?.get("x-forwarded-proto") ??
			(host.includes("localhost") ? "http" : "https");
		return `${proto}://${host}`;
	}

	return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
};

export const getAuthClient = async () => {
	const allHeaders = await headers();
	return createAuthClient({
		baseURL: resolveBaseURL(allHeaders),
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie: allHeaders.get("cookie") ?? "",
			},
		},
	});
};

export const getAuthClientFromCookie = (cookie: string, baseURL?: string) => {
	return createAuthClient({
		baseURL: baseURL ?? resolveBaseURL(),
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie,
			},
		},
	});
};
