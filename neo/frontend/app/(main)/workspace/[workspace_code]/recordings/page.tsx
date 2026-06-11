import RecordingListPageClient from "./page-client";

/**
 * Recording list page (server component).
 * Resolves workspace_code from the URL and hands it to the client component.
 */
export default async function RecordingListPage({
	params,
}: {
	params: Promise<{ workspace_code: string }>;
}) {
	const { workspace_code } = await params;
	return <RecordingListPageClient workspaceCode={workspace_code} />;
}
