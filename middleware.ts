import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	// add pathname to headers
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", request.nextUrl.pathname);

	// Check if user is trying to access user pages
	const userProtectedPaths = ["/contribute", "/my-contributions"];
	const isUserProtectedPath = userProtectedPaths.some((path) =>
		request.nextUrl.pathname.startsWith(path),
	);

	// For now, just add the path to headers - actual auth check will be done client-side
	if (isUserProtectedPath) {
		requestHeaders.set("x-requires-auth", "true");
	}

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}
