import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const token = getAuthTokenFromRequest(request);

	// Debug logging
	console.log("[/api/v1/tasks/me] Request cookies:", request.cookies.getAll());
	console.log("[/api/v1/tasks/me] Authorization header:", request.headers.get("Authorization"));
	console.log("[/api/v1/tasks/me] Extracted token:", token ? "present" : "missing");

	if (!token) {
		return NextResponse.json(
			{ code: 401, message: "Not authenticated" },
			{ status: 401 },
		);
	}

	try {
		const backendResponse = await fetch(
			`${BACKEND_URL}/api/v1/tasks/me?${searchParams.toString()}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);

		const data = await backendResponse.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ code: 500, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
