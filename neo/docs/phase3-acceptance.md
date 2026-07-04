# Phase 3 产品验收手册

> **作用**：Phase 3（LLM Gateway + AI 访谈 Agent）功能上线前的产品验收 checklist。
> 每条都给出可执行步骤 + 期望结果，覆盖 6 大新功能 + 5 类质量门。
>
> **面向角色**：QA、产品经理、Release Manager
>
> **预计时长**：~40 min 人工操作 + ~5 min 自动化脚本

## 0. 前置准备（2 min）

```bash
# 1. 启动 backend（首次配置 MiniMax）
cd /Volumes/data/working/ai/matrix/neo/backend
make ai-minimax              # 仅写 ANTHROPIC_API_BASE；密钥不写文件
export MINIMAX_API_KEY="<你的 key>"
make dev

# 2. 启动 frontend（新终端）
cd /Volumes/data/working/ai/matrix/neo/frontend
make dev

# 3. 登录：访问 http://localhost:3000
#    用户名: 13800138002
#    密码:   abcd1234
```

> ⚠️ **MINIMAX_API_KEY 不能 commit 到任何文件**。`.env` 里只有 `ANTHROPIC_API_BASE=https://api.minimaxi.com/anthropic`，密钥从 shell 环境变量读。

---

## 1. Feature 1 — AI 访谈 Session（核心新功能）

**入口**：`/workspace/<code>/knlg-base/qa/interview/ai`

### 1.1 列表页

| # | 操作 | 期望结果 |
|---|---|---|
| 1 | 访问 `/qa/interview/ai` | 看到状态徽章组件 + filter 按钮 |
| 1.1 | 7 态徽章 | `draft` 灰 / `ai_probing` 蓝 / `waiting_for_context` 黄 / `ai_summarizing` 紫 / `completed` 绿 / `paused` 橙 / `abandoned` 红 |
| 1.2 | Filter 按钮 | 按 status / expert_id 过滤 |

### 1.2 创建 + 流式对话

| # | 操作 | 期望结果 |
|---|---|---|
| 2 | 点击「创建 AI Session」 | 弹出表单：topic 输入框 + max_turns 数字框（默认 8） |
| 3 | 填 `topic="客户支持效率"`、`max_turns=5`，提交 | 跳转详情页，session 出现在列表 |
| 4 | 观察详情页 | 自动弹出「AI 正在思考...」指示器（ThinkingIndicator 组件） |
| 5 | 等待 3-8 秒 | 看到第一条 AI 问题出现，且**一个字一个字流式打字**（不是整段突然出现） |
| 6 | 输入框输入「响应慢」（< 10 字符）→ 提交 | AI 追问「能再详细说说吗？」(reason=TOO_SHORT) |
| 7 | 输入「3 天」→ 提交 | 出现 `key_metric` 信号标签（3 是关键数字） |
| 8 | 输入「我们 100+ 客户受影响」→ 提交 | AI 跳到下一问题（reason=HIGH_SIGNAL，因为检测到 pain_point signal） |
| 9 | 重复 6-8 直到 max_turns 用尽 | 看到 `summary_ready` 事件触发，弹出「AI 访谈总结」卡片，**Markdown 格式**渲染 |
| 10 | 列表页刷新 | session status = `completed` |

### 1.3 信号标签验证（贯穿 1.2）

**至少看到这 5 种标签之一**就算通过：

| 标签 | 颜色 | 含义 |
|---|---|---|
| `pain_point` | 红色 destructive | 痛点 / 抱怨 |
| `opportunity` | 蓝色 default | 商机 / 增长机会 |
| `counter_example` | 灰色 secondary | 反例 / 边界条件 |
| `boundary` | 浅色 outline | 适用边界 |
| `key_metric` | 灰色 secondary | 关键数据 |

**高级检查**：点击任意信号标签，**展开详情**（SignalChip 详情抽屉）。文本字段应来自专家回答原句或精确概括，confidence 字段以百分比形式显示。

### 1.4 Followup 原因面板（贯穿 1.2）

每次 AI 追问时，应在聊天区域上方/下方显示一块 FollowupReasonPanel：

```
┌─ AI 追问理由 ─────────────────────────┐
│  reason: TOO_SHORT                    │
│  rationale: 专家回答（3 字符）低于阈值  │
│  confidence: 0.85                    │
└────────────────────────────────────────┘
```

