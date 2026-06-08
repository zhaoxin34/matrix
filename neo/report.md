# Neo AI协作平台 - 投资人版功能清单

## 一、项目概述

**Neo** 是一个 AI 协作平台，通过构建人机协同的工作环境，实现 AI 的自学习、自组织和自决策能力。平台让人类和 AI 协同工作，自动组织成完成某个事项的工作组，让人和 AI 互相学习，最终让 AI 能够独立决策大多数事项。

---

## 二、核心技术架构

### 技术栈概览

| 模块 | 技术选型 | 说明 |
|------|---------|------|
| **前端** | Next.js 16 + React 19 + TypeScript | 高性能 Web 应用 |
| **后端** | FastAPI + SQLAlchemy 2.0 + MySQL 8 | 高性能 Python API |
| **AI 能力** | 多 Provider 架构（OpenAI/Claude/本地模型） | 灵活切换 AI 模型 |
| **浏览器扩展** | TypeScript + Vite + rrweb | Chrome 扩展录制 |
| **状态管理** | Zustand | 轻量状态管理 |
| **UI 组件** | Tailwind CSS 4 + shadcn/ui 4 | 现代化 UI |

---

## 三、模块与功能详述

### 模块一：用户认证与管理系统

#### 1.1 用户注册
- 手机号 + 验证码注册方式
- 密码强度校验
- 注册成功自动登录

#### 1.2 用户登录
- 手机号 + 密码登录
- JWT Token 认证机制
- Token 刷新与过期处理

#### 1.3 密码管理
- 修改密码
- 忘记密码（通过验证码重置）

#### 1.4 超级管理员-用户管理
- 用户列表查看
- 用户状态管理
- 用户搜索与筛选

---

### 模块二：组织架构管理

#### 2.1 组织树形结构
- **层级设计**：最多支持 4 级组织（公司 → 部门 → 子部门 → 小组）
- **CRUD 操作**：创建、查看、编辑、删除组织
- **树形展示**：清晰的组织架构可视化

#### 2.2 组织属性管理

| 属性 | 说明 |
|------|------|
| 组织名称 | 1-100 字符 |
| 组织编码 | 全局唯一 |
| 组织类型 | company/branch/department/sub_department |
| 负责人 | 关联用户 |
| 状态 | active / inactive |

#### 2.3 组织状态机

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| active | 正常状态 | 查看、编辑、禁用 |
| inactive | 已禁用状态 | 查看、编辑、启用 |

#### 2.4 组织删除约束
- 无子组织
- 无员工（在职/待入职/调动中）
- 无有效 Workspace

---

### 模块三：员工管理系统

#### 3.1 员工档案管理

| 属性 | 说明 |
|------|------|
| 工号 | 唯一标识 |
| 姓名 | 员工姓名 |
| 手机号 | 自动同步自关联用户（只读） |
| 邮箱 | 可独立于用户 |
| 岗位 | 职位名称 |
| 主属部门 | 必选，一个员工必须属于一个主属部门 |
| 辅助部门 | 可选，一个员工可同时属于多个部门 |

#### 3.2 员工状态机

```
待入职 → 在职 → 调动中 → 在职
                  ↓
               待离职 → 已离职
```

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| onboarding | 待入职 | 编辑、调动 |
| on_job | 在职 | 编辑、调动、离职 |
| transferring | 调动中 | 查看、办理调动 |
| offboarding | 待离职 | 查看、办理离职 |

#### 3.3 员工调动
- **直接调动**：无需审批流程
- **调动记录**：记录历史，包括原部门、新部门、调动原因、生效日期

#### 3.4 用户-员工映射
- **1:1 映射**：一个用户只能关联一个员工
- **强制关联**：创建员工时必须选择关联用户
- **手机号同步**：员工的手机号自动从用户同步，禁止手动编辑

---

### 模块四：工作区（Workspace）管理

#### 4.1 Workspace 概述
- Workspace 是组织和资源的容器
- 一个组织可包含多个 Workspace
- Workspace 是 Agent 运行的上下文环境

#### 4.2 Workspace 管理功能

| 功能 | 说明 |
|------|------|
| Workspace 列表 | 展示当前用户可访问的所有 Workspace |
| 创建 Workspace | 在指定组织下创建新 Workspace |
| Workspace 设置 | 配置 Workspace 基本信息、成员、权限 |
| 删除 Workspace | 软删除，保留数据 |

#### 4.3 Workspace 路由

