---
id: 03-frontend-modules
title: 03-前端模块拆分
sidebar_position: 3
author: Joky.Zhao
created: 2026-06-30
updated: 2026-06-30
version: 1.0.0
tags: [knowledge-base, technical, frontend]
---

## 1. 概述

本文档定义 Neo 平台**知识库与问答库子系统**的前端模块拆分设计。

技术栈遵循 Neo 平台统一规范：

- **框架**：Next.js 16（App Router）+ React 19
- **UI**：shadcn/ui + Tailwind CSS 4
- **状态管理**：Zustand
- **数据获取**：TanStack Query（React Query）
- **表单**：React Hook Form + Zod
- **图标**：lucide-react

详见 [前端工程架构](../arch/arch-frontend) 和 [技术架构总览](../arch/arch-overview)。

---

## 2. 路由设计

### 2.1 路由结构

```
/workspace/{code}/knlg-base/
├── /                                       # 知识库首页（统计概览）
├── /qa/                                    # 问答库
│   ├── /                                   # 问答列表/检索
│   ├── /questions/{id}                     # 问题详情（含所有访谈）
│   ├── /interviews/{id}                    # 访谈详情（对话流）
│   ├── /sessions/new                       # 新建访谈会话
│   └── /templates                          # 问题树模板管理
├── /knowledge/                             # 知识库
│   ├── /                                   # 知识卡片列表/检索
│   ├── /cards/{id}                         # 知识卡片详情
│   ├── /cards/{id}/edit                    # 知识卡片编辑
│   ├── /cards/new                          # 新建知识卡片
│   ├── /cards/{id}/versions                # 版本历史
│   └── /candidates                         # 候选知识审核
├── /rules/                                 # 规则库
│   ├── /                                   # 规则列表
│   ├── /rules/{id}                         # 规则详情
│   ├── /rules/{id}/edit                    # 规则编辑（含条件树编辑器）
│   ├── /rules/new                          # 新建规则
│   └── /rules/{id}/health                  # 规则健康度
├── /import/                                # 知识导入
│   ├── /                                   # 文档/任务列表
│   ├── /upload                             # 上传文档
│   └── /jobs/{id}                          # 导入任务详情
├── /interview/                             # AI 访谈（运行中）
│   ├── /sessions/{id}                      # 实时访谈界面
│   └── /sessions/{id}/history              # 历史访谈
└── /settings/                              # 设置
    ├── /prompts                            # Prompt 模板管理
    └── /llm                                # LLM Provider / Model 管理
```

### 2.2 路由保护

所有路由需要：

- 已登录（JWT Token 有效）
- 有当前 Workspace 访问权限
- 按 UI 权限矩阵控制按钮可见性

---

## 3. 模块拆分

### 3.1 目录结构

```
src/
├── app/
│   └── workspace/
│       └── [code]/
│           └── knlg-base/
│               ├── layout.tsx                # knlg-base 子布局
│               ├── page.tsx                 # 首页（统计概览）
│               ├── qa/                      # 问答库路由
│               ├── knowledge/               # 知识库路由
│               ├── rules/                   # 规则库路由
│               ├── import/                  # 知识导入路由
│               └── interview/               # AI 访谈路由
├── modules/
│   └── knlg-base/
│       ├── components/                      # 公共组件
│       │   ├── QaCard.tsx
│       │   ├── KnowledgeCardItem.tsx
│       │   ├── RuleConditionTree.tsx
│       │   ├── SourceRefList.tsx
│       │   ├── ConfidenceBadge.tsx
│       │   └── ...
│       ├── hooks/                           # 自定义 hooks
│       │   ├── useQuestions.ts
│       │   ├── useKnowledgeCards.ts
│       │   ├── useInterview.ts
│       │   └── ...
│       ├── stores/                          # Zustand stores
│       │   ├── qaStore.ts
│       │   ├── knowledgeStore.ts
│       │   ├── interviewStore.ts
│       │   └── ...
│       ├── schemas/                         # Zod schemas
│       │   ├── question.schema.ts
│       │   ├── knowledge-card.schema.ts
│       │   └── ...
│       ├── api/                             # API 客户端
│       │   ├── questions.ts
│       │   ├── knowledge.ts
│       │   ├── rules.ts
│       │   └── ...
│       └── types/                           # TypeScript 类型
│           ├── question.ts
│           ├── knowledge-card.ts
│           └── ...
├── components/                              # 全局公共组件
└── lib/                                     # 工具库
```

### 3.2 模块边界

