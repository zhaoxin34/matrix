import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col gap-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Neo UI 组件演示</h1>
          <p className="text-muted-foreground mt-2">
            基于 shadcn/ui 的 Next.js 组件演示项目
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/demo">查看演示</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/demo/form">表单演示</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/demo/theme">主题演示</Link>
          </Button>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          (按 <kbd className="rounded bg-muted px-1.5 py-0.5">d</kbd>{" "}
          切换明暗主题)
        </p>
      </div>
    </div>
  );
}
