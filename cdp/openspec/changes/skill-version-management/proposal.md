## Why

技能库的 `content` 字段需要支持版本化管理。当前实现中，内容更新直接覆盖，无法追溯历史版本，也无法回滚。需要引入版本概念，实现内容的历史记录、发布管理和回滚能力。

## What Changes

- **Skill 表变更**
  - 新增 `version` 字段，记录当前发布的版本号（如 "1.0.0"）
  - `content` 字段保留，作为草稿内容（永远代表最新编辑状态）

- **SkillVersion 表（新增）**
  - 记录每次发布的内容快照
  - 字段：`id`, `skill_id`, `version`, `content`, `comment`, `created_at`
  - 用户输入版本号和发布说明后发布

- **发布流程变更**
  - Step2 保存后状态保持 draft（不自动激活）
  - 列表增加"发布"操作按钮
  - 发布弹窗输入版本号 + comment
  - 发布成功后 status=active，version 记录版本号，内容存档到 SkillVersion

- **回滚功能**
  - 列表增加"历史"操作按钮
  - 查看版本历史列表
  - 选择版本回滚：SkillVersion.content → Skill.content，version 更新

- **编辑功能调整**
  - 编辑内容时默认加载 Skill.content（当前草稿）
  - 可选择历史版本查看/编辑

## Capabilities

### New Capabilities

- **skill-version-publish**: 技能版本发布能力
  - 点击发布按钮弹出对话框
  - 输入版本号（用户手动输入，如 "1.0.0"）
  - 输入发布说明（comment）
  - 验证版本号不重复
  - 保存到 SkillVersion 表
  - 更新 Skill.version 和 Skill.status=active

- **skill-version-history**: 技能版本历史能力
  - 查看版本历史列表
  - 每个版本显示：版本号、comment、创建时间
  - 选择版本查看详情
  - 回滚到指定版本

- **skill-version-rollback**: 技能版本回滚能力
  - 从历史版本回滚到 Skill.content
  - 更新 Skill.version 为回滚的版本号
  - 内容覆盖更新

## Impact

- **数据库**：新增 SkillVersion 表，Skill 表增加 version 字段
- **后端 API**：
  - `POST /skills/{code}/publish` - 发布技能
  - `GET /skills/{code}/versions` - 获取版本历史
  - `POST /skills/{code}/rollback` - 回滚到指定版本
- **前端页面**：
  - 技能列表：增加"发布"和"历史"按钮
  - 技能创建/编辑：Step2 保存后保持草稿状态
  - 详情页：可查看当前版本号
