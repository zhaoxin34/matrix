# Tasks: knlg-base-p3-llm-interview

## 1. Setup & Dependencies

- [ ] 1.1 添加 `litellm` 依赖到 `backend/pyproject.toml`（跟随 latest，决策 D-6）
- [ ] 1.2 添加 `jinja2` 依赖（Prompt 渲染，已是 FastAPI 传递依赖，确认即可）
- [ ] 1.3 验证 `httpx` 已安装（LiteLLM 已传递依赖）
- [ ] 1.4 配置 Redis 连接（限流 + Prompt 缓存）

## 2. Database Migration

- [ ] 2.1 编写 alembic migration `2026_07_xx_005_phase3_ai_interview.sql`
- [ ] 2.2 ALTER `knlg_interview_session` 加 8 列 + 2 索引（`idx_session_mode_status`, `idx_session_tree`）
- [ ] 2.3 CREATE `knlg_interview_ai_turn` 表（含 FULLTEXT ngram）
- [ ] 2.4 CREATE `knlg_signal` 表
- [ ] 2.5 CREATE `knlg_prompt_version_snapshot` 表
- [ ] 2.6 本地 `alembic upgrade head` 验证通过
- [ ] 2.7 `alembic downgrade base` 验证可回滚

## 3. Backend: LLM Gateway Services

- [ ] 3.1 创建 `backend/src/app/services/knlg_base/llm/` 目录结构
- [ ] 3.2 实现 `types.py`（Pydantic: LlmRequest, LlmResponse, LlmChunk, LlmError）
- [ ] 3.3 实现 `exceptions.py`（KnlgLlmRateLimitError / KnlgLlmTimeoutError / KnlgLlmAuthError / KnlgLlmUnavailableError）
- [ ] 3.4 实现 `router.py`（按 model_id 选 provider + fallback chain）
- [ ] 3.5 实现 `cost_guard.py`（Redis INCR + EXPIRE，限流 100/h/user）
- [ ] 3.6 实现 `logger.py`（写 `knlg_interview_ai_turn.llm_request_log` JSON）
- [ ] 3.7 实现 `client.py`（KnlgLlmClient 主入口，async chat() + stream()）
- [ ] 3.8 单元测试：cost_guard（超限/未超限）+ router（fallback chain）

## 4. Backend: Provider/Model/Prompt 配置复用

- [ ] 4.1 复用 Phase 1 `knlg_llm_provider` 表，加 api_key Fernet 加密工具
- [ ] 4.2 验证 `knlg_llm_model.fallback_model_id` 字段存在（若无则加 migration）
- [ ] 4.3 Redis cache provider 配置（key: `provider:{id}`, TTL 300s）
- [ ] 4.4 LLM 管理 API（已有 Phase 2 端点，复用 + 文档）

## 5. Backend: Prompt Management

- [ ] 5.1 实现 `KnlgPromptRenderer` 服务（读 + Jinja2 渲染 + Redis 缓存）
- [ ] 5.2 渲染失败错误处理（缺失变量 → KnlgPromptRenderError）
- [ ] 5.3 Prompt 缓存失效（创建 v2 时删 key 前缀）
- [ ] 5.4 单元测试：renderer（正常/缺失变量/缓存命中/缓存失效）

## 6. Backend: AI Interview Agent Services

- [ ] 6.1 创建 `backend/src/app/services/knlg_base/agent/` 目录结构
- [ ] 6.2 实现 `state_machine.py`（6 态状态机 + 转移白名单 + 副作用）
- [ ] 6.3 实现 `followup_decider.py`（10 种 `next_question_reason` 决策器）
- [ ] 6.4 实现 `signal_extractor.py`（LLM 实时抽取 + Pydantic schema 强约束）
- [ ] 6.5 实现 `summarizer.py`（AI 总结 + InterviewSummary Pydantic）
- [ ] 6.6 实现 `stream.py`（SSE 事件编排）
- [ ] 6.7 实现 `session_repo.py` / `turn_repo.py` / `signal_repo.py`
- [ ] 6.8 实现 `service.py`（KnlgInterviewAgentService 主入口）
- [ ] 6.9 实现 turn 双写（AI turn + Phase 1 turn 同一事务）

## 7. Backend: API Endpoints

- [ ] 7.1 `POST /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions`（启动 AI session）
- [ ] 7.2 `GET /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}`（详情）
- [ ] 7.3 `GET /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions`（列表，filter by mode='ai_agent'）
- [ ] 7.4 `GET /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}/stream`（SSE 流，含 Last-Event-ID）
- [ ] 7.5 `POST /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}/pause`（暂停）
- [ ] 7.6 `POST /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}/resume`（恢复 + Last-Event-ID）
- [ ] 7.7 `POST /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}/abandon`（放弃）
- [ ] 7.8 更新 `qa-library` 端点支持 `mode='ai_agent'` 创建（移除 P0 限制）

## 8. Frontend: LLM/Prompt API Client

