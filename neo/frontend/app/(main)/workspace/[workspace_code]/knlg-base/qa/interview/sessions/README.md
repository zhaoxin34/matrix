# AI Interview Workspace (`/qa/interview/sessions`)

Phase 3 路线的 SSE 流式访谈界面。负责人：Joky.Zhao — 2026-07-04。

## 数据流概览

```
浏览器 ── EventSource ──▶ GET /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions/{id}/stream
                              │
                              │  11 个事件类型：connected / message_start /
                              │  content_delta / signal_detected / question_proposed /
                              │  message_end / session_state_changed / turn_completed /
                              │  summary_ready / error / done
                              ▼
                         KnlgInterviewAgentService.process_turn()
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        SignalExtractor   FollowupDecider   InterviewSummarizer
        (LLM 实时抽信号)   (10 reason 决策)  (LlmRequest + 写 ai_turn + 写 signal)
```

详细协议见 [design/docs/technical/knlg-base/06-interview-agent.md](../../../../../../../design/docs/technical/knlg-base/06-interview-agent)。
State machine 6 态详见 [openspec change spec/specs/ai-interview-agent/spec.md](../../../../../../../openspec/changes/knlg-base-p3-llm-interview/specs/ai-interview-agent/spec.md)。

## 路由

| Path | 用途 |
|---|---|
| `/workspace/[code]/knlg-base/qa/interview/sessions` | 所有 interview sessions 列表（manual + ai_agent 共享） |
| `/workspace/[code]/knlg-base/qa/interview/sessions/[id]` | 单个 session 流式对话页 |

启动一个 AI session：`POST /api/v1/workspaces/{code}/knlg-base/qa/interview/ai/sessions`，会返回 SSE stream URL。

## 关键组件

| 文件 | 职责 |
|---|---|
| `components/knlg-base/ai/SignalChip.tsx` | 单个信号标签，可点开展开 details |
| `components/knlg-base/ai/FollowupReasonPanel.tsx` | 显示 AI 追问的原因（`next_question_reason` 之一） |
| `components/knlg-base/ai/ThinkingIndicator.tsx` | "AI 正在思考..." 加载占位 |
| `lib/hooks/use-interview-stream.ts` | EventSource Hook + Last-Event-ID 重连 |
| `lib/stores/signal-store.ts` | Zustand signalsByTurn + allSignals + subscribeSignals 助手 |
| `lib/api/knlg-base/ai.ts` | REST 客户端（create / list / get / pause / resume / abandon） |

## 状态机

```
draft ──start──▶ ai_probing ──┐
   │                           │
   │                       (decide)
   │                           │
   │             ┌─── summarize ──▶ ai_summarizing ──▶ completed (terminal)
   │             │
   │             └─── wait ──────▶ waiting_for_context ──┐
   │                                                 (re-enable)
   │             ┌─── pause (人工) ──▶ paused ──────┐
   │             │                                  │
   │             └─── abandon / 超时 ──▶ abandoned (terminal)
```

实现于 `backend/src/app/services/knlg_base/agent/state_machine.py`。

## Known Limitations (Phase 3 MVP)

- 暂无 **追问决策 v2（LLM 动态生成追问）** —— 当前依赖 `KnlgQuestionTree` 静态规则
- SSE 持久化按 **turn 粒度**（decision D-2），不是 event 粒度
- `KNLG_AI_INTERVIEW_ENABLED=false` 可紧急关闭整个路由

## 调试

打开 DevTools Console：

- 信道事件：`content_delta` / `signal_detected` / `summary_ready`
- Zustand debug：`useSignalStore.setState(...)` 注入测试数据

后端日志：

```bash
tail -f logs/app.log | grep -E 'knlg_llm_metrics|signal_detected|turn_completed'
```
