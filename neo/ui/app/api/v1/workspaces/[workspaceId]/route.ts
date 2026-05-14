import { NextRequest, NextResponse } from "next/server";

// Mock data (shared reference would be better in production)
const mockWorkspaces: Record<
  number,
  {
    id: number;
    name: string;
    code: string;
    description: string;
    status: string;
    org_id: number;
    owner_id: number;
    member_count: number;
    project_count: number;
    created_at: string;
    updated_at: string;
  }
> = {
  1: {
    id: 1,
    name: "CRM 工作区",
    code: "crm-workspace",
    description: "客户关系管理团队的工作区",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 15,
    project_count: 8,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-12T15:30:00Z",
  },
  2: {
    id: 2,
    name: "运营工作区",
    code: "ops-workspace",
    description: "运营团队的工作区，负责日常运营任务",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 8,
    project_count: 5,
    created_at: "2026-04-15T08:00:00Z",
    updated_at: "2026-05-10T12:00:00Z",
  },
  3: {
    id: 3,
    name: "已禁用工作区",
    code: "disabled-workspace",
    description: "这是一个已禁用的工作区示例",
    status: "disabled",
    org_id: 1,
    owner_id: 1,
    member_count: 3,
    project_count: 1,
    created_at: "2026-03-20T09:00:00Z",
    updated_at: "2026-05-08T18:00:00Z",
  },
};

export async function GET(
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

  const workspace = mockWorkspaces[id];

  if (!workspace) {
    return NextResponse.json(
      {
        code: 404,
        message: "工作区不存在",
        data: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    code: 0,
    message: "success",
    data: workspace,
  });
}

export async function PATCH(
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

  const workspace = mockWorkspaces[id];

  if (!workspace) {
    return NextResponse.json(
      {
        code: 404,
        message: "工作区不存在",
        data: null,
      },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          {
            code: 400,
            message: "请输入工作区名称",
            data: null,
          },
          { status: 400 },
        );
      }
      if (name.length > 50) {
        return NextResponse.json(
          {
            code: 400,
            message: "名称不能超过50个字符",
            data: null,
          },
          { status: 400 },
        );
      }
      workspace.name = name.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        return NextResponse.json(
          {
            code: 400,
            message: "描述不能超过500个字符",
            data: null,
          },
          { status: 400 },
        );
      }
      workspace.description = description?.trim() || "";
    }

    workspace.updated_at = new Date().toISOString();

    return NextResponse.json({
      code: 0,
      message: "保存成功",
      data: workspace,
    });
  } catch {
    return NextResponse.json(
      {
        code: 500,
        message: "服务器错误",
        data: null,
      },
      { status: 500 },
    );
  }
}