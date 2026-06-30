## 1. Database Layer

- [x] 1.1 创建 Alembic migration 脚本，包含 17 张 `knlg_*` 表的 schema 定义（按 `design/docs/technical/knlg-base/01-database-schema.md` v1.1）
- [x] 1.2 应用 migration 到本地 dev 数据库：`cd backend && make migrate`
- [x] 1.3 验证所有表创建成功（`SHOW TABLES LIKE 'knlg_%'`），索引就位（17 张表 + 索引），外键约束生效
- [x] 1.4 准备 migration down 脚本（验证可回滚）

## 2. Backend Models

- [x] 2.1 创建 `backend/src/app/models/knlg_question_tree.py`
- [x] 2.2 创建 `backend/src/app/models/knlg_question.py`
- [x] 2.3 创建 `backend/src/app/models/knlg_interview_session.py`
- [x] 2.4 创建 `backend/src/app/models/knlg_interview.py`
- [x] 2.5 创建 `backend/src/app/models/knlg_interview_turn.py`
- [x] 2.6 创建 `backend/src/app/models/knlg_interview_turn.py`
- [x] 2.7 创建 `backend/src/app/models/knlg_knowledge_card.py`
- [x] 2.8 创建 `backend/src/app/models/knlg_source_ref.py`
- [x] 2.9 创建 `backend/src/app/models/knlg_knowledge_card_version.py`
- [x] 2.10 创建 `backend/src/app/models/knlg_document.py`
- [x] 2.11 创建 `backend/src/app/models/knlg_import_job.py`
- [x] 2.12 创建 `backend/src/app/models/knlg_parsed_chunk.py`
- [x] 2.13 创建 `backend/src/app/models/knlg_candidate_kc.py`
- [x] 2.14 创建 `backend/src/app/models/knlg_rule.py`
- [x] 2.15 创建 `backend/src/app/models/knlg_evidence.py`
- [x] 2.16 创建 `backend/src/app/models/knlg_rule_execution.py`
- [x] 2.17 更新 `backend/src/app/models/__init__.py` 导出所有 knlg_* model

## 3. Backend Pydantic Schemas

- [x] 3.1 创建 `backend/src/app/schemas/knlg_base/__init__.py`
- [x] 3.2 创建 `backend/src/app/schemas/knlg_base/knowledge.py`（KnowledgeCard create/update/response/list schemas）
- [x] 3.3 创建 `backend/src/app/schemas/knlg_base/qa.py`（QuestionTree / Question / InterviewSession / Interview / Turn / TurnRef schemas）
- [x] 3.4 创建 `backend/src/app/schemas/knlg_base/rule.py`（Rule / Evidence schemas）
- [x] 3.5 创建 `backend/src/app/schemas/knlg_base/import_.py`（Document / ImportJob schemas）

## 4. Backend Repository Layer

- [x] 4.1 创建 `backend/src/app/repositories/knlg_base/__init__.py`
- [x] 4.2 创建 `backend/src/app/repositories/knlg_base/base.py`（基础 repository：CRUD + 分页 + workspace_id 过滤）
- [x] 4.3 创建 `backend/src/app/repositories/knlg_base/knowledge.py`（KnowledgeCardRepository）
- [x] 4.4 创建 `backend/src/app/repositories/knlg_base/qa.py`（QuestionTreeRepository, QuestionRepository, InterviewSessionRepository, InterviewRepository, InterviewTurnRepository, InterviewTurnRefRepository）
- [x] 4.5 创建 `backend/src/app/repositories/knlg_base/rule.py`（RuleRepository, EvidenceRepository）
- [x] 4.6 创建 `backend/src/app/repositories/knlg_base/import_.py`（DocumentRepository, ImportJobRepository, ParsedChunkRepository）

## 5. Backend Service Layer

