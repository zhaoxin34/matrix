/**
 * Enable Model Provider API Route
 * PATCH /api/v1/model-providers/{id}/enable
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface RouteParams {
	params: Promise<{ providerId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const token = getAuthTokenFromRequest(request);
	if (!token) {
		return NextResponse.json(
			{ code: 401, message: "Unauthorized" },
			{ status: 401 },
		);
	}

	const { providerId } = await params;
	const url = `${API_BASE_URL}/api/v1/model-providers/${providerId}/enable`;

	try {
		const response = await fetch(url, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		console.error("Proxy error:", error);
		return NextResponse.json(
			{ code: 500, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
