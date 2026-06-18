import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS middleware for /api/* routes.
 *
 * This is a "personal / LAN" deployment, so we reflect the request Origin
 * back in Access-Control-Allow-Origin and allow all common methods & headers.
 * If/when an external layer adds auth, the same middleware can be updated
 * (or chained) to validate credentials.
 *
 * Notes:
 * - Only /api/* paths are affected. Static assets, the home page, etc. are
 *   untouched.
 * - OPTIONS preflight returns 204 directly without invoking the route handler.
 * - SSE routes (text/event-stream) keep their own Cache-Control / Connection
 *   headers; route-handler headers override middleware headers in Next.js.
 */
export function middleware(req: NextRequest) {
	// Only apply CORS to /api/* — leave everything else (pages, static assets)
	// alone so the home page can still be served from the same origin.
	if (!req.nextUrl.pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	const origin = req.headers.get("origin");

	// Preflight: short-circuit with 204 + CORS headers, don't run the route.
	if (req.method === "OPTIONS") {
		const res = new NextResponse(null, { status: 204 });
		applyCorsHeaders(res, origin);
		return res;
	}

	// For real requests, pass through and let Next.js run the route handler.
	// We mutate the *response* headers, not the request, so the route handler
	// still sees the original Origin header.
	const res = NextResponse.next();
	applyCorsHeaders(res, origin);
	// Expose the headers we set / that downstream may set, so the browser
	// can read them on cross-origin responses.
	res.headers.set("Vary", "Origin");
	return res;
}

function applyCorsHeaders(res: NextResponse, origin: string | null) {
	// Two cases (mutually exclusive per the CORS spec):
	//  1. Browser request (has Origin header): reflect the origin and allow
	//     credentials. This is the typical cross-origin XHR/fetch case.
	//  2. No Origin header (curl, server-to-server, same-origin browser
	//     request): ACAO is irrelevant — browsers don't enforce CORS without
	//     an Origin. Set no ACAO so the response is unambiguous.
	// We deliberately do NOT use "*" anywhere: per spec, "*" + credentials is
	// a client-side error, and reflecting the origin is strictly more
	// permissive without that footgun.
	if (origin) {
		res.headers.set("Access-Control-Allow-Origin", origin);
		res.headers.set("Access-Control-Allow-Credentials", "true");
	}
	res.headers.set(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE, OPTIONS",
	);
	res.headers.set(
		"Access-Control-Allow-Headers",
		// Reflect whatever the browser asks for, plus the common auth / SSE ones.
		// Fall back to a safe default set.
		reqHeadersFallback(),
	);
	res.headers.set("Access-Control-Max-Age", "86400");
}

// We can't read the request headers here without a NextRequest reference, so
// we list the common ones browsers send. Route handlers that need extra
// headers (e.g. a future Authorization header) should add them here.
function reqHeadersFallback(): string {
	return [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Origin",
		"Cache-Control",
		"Last-Event-ID", // SSE reconnection
	].join(", ");
}

export const config = {
	// Apply to all /api/* paths. Exclude Next.js internals and static files.
	matcher: "/api/:path*",
};
