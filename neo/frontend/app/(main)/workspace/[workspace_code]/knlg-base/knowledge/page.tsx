"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KnowledgeCardItem } from "@/components/knlg-base/KnowledgeCardItem";
import { EmptyState } from "@/components/knlg-base/EmptyState";
import {
  listKnowledgeCards,
  publishKnowledgeCard,
  deprecateKnowledgeCard,
  deleteKnowledgeCard,
} from "@/lib/api/knlg-base/knowledge";
import type {
  KnowledgeCard,
  KnowledgeCardListResponse,
} from "@/lib/api/knlg-base/_base";

export default function KnowledgeListPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;

  const [items, setItems] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data: KnowledgeCardListResponse = await listKnowledgeCards(
        workspaceCode,
        {
          keyword: keyword || undefined,
          status: statusFilter || undefined,
        },
      );
      setItems(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublish = async (id: number) => {
    await publishKnowledgeCard(workspaceCode, id);
    fetchData();
  };
  const handleDeprecate = async (id: number) => {
    await deprecateKnowledgeCard(workspaceCode, id);
    fetchData();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("确认删除？")) return;
    await deleteKnowledgeCard(workspaceCode, id);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">知识库</h1>
        <Button asChild>
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/knowledge/cards/new` as `/${string}`
            }
          >
            新建卡片
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="搜索标题/陈述/条件"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          className="max-w-xs"
        />
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setTimeout(fetchData, 0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="reviewing">审核中</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="deprecated">已废弃</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="暂无知识卡片"
          description="点击右上角创建你的第一张知识卡片"
          action={
            <Button asChild>
              <Link
                href={
                  `/workspace/${workspaceCode}/knlg-base/knowledge/cards/new` as `/${string}`
                }
              >
                创建卡片
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((card) => (
            <KnowledgeCardItem
              key={card.id}
              card={card}
              workspaceCode={workspaceCode}
              onPublish={handlePublish}
              onDeprecate={handleDeprecate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
