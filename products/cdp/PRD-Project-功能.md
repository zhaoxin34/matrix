# 项目（Project）功能 PRD

## 1. Executive Summary

我们正在为 CDP 平台构建"项目"（Project）功能，为 AI 研究人员提供完全数据隔离的多租户架构。当前 CDP 平台没有多租户概念，所有数据都在同一空间，无法满足 AI 实验场景隔离的需求。通过引入项目概念，允许多个项目共享组织数据的同时保持业务数据独立，实现类似 Notion/Linear workspace 的数据隔离能力。该功能将首先支持项目管理和成员管理，后续逐步实现数据层面的隔离。

## 2. Problem Statement

### Who has this problem?

AI 研究人员需要在 CDP 平台上进行不同实验场景的研究和测试。

### What is this problem?

当前 CDP 平台缺乏多租户概念，所有员工数据和组织结构都在同一空间。当 AI 研究人员需要隔离不同实验场景时，无法实现：
- 数据完全隔离
- 成员权限独立管理
- 实验配置独立维护

### Why is it painful?

- **数据污染风险**：不同实验的数据混合在一起，无法保证数据纯净度
- **权限混乱**：无法按项目区分管理员和成员权限
- **复用困难**：需要在多个独立环境中重复创建相似的组织数据

### Evidence

- AI 研究人员明确需要在隔离环境中测试不同的 AI 策略
- 缺乏类似 Notion/Linear workspace 的项目概念
- 一个用户可能同时属于多个项目，需要独立的权限管理

## 3. Target Users & Personas

### Primary Persona: AI 研究人员

- **角色**：AI 算法研究员或 AI 产品经理
- **目标**：在隔离环境中验证不同 AI 策略的效果
- **痛点**：当前无法隔离数据和配置，导致实验结果不准确
- **行为**：创建项目、添加成员、配置组织关联、管理实验数据

### Secondary Persona: 项目管理员

- **角色**：AI 实验项目负责人
- **目标**：管理团队成员的访问权限和项目配置
- **痛点**：无法精细控制谁能访问哪些数据
- **行为**：添加/移除成员、设置角色、关联组织数据

## 4. Strategic Context

### Business Goals

- 支持 AI 研究的快速迭代
- 提供真实的业务模拟数据环境
- 建立稳健、可扩展的架构

### Why Now?

AI Matrix 项目进入第一阶段后期，需要为 AI 研究提供基础架构支持。项目功能是多租户架构的基础，后续所有功能都将基于项目进行数据隔离。

## 5. Solution Overview

### 核心设计

1. **Project 表**：存储项目基本信息（name, code, description, status）
2. **ProjectMember 表**：存储项目成员关系和角色（admin/member）
3. **OrgProject 关联表**：控制项目可访问的组织范围

### 数据模型

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   project   │──1:N──│  project_member   │──N:1──│    user     │
└─────────────┘       └──────────────────┘       └─────────────┘
       │
       │ N:M
       ▼
┌─────────────┐
│ org_project │ (组织-项目关联表)
└─────────────┘
       │
       │ N:1
       ▼
┌──────────────────┐
│ organization_unit│
└──────────────────┘
```

### 关键特性

- **松耦合**：Project 不直接侵入 Employee/OrganizationUnit 模型
- **灵活关联**：一个组织可关联到多个项目，实现数据共享
- **清晰隔离**：通过 OrgProject 关联表控制项目可访问的组织范围
- **项目上下文传递**：前端通过 `x-project-id` header 传递当前项目

## 6. Success Metrics

### Primary Metric

- **项目创建成功率**：100%（创建、成员管理、数据关联）
- **数据隔离有效性**：所有查询均正确过滤项目数据

### Secondary Metrics

- API 响应时间：< 200ms
- 用户满意度：项目切换流畅，成员管理便捷

## 7. User Stories & Requirements

### Epic Hypothesis

我们相信，为 CDP 平台添加项目功能，可以让 AI 研究人员在隔离的环境中验证 AI 策略，从而提高实验结果的准确性和可复用性。

### User Stories

**Story 1: 创建项目**
作为 AI 研究人员，我希望能够创建新项目，以便隔离不同的实验场景。

**Acceptance Criteria:**
- [ ] 能够创建项目，填写 name, code(唯一), description
- [ ] 项目 code 唯一性校验
- [ ] 项目创建后自动成为项目管理员

**Story 2: 管理项目成员**
作为项目管理员，我希望添加/移除项目成员，以便控制谁可以访问项目数据。

**Acceptance Criteria:**
- [ ] 项目管理员可以添加成员（通过用户 ID）
- [ ] 项目管理员可以移除成员
- [ ] 项目管理员可以更新成员角色（admin/member）
- [ ] 非管理员无法修改成员列表

**Story 3: 列出用户所属项目**
作为用户，我希望查看我所属的所有项目，以便在项目间切换。

**Acceptance Criteria:**
- [ ] 用户可以查看自己属于哪些项目
- [ ] 显示项目基本信息（name, code, role）

**Story 4: 项目详情与更新**
作为项目管理员，我希望能够更新项目信息和删除项目。

**Acceptance Criteria:**
- [ ] 项目管理员可以更新项目 name, description
- [ ] 项目管理员可以删除项目（同时清理成员关系）

**Story 5: 组织-项目关联**
作为项目管理员，我希望将项目与组织关联，以便共享组织数据。

**Acceptance Criteria:**
- [ ] 项目管理员可以关联/取消组织与项目的关联
- [ ] 关联后，项目可以访问该组织下的员工数据

### 约束与边界情况

- **向后兼容**：现有 is_admin 用户不受项目限制
- **性能**：OrgProject 关联查询需注意索引
- **数据隔离**：所有组织和员工查询必须通过 OrgProject 关联表过滤

## 8. Out of Scope

**本次不包含：**
- 项目级别的数据隔离实现（仅建立关联关系）
- 项目的详细权限控制（read/write/admin 三级）
- 项目使用量配额管理
- 项目的计费功能
- 跨项目数据引用/复制

**未来考虑：**
- 完整的项目数据隔离中间件
- 项目的审计日志
- 项目模板功能

## 9. Dependencies & Risks

### Technical Dependencies

- 数据库迁移脚本（004_add_project_tables.py）
- 现有的 EmployeeRepository、EmployeeService 模式
- 前端 Zustand Store 模式（参考 authStore）

### Risks & Mitigations

- **风险**：项目关联查询性能问题
  - **缓解**：在 org_project 表上添加适当索引

- **风险**：向后兼容性影响现有用户
  - **缓解**：is_admin 用户绕过项目限制

- **风险**：项目删除时的数据清理
  - **缓解**：级联删除 project_member，记录审计日志

## 10. Open Questions

- 项目是否需要支持嵌套（子项目）？
- 项目是否需要设置默认项目？
- 跨项目数据查询的性能如何优化？
- 是否需要支持项目级别的 Webhook 或事件通知？