| 模块 | 职责 | 不做 |
| --- | --- | --- |
| `app/workspace/[code]/knlg-base/` | 路由 + 页面容器 | 业务逻辑 |
| `modules/knlg-base/components/` | 可复用 UI 组件 | 数据获取 |
| `modules/knlg-base/hooks/` | 数据获取 + 业务逻辑封装 | UI 渲染 |
| `modules/knlg-base/stores/` | 跨页面共享状态 | 数据持久化 |
| `modules/knlg-base/api/` | API 调用 | UI 状态 |
| `modules/knlg-base/schemas/` | 类型 + 校验 | 业务逻辑 |

---

## 4. 核心页面设计

### 4.1 知识库首页（统计概览）

**路径**：`/workspace/{code}/knlg-base/`

```text
┌──────────────────────────────────────────────────┐
│ 知识库                              [新建+]      │
├──────────────────────────────────────────────────┤
│ 📊 统计概览                                       │
│ ┌──────────┬──────────┬──────────┬────────────┐ │
│ │ 问答单元  │ 知识卡片  │ 活跃规则  │ 文档导入  │ │
│ │  412     │  156     │   42    │   8       │ │
│ └──────────┴──────────┴──────────┴────────────┘ │
│                                                    │
│ 🎯 高价值知识（Top 10）                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ 假商机识别   confidence 0.85  [已验证]      │ │
│ │ 客户流失预警 confidence 0.78  [已验证]      │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ 📈 待办                                            │
│ ┌──────────────────────────────────────────────┐ │
│ │ • 5 条候选知识待审核                          │ │
│ │ • 3 条规则需要复审                            │ │
│ │ • 1 条访谈待总结                              │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 4.2 问题详情页

**路径**：`/workspace/{code}/knlg-base/qa/questions/{id}`

**核心组件**：

- `QuestionHeader`：问题基本信息
- `InterviewList`：相关访谈列表
- `QaTimeline`：所有 QA 按访谈分组
- `KnowledgeCardFromThisQuestion`：派生出的知识卡片

### 4.3 访谈详情页（核心交互页）

**路径**：`/workspace/{code}/knlg-base/qa/interviews/{id}`

```text
┌──────────────────────────────────────────────────┐
│ ← 返回 | 访谈详情                       [⋮]       │
├──────────────────────────────────────────────────┤
│ 主题：销售方法论访谈                                 │
│ 专家：王总监 | AI 访谈模式 | 2026-06-30 10:00      │
│                                                    │
│ 📊 AI 自动总结                                       │
│ ┌──────────────────────────────────────────────┐ │
│ │ 本次访谈中，专家强调了 3 个核心判断：          │ │
│ │ 1. 制造业客户更易成交                         │ │
│ │ 2. 改会 3 次以上需要主动升级                  │ │
│ │ 3. 决策人不露面是核心信号                     │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ 💬 对话流                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ Q1 [initial] 什么样的客户最值得跟？            │ │
│ │ A1 制造业客户通常更易成交...                  │ │
│ │   🏷️ industry_manufacturing                    │ │
│ │   [👍] [👎] [引用] [标记反例]                  │ │
│ │ ─────────────────────────────────────────── │ │
│ │ Q2 [followup] 为什么制造业客户更好成？        │ │
│ │ A2 因为采购流程规范...                        │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ 🔗 关联资源                                          │
│ ┌──────────────────────────────────────────────┐ │
│ │ • 知识卡片：假商机识别 [查看]                  │ │
│ │ • 业务案例：OPP-1003 [查看]                   │ │
│ │ • 引用问答：QA-205 [查看]                     │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 4.4 AI 访谈实时交互页（最复杂）

**路径**：`/workspace/{code}/knlg-base/interview/sessions/{id}`

```text
┌──────────────────────────────────────────────────┐
│ 销售方法论访谈 · AI 访谈中                [结束]  │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─ 消息区域 ──────────────────────────────────┐│
│  │                                                ││
│  │  AI: 您好王总监。我会围绕销售判断访谈您...    ││
│  │                                                ││
│  │  AI: 什么样的客户最值得跟？为什么？           ││
│  │                                                ││
│  │  专家: 制造业客户更好成。                       ││
│  │                                                ││
│  │  AI: ◌◌◌ thinking...                          ││
│  │  AI: 能举 1-2 个具体例子吗？                   ││
│  │  💡 追问原因：要求案例                         ││
│  │  🏷️ 检测到信号：industry_manufacturing         ││
│  │                                                ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  ┌─ 输入框 ──────────────────────────────────────┐│
│  │ 请输入回答...                                  ││
│  │                                                ││
│  │ [🎤 语音输入 (v2)]    [发送 (Enter)]         ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  📊 进度                                            │
│  已完成 5/12 问题 | 预计剩余 18 分钟              │
│  ▓▓▓▓▓▓▓░░░░░                                     │
└──────────────────────────────────────────────────┘
```

