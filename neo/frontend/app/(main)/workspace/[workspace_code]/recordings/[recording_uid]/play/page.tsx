import RecordingPlayPageClient from "./page-client";

/**
 * Recording playback page (server component).
 */
export default async function RecordingPlayPage({
  params,
}: {
  params: Promise<{ workspace_code: string; recording_uid: string }>;
}) {
  const { workspace_code, recording_uid } = await params;
  return (
    <RecordingPlayPageClient
      workspaceCode={workspace_code}
      recordingUid={recording_uid}
    />
  );
}