10 种 reason 类型必须能区分（不同 reason 渲染不同文案）。

### 1.5 状态机转移

| 步骤 | 操作 | 期望 |
|---|---|---|
| 14 | 创建新 session，正在对话 | status = `ai_probing` |
| 15 | 详情页点「暂停」 | status → `paused`，按钮变「恢复」 |
| 16 | 点「恢复」 | status → `ai_probing` |
| 17 | 点「放弃」 | status → `abandoned`（terminal，不可再转移） |

### 1.6 Last-Event-ID 重连

| 步骤 | 操作 | 期望 |
|---|---|---|
| 11 | 创建 session，打开 DevTools Network 面板，过滤 `stream` | SSE 响应中每条 event 有 `id: evt_<sid>_<turn>_<seq>` 格式 |
| 12 | 关闭浏览器 tab（模拟断线）| — |
| 13 | 重新打开详情页（如果 session 还在 `ai_probing` 状态）| EventSource 自动重连，浏览器自动发送 `Last-Event-ID: evt_<上次的id>` header |
| 14 | DevTools Network 看到第二个 stream 连接有 `Last-Event-ID` header | 重连 ID 与最后一次事件 id 一致 |

> ⚠️ 浏览器原生 EventSource 只能重连到上次 `id:` 字段，不能自定义 header。如果需要更精细的控制（如带 workspace_code 自定义 header），改用 fetch + ReadableStream。

---

## 2. Feature 2 — Prompt 模板管理（新 Monaco 编辑器）

**入口**：`/workspace/<code>/knlg-base/prompts`

### 2.1 列表页

| # | 操作 | 期望 |
|---|---|---|
| 1 | 访问 `/knlg-base/prompts` | 看到 Prompt 列表，每行含 key + version badge + status badge + 操作按钮 |
| 2 | 状态 filter 下拉 | active / deprecated / draft 三选项可过滤 |
| 3 | key 过滤输入框 | 输入后实时过滤 |

### 2.2 编辑器

| # | 操作 | 期望 |
|---|---|---|
| 2 | 点击「新建 Prompt」| 跳转 `/prompts/<id>` 编辑页 |
| 3 | 页面布局 | 左侧列表（占 2/3）+ 右侧变量面板（占 1/3） |
| 4 | 在 Monaco 里输入：`Hello {{ name }}, age {{ age }}` | Python 语法高亮（关键字蓝色、字符串红色、变量绿色） |
| 5 | 右侧变量面板 | **自动识别** `name`、`age` 两个变量，生成两个 Input |
| 6 | 在右面板输入 `name="张三"` `age="30"` | — |
| 7 | 点「试运行」| 绿色 toast「渲染成功」+ 下方卡片显示 `Hello 张三, age 30` |

### 2.3 缺失变量错误

| # | 操作 | 期望 |
|---|---|---|
| 8 | 清空 `age` 字段，再点「试运行」| 红色 toast「试运行失败: ERR_PROMPT_MISSING_VAR」+ 提示 `missing: ['age']` |

### 2.4 版本控制

| # | 操作 | 期望 |
|---|---|---|
| 9 | 保存当前 prompt | status = active，version = 1.0.0 |
| 10 | 修改 template，保存 | 创建新版本 v2.0.0，旧 v1.0.0 自动 → deprecated |
| 11 | filter = "deprecated" | 看到 v1.0.0 |
| 12 | filter = "active" | 看到 v2.0.0 |
| 13 | 点 v2.0.0 进编辑器 | template 框显示 v2 内容（不是 v1）|

> ⚠️ 版本对比 diff 视图在 MVP 不实现，记录为偏差。

---

## 3. Feature 3 — LLM Admin（Provider / Model 管理）

**入口**：**无 UI**，纯后端 REST API。用 curl 验收。

> 这块是 admin 操作，普通用户不接触。验收时用你的 token 当 admin。

### 3.1 Provider CRUD

