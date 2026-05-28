## Context

当前 `ui/app/admin/org-structure/page.tsx` 的员工列表中，操作列仅有「编辑」和「删除」两个按钮，缺少状态流转能力。

员工状态枚举：
- `onboarding` - 入职中
- `on_job` - 在职
- `transferring` - 调动中
- `offboarding` - 离职

## Goals / Non-Goals

**Goals:**
- 在操作列添加 Dropdown 菜单，显示当前状态可执行的操作
- 操作点击后立即生效，无需弹窗确认
- 操作成功后显示 Toast 提示，列表自动刷新

**Non-Goals:**
- 不做批量操作
- 不做审批流程
- 不做权限控制（所有人可操作）
- 不做「取消入职」功能

## Decisions

### 1. 状态流转矩阵

| 当前状态 | 可执行操作 | 操作后状态 |
|---------|----------|-----------|
| `onboarding` | 完成入职 | `on_job` |
| `on_job` | 发起调动 | `transferring` |
| `on_job` | 发起离职 | `offboarding` |
| `transferring` | 完成调动 | `on_job` |
| `transferring` | 取消调动 | `on_job` |
| `offboarding` | 重新入职 | `onboarding` |

### 2. UI 实现

在操作列添加 Dropdown Menu 按钮，点击展开操作列表：

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm">
      <MoreIcon className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {availableActions.map(action => (
      <DropdownMenuItem onClick={() => handleTransition(action)}>
        {action.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. 状态更新逻辑

```tsx
const transitionMap = {
  onboarding: [{ key: 'complete', label: '完成入职', targetStatus: 'on_job' }],
  on_job: [
    { key: 'transfer', label: '发起调动', targetStatus: 'transferring' },
    { key: 'offboard', label: '发起离职', targetStatus: 'offboarding' },
  ],
  transferring: [
    { key: 'complete_transfer', label: '完成调动', targetStatus: 'on_job' },
    { key: 'cancel_transfer', label: '取消调动', targetStatus: 'on_job' },
  ],
  offboarding: [{ key: 'rejoin', label: '重新入职', targetStatus: 'onboarding' }],
};

const handleTransition = (action: TransitionAction) => {
  // 更新本地状态
  setEmployees(prev =>
    prev.map(emp =>
      emp.id === employeeId
        ? { ...emp, status: action.targetStatus }
        : emp
    )
  );
  // 显示 Toast
  toast.success(`${employeeName} 已变更为「${getStatusLabel(action.targetStatus)}」`);
};
```

### 4. Toast 提示

使用现有的 UI 组件（如 `sonner` 或其他 Toast 库），显示操作成功信息。

### 5. 权限与审批

- 无需权限判断
- 无需审批流程
- 操作即生效

## Risks / Trade-offs

- **Mock 数据局限性**: 当前使用 mock 数据，刷新页面后会重置。后续连接后端 API 后需替换为 API 调用。
- **状态一致性**: 当前仅更新本地状态，未考虑多用户同时操作的冲突场景。