import RecordingDetailPageClient from "./page-client";

/**
 * Recording detail page (server component).
 * Resolves workspace_code and recording_uid from the URL.
 */
export default async function RecordingDetailPage({
	params,
}: {
	params: Promise<{ workspace_code: string; recording_uid: string }>;
}) {
	const { workspace_code, recording_uid } = await params;
	return (
		<RecordingDetailPageClient
			workspaceCode={workspace_code}
			recordingUid={recording_uid}
		/>
	);
}
