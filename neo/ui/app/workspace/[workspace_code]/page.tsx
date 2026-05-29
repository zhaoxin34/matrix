"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Settings01Icon,
	Folder02Icon,
	User02Icon,
	Robot02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { WorkspaceStatus } from "@/components/workspace/workspace-types";

interface WorkspaceDetail {
	id: number;
	name: string;
	code: string;
	description?: string;
	status: WorkspaceStatus;
	owner_id: number;
	org_id: number;
	created_at: string;
	updated_at: string;
	member_count?: number;
	project_count?: number;
}

async function fetchWorkspaceDetail(
	code: string,
): Promise<WorkspaceDetail | null> {
	const response = await fetch(`/api/v1/workspaces/code/${code}`);
	const result = await response.json();

	if (result.code === 0) {
		return result.data;
	}
	return null;
}

/**
 * User Workspace Detail Page
 *
 * 路由: /workspace/{workspace_code}
 * 角色: Workspace 成员
 * 功能: 查看 Workspace 概览信息，快速访问 Agent、嵌入网站等
 */
export default function UserWorkspaceDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;

	const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchWorkspaceDetail(workspaceCode);
				if (!cancelled) {
					if (data) {
						setWorkspace(data);
					} else {
						setError("工作区不存在或您没有访问权限");
					}
				}
			} catch (err) {
				if (!cancelled) {
					setError("加载失败，请重试");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, [workspaceCode]);

	if (loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card>
						<CardContent className="p-6 space-y-4">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-20 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (error || !workspace) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<HugeiconsIcon
					icon={Folder02Icon}
					strokeWidth={1.5}
					className="size-12 text-muted-foreground/50 mb-4"
				/>
				<h3 className="text-sm font-medium mb-1">工作区不存在</h3>
				<p className="text-xs text-muted-foreground mb-4">
					{error || "请检查链接是否正确"}
				</p>
				<Button variant="outline" asChild>
					<Link href="/workspace">返回我的工作区</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Workspace Header */}
			<div className="flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl font-heading font-medium">
							{workspace.name}
						</h1>
						<span
							className={`text-xs px-2 py-0.5 rounded ${
								workspace.status === "active"
									? "bg-green-100 text-green-700"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{workspace.status === "active" ? "活跃" : "已禁用"}
						</span>
					</div>
					<p className="text-xs text-muted-foreground mt-1">{workspace.code}</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<Link href={`/admin/workspace/${workspace.id}/settings`}>
						<HugeiconsIcon
							icon={Settings01Icon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						设置
					</Link>
				</Button>
			</div>

			{/* Description */}
			{workspace.description && (
				<p className="text-sm text-muted-foreground">{workspace.description}</p>
			)}

			{/* Quick Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4 flex items-center gap-3">
						<div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
							<HugeiconsIcon
								icon={User02Icon}
								strokeWidth={1.5}
								className="size-5 text-blue-600"
							/>
						</div>
						<div>
							<p className="text-2xl font-semibold">
								{workspace.member_count ?? 0}
							</p>
							<p className="text-xs text-muted-foreground">成员</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 flex items-center gap-3">
						<div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
							<HugeiconsIcon
								icon={Robot02Icon}
								strokeWidth={1.5}
								className="size-5 text-purple-600"
							/>
						</div>
						<div>
							<p className="text-2xl font-semibold">
								{workspace.project_count ?? 0}
							</p>
							<p className="text-xs text-muted-foreground">Agent</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="space-y-4">
				<h2 className="text-sm font-medium">快速访问</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card className="hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<Link
								href={`/workspace/${workspaceCode}/agents`}
								className="flex items-center gap-4"
							>
								<div className="size-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
									<HugeiconsIcon
										icon={Robot02Icon}
										strokeWidth={1.5}
										className="size-6 text-white"
									/>
								</div>
								<div>
									<h3 className="font-medium text-sm">Agent 管理</h3>
									<p className="text-xs text-muted-foreground">
										创建和管理您的 AI Agent
									</p>
								</div>
							</Link>
						</CardContent>
					</Card>
					<Card className="hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<Link
								href={`/workspace/${workspaceCode}/embedded-sites`}
								className="flex items-center gap-4"
							>
								<div className="size-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
									<HugeiconsIcon
										icon={Folder02Icon}
										strokeWidth={1.5}
										className="size-6 text-white"
									/>
								</div>
								<div>
									<h3 className="font-medium text-sm">嵌入网站</h3>
									<p className="text-xs text-muted-foreground">
										管理可以被 Agent 学习的网站
									</p>
								</div>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
