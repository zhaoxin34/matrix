## Context

技能库现有内容管理直接在 Skill.content 更新，无法追溯历史。需要在数据库层面支持版本化，实现发布-回滚能力。

**当前表结构：**
```
Skill: id, code, name, level, tags, author, status, content, created_at, updated_at, deleted_at
```

**目标表结构：**
```
Skill: id, code, name, level, tags, author, status, content(草稿), version(当前版本), created_at, updated_at, deleted_at
SkillVersion: id, skill_id, version, content, comment, created_at
```

## Goals / Non-Goals

**Goals:**
- 支持内容版本化发布
- 支持查看历史版本
- 支持回滚到任意版本
- 草稿内容与正式版本分离

**Non-Goals:**
- 不支持版本对比（diff）
- 不支持多人协作编辑冲突处理
- 不支持自动版本号生成

## Decisions

### 1. Skill.content 作为草稿

**决定**：Skill.content 始终代表草稿内容，发布时复制到 SkillVersion。

**理由**：
- 避免每次编辑都创建版本记录
- 草稿编辑无需版本号
- 回滚是内容逆向复制，操作简单

**替代方案**：
- 草稿也存入 SkillVersion（is_published=false）→ 复杂度高，版本列表需过滤
- 另建草稿表 → 增加维护成本

### 2. 版本号由用户输入

**决定**：用户手动输入版本号（如 "1.0.0", "2.1.3"）。

**理由**：
- 符合语义化版本习惯
- 用户最清楚版本命名规则
- 避免自动生成版本号的复杂性

**替代方案**：
- 系统自动生成（时间戳/自增）→ 用户无法理解
- 半自动（建议版本号，可修改）→ 增加复杂度

### 3. 版本号唯一性约束

**决定**：同一技能下，版本号必须唯一。

**实现**：
- 数据库层：skill_id + version 联合唯一索引
- API 层：发布前检查版本号是否存在

### 4. 回滚操作

**决定**：回滚复制内容并更新版本号，不删除目标版本记录。

**理由**：
- 保留回滚历史（记录何时回滚）
- 操作可逆
- 风险低，可从任意版本重新回滚

### 5. comment 必填

**决定**：发布时 comment 为必填项。

**理由**：
- 版本历史需要说明本次发布内容
- 便于日后追溯每个版本的改动目的
- 提高版本列表可读性

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 用户输入重复版本号 | 发布前 API 层校验，返回明确错误提示 |
| 草稿内容丢失（未发布直接关闭） | 草稿存在 Skill.content，刷新页面保留 |
| 版本号格式不规范 | 前端可做格式建议（如"主.次.补丁"），后端不强制校验 |
| 回滚后内容丢失 | 回滚是复制不是移动，旧内容在 SkillVersion 中保留 |

## Migration Plan

### Phase 1: 数据库迁移
```sql
-- 1. Skill 表增加 version 字段
ALTER TABLE skill ADD COLUMN version VARCHAR(50) DEFAULT NULL;

-- 2. 创建 SkillVersion 表
CREATE TABLE skill_version (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  skill_id BIGINT NOT NULL,
  version VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  comment VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (skill_id) REFERENCES skill(id),
  UNIQUE KEY uk_skill_version (skill_id, version)
);
```

### Phase 2: 后端 API 实现
- 新增 `POST /skills/{code}/publish` - 发布技能
- 新增 `GET /skills/{code}/versions` - 获取版本历史
- 新增 `POST /skills/{code}/rollback` - 回滚技能

### Phase 3: 前端 UI 实现
- 列表增加"发布"和"历史"按钮
- 发布弹窗：版本号 + comment 输入
- 历史弹窗：版本列表 + 回滚按钮
- 移除自动激活逻辑

### Phase 4: 数据清理
- 将现有 active 技能的内容创建初始版本（version="1.0.0"）

## Open Questions

1. **初始版本号默认值**：现有技能创建初始版本时，版本号默认 "1.0.0" 还是需要用户输入？
2. **draft 技能是否也需要版本号**：创建时 version=null 还是也需要一个默认值？
3. **删除技能时版本历史处理**：软删除 Skill 时，SkillVersion 如何处理？一并软删除还是保留？
