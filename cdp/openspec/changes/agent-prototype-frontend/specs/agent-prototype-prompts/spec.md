# Agent Prototype Prompts Spec

## ADDED Requirements

### Requirement: Prompt type tabs

系统 SHALL 显示 6 个 Prompt 类型的 Tab 切换。

#### Scenario: Display type tabs
- **WHEN** 用户进入 Prompts Tab
- **THEN** 系统显示 6 个类型按钮：Soul、Memory、Reasoning、Agents、Workflow、Comm
- **AND** 默认选中 Soul
- **AND** 每个 Tab 显示该类型的描述（帮助用户理解如何填写）

### Requirement: Markdown editor

Markdown 编辑器 SHALL 支持左侧编辑、右侧预览。

#### Scenario: Display editor
- **WHEN** 用户选择某个 Prompt 类型
- **THEN** 系统显示 Split View：左侧 textarea，右侧渲染预览

#### Scenario: Save prompt
- **WHEN** 用户编辑完内容并点击"保存"
- **THEN** 系统调用 `PUT /api/v1/agent-prototypes/{id}`，更新 prompts 字段
- **AND** 保存成功后显示成功提示

#### Scenario: Display type description
- **WHEN** 用户选择某个 Prompt 类型
- **THEN** 系统在该类型 Tab 旁边显示描述，帮助用户理解如何填写
  - Soul: 核心灵魂：定义 Agent 的基本性格、价值观和行为准则
  - Memory: 记忆机制：定义 Agent 如何存储和检索过往经验
  - Reasoning: 推理方式：定义 Agent 的思考链和问题解决模式
  - Agents: 多智能体：定义多 Agent 协作时的角色分工
  - Workflow: 工作流程：定义任务执行的标准流程和步骤
  - Communication: 沟通方式：定义 Agent 与用户/其他 Agent 交互规范

### Requirement: Prompts field structure

Prompts 字段 SHALL 直接存储在原型记录中。

```typescript
interface Prompts {
  soul: string;          // Markdown
  memory: string;       // Markdown
  reasoning: string;     // Markdown
  agents: string;        // Markdown
  workflow: string;     // Markdown
  communication: string; // Markdown
}
```

#### Scenario: Load prompts
- **WHEN** 用户打开原型详情页
- **THEN** 系统从原型记录的 prompts 字段加载所有 6 个类型的内容

#### Scenario: Update prompts
- **WHEN** 用户修改某个 Prompt 类型内容并保存
- **THEN** 系统更新整个 prompts JSON 字段（而非单个 prompt）
