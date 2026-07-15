"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function KnlgBaseHome() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const modules = [
    {
      title: "问答库",
      description: "问题、访谈、问答库",
      href: "qa",
      icon: "💬",
    },
    {
      title: "AI 访谈",
      description: "AI 驱动的专家访谈",
      href: "qa/agent-interview",
      icon: "🤖",
    },
    {
      title: "知识库",
      description: "结构化知识卡片",
      href: "knowledge",
      icon: "📚",
    },
    {
      title: "规则库",
      description: "可执行规则定义",
      href: "rules",
      icon: "⚙️",
    },
    {
      title: "Prompt 模板",
      description: "Prompt 版本管理与编辑",
      href: "prompts",
      icon: "📝",
    },
    {
      title: "知识导入",
      description: "文档与导入任务",
      href: "import",
      icon: "📥",
    },
    {
      title: "Agent 映射",
      description: "type 与 Agent 实例绑定",
      href: "agent-mappings",
      icon: "🔗",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">知识库与问答库</h1>
      <p className="text-muted-foreground mb-6">
        把专家经验沉淀为 AI 可用决策记忆
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={
              `/workspace/${workspaceCode}/knlg-base/${m.href}` as `/${string}`
            }
            className="block"
          >
            <Card className="h-full hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <div className="text-4xl mb-2">{m.icon}</div>
                <CardTitle>{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