```bash
TOKEN=<your-jwt-token>
CODE=<workspace-code>

# 1. 列 provider（初始空）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers
# 期望: 200, {"code":0,"data":[]}

# 2. 创建 provider
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"minimax","display_name":"MiniMax","api_key":"sk-test-abc","api_base_url":"https://api.minimaxi.com/anthropic"}' \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers
# 期望: 200, 返回 id=1 的 provider 对象

# 3. 验证 DB 里 api_key 是密文（不是 sk-test-abc）
cd /Volumes/data/working/ai/matrix/neo/backend
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
e = create_engine(settings.DATABASE_URL)
with e.connect() as c:
    r = c.execute(text(\"SELECT api_key_secret FROM knlg_llm_provider WHERE name='minimax'\"))
    val = r.scalar()
    print('DB value:', val)
    assert val.startswith('fernet-v1:'), 'NOT ENCRYPTED!'
    print('✅ Encrypted with Fernet')
"
# 期望: fernet-v1:gAAAAA...（密文）

# 4. 列 provider（默认 masked）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers | python -m json.tool | grep api_key_masked
# 期望: "fernet-v1:gAAAAAB..."

# 5. reveal 明文
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers?reveal=true" | python -m json.tool | grep api_key_masked
# 期望: "sk-test-abc"

# 6. 更新 provider
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"MiniMax Production"}' \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers/1
# 期望: 200, display_name 已更新

# 7. 删除 provider
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/providers/1
# 期望: 200, {"deleted":1}；关联 model 因 CASCADE 也被删
```

### 3.2 Model CRUD（同样的模式）

```bash
# 假设 provider id=2
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider_id":2,"name":"MiniMax-M2.7","display_name":"MiniMax M2.7","max_tokens":8192,"capabilities":["chat"]}' \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/models
# 期望: 200, model 创建成功

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/llm-admin/models?provider_id=2"
# 期望: 200, models 列表
```

---

## 4. Feature 4 — 紧急关闭开关

```bash
# 1. 关闭
cd /Volumes/data/working/ai/matrix/neo/backend
make ai-off
# 编辑 .env 把 KNLG_AI_INTERVIEW_ENABLED=false；显示 "Set KNLG_AI_INTERVIEW_ENABLED=false ..."

# 2. 重启 backend
make dev

# 3. 验证关闭
curl -H "Authorization: Bearer $TOKEN" \
  -X POST -H "Content-Type: application/json" \
  -d '{"topic":"test"}' \
  http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/qa/interview/ai/sessions
# 期望: 503 / 403 / 返回明确禁用提示

# 4. 重新开启
sed -i '' 's/^KNLG_AI_INTERVIEW_ENABLED=false/KNLG_AI_INTERVIEW_ENABLED=true/' .env
make dev

# 5. 验证开启
# 重试上面的 POST，应该正常创建 session
```

---

## 5. Feature 5 — 性能与可观测

### 5.1 Metrics 日志

```bash
# 1. 触发一次完整 AI 访谈（5 turns）
# 详情见 §1.2 步骤 2-9

# 2. 看 metrics 快照
tail -100 /Volumes/data/working/ai/matrix/neo/backend/logs/app.log | grep knlg_llm_metrics
# 期望: 出现 {"calls_total":N,"calls_success":M,"success_rate":0.X,"calls_rate_limited":K,
#          "signal_confidence_avg":0.XX,"signal_confidence_n":J} 这样的 JSON 日志
```

### 5.2 限流测试

```bash
TOKEN=<your-jwt-token>
CODE=<workspace-code>

# 连续 105 次（默认限 100/h/user）
for i in {1..105}; do
  curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d '{"topic":"test"}' \
    http://localhost:8000/api/v1/workspaces/$CODE/knlg-base/qa/interview/ai/sessions
done | grep -c "ERR_LLM_RATE_LIMIT"
# 期望: 出现 5+ 次（101-105 第 101 次开始）
```

### 5.3 SSE 首 token 延迟（TTFT）

```bash
# 在 Network 面板找一个 stream 连接
# 看 `event: content_delta` 第一个 chunk 距离 `event: message_start` 的时间差
# 期望: < 2 秒（gpt-4o）或 < 3 秒（MiniMax-M2.7 等 reasoning model）
```

---

## 6. Feature 6 — 数据库迁移可逆性

