# Skills Admin 模块

## 页面路由

- `/admin/skills` - Skills 列表页
- `/admin/skills/[code]` - Skill 详情/编辑器页

## 组件结构

```
app/admin/skills/
├── page.tsx                    # 列表页
├── [code]/
│   └── page.tsx               # 详情/编辑器页
└── components/
    ├── skills-list.tsx        # 列表组件
    ├── skills-table.tsx       # 表格组件
    ├── create-skill-dialog.tsx # 创建弹窗
    ├── skill-editor.tsx       # 编辑器主体
    ├── file-tree.tsx           # 文件树
    ├── file-editor.tsx         # Monaco 编辑器
    ├── version-history-dialog.tsx # 版本历史弹窗
    └── publish-dialog.tsx      # 发布弹窗
```

## 功能清单

### 列表页

- [x] 搜索框 (按名称/编码搜索)
- [x] 状态筛选 (全部/草稿/激活/禁用)
- [x] 粒度级别筛选 (全部/规划级/功能级/原子级)
- [x] 标签筛选
- [x] 表格展示 (名称、编码、级别、标签、状态、更新时间、操作)
- [x] 创建按钮
- [x] 编辑/禁用/删除操作

### 详情/编辑器页

- [x] 返回列表按钮
- [x] Skill 基本信息展示 (名称、编码、级别、状态)
- [x] 左侧文件树
- [x] 右侧 Monaco 编辑器
- [x] 新建文件按钮
- [x] 删除文件按钮
- [x] 发布按钮
- [x] 版本历史弹窗
- [x] 回滚功能
- [x] 发布弹窗 (版本号 + 发布说明)

## 数据模型

参考 design/docs/product/admin/skills-overview.md

## 状态流转

```
draft → active → disabled
       ↑                  ↓
       └─── 回滚 ─────────┘
```