- [x] 5.1 创建 `backend/src/app/services/knlg_base/__init__.py`
- [x] 5.2 创建 `backend/src/app/services/knlg_base/base.py`（基础 service：workspace_code → id 转换、权限校验辅助）
- [x] 5.3 创建 `backend/src/app/services/knlg_base/knowledge.py`（KnowledgeCardService：CRUD + 状态机 + source ref 自动创建）
- [x] 5.4 创建 `backend/src/app/services/knlg_base/qa.py`（QuestionTreeService, QuestionService, InterviewSessionService, InterviewService, InterviewTurnService, InterviewTurnRefService）
- [x] 5.5 创建 `backend/src/app/services/knlg_base/rule.py`（RuleService：CRUD + 状态机 + 置信度校验；EvidenceService READ-ONLY）
- [x] 5.6 创建 `backend/src/app/services/knlg_base/import_.py`（DocumentService：上传 + RustFS 集成 + 哈希去重；ImportJobService：CRUD + 状态手动更新）

## 6. Backend API Routers

- [x] 6.1 创建 `backend/src/app/api/v1/knlg_base/__init__.py`
- [x] 6.2 创建 `backend/src/app/api/v1/knlg_base/knowledge.py`（knowledge cards endpoints）
- [x] 6.3 创建 `backend/src/app/api/v1/knlg_base/qa.py`（question tree / question / interview / turn endpoints）
- [x] 6.4 创建 `backend/src/app/api/v1/knlg_base/rule.py`（rule / evidence endpoints）
- [x] 6.5 创建 `backend/src/app/api/v1/knlg_base/import_.py`（document / import job endpoints）
- [x] 6.6 修改 `backend/src/app/main.py` 注册 `app.include_router(knlg_base_router, prefix="/api/v1/workspaces/{workspace_code}/knlg-base")`

## 7. Backend Quality Checks

- [ ] 7.1 运行 `cd backend && make lint`，确保 ruff 通过
- [ ] 7.2 运行 `cd backend && make format`
- [ ] 7.3 运行 `cd backend && make type-check`，确保 mypy 通过
- [ ] 7.4 手测 API：curl 测试每个 endpoint 的 happy path + 错误码路径（用 SPEC 验证场景）
- [ ] 7.5 验证跨 workspace 隔离：尝试访问其他 workspace 的资源应返回 404

## 8. Frontend Foundation

- [x] 8.1 启动 backend，从 OpenAPI 自动生成 TypeScript 类型：`cd frontend && pnpm generate-types`
- [x] 8.2 创建 `frontend/src/lib/knlg-base/` 目录结构
- [x] 8.3 创建 `frontend/src/lib/knlg-base/schemas/`（Zod schemas 对应各 capability 的 request/response）
- [x] 8.4 创建 `frontend/src/lib/knlg-base/api/knowledge.ts`（fetch wrappers for knowledge endpoints）
- [x] 8.5 创建 `frontend/src/lib/knlg-base/api/qa.ts`（fetch wrappers for qa endpoints）
- [x] 8.6 创建 `frontend/src/lib/knlg-base/api/rule.ts`（fetch wrappers for rule endpoints）
- [x] 8.7 创建 `frontend/src/lib/knlg-base/api/import.ts`（fetch wrappers for import endpoints）

## 9. Frontend Common Components

- [x] 9.1 创建 `frontend/src/components/knlg-base/KnowledgeCardItem.tsx`
- [x] 9.2 创建 `frontend/src/components/knlg-base/RuleConditionTree.tsx`
- [x] 9.3 创建 `frontend/src/components/knlg-base/QaCard.tsx`
- [x] 9.4 创建 `frontend/src/components/knlg-base/SourceRefList.tsx`
- [x] 9.5 创建 `frontend/src/components/knlg-base/ConfidenceBadge.tsx`
- [x] 9.6 创建 `frontend/src/components/knlg-base/StatusBadge.tsx`
- [x] 9.7 创建 `frontend/src/components/knlg-base/EmptyState.tsx`
- [x] 9.8 创建 `frontend/src/components/knlg-base/ErrorBoundary.tsx`

## 10. Frontend TanStack Query Hooks

- [ ] 10.1 创建 `frontend/src/hooks/knlg-base/useKnowledgeCards.ts`（list/get/create/update/delete + 状态变更）
- [ ] 10.2 创建 `frontend/src/hooks/knlg-base/useQuestions.ts`（question trees / questions CRUD）
- [ ] 10.3 创建 `frontend/src/hooks/knlg-base/useInterviews.ts`（sessions / interviews / turns CRUD）
- [ ] 10.4 创建 `frontend/src/hooks/knlg-base/useTurnRefs.ts`（turn references CRUD）
- [ ] 10.5 创建 `frontend/src/hooks/knlg-base/useRules.ts`（rules CRUD + 状态变更 + evidences READ）
- [ ] 10.6 创建 `frontend/src/hooks/knlg-base/useDocuments.ts`（document upload + list）
- [ ] 10.7 创建 `frontend/src/hooks/knlg-base/useImportJobs.ts`（job CRUD + status update + cancel）