```bash
cd /Volumes/data/working/ai/matrix/neo/backend

# 1. 确认 head
uv run alembic current
# 期望: 2026_07_04_001 (head)

# 2. 验证新增列已落库
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
e = create_engine(settings.DATABASE_URL)
with e.connect() as c:
    cols = [row[0] for row in c.execute(text('DESCRIBE knlg_interview_session'))]
    for new_col in ['tree_id','waiting_reason','current_turn_index','max_turns','last_event_id','started_at','ended_at','summary']:
        print(f'{new_col}: {\"✓\" if new_col in cols else \"✗\"}')"
# 期望: 8 列全部 ✓

# 3. 验证 3 张新表
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
e = create_engine(settings.DATABASE_URL)
with e.connect() as c:
    for t in ['knlg_interview_ai_turn', 'knlg_signal', 'knlg_prompt_version_snapshot']:
        r = c.execute(text(f'SELECT COUNT(*) FROM {t}'))
        print(f'{t}: {r.scalar()} rows')"
# 期望: 3 张表都存在

# 4. 验证 downgrade 函数存在（不实际执行以免破坏数据）
grep -A3 "^def downgrade" alembic/versions/2026_07_02_001_phase3_ai_interview.py | head -10
# 期望: 看到 DROP TABLE IF EXISTS × 3 + ALTER TABLE ... DROP COLUMN × 8
```

---

## 7. 自动化验收脚本

上面的 1-6 步都可手动执行。也提供了一键脚本：

```bash
cd /Volumes/data/working/ai/matrix/neo
bash scripts/verify-phase3.sh              # 默认：跑 1-9 步（不含真实 LLM）
bash scripts/verify-phase3.sh --network    # 含 §12.6 5 persona E2E
```

**脚本输出样例**：

```
════════════════════════════════════════════════════════════
▶ 1. Tasks checklist (82 / 83 should be done)
════════════════════════════════════════════════════════════
  ✅ All 83 tasks complete

════════════════════════════════════════════════════════════
▶ 2. Quality gates
════════════════════════════════════════════════════════════
  ✅ backend ruff check
  ✅ backend mypy
  ✅ frontend lint
  ✅ frontend typecheck

════════════════════════════════════════════════════════════
▶ Summary
════════════════════════════════════════════════════════════
  ✅ Passed:  39
  ❌ Failed:  0
🎉 Phase 3 acceptance: ALL GREEN
```

---

## 8. 验收流程总览

| 步骤 | 内容 | 时长 |
|---|---|---|
| 0 | 启动 + 登录 | 2 min |
| 1 | Feature 1: AI 访谈（含 1.6 SSE 重连） | 15 min |
| 2 | Feature 2: Prompt 编辑器 | 5 min |
| 3 | Feature 3: LLM admin (curl) | 5 min |
| 4 | Feature 4: 紧急开关 | 3 min |
| 5 | Feature 5: 性能 / 限流 | 5 min |
| 6 | Feature 6: DB 迁移 | 3 min |
| 7 | 自动验收脚本 | 5 min |
| **Total** | | **~40 min** |

---

## 9. 验收签字

| 角色 | 姓名 | 日期 | 结论 |
|---|---|---|---|
| QA | ________ | ________ | □ 通过 □ 不通过 |
| 产品 | ________ | ________ | □ 通过 □ 不通过 |
| Release Manager | ________ | ________ | □ 通过 □ 不通过 |

---

## 附录 A — 已知偏差 / 限制

| 偏差 ID | 描述 | 决策 |
|---|---|---|
| §6.6 | SSE `stream.py` 拆为独立文件 | 偏差：聚合在 `agent_service.py` + `ai_interview.py` |
| §6.7 | `session_repo.py` / `turn_repo.py` / `signal_repo.py` 拆为独立文件 | 偏差：4 个 Repository class 聚合在 `repositories/knlg_base/agent.py` |
| §6.8 | `service.py` 拆为独立文件 | 偏差：主服务在 `agent_service.py` |
| §6.9 | Phase 1 turn 双写 | defer to Phase 4（schema 限制：`knlg_interview_turn.interview_id` NOT NULL） |
| §10.1 | `/ai/` 子路由 | 偏差：alias 到 `/sessions/` 复用页面 |
| §11.5 | Prompt 版本对比 diff 视图 | defer（不在 MVP 范围）|

## 附录 B — 相关链接

- 技术设计 `design/docs/technical/knlg-base/04-llm-gateway.md`
- 技术设计 `design/docs/technical/knlg-base/05-prompt-management.md`
- 技术设计 `design/docs/technical/knlg-base/06-interview-agent.md`
- 决策记录 `design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF.md §4.5`
- OpenSpec change: `openspec/changes/archive/2026-07-04-knlg-base-p3-llm-interview/`
- 实现路线图: `design/docs/product/knlg-base/implementation-roadmap.md` (§Phase 3)
- 自动化脚本: `scripts/verify-phase3.sh`