| 页面 | 路由 |
|------|------|
| 我的 Workspace | `/workspace` |
| Workspace 详情 | `/workspace/{id}` |
| Workspace 列表（管理） | `/admin/workspace` |
| 创建 Workspace | `/admin/workspace/new` |
| Workspace 设置 | `/admin/workspace/{id}/settings` |

---

### 模块五：Agent 原型（Prototype）管理系统

#### 5.1 Agent Prototype 定义
- Agent Prototype 是 Agent 的"图纸"或"草稿"
- 通过配置 Prompts 定义 Agent 的行为模式
- Prototype 不可直接运行，需通过 Agent Factory 生成 Agent

#### 5.2 Prompts 配置结构（两层六型）

**认知层**（定义 Agent "怎么想"）

| 类型 | 说明 |
|------|------|
| Soul（灵魂） | Agent 的性格、价值观、行为准则 |
| Memory（记忆） | Agent 如何存储和检索过往经验 |
| Reasoning（推理） | Agent 的思考链和问题解决模式 |

**协作层**（定义 Agent "怎么做"）

| 类型 | 说明 |
|------|------|
| Agents（多智能体） | 多 Agent 协作时的角色分工 |
| Workflow（流程） | 任务执行的标准流程和步骤 |
| Communication（沟通） | Agent 与用户交互的规范 |

#### 5.3 Agent Prototype 状态机

```
草稿(draft) → 已启用(enabled) → 已禁用(disabled)
```

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| draft | 草稿状态，初始状态 | 编辑、发布、删除 |
| enabled | 已发布状态 | 编辑、禁用、查看历史 |
| disabled | 已禁用状态 | 启用、查看历史 |

#### 5.4 版本管理
- **发布**：将草稿快照转为正式版本
- **回滚**：恢复到历史版本
- **版本历史**：查看所有历史版本记录

#### 5.5 Agent Prototype 管理页面

| 页面 | 路由 |
|------|------|
| 列表页 | `/admin/agent-prototype` |
| 详情页 | `/admin/agent-prototype/{id}` |
| 编辑页 | `/admin/agent-prototype/{id}/edit` |

---

### 模块六：Agent Factory（智能体工厂）

#### 6.1 Agent Factory 定义
- 根据 Agent Prototype 生产可运行的 Agent
- Agent 只能在 Workspace 下生成
- 实现生产与运行逻辑分离

#### 6.2 Agent 生产流程

```
选择 Prototype → 配置参数 → 生成 Agent
```

#### 6.3 Agent 配置

| 配置项 | 说明 |
|------|------|
| name | Agent 名称，Workspace 内唯一 |
| description | Agent 描述 |
| prototype_id | 引用的 Prototype ID |
| prototype_version | 基于的 Prototype 版本 |
| model | AI 模型配置（可继承 Prototype） |
| skills | 启用的技能列表 |
| config | 运行时配置（温度、最大 token 等） |

#### 6.4 Agent 运行时配置 (AgentConfig)

