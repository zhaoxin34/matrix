'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AgentSteerDemoPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('表单已提交！\n\n这是一个模拟的目标页面，Agent Steer 会录制你在上面的操作。');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Agent Steer 演示</h1>
          <p className="text-muted-foreground mt-2">
            模拟 Chrome Extension 场景：右侧的 Agent Steer 通过 iframe 嵌入此页面
          </p>
        </div>

        {/* 主内容区域 */}
        <div className="relative">
          {/* 模拟目标页面（表单） */}
          <div className="border rounded-lg p-8 bg-card text-card-foreground max-w-md">
            <h2 className="text-xl font-semibold mb-6">用户注册表单</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  提交
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({ username: '', email: '', password: '' })
                  }
                >
                  重置
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 提示：在右侧的 Agent Steer 中选择「学习模式」，然后在此表单上进行操作，
                操作会被录制下来。
              </p>
            </div>
          </div>

          {/* Agent Steer iframe 容器 */}
          <div className="absolute bottom-4 right-4">
            <div className="w-[320px] rounded-lg border bg-background shadow-lg overflow-hidden">
              <div className="p-1 bg-muted/30 border-b text-center text-xs text-muted-foreground">
                Agent Steer (iframe)
              </div>
              <iframe
                src="/agent-steer"
                className="w-full h-[400px] border-0"
                title="Agent Steer"
              />
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-2xl">
          <h3 className="text-sm font-medium mb-3">架构说明</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-background rounded border">
              <div className="font-medium mb-1">/agent-steer</div>
              <div className="text-muted-foreground">Agent Steer UI 组件（iframe 内容）</div>
            </div>
            <div className="p-3 bg-background rounded border">
              <div className="font-medium mb-1">/workspace/test/agent-steer-demo</div>
              <div className="text-muted-foreground">模拟 Chrome Extension 场景</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            在真实场景中，Chrome Extension 的 Content Script 会将 /agent-steer 通过 iframe 嵌入到目标页面。
          </div>
        </div>
      </div>
    </div>
  );
}