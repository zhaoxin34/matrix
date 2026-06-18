"use client";

import Link from "next/link";

import { RecordingPlayer } from "@/components/recording/recording-player";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceCode: string;
  recordingUid: string;
}

export default function RecordingPlayPageClient({
  workspaceCode,
  recordingUid,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">回放</h1>
          <p className="text-xs text-muted-foreground mt-1">
            使用 rrweb 回放 segment 中的操作序列
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/workspace/${workspaceCode}/recordings/${recordingUid}`}>
            返回详情
          </Link>
        </Button>
      </div>

      <RecordingPlayer
        workspaceCode={workspaceCode}
        recordingUid={recordingUid}
      />
    </div>
  );
}
