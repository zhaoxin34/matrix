"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { uploadDocument } from "@/lib/api/knlg-base/import";

export default function UploadDocumentPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [file, setFile] = useState<File | null>(null);
	const [name, setName] = useState("");
	const [type, setType] = useState("pdf");
	const [sourceUrl, setSourceUrl] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			setError("请选择文件");
			return;
		}
		setSubmitting(true);
		setError("");
		try {
			await uploadDocument(
				workspaceCode,
				file,
				name || file.name,
				type,
				sourceUrl || undefined,
			);
			router.push(
				`/workspace/${workspaceCode}/knlg-base/import` as `/${string}`,
			);
		} catch (err: unknown) {
			const e = err as { message?: string };
			setError(e.message || "上传失败");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-xl">
			<h1 className="text-3xl font-bold mb-6">上传文档</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="file">文件 *</Label>
					<Input
						id="file"
						type="file"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						required
					/>
					<p className="text-xs text-muted-foreground mt-1">
						最大 50MB，支持 pdf/docx/md/txt/csv/wiki/confluence
					</p>
				</div>
				<div>
					<Label htmlFor="name">文档名称</Label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="留空则使用文件名"
					/>
				</div>
				<div>
					<Label htmlFor="type">类型 *</Label>
					<Select value={type} onValueChange={setType}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pdf">pdf</SelectItem>
							<SelectItem value="docx">docx</SelectItem>
							<SelectItem value="md">md</SelectItem>
							<SelectItem value="txt">txt</SelectItem>
							<SelectItem value="csv">csv</SelectItem>
							<SelectItem value="wiki">wiki</SelectItem>
							<SelectItem value="confluence">confluence</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="source_url">来源 URL（可选）</Label>
					<Input
						id="source_url"
						type="url"
						value={sourceUrl}
						onChange={(e) => setSourceUrl(e.target.value)}
					/>
				</div>
				{error && <p className="text-red-600">{error}</p>}
				<div className="flex gap-2">
					<Button type="submit" disabled={submitting || !file}>
						{submitting ? "上传中..." : "上传"}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.back()}>
						取消
					</Button>
				</div>
			</form>
		</div>
	);
}
