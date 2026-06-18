/**
 * Auth Bridge Test Page
 *
 * 用于手动测试 auth-bridge 功能。
 * 模拟 Chrome Extension popup 环境，展示 postMessage 通信。
 */

"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useOrganizationStore } from "@/hooks/use-organization-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReceivedMessage = {
  type: string;
  version: number;
  status: string;
  token?: string;
  userId?: number;
  username?: string;
  workspaceCode?: string;
  workspaceId?: number;
  acquiredAt?: number;
} | null;

export default function AuthBridgeTestPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const hasOrgId = useWorkspaceStore((s) => s.hasOrgId);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

  // 当 currentWorkspaceId 存在但 currentWorkspace 为 null 时，尝试恢复 workspace
  useEffect(() => {
    if (
      currentWorkspaceId &&
      !currentWorkspace &&
      !hasOrgId &&
      !selectedOrgId
    ) {
      loadOrgUnits().then(() => {
        // loadOrgUnits 会设置 selectedOrgId，然后触发 loadWorkspaces
      });
    }
  }, [
    currentWorkspaceId,
    currentWorkspace,
    hasOrgId,
    selectedOrgId,
    loadOrgUnits,
  ]);

  // 当 orgId 变化时加载 workspaces
  useEffect(() => {
    if (selectedOrgId) {
      loadWorkspaces(selectedOrgId);
    }
  }, [selectedOrgId, loadWorkspaces]);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>(
    [],
  );

  // 监听 postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // 简单校验：只接受来自当前域的消息
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data?.type === "user_info" && data?.version === 1) {
        setReceivedMessages((prev) => [data, ...prev].slice(0, 10));
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // 构建 iframe URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const iframeUrl = `${baseUrl}/auth-bridge/user-info`;

  const loadIframe = () => {
    setReceivedMessages([]);
    setIframeLoaded(false);
    setIframeSrc(iframeUrl);
  };

  const clearMessages = () => {
    setReceivedMessages([]);
    // 同时清空 iframeSrc，下次加载时重新创建 iframe
    setIframeSrc("");
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Auth Bridge 测试</h1>

      <div className="grid gap-6">
        {/* 当前认证状态 */}
        <Card>
          <CardHeader>
            <CardTitle>当前认证状态</CardTitle>
            <CardDescription>来自 Frontend Store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "已登录" : "未登录"}
              </Badge>
              <Badge variant={currentWorkspace ? "default" : "outline"}>
                Workspace: {currentWorkspace?.name ?? "未选择"}
              </Badge>
            </div>
            {user && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>User ID: {user.user_id}</p>
                <p>Username: {user.username}</p>
                {currentWorkspace && (
                  <>
                    <p>Workspace Code: {currentWorkspace.code}</p>
                    <p>Workspace ID: {currentWorkspace.id}</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 模拟 iframe */}
        <Card>
          <CardHeader>
            <CardTitle>模拟 Chrome Extension Popup</CardTitle>
            <CardDescription>
              加载 /auth-bridge/user-info 作为隐藏 iframe，模拟 Chrome Extension
              获取认证信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={loadIframe}>加载 iframe</Button>
                <Button variant="outline" onClick={clearMessages}>
                  清除消息
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p>Iframe URL: {iframeUrl}</p>
                <p>Status: {iframeLoaded ? "已加载" : "未加载"}</p>
              </div>

              {/* 隐藏的 iframe - 只在有 src 时渲染 */}
              {iframeSrc && (
                <iframe
                  src={iframeSrc}
                  className="hidden"
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeLoaded(false)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 接收到的消息 */}
        <Card>
          <CardHeader>
            <CardTitle>接收到的 postMessage</CardTitle>
            <CardDescription>最近 10 条消息（按时间倒序）</CardDescription>
          </CardHeader>
          <CardContent>
            {receivedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                暂无消息。点击&quot;加载 iframe&quot;开始测试。
              </p>
            ) : (
              <div className="space-y-2">
                {receivedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="bg-muted p-3 rounded text-xs font-mono"
                  >
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
