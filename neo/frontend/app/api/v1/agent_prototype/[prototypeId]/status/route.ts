/**
 * Agent Prototype Status API Route
 * PUT /api/v1/agent_prototype/{prototypeId}/status - Update prototype status
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest } from "@/lib/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface RouteParams {
  params: Promise<{ prototypeId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { code: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { prototypeId } = await params;
  const body = await request.json();
  const url = `${API_BASE_URL}/api/v1/agent_prototype/${prototypeId}/status`;

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
