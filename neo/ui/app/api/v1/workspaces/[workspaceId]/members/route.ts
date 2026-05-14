import { NextRequest, NextResponse } from "next/server";

// Mock members data
const mockMembers: Record<
  number,
  Array<{
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    role: string;
    workspace_id: number;
    created_at: string;
  }>
> = {
  1: [
    {
      id: 1,
      user_id: 1,
      user_name: "张三",
      user_email: "zhangsan@example.com",
      role: "owner",
      workspace_id: 1,
      created_at: "2026-05-01T10:00:00Z",
    },
    {
      id: 2,
      user_id: 2,
      user_name: "李四",
      user_email: "lisi@example.com",
      role: "admin",
      workspace_id: 1,
      created_at: "2026-05-02T14:00:00Z",
    },
    {
      id: 3,
      user_id: 3,
      user_name: "王五",
      user_email: "wangwu@example.com",
      role: "member",
      workspace_id: 1,
      created_at: "2026-05-03T09:00:00Z",
    },
  ],
  2: [
    {
      id: 4,
      user_id: 4,
      user_name: "赵六",
      user_email: "zhaoliu@example.com",
      role: "owner",
      workspace_id: 2,
      created_at: "2026-04-15T08:00:00Z",
    },
  ],
  3: [
    {
      id: 5,
      user_id: 5,
      user_name: "孙七",
      user_email: "sunqi@example.com",
      role: "owner",
      workspace_id: 3,
      created_at: "2026-03-20T09:00:00Z",
    },
  ],
};

let nextMemberId = 6;

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

  const members = mockMembers[id] || [];

  return NextResponse.json({
    code: 0,
    message: "success",
    data: {
      list: members,
      total: members.length,
    },
  });
}

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

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        {
          code: 400,
          message: "请提供邮箱和角色",
          data: null,
        },
        { status: 400 },
      );
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json(
        {
          code: 400,
          message: "无效的角色",
          data: null,
        },
        { status: 400 },
      );
    }

    // Initialize members array if not exists
    if (!mockMembers[id]) {
      mockMembers[id] = [];
    }

    // Check for duplicate email
    const exists = mockMembers[id].some((m) => m.user_email === email);
    if (exists) {
      return NextResponse.json(
        {
          code: 400,
          message: "该成员已在工作区中",
          data: null,
        },
        { status: 400 },
      );
    }

    const newMember = {
      id: nextMemberId++,
      user_id: nextMemberId,
      user_name: email.split("@")[0],
      user_email: email,
      role,
      workspace_id: id,
      created_at: new Date().toISOString(),
    };

    mockMembers[id].push(newMember);

    return NextResponse.json({
      code: 0,
      message: "邀请成功",
      data: newMember,
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