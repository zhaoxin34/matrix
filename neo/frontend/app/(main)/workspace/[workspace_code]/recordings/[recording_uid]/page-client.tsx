"use client";

import Link from "next/link";

import { RecordingDetail } from "@/components/recording/recording-detail";
import { Button } from "@/components/ui/button";

interface Props {
	workspaceCode: string;
	recordingUid: string;
}

export default function RecordingDetailPageClient({
	workspaceCode,
	recordingUid,
}: Props) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-heading font-medium">录像详情</h1>
					<p className="text-xs text-muted-foreground mt-1">
						查看、重命名、删除录像及其 segments
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/workspace/${workspaceCode}/recordings`}>返回列表</Link>
				</Button>
			</div>

			<RecordingDetail
				workspaceCode={workspaceCode}
				recordingUid={recordingUid}
			/>
		</div>
	);
}
