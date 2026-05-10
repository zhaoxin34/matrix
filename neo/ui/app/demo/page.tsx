import { HugeiconsIcon } from "@hugeicons/react";
import { ListPlusIcon, ColorsIcon } from "@hugeicons/core-free-icons";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const demos = [
	{
		href: "/demo/form",
		title: "表单演示",
		description:
			"学习 shadcn/ui 表单组件的使用，包括 Input、Select、RadioGroup、Checkbox、Switch 等多种控件。",
		icon: ListPlusIcon,
		tags: ["表单", "验证", "Zod"],
	},
	{
		href: "/demo/theme",
		title: "主题演示",
		description:
			"了解项目中的明暗主题切换功能，学习如何使用 next-themes 和语义化颜色。",
		icon: ColorsIcon,
		tags: ["主题", "暗色模式", "CSS"],
	},
];

export default function DemoIndexPage() {
	return (
		<div className="container mx-auto max-w-4xl py-10 px-4">
			{/* 页面标题 */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">组件演示</h1>
				<p className="text-muted-foreground mt-2">
					通过实际示例学习 shadcn/ui 组件的使用方法和最佳实践。
				</p>
			</div>

			{/* 演示列表 */}
			<div className="grid gap-6 sm:grid-cols-2">
				{demos.map((demo) => (
					<Card
						key={demo.href}
						className="group relative overflow-hidden transition-colors hover:border-primary/50"
					>
						<CardHeader>
							<div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
								<HugeiconsIcon
									icon={demo.icon}
									strokeWidth={2}
									className="size-6 text-muted-foreground"
								/>
							</div>
							<CardTitle className="group-hover:text-primary">
								{demo.title}
							</CardTitle>
							<CardDescription>{demo.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="mb-4 flex flex-wrap gap-2">
								{demo.tags.map((tag) => (
									<span
										key={tag}
										className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
									>
										{tag}
									</span>
								))}
							</div>
							<Button asChild className="w-full">
								<Link href={demo.href}>打开演示</Link>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
