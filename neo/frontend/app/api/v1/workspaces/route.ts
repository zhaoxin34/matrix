/**
 * Workspace List API Route
 * GET /api/v1/workspaces - List workspaces
 * POST /api/v1/workspaces - Create workspace
 *
 * Proxies requests to backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
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

    // Forward query params to backend
    const queryString = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/api/v1/workspaces${queryString ? `?${queryString}` : ""}`;

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
    console.error("Error fetching workspaces:", error);
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

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
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

    const url = `${API_BASE_URL}/api/v1/workspaces`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        org_id: body.org_id || 1, // Default org_id
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          code: data.code || response.status,
          message: data.message || "创建失败",
          data: null,
          traceId: data.traceId || "",
          timestamp: Date.now(),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating workspace:", error);
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