## 11. Frontend Home Page [ ] 11.1 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/layout.tsx`（knlg-base 子布局 + 左侧导航） [ ] 11.2 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/page.tsx`（首页：4 个子模块导航卡片）
- [x] 11.3 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/error.tsx`（全局错误边界）

## 12. Frontend Knowledge Base Pages

- [x] 12.1 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/knowledge/page.tsx`（卡片列表 + 过滤 + 搜索）
- [x] 12.2 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/knowledge/cards/new/page.tsx`（新建卡片）
- [x] 12.3 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/knowledge/cards/[id]/page.tsx`（卡片详情）
- [x] 12.4 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/knowledge/cards/[id]/edit/page.tsx`（卡片编辑）
- [x] 12.5 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/knowledge/cards/[id]/versions/page.tsx`（版本列表）

## 13. Frontend QA Library Pages

- [x] 13.1 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/qa/page.tsx`（问答库入口）
- [x] 13.2 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/qa/questions/[id]/page.tsx`（问题详情 + 所有访谈）
- [x] 13.3 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/qa/interviews/[id]/page.tsx`（访谈详情 + 问答流）
- [x] 13.4 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/qa/sessions/new/page.tsx`（新建访谈会话）
- [x] 13.5 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/qa/templates/page.tsx`（问题树模板管理）

## 14. Frontend Rule Library Pages

- [x] 14.1 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/rules/page.tsx`（规则列表 + 过滤）
- [x] 14.2 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/rules/new/page.tsx`（新建规则 + 条件编辑器）
- [x] 14.3 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/rules/[id]/page.tsx`（规则详情）
- [x] 14.4 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/rules/[id]/edit/page.tsx`（规则编辑）
- [x] 14.5 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/rules/[id]/evidences/page.tsx`（证据列表）

## 15. Frontend Knowledge Import Pages

- [x] 15.1 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/import/page.tsx`（文档列表 + 上传按钮）
- [x] 15.2 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/import/upload/page.tsx`（上传文档表单）
- [x] 15.3 创建 `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/import/jobs/[id]/page.tsx`（导入任务详情 + 进度展示）

## 16. Frontend Quality Checks

- [ ] 16.1 运行 `cd frontend && pnpm lint`，确保 ESLint 通过
- [ ] 16.2 运行 `cd frontend && pnpm format`，Prettier 格式化
- [ ] 16.3 运行 `cd frontend && pnpm type-check`，确保 TypeScript 编译通过
- [ ] 16.4 手测前端：登录 → 创建 workspace → 进入 knlg-base → 验证 4 个子模块入口可见
- [ ] 16.5 手测 CRUD：在 1 个 workspace 内完成知识卡片/问答/规则/导入的创建-列表-详情-编辑-删除流程

## 17. Integration & Validation

- [ ] 17.1 端到端走通：登录 → 创建 workspace → 进入 `/workspace/{code}/knlg-base` → CRUD 5 个子模块
- [ ] 17.2 验证跨 workspace 隔离：用 workspace A 创建知识卡，在 workspace B 访问应返回 404
- [ ] 17.3 验证权限矩阵：分别用 Owner / Admin / Member / Guest 4 个角色测试 CRUD + 状态变更
- [ ] 17.4 验证 API 响应格式：所有成功/错误响应都符合 `{code, message, data, traceId, timestamp}` 规范
- [ ] 17.5 验证前端按钮可见性：Guest 用户应看不到"Edit/Delete/Publish"按钮

## 18. Documentation

- [ ] 18.1 更新 `design/docs/technical/knlg-base/index.md` 中的实施节奏：标记 P0 CRUD 已完成
- [ ] 18.2 同步 `design/docs/product/knlg-base/implementation-roadmap.md` Phase 1 状态
- [ ] 18.3 提交代码到 git（使用 conventional commits 格式）
