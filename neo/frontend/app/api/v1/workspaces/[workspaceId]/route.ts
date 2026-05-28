/**
 * Workspace Detail API Route
 * GET /api/v1/workspaces/{workspaceId} - Get workspace detail
 * PATCH /api/v1/workspaces/{workspaceId} - Update workspace
 *
 * Proxies requests to backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(
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

    const url = `${API_BASE_URL}/api/v1/workspaces/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspace:", error);
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

export async function PATCH(
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

    const body = await request.json();

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          {
            code: 400,
            message: "请输入工作区名称",
            data: null,
            traceId: "",
            timestamp: Date.now(),
          },
          { status: 400 },
        );
      }
      if (body.name.length > 50) {
        return NextResponse.json(
          {
            code: 400,
            message: "名称不能超过50个字符",
            data: null,
            traceId: "",
            timestamp: Date.now(),
          },
          { status: 400 },
        );
      }
    }

    // Validate description if provided
    if (body.description !== undefined && body.description?.length > 500) {
      return NextResponse.json(
        {
          code: 400,
          message: "描述不能超过500个字符",
          data: null,
          traceId: "",
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }

    const url = `${API_BASE_URL}/api/v1/workspaces/${id}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          code: data.code || response.status,
          message: data.message || "更新失败",
          data: null,
          traceId: data.traceId || "",
          timestamp: Date.now(),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating workspace:", error);
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
