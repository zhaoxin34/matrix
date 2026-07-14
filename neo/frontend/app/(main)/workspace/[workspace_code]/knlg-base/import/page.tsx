"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	listDocuments,
	deleteDocument,
	createImportJob,
} from "@/lib/api/knlg-base/import";
import type { Document } from "@/lib/api/knlg-base/_base";

export default function ImportListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [docs, setDocs] = useState<Document[]>([]);

	const fetchData = useCallback(async () => {
		try {
			const data = await listDocuments(workspaceCode);
			setDocs(data.items);
		} catch (e) {
			console.error(e);
		}
	}, [workspaceCode]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDelete = async (id: number) => {
		if (!confirm("确认删除？")) return;
		await deleteDocument(workspaceCode, id);
		fetchData();
	};

	const handleCreateJob = async (docId: number) => {
		await createImportJob(workspaceCode, { document_id: docId });
		alert("导入任务已创建（仅 pending 状态，P2+ 才会真正解析）");
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">知识导入</h1>
				<Button asChild>
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/import/upload` as `/${string}`
						}
					>
						上传文档
					</Link>
				</Button>
			</div>
			<div className="space-y-2">
				{docs.map((doc) => (
					<Card key={doc.id}>
						<CardContent className="flex items-center justify-between py-3">
							<div className="flex-1">
								<div className="font-medium">{doc.name}</div>
								<div className="text-sm text-muted-foreground">
									类型: {doc.type} | 大小:{" "}
									{doc.file_size
										? `${(doc.file_size / 1024).toFixed(1)}KB`
										: "-"}{" "}
									| 任务数: {doc.import_job_count ?? 0}
								</div>
								<div className="text-xs text-muted-foreground">
									{new Date(doc.imported_at).toLocaleString()}
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCreateJob(doc.id)}
								>
									创建任务
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => handleDelete(doc.id)}
								>
									删除
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
				{docs.length === 0 && (
					<p className="text-muted-foreground text-center py-8">暂无文档</p>
				)}
			</div>
		</div>
	);
}