```json
{
  "temperature": 0.7,
  "max_tokens": 4096,
  "thinking": "high",
  "timeout": 60,
  "retry": {
    "max_attempts": 3,
    "backoff": "exponential"
  }
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| temperature | FLOAT | 0.7 | 模型温度参数 |
| max_tokens | INTEGER | 4096 | 最大输出 token 数 |
| thinking | ENUM | "low" | 思考深度: low / medium / high |
| timeout | INTEGER | 60 | 单次执行超时（秒） |
| retry.max_attempts | INTEGER | 3 | 最大重试次数 |
| retry.backoff | ENUM | "linear" | 重试策略: linear / exponential |

#### 6.5 Agent 状态机

```
创建 → 已启用(enabled) → 已禁用(disabled) → 已删除(deleted)
```

| 状态 | Task 调度 | 接收新任务 | 正在执行的任务 |
|------|----------|-----------|---------------|
| enabled | ✅ 允许 | ✅ 允许 | ✅ 继续执行 |
| disabled | ❌ 暂停 | ❌ 拒绝 | ✅ 继续执行 |
| deleted | ❌ 禁止 | ❌ 拒绝 | ❌ 中断执行 |

#### 6.6 Agent Factory 页面

| 页面 | 路由 |
|------|------|
| Agent 列表 | `/workspace/{workspace_code}/agents` |
| Agent 详情 | `/workspace/{workspace_code}/agents/{id}` |
| 创建 Agent | `/workspace/{workspace_code}/agents/create` |
| 编辑 Agent | `/workspace/{workspace_code}/agents/{id}/edit` |

---

### 模块七：Agent 嵌入与交互（三大模式）

#### 7.1 嵌入模式概述
- 将 Agent 嵌入到目标系统中（如企业 CRM、ERP 等）
- 通过 Chrome 扩展实现
- 支持三种交互模式

#### 7.2 学习模式 🏫

| 功能 | 说明 |
|------|------|
| 触发方式 | 点击 Agent 图标 → 选择学习模式 |
| 核心能力 | 记录用户操作、行为评估与预测 |
| 退出方式 | 点击图标 → 选择结束 → 结束记录 |
| 边界情况 | 网络中断时本地缓存，恢复后同步 |

#### 7.3 引导模式 🎬

| 功能 | 说明 |
|------|------|
| 核心能力 | 播放 rrweb 录制的操作录像 + Agent 讲解 |
| 录像选择 | 根据当前页面上下文，推荐相关录像 |
| 遮罩功能 | 遮挡真实系统，突出操作区域 |
| 打断机制 | 用户随时可提问，Agent 暂停并解答 |
| 问答记录 | 展示 Agent 和原操作人员的问答记录 |

#### 7.4 主动模式 🚀

| 功能 | 说明 |
|------|------|
| 任务列表 | 显示待执行的任务列表 |
| 添加任务 | 添加临时任务 |
| 操作执行 | Agent 直接在页面上执行操作 |
| 实时可见 | 所有操作对用户可见，支持监控 |
| 用户接管 | 用户可随时接管，停止 Agent |
| 异常处理 | 操作失败时提示用户并请求指令 |

#### 7.5 Chat 能力（通用）

| 功能 | 说明 |
|------|------|
| 对话界面 | 浮层面板内，包含输入框和消息列表 |
| 打断机制 | 任何模式下随时呼出 Chat |
| 上下文关联 | Chat 理解当前操作上下文 |
| 恢复机制 | Chat 结束后恢复到之前状态 |

#### 7.6 Agent 状态可视化

| 状态 | 图标变化 | 说明 |
|------|---------|------|
| 空闲 | 灰色静态图标 | 等待用户交互 |
| 学习中 | 蓝色脉冲图标 | 记录用户操作中 |
| 引导中 | 橙色播放图标 | 播放录像演示中 |
| 执行中 | 绿色旋转图标 | Agent 正在操作 |
| 异常 | 红色警告图标 | 需要用户关注 |

#### 7.7 UI 形态
- **浮动 Icon**：屏幕角落（右下角默认，可拖拽）
- **轻量风格**：类似 Siri 交互体验

---

### 模块八：Agent 任务系统

#### 8.1 任务定义
- Agent 任务是分配给 Agent 执行的工作单元
- 可以是简单的提示词，也可以是复杂的工作流

#### 8.2 任务类型

| 类型 | 说明 |
|------|------|
| 临时任务 | 一次性任务，立即执行 |
| 周期任务 | 按 Cron 表达式定时执行 |
| 派发任务 | 其他系统派发的任务 |

#### 8.3 任务属性

| 属性 | 说明 |
|------|------|
| owner_id | 创建人/拥有者 |
| workspace_id | 关联的工作区 |
| agent_id | 执行任务的 Agent |
| 优先级 | 高、中、低 |
| 任务描述 | 简要描述 |
| 任务内容 | Markdown 格式的任务内容 |
| 执行状态 | 待执行、执行中、暂停、成功、失败 |
| 重试配置 | 最大重试次数、重试间隔 |
| webhook | 执行完成后的反馈地址 |

#### 8.4 任务状态机

```
创建 → 待执行 → 执行中 → 成功/失败
                    ↓
                  暂停 ← 用户暂停
                    ↓
                  取消 ← 用户取消
                  
失败 → 重试 → 执行中（最多 N 次）
         ↓
       最终失败
