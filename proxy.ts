import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const { pathname } = request.nextUrl;
	const authReasonByPath: Record<string, string> = {
		"/my-contributions": "view_submissions",
	};

	// Add pathname to headers for layouts
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", pathname);

	// Admin route protection
	if (pathname.startsWith("/admin")) {
		if (!sessionCookie) {
			return NextResponse.redirect(new URL("/", request.url));
		}
		// Mark as admin path for layout role verification
		requestHeaders.set("x-requires-admin", "true");
		requestHeaders.set("x-has-session", "true");
	}

	// User route protection
	const userProtectedPaths = ["/my-contributions"];
	const matchedProtectedPath = userProtectedPaths.find((path) =>
		pathname.startsWith(path),
	);
	if (matchedProtectedPath) {
		if (!sessionCookie) {
			const authUrl = new URL("/auth", request.url);
			const nextPath = `${pathname}${request.nextUrl.search}`;
			const reason = authReasonByPath[matchedProtectedPath] ?? "login_required";
			authUrl.searchParams.set("next", nextPath);
			authUrl.searchParams.set("reason", reason);
			return NextResponse.redirect(authUrl);
		}
		requestHeaders.set("x-requires-auth", "true");
	}

	// Redirect authenticated users away from auth pages
	if (sessionCookie && pathname === "/auth") {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next({
		request: { headers: requestHeaders },
	});
}

export const config = {
	matcher: ["/admin/:path*", "/my-contributions/:path*", "/auth"],
};
