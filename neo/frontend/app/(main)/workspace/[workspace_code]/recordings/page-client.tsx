"use client";

import { useState } from "react";

import { RecordingList } from "@/components/recording/recording-list";
import { RecordingUploadDialog } from "@/components/recording/recording-upload-dialog";

interface Props {
  workspaceCode: string;
}

export default function RecordingListPageClient({ workspaceCode }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  // Bump this after upload completes to force the list to refetch.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">录像管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            浏览、检索、批量管理所有录像
          </p>
        </div>
      </div>

      <RecordingList
        workspaceCode={workspaceCode}
        onUploadClick={() => setUploadOpen(true)}
        refreshKey={refreshKey}
      />

      <RecordingUploadDialog
        workspaceCode={workspaceCode}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
