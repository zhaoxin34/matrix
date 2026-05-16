import { NextRequest, NextResponse } from "next/server";

// Mock workspace statuses (for enable)
const workspaceStatuses: Record<number, string> = {
  1: "active",
  2: "active",
  3: "disabled",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const id = parseInt(workspaceId, 10);

  if (isNaN(id)) {
    return NextResponse.json(
      {
        code: 400,
        message: "无效的工作区 ID",
        data: null,
      },
      { status: 400 },
    );
  }

  if (!workspaceStatuses[id] && workspaceStatuses[id] !== undefined) {
    return NextResponse.json(
      {
        code: 404,
        message: "工作区不存在",
        data: null,
      },
      { status: 404 },
    );
  }

  // Update the status
  workspaceStatuses[id] = "active";

  return NextResponse.json({
    code: 0,
    message: "工作区已启用",
    data: {
      id,
      status: "active",
      updated_at: new Date().toISOString(),
    },
  });
}