```

#### 8.5 任务执行约束

| 约束 | 说明 |
|------|------|
| 最大执行时长 | 单次任务执行最大 30 分钟 |
| 任务队列限制 | 单个 Agent 最多同时执行 3 个任务 |
| 重试冷却时间 | 失败后至少等待 1 分钟 |

#### 8.6 任务执行录像

| 功能 | 说明 |
|------|------|
| 录像格式 | rrweb 录制，.webm 格式 |
| 录像时长 | 单次最长 2 小时，超出后分段存储 |
| 录像存储 | 保留 30 天后自动清理 |
| 录像权限 | 仅 Agent 拥有者和系统管理员可查看 |

#### 8.7 Webhook 反馈

| 功能 | 说明 |
|------|------|
| 超时设置 | Webhook 回调超时 10 秒 |
| 重试策略 | 失败后最多 3 次重试（1min、5min、15min） |
| 签名验证 | 支持 HMAC-SHA256 签名 |
| 幂等性 | 接收方需保证幂等 |

---

### 模块九：Skills 技能系统

#### 9.1 Skills 定义
- Skills 是 Agent 的能力模块，为 Agent 提供特定功能支持
- 由 Markdown 文档和脚本文件组成
- 支持分类、标签、版本管理

#### 9.2 Skills 文件结构

```
skill-root/
├── SKILL.md              # 主入口文件
├── scripts/              # 脚本目录
│   ├── file1.sh
│   └── file2.py
├── docs/                 # 文档目录
│   └── README.md
└── 其他目录和文件...
```

#### 9.3 Skills 数据模型

**Skill 实体**

| 属性 | 说明 |
|------|------|
| code | 唯一标识符 |
| name | 展示名称 |
| level | 粒度级别（Planning/Functional/Atomic） |
| tags | 标签数组 |
| status | 状态（draft/active/disabled） |
| draft_snapshot | 草稿快照 |

**SkillVersion 实体**

| 属性 | 说明 |
|------|------|
| skill_id | 关联的 Skill |
| version | 版本号（如 1.0.0） |
| file_snapshot | 文件快照 |
| comment | 版本发布说明 |

**FileMetadata 实体**

| 属性 | 说明 |
|------|------|
| name | 文件名 |
| path | 文件路径 |
| size | 文件大小 |

**File 实体**

| 属性 | 说明 |
|------|------|
| file_metadata_id | 关联的 FileMetadata |
| version | 文件版本号 |
| content | 文件内容 |

#### 9.4 Skills 粒度级别

| 级别 | 说明 |
|------|------|
| Planning（规划级） | 粗粒度，适合复杂业务流程 |
| Functional（功能级） | 中等粒度，适合常见业务场景 |
| Atomic（原子级） | 最小可复用单元 |

#### 9.5 Skills 状态机

```
创建 → 草稿(draft) → 激活(active) → 禁用(disabled)
                  ↓
              发布（复制草稿到版本）
                  ↓
              回滚（用历史版本覆盖草稿）
```

#### 9.6 文件操作

| 操作 | 说明 |
|------|------|
| 创建文件 | 上传/新建文件，更新草稿快照 |
| 编辑文件 | 新增版本记录，更新草稿快照 |
| 删除文件 | 从草稿快照移除记录 |
| 发布 | 将草稿快照转为正式版本 |
| 禁用 | 设置状态为 disabled |
| 回滚 | 用历史版本覆盖当前草稿 |

#### 9.7 Skills 页面

| 页面 | 路由 |
|------|------|
| Skills 列表页 | `/admin/skills` |
| Skill 详情页 | `/skills/{code}` |

---

### 模块十：嵌入网站管理

#### 10.1 嵌入网站定义
- 嵌入网站指可以被 Agents 嵌入进行学习和操作的外部网站
- 与 Workspace 关联，一个 Workspace 可管理多个嵌入网站

#### 10.2 嵌入网站属性

| 属性 | 说明 |
|------|------|
| site_name | 网站名称 |
| site_url | 网站地址（有效 URL 格式） |
| description | 网站描述 |
| workspace_id | 关联的 Workspace |
| status | 状态（enabled/disabled） |

#### 10.3 嵌入网站状态机

```
创建 → 禁用(disabled) → 启用(enabled)
                      ↓
                   禁用(enabled)
```

#### 10.4 约束条件
- 同一 Workspace 下 site_name 唯一
- 删除前检查是否有关联 Agent

#### 10.5 嵌入网站页面

| 页面 | 路由 |
|------|------|
| 列表页 | `/workspace/{workspace_code}/embedded-sites` |
| 创建页 | `/workspace/{workspace_code}/embedded-sites/new` |
| 编辑页 | `/workspace/{workspace_code}/embedded-sites/{id}/edit` |

---

### 模块十一：Chrome 扩展系统

#### 11.1 扩展架构

```
Chrome Extension (MV3)
├── Service Worker (background/)
│   ├── 任务调度
│   ├── 消息路由
│   └── 离线缓存管理
├── Content Script (content/)
│   ├── recorder.ts    # rrweb 录像录制
│   ├── operator.ts     # DOM 操作执行
│   ├── overlay.ts      # Shadow DOM 遮罩
│   ├── iframe-manager.ts # Neo Frontend iframe 管理
│   └── storage.ts      # IndexedDB 存储
└── Extension UI (extension/)
    ├── popup
    └── options
