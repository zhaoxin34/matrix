import AgentSteerDemoClient from "./page-client";

/**
 * Server component: resolve the dynamic workspace_code from the URL and
 * hand it to the client component that owns the form + recorder state.
 *
 * Next 15+ delivers `params` as a Promise; await it server-side.
 */
export default async function AgentSteerDemoPage({
	params,
}: {
	params: Promise<{ workspace_code: string }>;
}) {
	const { workspace_code } = await params;
	return <AgentSteerDemoClient workspaceCode={workspace_code} />;
}
