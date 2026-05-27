"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { SunIcon, MoonIcon, GearsIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ThemeDemoPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // 当前主题状态
  const currentTheme = React.useMemo(() => {
    if (theme === "system") return `系统偏好 (${resolvedTheme})`;
    return theme === "dark" ? "深色" : "浅色";
  }, [theme, resolvedTheme]);

  // 切换主题
  function handleThemeChange(value: string) {
    setTheme(value);
    toast.success(
      `主题已切换为: ${value === "dark" ? "深色" : value === "light" ? "浅色" : "跟随系统"}`,
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">主题演示</h1>
        <p className="text-muted-foreground mt-2">
          演示如何在项目中使用明暗主题切换功能。项目使用 next-themes 实现。
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline">当前主题</Badge>
          <Badge variant="secondary">{currentTheme}</Badge>
        </div>
      </div>

      <div className="space-y-8">
        {/* 方式一：快捷键切换 */}
        <Card>
          <CardHeader>
            <CardTitle>方式一：快捷键切换</CardTitle>
            <CardDescription>按下键盘上的 D 键快速切换主题</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2">
                <kbd className="rounded bg-background px-2 py-1 text-xs font-semibold">
                  D
                </kbd>
                <span className="text-sm text-muted-foreground">切换主题</span>
              </div>
              <p className="text-sm text-muted-foreground">
                在非输入状态下按 D 键即可切换（输入框、文本域等除外）
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 方式二：单选按钮组 */}
        <Card>
          <CardHeader>
            <CardTitle>方式二：单选按钮组</CardTitle>
            <CardDescription>使用 RadioGroup 组件选择主题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={theme}
              onValueChange={handleThemeChange}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {/* 浅色主题 */}
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value="light"
                  id="theme-light"
                  className="mt-1"
                />
                <Label
                  htmlFor="theme-light"
                  className="flex cursor-pointer flex-col gap-2"
                >
                  <span className="font-medium">浅色模式</span>
                  <span className="rounded-lg border border-border bg-background p-4">
                    <HugeiconsIcon
                      icon={SunIcon}
                      className="size-8 text-amber-500"
                    />
                    <div className="mt-2 h-2 w-16 rounded bg-foreground" />
                    <div className="mt-1 h-2 w-12 rounded bg-muted" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    适用于光线充足的环境
                  </span>
                </Label>
              </div>

              {/* 深色主题 */}
              <div className="flex items-start gap-3">
                <RadioGroupItem value="dark" id="theme-dark" className="mt-1" />
                <Label
                  htmlFor="theme-dark"
                  className="flex cursor-pointer flex-col gap-2"
                >
                  <span className="font-medium">深色模式</span>
                  <span className="rounded-lg border border-border bg-[#1a1a1a] p-4 text-white">
                    <HugeiconsIcon
                      icon={MoonIcon}
                      className="size-8 text-indigo-400"
                    />
                    <div className="mt-2 h-2 w-16 rounded bg-white" />
                    <div className="mt-1 h-2 w-12 rounded bg-gray-600" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    减少眼睛疲劳，适合夜间使用
                  </span>
                </Label>
              </div>

              {/* 跟随系统 */}
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value="system"
                  id="theme-system"
                  className="mt-1"
                />
                <Label
                  htmlFor="theme-system"
                  className="flex cursor-pointer flex-col gap-2"
                >
                  <span className="font-medium">跟随系统</span>
                  <span className="rounded-lg border border-border bg-gradient-to-r from-background to-[#1a1a1a] p-4">
                    <HugeiconsIcon
                      icon={GearsIcon}
                      className="size-8 text-muted-foreground"
                    />
                    <div className="mt-2 h-2 w-16 rounded bg-gradient-to-r from-foreground to-white" />
                    <div className="mt-1 h-2 w-12 rounded bg-muted" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    根据设备设置自动切换
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 方式三：按钮切换 */}
        <Card>
          <CardHeader>
            <CardTitle>方式三：切换按钮</CardTitle>
            <CardDescription>
              在 Header 或 Footer 中放置主题切换按钮
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                <HugeiconsIcon
                  icon={SunIcon}
                  data-icon="inline-start"
                  strokeWidth={2}
                  className="size-4"
                />
                浅色
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                <HugeiconsIcon
                  icon={MoonIcon}
                  data-icon="inline-start"
                  strokeWidth={2}
                  className="size-4"
                />
                深色
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
              >
                <HugeiconsIcon
                  icon={GearsIcon}
                  data-icon="inline-start"
                  strokeWidth={2}
                  className="size-4"
                />
                跟随系统
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 代码示例 */}
        <Card>
          <CardHeader>
            <CardTitle>使用代码</CardTitle>
            <CardDescription>如何在组件中使用主题</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <pre className="overflow-x-auto text-muted-foreground">
                {`// 1. 导入 useTheme hook
import { useTheme } from "next-themes"

// 2. 在组件中使用
function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // theme: "light" | "dark" | "system"
  // resolvedTheme: "light" | "dark" (实际解析后的主题)
  
  return (
    <button onClick={() => setTheme("dark")}>
      切换到深色
    </button>
  )
}

// 3. 在 CSS 中使用
// 使用 Tailwind 的 dark: 前缀
<div className="bg-white dark:bg-black">
  深色模式下背景变为黑色
</div>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 深色模式样式指南 */}
        <Card>
          <CardHeader>
            <CardTitle>深色模式样式指南</CardTitle>
            <CardDescription>在项目中正确使用深色模式的技巧</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">✅ 推荐做法</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  使用语义化颜色：<code>bg-background</code>,{" "}
                  <code>text-foreground</code>
                </li>
                <li>
                  使用 dark: 前缀：<code>dark:bg-card</code>,{" "}
                  <code>dark:text-foreground</code>
                </li>
                <li>组件会自动处理颜色适配</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">❌ 避免做法</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  硬编码颜色：<code>bg-white</code>, <code>bg-black</code>
                </li>
                <li>
                  使用具体颜色值：<code>text-blue-500</code>
                </li>
                <li>在组件内覆盖颜色样式</li>
              </ul>
            </div>

            <Separator />

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-2 font-medium">示例对比</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">
                    ❌ 不推荐
                  </p>
                  <code className="block rounded bg-muted p-2 text-xs">
                    bg-white dark:bg-gray-900
                  </code>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-600">✅ 推荐</p>
                  <code className="block rounded bg-muted p-2 text-xs">
                    bg-background dark:bg-card
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主题颜色变量 */}
        <Card>
          <CardHeader>
            <CardTitle>可用颜色变量</CardTitle>
            <CardDescription>在 globals.css 中定义的主题颜色</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "background", var: "--background", desc: "页面背景" },
                { name: "foreground", var: "--foreground", desc: "主要文本" },
                { name: "primary", var: "--primary", desc: "主色调" },
                { name: "secondary", var: "--secondary", desc: "次要色" },
                { name: "muted", var: "--muted", desc: "次要背景" },
                { name: "accent", var: "--accent", desc: "强调色" },
                {
                  name: "destructive",
                  var: "--destructive",
                  desc: "危险/错误",
                },
                { name: "border", var: "--border", desc: "边框颜色" },
                { name: "card", var: "--card", desc: "卡片背景" },
                { name: "popover", var: "--popover", desc: "弹出层背景" },
                { name: "ring", var: "--ring", desc: "焦点环" },
              ].map((color) => (
                <div
                  key={color.name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
                >
                  <div
                    className="size-8 rounded border border-border"
                    style={{
                      backgroundColor: `var(${color.var})`,
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{color.desc}</span>
                    <code className="text-xs text-muted-foreground">
                      {color.var}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
