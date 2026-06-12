# 前端规范

- 尽量给页面的可操作元素增加`data-testid`属性, 以便于e2e的测试

示例:
```html
<input type="input" data-testid="inp-username" placeholder="input user name"/>
<button type="button" data-testid="btn-login"> 登录 </button>
```

## 字体大小规范

统一使用 Tailwind 的 `text-xs`（12px）和 `text-sm`（14px）作为主要字体大小，`text-xl`（20px）用于页面标题。

### 页面层级

| 元素 | 样式 | 说明 |
|------|------|------|
| 页面标题 | `text-xl font-heading font-medium` | h1，一级标题 |
| 页面描述 | `text-xs text-muted-foreground mt-1` | 标题下方的副标题 |

### 内容层级

| 元素 | 样式 | 说明 |
|------|------|------|
| 正文内容 | `text-sm` | 主要内容文字 |
| 次要内容 | `text-xs text-muted-foreground` | 辅助说明文字 |
| 表格内容 | `text-xs` | 表格单元格 |
| 表格表头 | `text-xs font-medium text-muted-foreground` | th |

### 状态文本

| 元素 | 样式 | 说明 |
|------|------|------|
| 加载状态 | `text-sm text-muted-foreground` | - |
| 错误状态 | `text-sm text-red-600` | - |
| 错误重试链接 | `text-xs text-red-500 hover:text-red-700 mt-2` | - |
| 空状态标题 | `text-sm font-medium mb-1` | - |
| 空状态描述 | `text-xs text-muted-foreground mb-4` | - |
| 分页信息 | `text-sm text-muted-foreground` | - |

### 参考页面

- `/admin/agent-prototype` - 页面标题使用 `text-xl`，描述使用 `text-xs`
- `/admin/workspace` - 页面标题使用 `text-xl`，描述使用 `text-xs`

### 错误示例

```tsx
// ❌ 错误：页面标题使用 text-lg
<h1 className="text-lg font-bold">用户管理</h1>
<p className="text-sm text-muted-foreground">描述</p>

// ✅ 正确：页面标题使用 text-xl
<h1 className="text-xl font-heading font-medium">用户管理</h1>
<p className="text-xs text-muted-foreground mt-1">描述</p>
```
