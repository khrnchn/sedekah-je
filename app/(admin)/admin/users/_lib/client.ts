import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { headers } from "next/headers";

export const getAuthClient = async () => {
	const allHeaders = await headers();
	return createAuthClient({
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie: allHeaders.get("cookie") ?? "",
			},
		},
	});
};

export const getAuthClientFromCookie = (cookie: string) => {
	return createAuthClient({
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie,
			},
		},
	});
};
