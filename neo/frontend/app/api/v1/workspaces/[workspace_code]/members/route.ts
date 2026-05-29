/**
 * Workspace Members API Route
 * GET /api/v1/workspaces/{workspace_code}/members - List members
 * POST /api/v1/workspaces/{workspace_code}/members - Add member
 *
 * Proxies requests to backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_code: string }> },
) {
  try {
    const { workspace_code } = await params;
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

    const id = parseInt(workspace_code, 10);
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

    // Forward query params
    const queryString = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/api/v1/workspaces/${id}/members${queryString ? `?${queryString}` : ""}`;

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
    console.error("Error fetching workspace members:", error);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_code: string }> },
) {
  try {
    const { workspace_code } = await params;
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

    const id = parseInt(workspace_code, 10);
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

    // Validate required fields
    if (
      !body.user_id ||
      typeof body.user_id !== "number" ||
      body.user_id <= 0
    ) {
      return NextResponse.json(
        {
          code: 400,
          message: "请提供有效的用户 ID",
          data: null,
          traceId: "",
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }

    if (
      !body.role ||
      !["owner", "admin", "member", "guest"].includes(body.role)
    ) {
      return NextResponse.json(
        {
          code: 400,
          message: "请提供有效的角色",
          data: null,
          traceId: "",
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }

    const url = `${API_BASE_URL}/api/v1/workspaces/${id}/members`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: body.user_id,
        role: body.role,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          code: data.code || response.status,
          message: data.message || "添加成员失败",
          data: null,
          traceId: data.traceId || "",
          timestamp: Date.now(),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding workspace member:", error);
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
