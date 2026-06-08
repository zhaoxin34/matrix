/**
 * Enable Task API Proxy
 * POST /api/v1/workspaces/{workspace_code}/tasks/{task_id}/enable
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

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { workspaceCode, taskId } = extractParams(request);
  const url = `${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/enable`;

  try {
    const response = await fetch(url, {
      method: "POST",
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
