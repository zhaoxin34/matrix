## Context

技能库 (Skill Library) 用于集中存储和管理 AI 技能的 markdown 文档。当前技能文档分散各处，缺乏统一管理机制。

CDP 平台使用 FastAPI + SQLAlchemy + MySQL，本项目复用现有架构。

## Goals / Non-Goals

**Goals:**
- 提供技能文档的 CRUD API
- 支持软删除（数据不丢失，可恢复）
- 支持启用/禁用状态控制
- 支持按 level、tags、is_active 筛选
- 支持分页查询

**Non-Goals:**
- 技能版本管理
- 技能依赖关系
- 技能推荐算法
- 技能使用统计
- 自动同步外部文档

## Decisions

### 1. 数据库表设计

**使用现有 CDP 数据库，不新建库**

```sql
CREATE TABLE skill (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    code        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    level       ENUM('Planning', 'Functional', 'Atomic') NOT NULL,
    tags        JSON,
    author      VARCHAR(50),
    content     LONGTEXT NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    deleted_at  DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_level (level),
    INDEX idx_is_active (is_active),
    INDEX idx_deleted_at (deleted_at)
);
```

**code 规范**: `[a-zA-Z0-9-]`，长度 4-64 字符，创建后不可更改
**code 唯一性**: 全局唯一

### 2. 目录结构

参考 CDP 后端现有结构：

```
cdp/backend/src/app/
├── models/
│   └── skill.py              # SQLAlchemy Model
├── schemas/
│   └── skill.py              # Pydantic Schemas
├── repositories/
│   └── skill_repo.py         # Data access layer
├── services/
│   └── skill_service.py      # Business logic
└── api/v1/
    └── skills.py             # API endpoints
```

### 3. API 设计

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/skills` | 获取技能列表（支持分页、level/tags/is_active 筛选） |
| GET | `/api/v1/skills/{code}` | 获取单个技能详情 |
| POST | `/api/v1/skills` | 创建技能 |
| PUT | `/api/v1/skills/{code}` | 更新技能（code 不可改） |
| DELETE | `/api/v1/skills/{code}` | 软删除 |
| PATCH | `/api/v1/skills/{code}/activate` | 启用技能 |
| PATCH | `/api/v1/skills/{code}/deactivate` | 禁用技能 |

### 4. 软删除策略

- `deleted_at = NULL`: 正常状态
- `deleted_at` 有值: 已软删除

列表查询默认只返回 `deleted_at IS NULL` 的记录，除非明确传入 `include_deleted=true`。

### 5. code 验证

使用正则表达式 `^[a-zA-Z0-9-]{4,64}$` 验证 code。

## Risks / Trade-offs

- **Risk**: code 唯一性冲突 → **Mitigation**: 创建时唯一性校验，返回 409 Conflict
- **Risk**: content 内容过大 → **Mitigation**: 使用 LONGTEXT 类型，最大 4GB

## Migration Plan

1. 创建数据库迁移文件 (Alembic)
2. 部署到开发环境验证
3. 验证各 API 端点功能
4. 合并到主分支

## Open Questions

- 是否需要导出功能（导出为单个 markdown 文件）？
- 是否需要技能关联（如 prd-development 依赖 problem-statement）？
