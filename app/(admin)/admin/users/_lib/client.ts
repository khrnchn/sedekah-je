import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { headers } from "next/headers";

export const getAuthClient = () => {
	const allHeaders = headers();
	return createAuthClient({
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie: allHeaders.get("cookie") ?? "",
			},
		},
	});
};