**关键交互**：

- SSE 流式接收 AI 响应
- 追问原因显示
- 实时信号检测展示
- 进度条
- 键盘快捷键（Enter 发送）

### 4.5 规则编辑器（核心复杂交互）

**路径**：`/workspace/{code}/knlg-base/rules/{id}/edit`

```text
┌──────────────────────────────────────────────────┐
│ ← 返回 | 编辑规则                          [保存]  │
├─────────────────────────┬────────────────────────┤
│ 📌 基本信息              │ 👁 实时预览             │
│ 名称：[           ]      │ {                      │
│ 描述：[           ]      │   "name": "...",       │
│ 来源 KC：[select]        │   "trigger": {...},    │
│ 置信度：[───●───] 0.82  │   "conditions": {...}  │
│                          │ }                      │
│ 🎯 触发器                │                        │
│ 类型：[Event 订阅 ▼]    │                        │
│ Event：[opportunity.    │                        │
│   stage_changed ▼]      │                        │
│ Filter:                 │                        │
│   ┌─────────────────┐  │                        │
│   │days_in_stage ≥ 60│  │                        │
│   ├─────────────────┤  │                        │
│   │customer_type =  │  │                        │
│   │enterprise_民营   │  │                        │
│   └─────────────────┘  │                        │
│ [+ 添加条件]            │                        │
│                          │                        │
│ ⚙ 评估条件              │                        │
│ (类似触发器)            │                        │
│                          │                        │
│ 🎬 结论                  │                        │
│ 动作：[推送通知 ▼]      │                        │
│ 风险等级：[中 ▼]        │                        │
│ 通知标题：[           ]  │                        │
│ 通知内容：[           ]  │                        │
│                          │                        │
│ 🚫 例外                  │                        │
│                          │                        │
└─────────────────────────┴────────────────────────┘
```

**关键组件**：

- `RuleConditionTree`：可视化条件树
- `RuleJsonPreview`：实时 JSON 预览
- `RuleTestRunner`：用示例数据测试

### 4.6 候选知识审核页

**路径**：`/workspace/{code}/knlg-base/knowledge/candidates`

```text
┌──────────────────────────────────────────────────┐
│ 候选知识审核 (12 待审)         [筛选 ▼] [批量操作] │
├──────────────────────────────────────────────────┤
│ ┌─ 候选 1 ─────────────────────────────────────┐│
│ │ 来源：销售SOP_v3.docx                         ││
│ │ 标题：客户改会 3 次以上需主动升级             ││
│ │ confidence: 0.68  ⚠️ pending_validation       ││
│ │                                                ││
│ │ 📝 AI 抽取:                                    ││
│ │ conditions: meeting_reschedule_count >= 3     ││
│ │ action: escalate                              ││
│ │                                                ││
│ │ 📄 原文:                                        ││
│ │ "客户改会 3 次以上需主动升级..."              ││
│ │                                                ││
│ │ [✓ 通过] [✗ 拒绝] [🔄 触发访谈] [✎ 编辑]      ││
│ └────────────────────────────────────────────────┘│
│ ┌─ 候选 2 ─────────────────────────────────────┐│
│ └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## 5. 状态管理（Zustand）

### 5.1 全局 Store 设计

```typescript
// stores/qaStore.ts
interface QaStoreState {
  // 当前活跃的访谈会话
  activeSessionId: string | null;

  // 当前访谈的实时消息
  messages: InterviewMessage[];

  // 当前访谈的实时信号
  signals: DetectedSignal[];

  // 进度
  progress: {
    current: number;
    total: number;
  };

  // Actions
  setActiveSession: (id: string | null) => void;
  appendMessage: (msg: InterviewMessage) => void;
  appendSignal: (sig: DetectedSignal) => void;
  updateProgress: (current: number, total: number) => void;
  reset: () => void;
}
```

```typescript
// stores/interviewStore.ts
interface InterviewStoreState {
  // SSE 连接状态
  connectionStatus: 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

  // 当前 AI 思考状态
  isAiThinking: boolean;