- [ ] 8.1 创建 `frontend/lib/api/knlg-base/llm.ts`（knlgGet / knlgPost 包装）
- [ ] 8.2 创建 `frontend/lib/api/knlg-base/prompts.ts`（Prompt CRUD + 渲染）
- [ ] 8.3 SSE EventSource Hook `frontend/lib/hooks/use-interview-stream.ts`

## 9. Frontend: Signal Store

- [ ] 9.1 创建 `frontend/lib/stores/signal-store.ts`（Zustand）
- [ ] 9.2 `useSignalStore`：list of signals, by turn, subscribe/unsubscribe

## 10. Frontend: AI Interview UI

- [ ] 10.1 创建 `frontend/app/(main)/workspace/[workspace_code]/knlg-base/qa/interview/ai/` 路由
- [ ] 10.2 列表页（`page.tsx`）：AI sessions 列表 + filter
- [ ] 10.3 详情页（`[id]/page.tsx`）：流式对话 UI + AI 消息气泡 + 流式打字效果
- [ ] 10.4 创建 `frontend/components/knlg-base/ai/SignalChip.tsx`（信号标签，点击展开详情）
- [ ] 10.5 创建 `frontend/components/knlg-base/ai/FollowupReasonPanel.tsx`（追问原因解释）
- [ ] 10.6 创建 `frontend/components/knlg-base/ai/ThinkingIndicator.tsx`（"AI 正在思考..."）
- [ ] 10.7 断线重连机制（EventSource + Last-Event-ID header）

## 11. Frontend: Prompt Editor

- [ ] 11.1 创建 `frontend/app/(main)/workspace/[workspace_code]/knlg-base/prompts/` 路由
- [ ] 11.2 列表页：Prompt 列表 + 版本号 + 操作按钮
- [ ] 11.3 详情页：Monaco Editor + 变量声明面板 + "试运行"按钮
- [ ] 11.4 安装 Monaco Editor（已用 `@monaco-editor/react` 则跳过）
- [ ] 11.5 版本对比（diff 视图）

## 12. Tests

- [ ] 12.1 单元测试：`state_machine`（6 态转移 + 非法转移拒绝）
- [ ] 12.2 单元测试：`followup_decider`（10 种 reason 触发条件）
- [ ] 12.3 单元测试：`signal_extractor`（Pydantic 校验失败 + 重试）
- [ ] 12.4 单元测试：`prompt_renderer`（正常/缺失变量/缓存命中/失效）
- [ ] 12.5 集成测试：mock LLM 跑完整 turn 流程（start → answer → signal → next question → summarize）
- [ ] 12.6 E2E：真实 LLM（gpt-4o-mini）跑 5 个 persona × 完整访谈
- [ ] 12.7 E2E：SSE 断线重连测试

## 13. Quality Gates

- [ ] 13.1 `make lint` (backend ruff + frontend eslint) 全绿
- [ ] 13.2 `make typecheck` (mypy + tsc) 全绿
- [ ] 13.3 `make test` (pytest) 全绿，目标 ≥ 600 passed
- [ ] 13.4 frontend `pnpm build` 通过
- [ ] 13.5 pre-commit hook 通过

## 14. Documentation & Handoff

- [ ] 14.1 更新 `implementation-roadmap.md`：Phase 3 W8-W10 标完成
- [ ] 14.2 更新 `design/docs/technical/knlg-base/index.md`：04/05/06 标完成
- [ ] 14.3 添加 frontend README：`frontend/app/(main)/workspace/[workspace_code]/knlg-base/qa/interview/ai/README.md`
- [ ] 14.4 OpenSpec change archive（实施完成后）

## 15. Production Readiness

- [ ] 15.1 配置 `KNLG_LLM_KEY_ENCRYPTION_KEY` env（Fernet master key）
- [ ] 15.2 配置 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`（首期至少 2 个 provider）
- [ ] 15.3 配置 Redis URL（限流 + Prompt 缓存）
- [ ] 15.4 部署脚本（alembic upgrade + uvicorn 启动）
- [ ] 15.5 监控：调用成功率、限流触发率、信号识别 confidence 分布
- [ ] 15.6 feature flag `KNLG_AI_INTERVIEW_ENABLED`（默认 true，可紧急关闭）

---

## Verification Contract

完成上述所有任务后，必须满足：

- ✅ `openspec status --change knlg-base-p3-llm-interview` 显示 4/4 artifacts done
- ✅ `make test` 通过，backend ≥ 600 passed
- ✅ `make lint` + `make typecheck` 全绿
- ✅ E2E 测试 5 个 persona 全部通过
- ✅ 端到端跑通：登录 → 创建 AI session → 专家回答 1 轮 → AI 追问 → 完成总结
- ✅ agent-browser 验证：UI 渲染、SSE 流式、信号高亮、追问原因面板
- ✅ 设计文档（roadmap.md + index.md）同步标完成

## Estimated Effort

- Setup + Migration：0.5 天
- 后端 LLM + Agent：3-4 天
- 后端 API：1 天
- 前端 API + Store：0.5 天
- 前端 UI：2-3 天
- 测试：1-2 天
- 文档 + 部署：0.5 天

**总工作量**：约 8-10 天（与 implementation-roadmap.md Phase 3 估算一致）
