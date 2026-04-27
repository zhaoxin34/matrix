## 1. Database Migration

- [x] 1.1 执行 Alembic 迁移脚本，将 `skill` 表的 `is_active` 列替换为 `status` ENUM('draft', 'active', 'disabled')
- [x] 1.2 数据迁移：is_active=true → status='active'，is_active=false → status='disabled'
- [x] 1.3 更新后端 Skill 模型，移除 is_active 字段，新增 status 字段

## 2. Backend API Changes

- [x] 2.1 更新 SkillCreate Schema，移除 is_active，新增 status（默认 'draft'）
- [x] 2.2 更新 SkillResponse Schema，移除 is_active，新增 status
- [x] 2.3 更新 skill-list API，支持 status 参数过滤（替换 is_active）
- [x] 2.4 更新 activate/deactivate API，使用 status 字段而非 is_active
- [x] 2.5 更新技能创建逻辑：创建时默认 status='draft'
- [x] 2.6 更新技能更新逻辑：更新 content 时，如果 status='draft' 则变为 'active'
- [x] 2.7 调整列表默认行为：默认不返回 draft 状态的技能

## 3. Frontend Dependencies

- [x] 3.1 安装 `@uiw/react-md-editor` Markdown 编辑器
- [x] 3.2 安装 `react-markdown` 用于详情页渲染

## 4. Frontend - Skill Library Page Rebuild

- [x] 4.1 重构新建技能 Dialog 为两步 Wizard
  - [x] 4.1.1 Step 1：基本信息表单（code, name, level, tags, author）
  - [x] 4.1.2 Step 2：Markdown 内容编辑器
- [x] 4.2 保存逻辑：Step 1 保存为 draft，Step 2 保存后变为 active
- [x] 4.3 拆分编辑操作为两个入口
  - [x] 4.3.1 "编辑基本信息" Dialog（保存后保持当前 status）
  - [x] 4.3.2 "编辑内容" Dialog（保存后 draft → active）
- [x] 4.4 更新列表操作栏：移除启用/禁用按钮，替换为编辑入口
- [x] 4.5 更新详情 Drawer：content 使用 react-markdown 渲染
- [x] 4.6 更新状态筛选：is_active → status

## 5. Testing & Validation

- [x] 5.1 更新 E2E 测试用例，覆盖新建两步流程
- [x] 5.2 测试状态流转：draft → active → disabled → active
- [x] 5.3 验证 Markdown 编辑器功能（编辑、预览、工具栏）
