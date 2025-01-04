import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	// add pathname to headers
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", request.nextUrl.pathname);

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}
