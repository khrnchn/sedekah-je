import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const { pathname } = request.nextUrl;

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
	const userProtectedPaths = ["/contribute", "/my-contributions"];
	if (userProtectedPaths.some((path) => pathname.startsWith(path))) {
		if (!sessionCookie) {
			return NextResponse.redirect(new URL("/auth", request.url));
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
	matcher: [
		"/admin/:path*",
		"/contribute/:path*",
		"/my-contributions/:path*",
		"/auth",
	],
};
