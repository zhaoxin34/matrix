"use client";

/**
 * Manual rrweb JSON upload dialog.
 *
 * Spec coverage:
 *   5.5.1 file selection + upload
 *   5.5.2 multi-file upload (each file becomes one segment)
 *
 * Flow: each session creates one new `upload`-source recording, then for
 * each file: PUT bytes via backend proxy, POST /segments to register.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	addSegment,
	createRecording,
	getErrorMessage,
	uploadSegmentBytes,
} from "@/lib/api/recording";

interface Props {
	workspaceCode: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUploaded?: () => void;
}

interface UploadTask {
	file: File;
	status: "pending" | "uploading" | "done" | "error";
	error?: string;
}

function cryptoRandom(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID().replace(/-/g, "");
	}
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function RecordingUploadDialog({
	workspaceCode,
	open,
	onOpenChange,
	onUploaded,
}: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState("");
	const [tags, setTags] = useState("");
	const [files, setFiles] = useState<UploadTask[]>([]);
	const [uploading, setUploading] = useState(false);
	const [doneCount, setDoneCount] = useState(0);

	const reset = () => {
		setName("");
		setTags("");
		setFiles([]);
		setDoneCount(0);
		setUploading(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleClose = () => {
		if (uploading) return; // don't allow mid-upload
		onOpenChange(false);
		reset();
	};

	const onFilesSelected = (selected: FileList | null) => {
		if (!selected) return;
		const tasks: UploadTask[] = Array.from(selected)
			.filter((f) => f.size > 0)
			.map((file) => ({ file, status: "pending" }));
		setFiles(tasks);
		setDoneCount(0);
	};

	const upload = async () => {
		if (!files.length) {
			toast.error("请至少选择一个文件");
			return;
		}
		setUploading(true);

		let recordingUid: string | null = null;
		try {
			// 1) Create the recording up front
			const recording = await createRecording(workspaceCode, {
				name: name || `upload-${new Date().toISOString()}`,
				tags: tags
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean),
				source: "upload",
			});
			recordingUid = recording.uid;

			// 2) Upload each file as one segment, in order
			let sequence = 1;
			for (let i = 0; i < files.length; i++) {
				setFiles((prev) =>
					prev.map((t, idx) => (idx === i ? { ...t, status: "uploading" } : t)),
				);
				const task = files[i];
				try {
					const text = await task.file.text();
					const segmentUid = `seg-${cryptoRandom()}`;
					const uploaded = await uploadSegmentBytes(
						workspaceCode,
						recordingUid,
						segmentUid,
						text,
						"application/json",
					);
					// Derive timestamps from filename if possible, else use file.lastModified.
					const startTime = new Date(
						task.file.lastModified || Date.now(),
					).toISOString();
					await addSegment(workspaceCode, recordingUid, {
						start_time: startTime,
						end_time: new Date(
							(task.file.lastModified || Date.now()) +
								Math.max(1, Math.floor(task.file.size / 1000)),
						).toISOString(),
						page_urls: [],
						storage_key: uploaded.storage_key,
						size: uploaded.size,
					});
					setFiles((prev) =>
						prev.map((t, idx) => (idx === i ? { ...t, status: "done" } : t)),
					);
					setDoneCount(sequence);
					sequence += 1;
				} catch (err) {
					setFiles((prev) =>
						prev.map((t, idx) =>
							idx === i
								? { ...t, status: "error", error: getErrorMessage(err) }
								: t,
						),
					);
				}
			}

			const okCount = files.filter((f) => f.status === "done").length;
			const errCount = files.filter((f) => f.status === "error").length;
			if (errCount === 0) {
				toast.success(`上传完成：${okCount} 个 segment`);
			} else {
				toast.warning(`部分失败：成功 ${okCount}，失败 ${errCount}`);
			}
			onUploaded?.();
			handleClose();
		} catch (err) {
			toast.error(`创建录像失败：${getErrorMessage(err)}`);
		} finally {
			setUploading(false);
		}
	};

	const progressPct = files.length
		? Math.round((doneCount / files.length) * 100)
		: 0;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>上传录像</DialogTitle>
					<DialogDescription>
						选择 rrweb JSON 文件，每个文件将作为一个 segment 上传到 S3。
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="upload-name">录像名称</Label>
						<Input
							id="upload-name"
							placeholder="可选，留空将自动生成"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={uploading}
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="upload-tags">标签</Label>
						<Input
							id="upload-tags"
							placeholder="可选，逗号分隔"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							disabled={uploading}
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="upload-files">rrweb JSON 文件（可多选）</Label>
						<Input
							id="upload-files"
							ref={fileInputRef}
							type="file"
							accept="application/json,.json"
							multiple
							onChange={(e) => onFilesSelected(e.target.files)}
							disabled={uploading}
						/>
					</div>

					{files.length > 0 && (
						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">
								已选 {files.length} 个 · 已完成 {doneCount}
							</div>
							<Progress value={progressPct} />
							<ul className="text-xs space-y-1 max-h-40 overflow-auto">
								{files.map((t, i) => (
									<li
										key={i}
										className={
											t.status === "error"
												? "text-destructive"
												: t.status === "done"
													? "text-green-600"
													: ""
										}
									>
										{i + 1}. {t.file.name} ({(t.file.size / 1024).toFixed(1)}{" "}
										KB) —{" "}
										{t.status === "pending"
											? "等待"
											: t.status === "uploading"
												? "上传中…"
												: t.status === "done"
													? "完成"
													: `失败：${t.error}`}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={uploading}>
						取消
					</Button>
					<Button onClick={upload} disabled={!files.length || uploading}>
						{uploading ? "上传中…" : `上传 ${files.length} 个文件`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
