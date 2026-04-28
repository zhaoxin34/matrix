# Agent Prototype Detail Spec

## ADDED Requirements

### Requirement: Detail page tabs

详情页 SHALL 包含 3 个 Tab：基本信息、Prompts、版本历史。

#### Scenario: Display detail page
- **WHEN** 用户访问 `/agent-prototypes/{id}`
- **THEN** 系统显示详情页，包含 Tab 导航
- **AND** 默认选中"基本信息" Tab

#### Scenario: Tab navigation
- **WHEN** 用户点击不同 Tab
- **THEN** 系统切换到对应 Tab 内容，不刷新页面

### Requirement: Basic info tab

基本信息 Tab SHALL 显示原型的所有配置信息。

#### Scenario: Display basic info
- **WHEN** 用户查看基本信息 Tab
- **THEN** 系统显示：名称、描述、版本、模型、温度、max_tokens、状态、创建时间、更新时间
- **AND** 显示操作按钮：编辑、删除（仅 draft）、发布（仅 draft）、启用/禁用

### Requirement: Prompts tab

Prompts Tab SHALL 支持 6 种类型的 Tab 切换和 Markdown 编辑。

#### Scenario: Display prompts tab
- **WHEN** 用户查看 Prompts Tab
- **THEN** 系统显示 6 个类型按钮：Soul、Memory、Reasoning、Agents、Workflow、Comm
- **AND** 选中类型的 Markdown 编辑器（左侧）和预览（右侧）

#### Scenario: Switch prompt type
- **WHEN** 用户点击不同类型按钮
- **THEN** 系统加载该类型的 prompt 内容到编辑器

### Requirement: Versions tab

版本历史 Tab SHALL 显示所有版本记录。

#### Scenario: Display versions
- **WHEN** 用户查看版本历史 Tab
- **THEN** 系统显示版本列表，包含：版本号、变更说明、创建时间、创建人
- **AND** 每行有"回滚"按钮
