"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { toast } from "sonner";
import { mockSkills, models } from "@/mockdata/workspace/agent-factory";
import {
  listAgentPrototypes,
  getVersionHistory,
} from "@/lib/api/agent-prototype";
import { createAgent } from "@/lib/api/agent";
import { PrototypePicker } from "@/components/agent-factory/prototype-picker";
import {
  AdvancedConfigCard,
  defaultAdvancedConfig,
  type AdvancedConfigState,
} from "@/components/agent-factory/advanced-config";
import {
  SkillPicker,
  SelectedSkillBadge,
} from "@/components/agent-factory/skill-picker";
import type {
  SelectablePrototype,
  SkillWithVersions,
  SkillVersion,
  SelectedSkill,
} from "@/components/agent-factory/agent-factory-types";

const createAgentSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(32, "名称最多32个字符"),
  description: z.string().max(500, "描述最多500个字符").optional(),
  prototype_id: z.number().min(1, "请选择原型"),
  prototype_version: z.string().min(1, "请选择版本"),
  model: z.string().min(1, "请选择模型"),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

export default function AgentFactoryCreatePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceCode = params.workspace_code as string;

  const [selectedPrototype, setSelectedPrototype] =
    useState<SelectablePrototype | null>(null);
  const [selectedPrototypeId, setSelectedPrototypeId] = useState<number | null>(
    null,
  );
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfigState>(
    defaultAdvancedConfig,
  );
  const [prototypes, setPrototypes] = useState<SelectablePrototype[]>([]);
  const [loadingPrototypes, setLoadingPrototypes] = useState(true);

  useEffect(() => {
    async function fetchPrototypes() {
      try {
        setLoadingPrototypes(true);
        const response = await listAgentPrototypes({
          status: "enabled",
          page_size: 100,
        });
        const selectablePrototypes: SelectablePrototype[] = response.items.map(
          (p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            description: p.description || "",
            current_version: p.version || "1.0.0",
            versions: [],
            model: p.model,
          }),
        );
        setPrototypes(selectablePrototypes);
      } catch (error) {
        console.error("获取原型失败:", error);
      } finally {
        setLoadingPrototypes(false);
      }
    }
    fetchPrototypes();
  }, []);

  useEffect(() => {
    if (!selectedPrototypeId) return;
    async function fetchVersions() {
      try {
        const versionResponse = await getVersionHistory(selectedPrototypeId!);
        setSelectedPrototype((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            versions: versionResponse.items.map((v) => ({
              id: v.id,
              version: v.version,
              change_summary: v.change_summary,
              created_at: v.created_at,
            })),
          };
        });
      } catch (error) {
        console.error("获取版本失败:", error);
      }
    }
    fetchVersions();
  }, [selectedPrototypeId]);

  const prototypeMap = useMemo(
    () => new Map(prototypes.map((p) => [p.id, p])),
    [prototypes],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      prototype_id: 0,
      prototype_version: "",
      model: "",
    },
  });

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

  const handleRemoveSkill = useCallback((skillId: number) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  }, []);

  const onSubmit = async (data: CreateAgentForm) => {
    try {
      await createAgent(workspaceCode, {
        name: data.name,
        description: data.description,
        prototype_id: data.prototype_id,
        prototype_version: data.prototype_version,
        model: data.model,
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
      toast.success("Agent 创建成功");
      router.push(`/workspace/${workspaceCode}/agents`);
    } catch (error) {
      console.error("创建 Agent 失败:", error);
      toast.error(error instanceof Error ? error.message : "创建 Agent 失败");
    }
  };

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          toast.error("表单验证失败，请检查输入");
        })}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${workspaceCode}/agents`}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={1.5}
                className="size-4"
              />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-heading font-medium">创建 Agent</h1>
            <p className="text-sm text-muted-foreground mt-1">
              基于 Prototype 创建新的 Agent 实例
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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

            <div>
              <Label className="mb-1.5">
                原型 <span className="text-destructive">*</span>
              </Label>
              {loadingPrototypes ? (
                <div className="text-sm text-muted-foreground">加载中...</div>
              ) : prototypes.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  暂无可用原型
                </div>
              ) : (
                <PrototypePicker
                  prototypes={prototypes}
                  selectedPrototype={selectedPrototype}
                  onSelect={(prototypeId, version) => {
                    const prototype = prototypeMap.get(prototypeId);
                    if (prototype) {
                      const actualVersion =
                        version === "latest"
                          ? prototype.current_version
                          : version;
                      setSelectedPrototypeId(prototypeId);
                      setSelectedPrototype(prototype);
                      setValue("prototype_id", prototypeId, {
                        shouldValidate: true,
                      });
                      setValue("prototype_version", actualVersion, {
                        shouldValidate: true,
                      });
                      setValue("model", prototype.model, {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              )}
              {selectedPrototype?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPrototype.description}
                </p>
              )}
            </div>

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
              {selectedPrototype && (
                <p className="text-sm text-muted-foreground mt-1">
                  原型默认: {selectedPrototype.model}
                </p>
              )}
              {errors.model && (
                <p className="text-sm text-destructive mt-1">
                  {errors.model.message}
                </p>
              )}
            </div>

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
            <SkillPicker
              skills={mockSkills}
              selectedSkills={selectedSkills}
              onAddSkill={handleAddSkill}
            />
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

        <AdvancedConfigCard
          value={advancedConfig}
          onChange={setAdvancedConfig}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" asChild>
            <Link href={`/workspace/${workspaceCode}/agents`}>取消</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            创建 Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
