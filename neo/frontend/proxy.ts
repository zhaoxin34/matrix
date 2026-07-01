/**
 * Next.js 16 proxy.ts — rewrites client `/api/*` to backend (localhost:8000).
 *
 * Without this file, fetch('/api/v1/...') hits the Next.js dev server
 * itself (returns 404 HTML). With it, calls are proxied to the backend.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;
	if (pathname.startsWith("/api/")) {
		const url = BACKEND + pathname + search;
		return NextResponse.rewrite(new URL(url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/api/:path*"],
};
