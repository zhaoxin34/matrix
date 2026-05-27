import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Proxy POST /api/v1/workspaces/{id}/enable to backend
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ workspaceId: string }> },
) {
	try {
		const { workspaceId } = await params;
		const backendUrl = `${BACKEND_URL}/api/v1/workspaces/${workspaceId}/enable`;

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
