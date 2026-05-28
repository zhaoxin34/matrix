## Why

Neo 项目需要一套完整的 Skills 管理系统，为 Agent 提供标准化的技能支持能力。Skills 作为核心功能，承载了 markdown 文档和 script 脚本等多种文件类型的组合，需要支持版本管理、文件编辑、发布与回滚等完整生命周期操作。

## What Changes

- **新增 Skills CRUD 功能**：支持创建、读取、更新、软删除 Skill
- **新增文件管理功能**：支持文件的创建、编辑、删除，支持多级目录结构
- **新增版本管理功能**：支持发布草稿为正式版本，查看版本历史，执行回滚操作
- **新增状态管理功能**：支持 draft → active → disabled 状态流转
- **新增权限控制**：支持按角色（super_admin, skill_admin, skill_editor, skill_viewer）控制操作权限

## Capabilities

### New Capabilities

- `skill-crud`: Skill 基本信息的增删改查操作，包括名称、级别、标签等字段管理
- `skill-files`: Skill 文件管理，包括文件树展示、文件内容读写、多版本存储
- `skill-versioning`: Skill 版本管理，包括发布、回滚、版本历史查看
- `skill-status`: Skill 状态机管理，包括草稿、激活、禁用状态的流转控制
- `skill-permission`: Skill 权限控制，按角色控制创建、编辑、发布、禁用等操作

### Modified Capabilities

- （无）

## Impact

- **前端**: 新增 `/admin/skills` 列表页和 `/skills/{code}` 详情页
- **后端**: 新增 `/api/v1/skills` 系列 API（13个端点）
- **数据库**: 新增 4 张表（skills, skill_versions, file_metadata, files）
- **权限系统**: 新增 skill_admin, skill_editor, skill_viewer 角色
- **依赖**: 无外部依赖