  // 当前追问原因
  lastFollowupReason: string | null;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setAiThinking: (thinking: boolean) => void;
}
```

```typescript
// stores/knowledgeStore.ts
interface KnowledgeStoreState {
  // 当前正在编辑的知识卡片
  editingCard: Partial<KnowledgeCard> | null;

  // 编辑器是否处于未保存状态
  isDirty: boolean;

  // Actions
  setEditingCard: (card: Partial<KnowledgeCard> | null) => void;
  markDirty: () => void;
  clearDirty: () => void;
}
```

### 5.2 持久化策略

| Store | 持久化 | 说明 |
| --- | --- | --- |
| `qaStore` | 不持久化 | 会话内状态 |
| `interviewStore` | localStorage（恢复中断） | 异常崩溃可恢复 |
| `knowledgeStore` | 不持久化 | 编辑状态由 RHF 管理 |

---

## 6. 数据获取（TanStack Query）

### 6.1 Query Key 规范

```typescript
// 统一的 query key 工厂
export const qk = {
  qa: {
    all: ['knlg-base', 'qa'] as const,
    questions: (workspaceId: string) =>
      [...qk.qa.all, workspaceId, 'questions'] as const,
    question: (workspaceId: string, id: string) =>
      [...qk.qa.questions(workspaceId), id] as const,
    interviews: (workspaceId: string) =>
      [...qk.qa.all, workspaceId, 'interviews'] as const,
    interview: (workspaceId: string, id: string) =>
      [...qk.qa.interviews(workspaceId), id] as const,
    qaUnits: (workspaceId: string) =>
      [...qk.qa.all, workspaceId, 'qa-units'] as const,
  },
  knowledge: {
    all: ['knlg-base', 'knowledge'] as const,
    cards: (workspaceId: string) =>
      [...qk.knowledge.all, workspaceId, 'cards'] as const,
    card: (workspaceId: string, id: string) =>
      [...qk.knowledge.cards(workspaceId), id] as const,
    candidates: (workspaceId: string) =>
      [...qk.knowledge.all, workspaceId, 'candidates'] as const,
  },
  rules: {
    all: ['knlg-base', 'rules'] as const,
    rules: (workspaceId: string) =>
      [...qk.rules.all, workspaceId, 'rules'] as const,
    rule: (workspaceId: string, id: string) =>
      [...qk.rules.rules(workspaceId), id] as const,
    health: (workspaceId: string, id: string) =>
      [...qk.rules.rule(workspaceId, id), 'health'] as const,
  },
};
```

### 6.2 通用 Hooks

```typescript
// hooks/useQuestions.ts
export function useQuestions(params: QuestionListParams) {
  return useQuery({
    queryKey: qk.qa.questions(workspaceId),
    queryFn: () => api.getQuestions(params),
    staleTime: 30_000,
  });
}

// hooks/useInterview.ts
export function useInterview(id: string) {
  return useQuery({
    queryKey: qk.qa.interview(workspaceId, id),
    queryFn: () => api.getInterview(id),
    staleTime: 60_000,
  });
}

// hooks/useKnowledgeCard.ts
export function useKnowledgeCard(id: string) {
  return useQuery({
    queryKey: qk.knowledge.card(workspaceId, id),
    queryFn: () => api.getKnowledgeCard(id),
    staleTime: 60_000,
  });
}

