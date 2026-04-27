## ADDED Requirements

### Requirement: Markdown editor for content editing
系统 SHALL 提供 Markdown 编辑器用于编辑技能内容，支持实时预览和常用格式工具栏。

#### Scenario: Edit content with markdown editor
- **WHEN** 用户在 Markdown 编辑器中输入 `# 标题` 和 `- 列表项`
- **THEN** 预览区域实时显示渲染后的格式（标题样式和列表）

#### Scenario: Save content updates status
- **WHEN** 用户编辑内容后点击保存
- **AND** 技能原 status 为 'draft'
- **THEN** 系统更新 content 并将 status 变为 'active'

#### Scenario: Editor toolbar functions
- **WHEN** 用户点击编辑器工具栏的加粗按钮
- **THEN** 编辑器在光标位置插入 `**粗体**` 语法

#### Scenario: Fullscreen editing mode
- **WHEN** 用户点击编辑器的全屏按钮
- **THEN** 编辑器扩展为全屏，ESC 退出

### Requirement: Display rendered markdown content
系统 SHALL 在技能详情页渲染 Markdown 内容为 HTML 格式展示。

#### Scenario: View skill detail with markdown content
- **WHEN** 用户打开技能详情 Drawer
- **AND** 技能的 content 包含 Markdown 语法（如 `# 标题`）
- **THEN** 系统渲染为 HTML 显示，支持标题、列表、代码块等格式

#### Scenario: Display plain text when no content
- **WHEN** 技能的 content 为空或 null
- **THEN** 系统显示占位符 "-"