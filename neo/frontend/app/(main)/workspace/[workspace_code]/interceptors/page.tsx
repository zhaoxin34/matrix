import { InterceptorHeader } from "@/components/interceptor";
import { InterceptorsClient } from "./interceptors-client";

interface PageProps {
  params: Promise<{
    workspace_code: string;
  }>;
}

export default async function InterceptorsPage({ params }: PageProps) {
  const { workspace_code } = await params;

  return (
    <div className="container py-6">
      <InterceptorHeader workspaceCode={workspace_code} />
      <div className="mt-6">
        <InterceptorsClient workspaceCode={workspace_code} />
      </div>
    </div>
  );
}