// hooks/useRule.ts
export function useRule(id: string) {
  return useQuery({
    queryKey: qk.rules.rule(workspaceId, id),
    queryFn: () => api.getRule(id),
    staleTime: 60_000,
  });
}
```

### 6.3 Mutation 通用模式

```typescript
// 通用 mutation 模式
export function useCreateKnowledgeCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createKnowledgeCard,
    onSuccess: (data) => {
      // 失效知识卡片列表
      queryClient.invalidateQueries({ queryKey: qk.knowledge.cards(workspaceId) });
      // 失效首页统计
      queryClient.invalidateQueries({ queryKey: ['knlg-base', 'stats'] });
    },
  });
}
```

### 6.4 乐观更新策略

| 操作 | 是否乐观更新 | 理由 |
| --- | --- | --- |
| 点赞 / 点踩 | ✅ | 用户体验优先 |
| QA 引用添加 | ✅ | 立即可见 |
| 知识卡片编辑 | ❌ | 涉及版本，保守 |
| 规则发布 | ❌ | 关键操作，安全优先 |

---

## 7. SSE 流式响应处理（AI 访谈）

### 7.1 EventSource Hook

```typescript
// hooks/useInterviewSSE.ts
export function useInterviewSSE(sessionId: string) {
  const queryClient = useQueryClient();
  const interviewStore = useInterviewStore();
  const qaStore = useQaStore();

  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(
      `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/sessions/${sessionId}/stream`
    );

    eventSource.addEventListener('question', (event) => {
      const msg = JSON.parse(event.data);
      qaStore.appendMessage({ type: 'ai-question', ...msg });
    });

    eventSource.addEventListener('signal_detected', (event) => {
      const signal = JSON.parse(event.data);
      qaStore.appendSignal(signal);
    });

    eventSource.addEventListener('thinking', () => {
      interviewStore.setAiThinking(true);
    });

    eventSource.addEventListener('done', () => {
      interviewStore.setConnectionStatus('completed');
      // 失效访谈缓存
      queryClient.invalidateQueries({ queryKey: qk.qa.interview(workspaceId, sessionId) });
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      interviewStore.setConnectionStatus('error');
      eventSource.close();
    });

    return () => eventSource.close();
  }, [sessionId, workspaceId]);
}
```

### 7.2 重连策略

```typescript
// 自动重连（最多 3 次）
eventSource.addEventListener('error', async () => {
  if (reconnectAttempts < 3) {
    reconnectAttempts++;
    await delay(1000 * reconnectAttempts);
    // 重连逻辑
  } else {
    interviewStore.setConnectionStatus('error');
  }
});
```

---

## 8. 表单设计

### 8.1 知识卡片编辑表单

```typescript
// schemas/knowledge-card.schema.ts
export const knowledgeCardSchema = z.object({
  title: z.string().min(1).max(255),
  statement: z.string().min(10),
  domain: z.string().min(1),
  type: z.enum(['judgement', 'risk', 'opportunity', 'process', 'communication', 'competitive']),
  key_signals: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  conditions: z.string().optional(),
  exceptions: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

// 在组件中使用
const form = useForm<KnowledgeCardFormData>({
  resolver: zodResolver(knowledgeCardSchema),
  defaultValues: { ... },
});

const mutation = useCreateKnowledgeCard();

const onSubmit = form.handleSubmit((data) => {
  mutation.mutate(data);
});
```

### 8.2 规则编辑表单

见 §4.5 规则编辑器，特别需要：

- 字段类型约束（如 `meeting_reschedule_count` 必须是 INT）
- 运算符自动提示
- 实时 JSON Schema 校验

---

## 9. 权限控制（UI 层）

### 9.1 权限 Hook

```typescript
// hooks/useWorkspacePermissions.ts
export function useWorkspacePermissions() {
  const { workspace, currentUser } = useWorkspaceContext();

  return {
    canCreateKnowledgeCard: ['owner', 'admin', 'member'].includes(
      workspace.userRole
    ),
    canPublishRule: ['owner', 'admin'].includes(workspace.userRole),
    canReviewCandidate: ['owner', 'admin'].includes(workspace.userRole),
    canDelete: ['owner', 'admin'].includes(workspace.userRole),
  };
}
```

### 9.2 按钮可见性

```tsx
function KnowledgeCardActions({ card }: { card: KnowledgeCard }) {
  const perms = useWorkspacePermissions();

  return (
    <div className="flex gap-2">
      <Button disabled={!perms.canCreateKnowledgeCard}>编辑</Button>
      {perms.canPublishRule && (
        <Button variant="destructive">废弃</Button>
      )}
    </div>
  );
}
```

---

## 10. 错误处理与加载状态

### 10.1 全局错误边界

```tsx
// app/workspace/[code]/knlg-base/error.tsx
'use client';

export default function KnlgBaseError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">出错了</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>重试</Button>
    </div>
  );
}
```

### 10.2 Loading 状态

| 场景 | Loading 策略 |
| --- | --- |
| 列表首次加载 | 全屏 Skeleton |
| 列表分页加载 | 保留列表 + 底部 Spinner |
| 详情加载 | 页面级 Skeleton |
| 数据提交 | 按钮内 Spinner，禁用重复 |
| 后台同步 | 右上角 Toast |

### 10.3 错误 Toast

```typescript
// 全局错误处理
queryClient.setMutationDefaults(['mutate'], {
  onError: (error) => {
    toast.error(getErrorMessage(error));
  },
});
```

---

## 11. 性能优化

### 11.1 关键优化点

| 优化点 | 策略 | 预期效果 |
| --- | --- | --- |
| 大列表渲染 | 虚拟滚动（react-window） | 1000+ QA 流畅 |
| 全文检索 | 防抖 300ms + 服务端分页 | 减少请求 |
| 知识卡片 diff | 增量渲染 | 快速版本对比 |
| SSE 流式 | 自动重连 + 断点续传 | 异常恢复 |
| 表单提交 | 乐观更新 + 失败回滚 | 即时反馈 |
| 路由切换 | 预加载（Next.js Link prefetch） | 秒切 |

### 11.2 代码分割

```tsx
// 动态导入大型编辑器
const RuleConditionTreeEditor = dynamic(
  () => import('@/modules/knlg-base/components/RuleConditionTree'),
  { loading: () => <Skeleton className="h-96" /> }
);
```

---

## 12. 国际化（i18n）

按 Neo 平台 i18n 规范：

| key 空间 | 示例 |
| --- | --- |
| `knlg-base.qa.title` | "问答库" |
| `knlg-base.qa.button.create` | "新建访谈" |
| `knlg-base.knowledge.status.validated` | "已验证" |
| `knlg-base.rules.severity.high` | "高" |

v1 优先支持中文，预留 i18n key。

---

## 13. 组件库清单

### 13.1 通用组件（Neo 平台已有）

- `Button`、`Input`、`Textarea`
- `Select`、`Combobox`、`MultiSelect`
- `Card`、`Dialog`、`Sheet`、`Dropdown`
- `Tabs`、`Accordion`、`Tooltip`
- `Toast`、`Badge`、`Avatar`

### 13.2 knlg-base 专用组件

| 组件 | 用途 | 复杂度 |
| --- | --- | --- |
| `QaCard` | 显示单条 QA | 简单 |
| `QaTimeline` | QA 时间线 | 中 |
| `KnowledgeCardItem` | 知识卡片项 | 简单 |
| `KnowledgeCardEditor` | 知识卡片编辑器 | 复杂 |
| `RuleConditionTree` | 规则条件树 | 复杂 |
| `RuleJsonPreview` | 规则 JSON 预览 | 中 |
| `SourceRefList` | 来源关联列表 | 简单 |
| `ConfidenceBadge` | 置信度徽章 | 简单 |
| `InterviewMessage` | 访谈消息 | 简单 |
| `InterviewStreamView` | 实时访谈流 | 复杂 |
| `CandidateCard` | 候选知识卡片 | 中 |
| `DocumentUploader` | 文档上传 | 中 |

### 13.3 第三方库选型

| 用途 | 选型 |
| --- | --- |
| JSON 编辑器 | `@monaco-editor/react` |
| Markdown 渲染 | `react-markdown` |
| SQL 编辑器（回测） | `@codemirror/lang-sql` |
| 流程图（规则可视化） | `reactflow` |
| 图表（统计） | `recharts` |
| 时间线 | 自定义 |
| 虚拟列表 | `react-window` |

---

## 14. 开发规范

### 14.1 文件命名

| 类型 | 命名 | 示例 |
| --- | --- | --- |
| 页面 | kebab-case | `rule-editor/page.tsx` |
| 组件 | PascalCase | `KnowledgeCardEditor.tsx` |
| Hooks | camelCase (use 前缀) | `useInterview.ts` |
| Store | camelCase (Store 后缀) | `qaStore.ts` |
| Schema | kebab-case | `knowledge-card.schema.ts` |
| 类型 | kebab-case | `knowledge-card.ts` |

### 14.2 代码检查

| 工具 | 范围 |
| --- | --- |
| ESLint | 全量代码风格 |
| TypeScript | 类型检查 |
| Prettier | 格式化 |

详见 Neo 平台前端工程规范。

---

## 🔗 相关文档

- [技术设计总览](./index)
- [01-数据库 schema 设计](./01-database-schema)
- [02-后端 API 设计](./02-backend-api)
- [前端工程架构](../arch/arch-frontend)
- [知识库与问答库产品设计（总览）](../../product/knlg-base/)
- [问答库产品设计](../../product/knlg-base/q-a-library)
- [知识库与规则库产品设计](../../product/knlg-base/knowledge-and-rule)

---

## ✅ 设计检查清单

- [x] 完整路由结构
- [x] 模块目录划分
- [x] 核心页面设计
- [x] Zustand Store 设计
- [x] TanStack Query 设计
- [x] SSE 流式响应处理
- [x] 表单与校验
- [x] 权限 UI 控制
- [x] 错误处理
- [x] 性能优化
- [x] 组件库清单
