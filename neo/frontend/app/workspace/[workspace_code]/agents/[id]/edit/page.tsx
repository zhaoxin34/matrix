"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import type {
  SelectedSkill,
  SkillWithVersions,
  SkillVersion,
} from "@/components/agent-factory/agent-factory-types";
import {
  mockPrototypes,
  mockSkills,
  models,
} from "@/mockdata/workspace/agent-factory";
import {
  AdvancedConfigCard,
  type AdvancedConfigState,
} from "@/components/agent-factory/advanced-config";
import {
  SkillPicker,
  SelectedSkillBadge,
} from "@/components/agent-factory/skill-picker";

// Form Schema
const editAgentSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(32, "名称最多32个字符"),
  description: z.string().max(500, "描述最多500个字符").optional(),
  model: z.string().min(1, "请选择模型"),
});

type EditAgentForm = z.infer<typeof editAgentSchema>;

// Mock Agent 详情
const mockAgent = {
  id: 1,
  name: "客服助手-北京分部",
  description: "服务于北京地区的客户咨询和问题解答",
  prototype_id: 1,
  prototype_version: "1.2.0",
  model: "gpt-4o",
  skills: [
    { skill_id: 1, code: "faq", name: "FAQ 查询", selected_version: "2.1.0" },
    {
      skill_id: 2,
      code: "ticket",
      name: "工单创建",
      selected_version: "1.0.0",
    },
  ] as SelectedSkill[],
};

/**
 * Agent Factory Edit Page
 *
 * 路由: /workspace/{workspace_code}/agents/{id}/edit
 * 角色: Workspace 成员
 * 功能: 编辑 Agent 配置
 */
export default function AgentFactoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceCode = params.workspace_code as string;
  const agentId = params.id as string;

  // 获取当前 agent 对应的原型
  const prototype =
    mockPrototypes.find((p) => p.id === mockAgent.prototype_id) ?? null;

  // 已选中的技能
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>(
    mockAgent.skills,
  );

  // 高级配置
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfigState>({
    temperature: 0.7,
    maxTokens: 4096,
    thinking: "medium",
    timeout: 60,
    retryAttempts: 3,
    retryBackoff: "exponential",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditAgentForm>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      name: mockAgent.name,
      description: mockAgent.description,
      model: mockAgent.model,
    },
  });

  // 添加技能
  const handleAddSkill = useCallback(
    (skill: SkillWithVersions, version: SkillVersion) => {
      setSelectedSkills((prev) => {
        const exists = prev.find((s) => s.skill_id === skill.id);
        if (exists) {
          return prev.map((s) =>
            s.skill_id === skill.id
              ? { ...s, selected_version: version.version }
              : s,
          );
        }
        return [
          ...prev,
          {
            skill_id: skill.id,
            code: skill.code,
            name: skill.name,
            selected_version: version.version,
          },
        ];
      });
    },
    [],
  );

  // 移除技能
  const handleRemoveSkill = useCallback((skillId: number) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  }, []);

  const onSubmit = async (data: EditAgentForm) => {
    console.log("更新 Agent:", {
      id: agentId,
      ...data,
      skills: selectedSkills.map((s) => ({
        skill_id: s.skill_id,
        version: s.selected_version,
      })),
      config: {
        ...advancedConfig,
        retry: {
          max_attempts: advancedConfig.retryAttempts,
          backoff: advancedConfig.retryBackoff,
        },
      },
    });
    router.push(`/workspace/${workspaceCode}/agents/${agentId}`);
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${workspaceCode}/agents/${agentId}`}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={1.5}
                className="size-4"
              />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-heading font-medium">编辑 Agent</h1>
            <p className="text-sm text-muted-foreground mt-1">
              修改 Agent 配置和运行参数
            </p>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Prototype Info (read-only) */}
            {prototype && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">基于原型:</span>
                  <span className="font-medium">
                    {prototype.name} (v{mockAgent.prototype_version})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  原型版本在创建时锁定，如需更改请创建新的 Agent
                </p>
              </div>
            )}

            {/* Agent Name */}
            <div>
              <Label htmlFor="name" className="mb-1.5">
                Agent 名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="输入 Agent 名称"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model" className="mb-1.5">
                模型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("model")}
                onValueChange={(v) => setValue("model", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择模型..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                可覆盖原型默认的模型配置
              </p>
              {errors.model && (
                <p className="text-sm text-destructive mt-1">
                  {errors.model.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="mb-1.5">
                描述
              </Label>
              <Textarea
                id="description"
                placeholder="输入 Agent 描述（可选）"
                rows={2}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon
                icon={UserGroupIcon}
                strokeWidth={1.5}
                className="size-4"
              />
              选择技能
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 技能选择器 */}
            <SkillPicker
              skills={mockSkills}
              selectedSkills={selectedSkills}
              onAddSkill={handleAddSkill}
            />

            {/* 已选技能 */}
            {selectedSkills.length > 0 ? (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  已选择 ({selectedSkills.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <SelectedSkillBadge
                      key={skill.skill_id}
                      skill={skill}
                      onRemove={handleRemoveSkill}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                点击上方按钮选择技能，已选择的技能将显示在这里
              </p>
            )}
          </CardContent>
        </Card>

        {/* Advanced Config Card */}
        <AdvancedConfigCard
          value={advancedConfig}
          onChange={setAdvancedConfig}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" asChild>
            <Link href={`/workspace/${workspaceCode}/agents/${agentId}`}>
              取消
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            保存更改
          </Button>
        </div>
      </form>
    </div>
  );
}
