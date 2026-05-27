import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Proxy GET /api/v1/workspaces to backend
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const queryString = searchParams.toString();
		const backendUrl = `${BACKEND_URL}/api/v1/workspaces${
			queryString ? `?${queryString}` : ""
		}`;

		// Extract auth token from cookie
		const token = request.cookies.get("access_token")?.value;

		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await fetch(backendUrl, {
			method: "GET",
			headers,
			credentials: "include",
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{
				code: 500,
				message: "Failed to connect to backend",
				data: null,
			},
			{ status: 500 },
		);
	}
}

/**
 * Proxy POST /api/v1/workspaces to backend
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const backendUrl = `${BACKEND_URL}/api/v1/workspaces`;

		// Extract auth token from cookie
		const token = request.cookies.get("access_token")?.value;

		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await fetch(backendUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			credentials: "include",
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{
				code: 500,
				message: "Failed to connect to backend",
				data: null,
			},
			{ status: 500 },
		);
	}
}