```

#### 11.2 核心能力

| 模块 | 功能 |
|------|------|
| **录像录制** | rrweb 录制用户操作，支持回放 |
| **遮罩层** | Shadow DOM 样式隔离，不受目标页面影响 |
| **DOM 操作** | Agent 在目标页面上执行操作 |
| **存储** | IndexedDB 离线存储，支持大容量 |
| **通信** | postMessage + BroadcastChannel |

#### 11.3 消息协议

| 通道 | 用途 |
|------|------|
| postMessage | iframe 内外通信 |
| BroadcastChannel | Content Script 与 Service Worker 通信 |

---

### 模块十二：系统管理与配置

#### 12.1 超级管理员功能

| 功能 | 说明 |
|------|------|
| 组织列表 | 查看所有组织树形结构 |
| 创建组织 | 在指定位置创建新组织 |
| 编辑组织 | 修改组织名称 |
| 删除组织 | 删除组织（需满足前置条件） |
| 员工列表 | 查看所有员工 |
| 员工调动 | 将员工从一个部门调到另一个部门 |
| 员工删除 | 软删除员工 |

#### 12.2 权限体系

| 角色 | 权限范围 |
|------|---------|
| 超级管理员 | 系统级管理权限（组织、用户） |
| Workspace 管理员 | Workspace 内管理权限 |
| Workspace 成员 | Workspace 内普通操作权限 |

---

## 四、技术特性总结

### 核心价值点

| 价值点 | 说明 |
|--------|------|
| **模块化设计** | Prompts 按类型分层（认知层+协作层），职责清晰 |
| **版本化管理** | 完整的历史记录，支持回滚 |
| **灵活 AI 支持** | 多 Provider 架构，支持 OpenAI/Claude/本地模型 |
| **实时协作** | 人机协同，实时可见操作过程 |
| **智能学习** | Agent 可从用户操作中学习和预测 |
| **标准化流程** | 任务系统支持周期任务、Webhook 反馈 |

### 安全与可靠性

| 特性 | 说明 |
|------|------|
| JWT 认证 | Token 机制保障 API 安全 |
| 软删除 | 数据保留，支持恢复 |
| 幂等设计 | Webhook 反馈支持幂等处理 |
| 操作日志 | 完整记录 Agent 学习、引导、操作日志 |

---

## 五、功能汇总表

| 序号 | 模块 | 主要功能 | 优先级 |
|------|------|---------|--------|
| 1 | 用户认证 | 注册、登录、密码管理 | P0 |
| 2 | 组织管理 | 组织 CRUD、层级管理 | P0 |
| 3 | 员工管理 | 员工档案、调动、状态管理 | P0 |
| 4 | Workspace | Workspace 创建、配置、成员管理 | P0 |
| 5 | Agent Prototype | Prototype 创建、Prompts 配置、版本管理 | P0 |
| 6 | Agent Factory | 基于 Prototype 生成 Agent | P0 |
| 7 | 学习模式 | 记录用户操作、行为评估 | P0 |
| 8 | 引导模式 | 录像播放、遮罩、Agent 讲解 | P0 |
| 9 | 主动模式 | Agent 任务执行、实时监控 | P0 |
| 10 | Chat 能力 | 随时打断的对话交互 | P0 |
| 11 | 任务系统 | 任务创建、执行、反馈、录像 | P0 |
| 12 | Skills 系统 | 技能创建、版本管理、文件编辑 | P1 |
| 13 | 嵌入网站 | 网站注册、状态管理 | P1 |
| 14 | Chrome 扩展 | 录制、遮罩、操作、存储 | P0 |
| 15 | 超级管理员 | 系统配置、用户管理 | P0 |

---

## 六、产品价值主张

### 核心理念

> **提取隐藏价值，让知识显性化**
> 
> **领域专家和 Agents 之间用 UBIQUITOUS LANGUAGE 沟通**

### 差异化优势

1. **人机协同新范式**：不同于传统 AI 工具，Neo 强调人与 AI 的双向学习和协作
2. **可观测的 AI 操作**：所有 Agent 操作实时可见，用户可随时接管
3. **结构化的知识管理**：Skills 系统让 AI 能力模块化、可复用、可版本化
4. **企业级架构**：完整的组织架构、权限体系、审计日志支持企业级部署
5. **灵活的 AI 集成**：多 Provider 架构支持企业灵活切换 AI 模型

---

*文档生成时间：2026-06-08*