## Context

技能库当前使用普通 TextArea 编辑 Markdown 内容，编辑体验差且无法预览。同时 `is_active` 布尔字段仅支持启用/禁用二态，无法表达"草稿"概念。

**现有约束**：
- 前端技术栈：React 19 + Next.js 16 + MUI v9
- 后端技术栈：Python FastAPI + SQLAlchemy + MySQL
- 已有 `skill` 表，字段包括 `code`, `name`, `level`, `tags`, `author`, `content`, `is_active`, `deleted_at`, `created_at`, `updated_at`

## Goals / Non-Goals

**Goals:**
- 提供实时预览的 Markdown 编辑体验
- 支持 draft → active → disabled 三态流转
- 拆分编辑入口，让基本信息和内容编辑解耦
- 详情页正确渲染 Markdown 内容

**Non-Goals:**
- 不支持富文本编辑器（只做 Markdown）
- 不做版本历史功能
- 不做内容对比或合并

## Decisions

### 1. Markdown 编辑器选型

**选择**: `@uiw/react-md-editor`

**理由**:
- 轻量级，API 简洁，与 React 生态兼容良好
- 内置实时预览分栏、工具栏、全屏模式
- TypeScript 支持完善
- `react-markdown` 用于详情页渲染

**替代方案考虑**:
- `@monaco-editor/react`：功能强大但过重，适合代码编辑而非 Markdown
- `react-mde`：需要额外配置预览组件，集成成本高

### 2. 两步 Wizard 交互设计

**选择**: Dialog 内两步切换，而非两个独立 Dialog

```
Step 1 (基本信息):
┌────────────────────────────────────┐
│ 新增技能            Step 1 of 2    │
├────────────────────────────────────┤
│ [技能代码]  [技能名称]             │
│ [级别]      [标签]                 │
│ [作者]                            │
│                        [取消][下一步]│
└────────────────────────────────────┘

Step 2 (内容编辑):
┌────────────────────────────────────┐
│ 新增技能            Step 2 of 2    │
├────────────────────────────────────┤
│ Markdown 编辑器 (全高度)           │
│ ┌─────────────┬─────────────┐     │
│ │ 编辑        │ 预览        │     │
│ └─────────────┴─────────────┘     │
│                        [取消][保存] │
└────────────────────────────────────┘
```

**理由**:
- 在同一个 Dialog 内切换内容，保持操作上下文
- Step 1 保存为 draft，Step 2 保存并激活，流程清晰
- 复用现有 Dialog 组件，改动成本低

### 3. 编辑功能拆分

**选择**: 两个独立 Dialog

| 操作 | Dialog 内容 | 保存后状态 |
|------|-------------|-----------|
| 编辑基本信息 | 基本信息表单 | 保持当前状态不变 |
| 编辑内容 | Markdown 编辑器 | 变为 `active`（如果原为 draft） |

**理由**:
- "编辑基本信息"仅修改元数据，不应改变内容状态
- "编辑内容"完成时视为内容已就绪，自动激活是合理的行为流

### 4. 数据库 Migration

```sql
-- 将 is_active 列替换为 status 列
ALTER TABLE skill MODIFY COLUMN is_active ENUM('draft', 'active', 'disabled') NOT NULL DEFAULT 'draft';
```

**注意**: 需要先清理已有数据的 is_active 值映射：
- `is_active = true` → `status = 'active'`
- `is_active = false` → `status = 'disabled'`

### 5. API 响应结构变更

```typescript
// Skill 响应
{
  "id": number,
  "code": string,
  "name": string,
  "level": "Planning" | "Functional" | "Atomic",
  "tags": string[],
  "author": string | null,
  "content": string,
  "status": "draft" | "active" | "disabled",  // 替换 is_active
  "created_at": string,
  "updated_at": string
}
```

## Risks / Trade-offs

**[Risk] 内容过长影响编辑体验**
→ Mitigation：MUI Dialog 默认有 max-height，内容超长时编辑器内部可滚动

**[Risk] Step 1 填完直接关闭导致 draft 残留**
→ Mitigation：draft 状态允许用户后续编辑，可以接受

**[Risk] 依赖库版本兼容性**
→ Mitigation：`@uiw/react-md-editor` 和 `react-markdown` 都是主流库，锁定次要版本

## Migration Plan

1. **数据库迁移**：执行 ALTER TABLE，将 is_active 替换为 status 列
2. **后端 API**：更新 Schema 和 Response 模型
3. **前端依赖**：安装 `@uiw/react-md-editor`、`react-markdown`
4. **前端组件**：重构 SkillLibraryPage，支持两步 Wizard
5. **测试**：E2E 测试用例更新

## Open Questions

- Step 2 保存后，是否需要自动跳转回列表页？建议：是，完成感更强
- 编辑基本信息时，是否允许修改 code？建议：否，code 是唯一标识
