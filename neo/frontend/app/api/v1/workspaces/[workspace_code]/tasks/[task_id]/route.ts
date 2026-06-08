/**
 * Task Detail API Proxy
 * Proxies requests from frontend to backend
 *
 * GET /api/v1/workspaces/{workspace_code}/tasks/{task_id} - Get task detail
 * PUT /api/v1/workspaces/{workspace_code}/tasks/{task_id} - Update task
 * DELETE /api/v1/workspaces/{workspace_code}/tasks/{task_id} - Delete task
 * POST /api/v1/workspaces/{workspace_code}/tasks/{task_id}/cancel - Cancel task
 * PATCH /api/v1/workspaces/{workspace_code}/tasks/{task_id}/disable - Disable task
 * PATCH /api/v1/workspaces/{workspace_code}/tasks/{task_id}/enable - Enable task
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function extractParams(request: NextRequest): {
  workspaceCode: string;
  taskId: string;
} {
  const urlParts = request.url.split("/api/v1/workspaces/");
  const afterWorkspaces = urlParts[1];
  const parts = afterWorkspaces.split("/");
  return {
    workspaceCode: parts[0],
    taskId: parts[2],
  };
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspaceCode, taskId } = extractParams(request);
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`;

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

export async function PUT(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { workspaceCode, taskId } = extractParams(request);

  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`;

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

export async function DELETE(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspaceCode, taskId } = extractParams(request);
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`;

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
