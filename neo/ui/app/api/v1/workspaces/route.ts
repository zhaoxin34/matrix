import { NextRequest, NextResponse } from "next/server";

// Mock data for workspaces
const mockWorkspaces = [
  {
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
  {
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
  {
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
];

let nextId = 4;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.toLowerCase();
  const status = searchParams.get("status");

  let filtered = mockWorkspaces;

  if (search) {
    filtered = filtered.filter(
      (ws) =>
        ws.name.toLowerCase().includes(search) ||
        ws.description?.toLowerCase().includes(search),
    );
  }

  if (status && status !== "all") {
    filtered = filtered.filter((ws) => ws.status === status);
  }

  return NextResponse.json({
    code: 0,
    message: "success",
    data: {
      list: filtered,
      total: filtered.length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
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

    // Generate code from name
    const code = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);

    const newWorkspace = {
      id: nextId++,
      name: name.trim(),
      code: `${code}-${Date.now().toString(36)}`,
      description: description?.trim() || "",
      status: "active",
      org_id: 1,
      owner_id: 1,
      member_count: 1,
      project_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockWorkspaces.push(newWorkspace);

    return NextResponse.json({
      code: 0,
      message: "创建成功",
      data: newWorkspace,
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