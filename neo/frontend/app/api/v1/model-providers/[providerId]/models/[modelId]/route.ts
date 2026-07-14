/**
 * Model Config Detail API Route
 * GET, PUT, DELETE /api/v1/model-providers/{id}/models/{modelId}
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface RouteParams {
	params: Promise<{ providerId: string; modelId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const token = getAuthTokenFromRequest(request);
	if (!token) {
		return NextResponse.json(
			{ code: 401, message: "Unauthorized" },
			{ status: 401 },
		);
	}

	const { providerId, modelId } = await params;
	const encodedModelId = encodeURIComponent(modelId);
	const url = `${API_BASE_URL}/api/v1/model-providers/${providerId}/models/${encodedModelId}`;

	try {
		const response = await fetch(url, {
			method: "GET",
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
	const token = getAuthTokenFromRequest(request);
	if (!token) {
		return NextResponse.json(
			{ code: 401, message: "Unauthorized" },
			{ status: 401 },
		);
	}

	const { providerId, modelId } = await params;
	const encodedModelId = encodeURIComponent(modelId);
	const body = await request.json();
	const url = `${API_BASE_URL}/api/v1/model-providers/${providerId}/models/${encodedModelId}`;

	try {
		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(body),
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	const token = getAuthTokenFromRequest(request);
	if (!token) {
		return NextResponse.json(
			{ code: 401, message: "Unauthorized" },
			{ status: 401 },
		);
	}

	const { providerId, modelId } = await params;
	const encodedModelId = encodeURIComponent(modelId);
	const url = `${API_BASE_URL}/api/v1/model-providers/${providerId}/models/${encodedModelId}`;

	try {
		const response = await fetch(url, {
			method: "DELETE",
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
