/**
 * Agent API Proxy
 * Proxies requests from frontend to backend
 *
 * GET /api/v1/workspaces/{workspace_code}/agents - List agents
 * POST /api/v1/workspaces/{workspace_code}/agents - Create agent
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

  // Extract workspace_code from URL
  const urlParts = request.url.split("/api/v1/workspaces/");
  const workspaceCode = urlParts[1].split("/")[0];

  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/agents${queryString ? `?${queryString}` : ""}`;

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

  // Extract workspace_code from URL
  const urlParts = request.url.split("/api/v1/workspaces/");
  const workspaceCode = urlParts[1].split("/")[0];

  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/agents`;

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
