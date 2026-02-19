import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { type UnsafeUnwrappedHeaders, headers } from "next/headers";

export const getAuthClient = () => {
	const allHeaders = headers() as unknown as UnsafeUnwrappedHeaders;
	return createAuthClient({
		plugins: [adminClient()],
		fetchOptions: {
			headers: {
				cookie: allHeaders.get("cookie") ?? "",
			},
		},
	});
};
