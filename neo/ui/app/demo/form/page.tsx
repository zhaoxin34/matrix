"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel02Icon,
  FileUploadIcon,
} from "@hugeicons/core-free-icons";

// 定义表单验证 schema
const formSchema = z.object({
  // 基本信息
  firstName: z.string().min(2, "名字至少2个字符"),
  lastName: z.string().min(2, "姓氏至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符"),

  // 联系信息
  phone: z.string().optional(),
  country: z.string().min(1, "请选择国家"),

  // 个人偏好
  bio: z.string().max(500, "简介最多500个字符").optional(),
  website: z.string().url("请输入有效的网址").optional().or(z.literal("")),

  // 设置选项
  notifications: z.boolean().default(false),
  newsletter: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]),

  // 技能选择
  skills: z.array(z.string()).min(1, "请至少选择一项技能"),

  // 经验级别
  experience: z.string().min(1, "请选择经验级别"),
});

type FormValues = z.infer<typeof formSchema>;

// 国家列表数据
const countries = [
  { value: "cn", label: "中国" },
  { value: "us", label: "美国" },
  { value: "jp", label: "日本" },
  { value: "kr", label: "韩国" },
  { value: "gb", label: "英国" },
  { value: "de", label: "德国" },
  { value: "fr", label: "法国" },
];

// 技能列表数据
const skillOptions = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue.js" },
  { id: "angular", label: "Angular" },
  { id: "nodejs", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
];

// 经验级别数据
const experienceLevels = [
  { value: "junior", label: "初级 (0-2年)" },
  { value: "mid", label: "中级 (3-5年)" },
  { value: "senior", label: "高级 (6-10年)" },
  { value: "expert", label: "专家 (10年以上)" },
];

export default function FormDemoPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [avatar, setAvatar] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      country: "",
      bio: "",
      website: "",
      notifications: false,
      newsletter: false,
      theme: "system",
      skills: [],
      experience: "",
    },
  });

  // 监听技能变化，避免 React Hook Form 的警告
  const watchedSkills = form.watch("skills");

  // 处理表单提交
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    // 模拟 API 请求
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("表单数据:", data);
    console.log("头像:", avatar);

    toast.success("表单提交成功！", {
      description: `用户 ${data.username} 的信息已保存。`,
    });

    setIsSubmitting(false);
  }

  // 处理头像上传
  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // 处理技能复选框变化
  function handleSkillChange(
    skillId: string,
    checked: boolean | "indeterminate",
  ) {
    const current = form.getValues("skills");
    if (checked) {
      form.setValue("skills", [...current, skillId], { shouldValidate: true });
    } else {
      form.setValue(
        "skills",
        current.filter((s) => s !== skillId),
        {
          shouldValidate: true,
        },
      );
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">表单演示</h1>
        <p className="text-muted-foreground mt-2">
          这是一个综合的表单演示页面，展示了 shadcn/ui 的多种表单控件。
          适合作为表单开发的学习参考。
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>填写你的基本个人信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 头像上传 */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt="头像预览"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon
                    icon={FileUploadIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium">上传头像</p>
                <p className="text-xs text-muted-foreground">
                  点击图片区域上传，支持 JPG、PNG 格式
                </p>
              </div>
            </div>

            <Separator />

            {/* 姓名 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  名字 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="请输入名字"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  姓氏 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="请输入姓氏"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username">
                用户名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                placeholder="请输入用户名"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                邮箱 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 联系信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>联系信息</CardTitle>
            <CardDescription>填写你的联系方式（可选）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 电话 */}
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+86 138 0000 0000"
                {...form.register("phone")}
              />
            </div>

            {/* 国家 */}
            <div className="space-y-2">
              <Label htmlFor="country">
                国家 <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => form.setValue("country", value)}
                defaultValue={form.getValues("country")}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="请选择国家" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.country && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.country.message}
                </p>
              )}
            </div>

            {/* 个人网站 */}
            <div className="space-y-2">
              <Label htmlFor="website">个人网站</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.website.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 个人偏好卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>个人偏好</CardTitle>
            <CardDescription>自定义你的个人资料和偏好设置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 个人简介 */}
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                placeholder="介绍一下你自己..."
                className="min-h-[120px] resize-none"
                {...form.register("bio")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>最多500个字符</span>
                <span>{(form.watch("bio") || "").length}/500</span>
              </div>
              {form.formState.errors.bio && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>

            <Separator />

            {/* 主题选择 */}
            <div className="space-y-3">
              <Label>界面主题</Label>
              <RadioGroup
                onValueChange={(value) =>
                  form.setValue("theme", value as "light" | "dark" | "system")
                }
                defaultValue={form.getValues("theme")}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label
                    htmlFor="theme-light"
                    className="cursor-pointer font-normal"
                  >
                    浅色
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label
                    htmlFor="theme-dark"
                    className="cursor-pointer font-normal"
                  >
                    深色
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label
                    htmlFor="theme-system"
                    className="cursor-pointer font-normal"
                  >
                    跟随系统
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* 技能选择 */}
            <div className="space-y-3">
              <Label>
                技能栈 <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {skillOptions.map((skill) => (
                  <div key={skill.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill.id}`}
                      checked={watchedSkills.includes(skill.id)}
                      onCheckedChange={(checked) =>
                        handleSkillChange(skill.id, checked)
                      }
                    />
                    <Label
                      htmlFor={`skill-${skill.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {skill.label}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.skills && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.skills.message}
                </p>
              )}
            </div>

            <Separator />

            {/* 经验级别 */}
            <div className="space-y-2">
              <Label htmlFor="experience">
                工作经验 <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => form.setValue("experience", value)}
                defaultValue={form.getValues("experience")}
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder="请选择经验级别" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.experience && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.experience.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 通知设置卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
            <CardDescription>管理你的通知偏好</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 通知开关 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="notifications" className="cursor-pointer">
                  系统通知
                </Label>
                <span className="text-xs text-muted-foreground">
                  接收重要的系统更新和提醒
                </span>
              </div>
              <Switch
                id="notifications"
                checked={form.watch("notifications")}
                onCheckedChange={(checked) =>
                  form.setValue("notifications", checked)
                }
              />
            </div>

            <Separator />

            {/* 订阅开关 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="newsletter" className="cursor-pointer">
                  订阅 newsletter
                </Label>
                <span className="text-xs text-muted-foreground">
                  定期接收最新资讯和更新通知
                </span>
              </div>
              <Switch
                id="newsletter"
                checked={form.watch("newsletter")}
                onCheckedChange={(checked) =>
                  form.setValue("newsletter", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 提交区域 */}
        <Card>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setAvatar(null);
                  toast.info("表单已重置");
                }}
              >
                <HugeiconsIcon
                  icon={Cancel02Icon}
                  data-icon="inline-start"
                  strokeWidth={2}
                  className="size-4"
                />
                重置
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* 表单验证状态预览 */}
              <Badge variant={form.formState.isValid ? "default" : "secondary"}>
                {form.formState.isValid ? "已验证" : "待验证"}
              </Badge>
              <Badge variant={form.formState.isDirty ? "secondary" : "outline"}>
                {form.formState.isDirty ? "已修改" : "未修改"}
              </Badge>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    提交中...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      data-icon="inline-start"
                      strokeWidth={2}
                      className="size-4"
                    />
                    提交表单
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* Sonner Toast 组件 */}
      <Toaster position="top-right" />
    </div>
  );
}
