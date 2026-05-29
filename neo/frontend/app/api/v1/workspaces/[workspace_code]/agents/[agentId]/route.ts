/**
 * Agent API Proxy - Single Agent
 *
 * GET /api/v1/workspaces/{workspace_code}/agents/{agentId} - Get agent
 * PUT /api/v1/workspaces/{workspace_code}/agents/{agentId} - Update agent
 * DELETE /api/v1/workspaces/{workspace_code}/agents/{agentId} - Delete agent
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_code: string; agentId: string }> },
) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspace_code, agentId } = await params;
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspace_code}/agents/${agentId}`;

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_code: string; agentId: string }> },
) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspace_code, agentId } = await params;
  const body = await request.json();
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspace_code}/agents/${agentId}`;

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_code: string; agentId: string }> },
) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspace_code, agentId } = await params;
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspace_code}/agents/${agentId}`;

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
