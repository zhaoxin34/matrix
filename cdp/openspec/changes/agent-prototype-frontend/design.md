## Context

Agent Prototype 后端已完成 API 开发，需要构建对应的 React 前端。页面需要支持：
- 原型 CRUD（列表/创建/编辑/删除）
- Prompts 管理（6 种类型，Markdown 编辑）
- 版本发布与回滚

**技术栈**：Next.js 16 + MUI v9 + TypeScript

## Goals / Non-Goals

**Goals:**
- 提供完整的原型管理 UI
- Prompts Tab 内实现 Markdown 编辑器（左侧编辑，右侧预览）
- 版本历史 Tab 支持发布和回滚操作
- 创建/编辑表单与 Prompts 分离（表单只包含 name/description/model/temperature/max_tokens）

**Non-Goals:**
- 不实现移动端适配
- 不实现权限控制（复用现有认证体系）
- 不使用独立的 Zustand store，数据在组件内管理

## Decisions

### 1. 页面结构

```
/agent-prototypes                 → 列表页
/agent-prototypes/new            → 创建页（仅基本信息）
/agent-prototypes/[id]            → 详情页（3 个 Tab）
/agent-prototypes/[id]/edit       → 编辑页（仅基本信息）
```

**Rationale**: 详情页用 Tab 切换比独立页面更流畅，符合项目管理类产品的常见模式。

### 2. Prompts Tab 结构

```
[Soul] [Memory] [Reasoning] [Agents] [Workflow] [Comm]

┌─────────────────────────┬─────────────────────────────┐
│ Markdown Editor         │ Preview                      │
│ (textarea)              │ (rendered HTML)              │
│                         │                             │
└─────────────────────────┴─────────────────────────────┘
                              [保存]
```

**Rationale**: Markdown 编辑器使用 Split View（编辑/预览并排），比切换模式更高效。

### 3. Markdown 编辑器实现

使用简单的 textarea + 实时预览（react-markdown + remark-gfm）。

**Alternative considered**: 使用 Draft.js 或类似富文本编辑器 → 复杂度高，不需要。

### 4. API 客户端结构

```typescript
// lib/agentPrototypeApi.ts
export const agentPrototypeApi = {
  list: async (params) => ...,
  get: async (id) => ...,
  create: async (data) => ...,
  update: async (id, data) => ...,
  delete: async (id) => ...,
  publish: async (id, data) => ...,
  rollback: async (id, data) => ...,
  listVersions: async (id) => ...,
}

// prompts
export const agentPrototypePromptApi = {
  list: async (prototypeId) => ...,
  create: async (data) => ...,
  update: async (id, data) => ...,
  delete: async (id) => ...,
}
```

**Rationale**: 与现有 projectApi.ts 保持一致的模式。

### 5. 状态管理

无新增 Zustand store。组件内部使用 useState + useCallback 管理状态。

**Rationale**: 原型数据关联性强但操作简单，不需要复杂的全局状态管理。

### 6. 发布弹窗

```jsx
<Dialog open={publishDialogOpen}>
  <DialogTitle>发布新版本</DialogTitle>
  <DialogContent>
    <TextField
      label="变更说明"
      multiline
      rows={3}
      fullWidth
      value={changeSummary}
      onChange={(e) => setChangeSummary(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setPublishDialogOpen(false)}>取消</Button>
    <Button variant="contained" onClick={handlePublish}>发布</Button>
  </DialogActions>
</Dialog>
```

## Risks / Trade-offs

**[Risk] Markdown 预览安全性**
→ Mitigation: 使用 react-markdown 渲染，配合 DOMPurify 防止 XSS

**[Risk] Prompts 内容过长**
→ Mitigation: 使用 Textarea autosize，MUI 组件天然支持

**[Risk] 页面间数据同步**
→ Mitigation: 使用 Next.js router.refresh() 刷新列表页数据

## Open Questions

无

## 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| AgentPrototypeList | `app/(authenticated)/agent-prototypes/page.tsx` | 列表页 |
| AgentPrototypeForm | `components/agent-prototype/AgentPrototypeForm.tsx` | 创建/编辑表单 |
| AgentPrototypeDetail | `app/(authenticated)/agent-prototypes/[id]/page.tsx` | 详情页（Tab） |
| AgentPrototypeTabs | `components/agent-prototype/AgentPrototypeTabs.tsx` | Tab 容器 |
| AgentPrototypePrompts | `components/agent-prototype/AgentPrototypePrompts.tsx` | Prompts 管理 |
| AgentPrototypeVersions | `components/agent-prototype/AgentPrototypeVersions.tsx` | 版本历史 |
| MarkdownEditor | `components/agent-prototype/MarkdownEditor.tsx` | Markdown 编辑器 |
| PublishDialog | `components/agent-prototype/PublishDialog.tsx` | 发布弹窗 |
| RollbackDialog | `components/agent-prototype/RollbackDialog.tsx` | 回滚弹窗 |