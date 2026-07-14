/**
 * Model Provider API Route
 * Proxies requests to backend API
 *
 * GET    /api/v1/model-providers        - List providers
 * POST   /api/v1/model-providers        - Create provider
 * GET    /api/v1/model-providers/{id}   - Get provider
 * PUT    /api/v1/model-providers/{id}   - Update provider
 * DELETE /api/v1/model-providers/{id}   - Delete provider
 * PATCH  /api/v1/model-providers/{id}/enable  - Enable provider
 * PATCH  /api/v1/model-providers/{id}/disable - Disable provider
 * GET    /api/v1/model-providers/{id}/models  - List models
 * POST   /api/v1/model-providers/{id}/models  - Create model
 * GET    /api/v1/model-providers/{id}/models/{modelId}  - Get model
 * PUT    /api/v1/model-providers/{id}/models/{modelId}  - Update model
 * DELETE /api/v1/model-providers/{id}/models/{modelId}  - Delete model
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// GET /api/v1/model-providers or POST /api/v1/model-providers
export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/model-providers${queryString ? `?${queryString}` : ""}`;

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

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const url = `${API_BASE_URL}/api/v1/model-providers`;

  try {
    const response = await fetch(url, {
      method: "POST",
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
