/**
 * Disable Workspace API Route
 * POST /api/v1/workspaces/{workspaceId}/disable
 * 
 * Proxies request to backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const token = getAuthTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          code: 401,
          message: "未登录",
          data: null,
          traceId: "",
          timestamp: Date.now(),
        },
        { status: 401 },
      );
    }

    const id = parseInt(workspaceId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          code: 400,
          message: "无效的工作区 ID",
          data: null,
          traceId: "",
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }

    const url = `${API_BASE_URL}/api/v1/workspaces/${id}/disable`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        {
          code: data.code || response.status,
          message: data.message || "禁用失败",
          data: null,
          traceId: data.traceId || "",
          timestamp: Date.now(),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error disabling workspace:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "服务器错误",
        data: null,
        traceId: "",
        timestamp: Date.now(),
      },
      { status: 500 },
    );
  }
}