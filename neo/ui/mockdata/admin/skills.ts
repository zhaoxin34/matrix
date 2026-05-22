// ============================================================
// Types
// ============================================================
export type SkillLevel = "Planning" | "Functional" | "Atomic";
export type SkillStatus = "draft" | "active" | "disabled";

export interface Skill {
	id: number;
	code: string;
	name: string;
	level: SkillLevel;
	tags: string[];
	status: SkillStatus;
	file_count: number;
	version_count: number;
	create_user: string;
	created_at: string;
	updated_at: string;
}

export interface FileNode {
	id: number;
	name: string;
	path: string;
	isDir: boolean;
	children?: FileNode[];
}

export interface SkillVersion {
	id: number;
	version: string;
	comment: string;
	created_at: string;
	file_count: number;
}

// ============================================================
// Skills List
// ============================================================
export const mockSkills: Skill[] = [
	{
		id: 1,
		code: "user-auth",
		name: "用户认证",
		level: "Functional",
		tags: ["认证", "安全"],
		status: "active",
		file_count: 5,
		version_count: 3,
		create_user: "张三",
		created_at: "2026-05-10 10:00:00",
		updated_at: "2026-05-15 14:30:00",
	},
	{
		id: 2,
		code: "data-fetch",
		name: "数据获取",
		level: "Atomic",
		tags: ["数据", "API"],
		status: "active",
		file_count: 3,
		version_count: 2,
		create_user: "李四",
		created_at: "2026-05-08 09:00:00",
		updated_at: "2026-05-14 16:00:00",
	},
	{
		id: 3,
		code: "order-management",
		name: "订单管理",
		level: "Planning",
		tags: ["电商", "订单"],
		status: "draft",
		file_count: 8,
		version_count: 0,
		create_user: "王五",
		created_at: "2026-05-12 11:00:00",
		updated_at: "2026-05-16 09:00:00",
	},
	{
		id: 4,
		code: "file-upload",
		name: "文件上传",
		level: "Atomic",
		tags: ["文件", "存储"],
		status: "disabled",
		file_count: 4,
		version_count: 5,
		create_user: "赵六",
		created_at: "2026-04-20 10:00:00",
		updated_at: "2026-05-01 12:00:00",
	},
	{
		id: 5,
		code: "notification-system",
		name: "通知系统",
		level: "Functional",
		tags: ["通知", "消息"],
		status: "active",
		file_count: 6,
		version_count: 4,
		create_user: "钱七",
		created_at: "2026-05-05 14:00:00",
		updated_at: "2026-05-13 10:00:00",
	},
	{
		id: 6,
		code: "payment-integration",
		name: "支付集成",
		level: "Planning",
		tags: ["支付", "电商"],
		status: "draft",
		file_count: 12,
		version_count: 0,
		create_user: "孙八",
		created_at: "2026-05-14 08:00:00",
		updated_at: "2026-05-16 11:00:00",
	},
];

// ============================================================
// Skill Detail (Editor page)
// ============================================================
export const mockSkillData = {
	id: 1,
	code: "user-auth",
	name: "用户认证",
	level: "Planning" as SkillLevel,
	status: "active" as SkillStatus,
	tags: ["认证", "安全"],
	create_user: "张三",
	created_at: "2026-05-10 10:00:00",
	updated_at: "2026-05-15 14:30:00",
};

export const mockFileTree: FileNode[] = [
	{
		id: 1,
		name: "SKILL.md",
		path: "SKILL.md",
		isDir: false,
	},
	{
		id: 2,
		name: "scripts",
		path: "scripts",
		isDir: true,
		children: [
			{ id: 3, name: "auth.py", path: "scripts/auth.py", isDir: false },
			{ id: 4, name: "token.py", path: "scripts/token.py", isDir: false },
		],
	},
	{
		id: 5,
		name: "docs",
		path: "docs",
		isDir: true,
		children: [
			{
				id: 6,
				name: "guides",
				path: "docs/guides",
				isDir: true,
				children: [
					{
						id: 7,
						name: "quickstart.md",
						path: "docs/guides/quickstart.md",
						isDir: false,
					},
				],
			},
			{ id: 8, name: "api.md", path: "docs/api.md", isDir: false },
		],
	},
];

export const mockFileContents: Record<string, string> = {
	"SKILL.md": `# 用户认证 Skill

## 概述
这是一个用于用户认证的 Skill。

## 功能
- 用户登录
- 用户注册
- 密码重置

## 使用方法
\`\`\`python
from auth import login
login(username, password)
\`\`\`
`,
	"scripts/auth.py": `# Authentication module

def login(username, password):
    """User login function"""
    # TODO: Implement login
    pass

def logout():
    """User logout function"""
    pass
`,
	"scripts/token.py": `# Token management

import time

def generate_token(user_id):
    """Generate JWT token"""
    return f"token_{user_id}_{int(time.time())}"
`,
	"docs/api.md": `# API Documentation

## Endpoints

### POST /api/login
User login endpoint.

### POST /api/logout
User logout endpoint.
`,
	"docs/guides/quickstart.md": `# Quick Start Guide

1. Install the auth module
2. Configure your credentials
3. Start using the API
`,
};

export const mockVersions: SkillVersion[] = [
	{
		id: 1,
		version: "1.0.0",
		comment: "初始版本",
		created_at: "2026-05-10 10:00:00",
		file_count: 3,
	},
	{
		id: 2,
		version: "1.1.0",
		comment: "新增 token 管理功能",
		created_at: "2026-05-12 14:00:00",
		file_count: 4,
	},
	{
		id: 3,
		version: "1.2.0",
		comment: "添加 API 文档",
		created_at: "2026-05-15 14:30:00",
		file_count: 5,
	},
];
