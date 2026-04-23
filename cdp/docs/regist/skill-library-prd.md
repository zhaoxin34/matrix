# 技能库 (Skill Library) PRD

## 1. Executive Summary

建设一个技能库系统，用于存储和管理 AI 技能的 markdown 文档。系统采用 MySQL 数据库存储技能元数据和内容，支持按标签搜索和三级分类体系（Planning / Functional / Atomic），提供完整的 CRUD 和软删除/启用禁用功能。

## 2. Problem Statement

### Who has this problem?
需要管理和共享 AI 技能文档的团队。

### What is the problem?
技能文档散落各地，缺乏统一管理，无法有效搜索和复用。

### Why is it painful?
- 技能文档查找困难
- 无法按分类/标签筛选
- 文档更新缺乏规范管理

### Evidence
- 当前技能文档分散在各处，缺乏集中管理

## 3. Target Users & Personas

### Primary Persona: 技能管理者
- 负责创建、更新、删除技能文档
- 需要按分类和标签组织技能

### Secondary Persona: 技能使用者
- 通过 API 查阅技能文档
- 按名称、标签、级别筛选技能

## 4. Strategic Context

- 构建统一的技能文档管理平台
- 为 AI Agent 提供标准化的技能调用接口
- 支撑技能库的后续扩展（如技能推荐、版本管理等）

## 5. Solution Overview

### 5.1 数据库设计

**表名: `skill`**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | 代号，如 `prd-development` |
| `name` | VARCHAR(200) | NOT NULL | 显示名称，可改，不必唯一 |
| `level` | ENUM | NOT NULL | Planning / Functional / Atomic |
| `tags` | JSON | 可NULL | 标签数组，如 `["workflow", "pm"]` |
| `author` | VARCHAR(50) | 可NULL | 作者 |
| `content` | LONGTEXT | NOT NULL | markdown 文档内容 |
| `is_active` | BOOLEAN | DEFAULT TRUE | 启用/禁用状态 |
| `deleted_at` | DATETIME | 可NULL | 软删除时间戳 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引:**
- `idx_code` on `code`
- `idx_level` on `level`
- `idx_is_active` on `is_active`
- `idx_deleted_at` on `deleted_at`

**约束:**
- `code` 规范: `[a-zA-Z0-9-]`，长度 4-64 字符，创建后不可更改
- `code` 唯一性: 全局唯一
- `level` 枚举值: `Planning`, `Functional`, `Atomic`

### 5.2 字段规范

| 字段 | 约束 | 说明 |
|------|------|------|
| `code` | NOT NULL, UNIQUE, 4-64 chars, `[a-zA-Z0-9-]` | 代号，创建后不可改 |
| `name` | NOT NULL | 显示名称，可改，不必唯一 |
| `level` | NOT NULL, ENUM | 三级分类 |
| `tags` | JSON array | 自由定义的标签 |
| `author` | VARCHAR(50) | 可NULL |
| `content` | LONGTEXT NOT NULL | markdown 内容 |
| `is_active` | BOOLEAN DEFAULT TRUE | 启用/禁用 |
| `deleted_at` | DATETIME | 软删除时间，有值表示已删除 |

### 5.3 API 设计

**Base Path: `/api/v1/skills`**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/skills` | 获取技能列表（支持分页、level/tags/is_active 筛选） |
| GET | `/api/v1/skills/{code}` | 获取单个技能详情 |
| POST | `/api/v1/skills` | 创建技能 |
| PUT | `/api/v1/skills/{code}` | 更新技能（code 不可改） |
| DELETE | `/api/v1/skills/{code}` | 软删除 |
| PATCH | `/api/v1/skills/{code}/activate` | 启用技能 |
| PATCH | `/api/v1/skills/{code}/deactivate` | 禁用技能 |

**状态说明:**
- `is_active=false` + `deleted_at=NULL` = 禁用状态
- `deleted_at` 有值 = 已软删除

### 5.4 列表查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | int | 页码，默认 1 |
| `page_size` | int | 每页数量，默认 20 |
| `level` | string | 按级别筛选 (Planning/Functional/Atomic) |
| `tags` | string | 按标签筛选，逗号分隔 |
| `is_active` | boolean | 按启用状态筛选 |
| `search` | string | 按名称模糊搜索（可选扩展） |

## 6. Success Metrics

### Primary Metric
- 技能创建成功率: 100%
- 技能查询响应时间: < 200ms

### Secondary Metrics
- 列表查询支持分页和筛选
- 软删除和启用禁用功能正常

## 7. User Stories & Requirements

### Story 1: 创建技能
As a 技能管理者, I want to 创建新技能, so that 扩充技能库内容.

**Acceptance Criteria:**
- [x] 可以通过 POST 创建技能
- [x] code 唯一性校验
- [x] level 必须是有效枚举值
- [x] tags 为 JSON 数组格式

### Story 2: 查询技能列表
As a 技能使用者, I want to 查询技能列表, so that 找到需要的技能.

**Acceptance Criteria:**
- [x] 支持分页查询
- [x] 支持按 level 筛选
- [x] 支持按 tags 筛选
- [x] 支持按 is_active 筛选

### Story 3: 获取技能详情
As a 技能使用者, I want to 获取技能详情, so that 查看完整内容.

**Acceptance Criteria:**
- [x] 通过 code 获取单个技能
- [x] 返回完整 content 内容
- [x] 已删除的技能不可访问

### Story 4: 更新技能
As a 技能管理者, I want to 更新技能, so that 修改技能内容.

**Acceptance Criteria:**
- [x] 可以更新 name, level, tags, author, content
- [x] code 不可修改
- [x] 更新 updated_at 时间戳

### Story 5: 软删除技能
As a 技能管理者, I want to 软删除技能, so that 移除不需要的技能.

**Acceptance Criteria:**
- [x] DELETE 设置 deleted_at，不真正删除数据
- [x] 已删除技能不可通过 API 访问
- [x] 可以通过筛选条件查询已删除技能（管理用途）

### Story 6: 启用/禁用技能
As a 技能管理者, I want to 启用/禁用技能, so that 控制技能可用性.

**Acceptance Criteria:**
- [x] PATCH /activate 设置 is_active=true
- [x] PATCH /deactivate 设置 is_active=false
- [x] 禁用技能仍然存在于数据库，但不可被普通查询访问

## 8. Out of Scope

- 技能版本管理
- 技能依赖关系（skill A 依赖 skill B）
- 技能推荐算法
- 技能使用统计
- 自动同步外部文档
- 技能评论/评分

## 9. Dependencies & Risks

### Dependencies
- CDP 后端框架 (FastAPI + SQLAlchemy)
- MySQL 数据库
- 现有用户认证系统

### Risks & Mitigations
- **Risk:** code 冲突
  - **Mitigation:** 创建时唯一性校验，返回 409 Conflict
- **Risk:** content 内容过大
  - **Mitigation:** 使用 LONGTEXT 类型，支持最大 4GB

## 10. Open Questions

- [ ] 是否需要技能分类（category）？
- [ ] 是否需要技能关联（如 prd-development 依赖 problem-statement）？
- [ ] 是否需要导出功能（导出为单个 markdown 文件）？
