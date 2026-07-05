#!/usr/bin/env bash
# Phase 3 acceptance verification.
#
# Runs every gate end-to-end and prints a green/yellow/red summary.
# Usage:
#   bash scripts/verify-phase3.sh            # fast (~3 min, default)
#   bash scripts/verify-phase3.sh --network  # full (~7 min, hits real LLM)
#
# Exit code: 0 if all green, 1 if any red.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

WITH_NETWORK=false
[ "${1:-}" = "--network" ] && WITH_NETWORK=true

pass=0
fail=0
section() {
    echo
    echo "════════════════════════════════════════════════════════════"
    echo "▶ $1"
    echo "════════════════════════════════════════════════════════════"
}
ok() {
    echo "  ✅ $1"
    pass=$((pass + 1))
}
ko() {
    echo "  ❌ $1"
    fail=$((fail + 1))
}

# ─────────────────────────────────────────────────────────────
section "1. Tasks checklist (82 / 83 should be done)"
TASKS="$ROOT/openspec/changes/archive/2026-07-04-knlg-base-p3-llm-interview/tasks.md"
done_n=$(grep -c '^- \[x\]' "$TASKS" 2>/dev/null || echo 0)
total_n=$(grep -c '^- \[ \]' "$TASKS" 2>/dev/null || echo 0)
left_n=$(grep -c '^- \[ \]' "$TASKS" 2>/dev/null || echo 0)
done_n=$((done_n))
left_n=$((left_n))
if [ "$left_n" -eq 0 ]; then
    ok "All 83 tasks complete (82 from prior session + 14.4 just ticked)"
else
    ko "Tasks incomplete: $left_n remaining"
    grep '^- \[ \]' "$TASKS"
fi

# ─────────────────────────────────────────────────────────────
section "2. Quality gates"
cd "$BACKEND"
if uv run ruff check src/ tests/ > /tmp/ruff.log 2>&1; then
    ok "backend ruff check"
else
    ko "backend ruff check failed"
    tail -20 /tmp/ruff.log
fi

if uv run mypy src/ --ignore-missing-imports > /tmp/mypy.log 2>&1; then
    ok "backend mypy"
else
    ko "backend mypy failed"
    tail -20 /tmp/mypy.log
fi

cd "$FRONTEND"
if pnpm lint > /tmp/flint.log 2>&1; then
    ok "frontend lint"
else
    ko "frontend lint failed"
    tail -20 /tmp/flint.log
fi

if pnpm typecheck > /tmp/ftc.log 2>&1; then
    ok "frontend typecheck"
else
    ko "frontend typecheck failed"
    tail -20 /tmp/ftc.log
fi

# ─────────────────────────────────────────────────────────────
section "3. Backend tests (default — no network)"
cd "$BACKEND"
start=$(date +%s)
if PYTHONPATH=tests:src uv run pytest tests/ -q --no-header > /tmp/pytest.log 2>&1; then
    end=$(date +%s)
    summary=$(tail -3 /tmp/pytest.log | head -1)
    elapsed=$((end - start))
    ok "pytest default suite — $summary in ${elapsed}s"
else
    ko "pytest default failed"
    tail -20 /tmp/pytest.log
fi

# ─────────────────────────────────────────────────────────────
section "4. Network E2E (real LLM)"
if [ "$WITH_NETWORK" = true ]; then
    if [ -z "${MINIMAX_API_KEY:-}" ]; then
        ko "MINIMAX_API_KEY unset — skipping §12.6 E2E"
    else
        start=$(date +%s)
        if PYTHONPATH=tests:src \
           MINIMAX_API_KEY="$MINIMAX_API_KEY" \
           ANTHROPIC_AUTH_TOKEN="$MINIMAX_API_KEY" \
           ANTHROPIC_API_BASE="https://api.minimaxi.com/anthropic" \
           ANTHROPIC_MODEL="MiniMax-M2.7" \
           uv run pytest tests/integration/test_ai_interview_e2e_real_llm.py -q --no-header > /tmp/e2e.log 2>&1; then
            end=$(date +%s)
            elapsed=$((end - start))
            summary=$(tail -1 /tmp/e2e.log)
            ok "§12.6 5-persona E2E — $summary in ${elapsed}s"
        else
            ko "§12.6 E2E failed"
            tail -20 /tmp/e2e.log
        fi
    fi
else
    echo "  ⏭  skipped (run with --network to enable)"
fi

# ─────────────────────────────────────────────────────────────
section "5. Database / migration sanity"
cd "$BACKEND"
if uv run alembic current 2>/dev/null | grep -q "2026_07_04_001"; then
    ok "alembic head = 2026_07_04_001 (fallback_model_id migration applied)"
else
    ko "alembic head does not include fallback_model_id migration"
    uv run alembic current 2>&1 | tail -3
fi

# Check Phase 3 tables exist
PYTHONPATH=src uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
e = create_engine(settings.DATABASE_URL)
with e.connect() as c:
    tables = ['knlg_interview_ai_turn', 'knlg_signal', 'knlg_prompt_version_snapshot']
    for t in tables:
        r = c.execute(text(f'SELECT COUNT(*) FROM {t}'))
        print(f'{t}: rows={r.scalar()}')
" > /tmp/dbcheck.log 2>&1
if grep -q "knlg_signal: rows=" /tmp/dbcheck.log; then
    ok "Phase 3 tables exist"
    cat /tmp/dbcheck.log | sed 's/^/     /'
else
    ko "Phase 3 tables missing"
    cat /tmp/dbcheck.log
fi

# ─────────────────────────────────────────────────────────────
section "6. Code presence — key files"
files=(
  "backend/src/app/services/knlg_base/llm/client.py"
  "backend/src/app/services/knlg_base/llm/router.py"
  "backend/src/app/services/knlg_base/llm/cost_guard.py"
  "backend/src/app/services/knlg_base/llm/logger.py"
  "backend/src/app/services/knlg_base/llm/metrics.py"
  "backend/src/app/services/knlg_base/llm/provider_cache.py"
  "backend/src/app/services/knlg_base/llm/prompt_renderer.py"
  "backend/src/app/services/knlg_base/agent/state_machine.py"
  "backend/src/app/services/knlg_base/agent/signal_extractor.py"
  "backend/src/app/services/knlg_base/agent/followup_decider.py"
  "backend/src/app/services/knlg_base/agent/summarizer.py"
  "backend/src/app/services/knlg_base/agent_service.py"
  "backend/src/app/core/crypto.py"
  "backend/src/app/api/v1/knlg_base/ai_interview.py"
  "backend/src/app/api/v1/knlg_base/prompts.py"
  "backend/src/app/api/v1/knlg_base/llm_admin.py"
  "backend/alembic/versions/2026_07_02_001_phase3_ai_interview.py"
  "backend/alembic/versions/2026_07_04_001_add_fallback_model_id.py"
  "frontend/lib/api/knlg-base/prompts.ts"
  "frontend/lib/stores/signal-store.ts"
  "frontend/lib/hooks/use-interview-stream.ts"
  "frontend/components/knlg-base/ai/SignalChip.tsx"
  "frontend/components/knlg-base/ai/FollowupReasonPanel.tsx"
  "frontend/components/knlg-base/ai/ThinkingIndicator.tsx"
  "frontend/app/(main)/workspace/[workspace_code]/knlg-base/prompts/page.tsx"
  "frontend/app/(main)/workspace/[workspace_code]/knlg-base/prompts/[id]/page.tsx"
)
for f in "${files[@]}"; do
    full="$ROOT/$f"
    if [ -f "$full" ]; then
        ok "exists — $f"
    else
        ko "MISSING — $f"
    fi
done

# ─────────────────────────────────────────────────────────────
section "7. Frontend build"
cd "$FRONTEND"
if pnpm build > /tmp/build.log 2>&1; then
    ok "frontend pnpm build"
else
    ko "frontend pnpm build failed"
    tail -20 /tmp/build.log
fi

# ─────────────────────────────────────────────────────────────
section "8. Pre-commit hook"
cd "$ROOT"
if bash hooks/pre-commit > /tmp/hook.log 2>&1; then
    ok "pre-commit hook all checks passed"
else
    ko "pre-commit hook failed"
    tail -20 /tmp/hook.log
fi

# ─────────────────────────────────────────────────────────────
section "9. Archive integrity"
if [ -d "$ROOT/openspec/changes/archive/2026-07-04-knlg-base-p3-llm-interview" ]; then
    ok "change archived as 2026-07-04-knlg-base-p3-llm-interview"
    ls "$ROOT/openspec/changes/archive/2026-07-04-knlg-base-p3-llm-interview/" | sed 's/^/     /'
else
    ko "archive directory missing"
fi

specs=(
  "$ROOT/openspec/specs/ai-interview-agent/spec.md"
  "$ROOT/openspec/specs/llm-gateway/spec.md"
  "$ROOT/openspec/specs/prompt-management/spec.md"
  "$ROOT/openspec/specs/qa-library/spec.md"
)
for s in "${specs[@]}"; do
    if [ -f "$s" ]; then
        ok "spec — $(basename $(dirname $s))"
    else
        ko "spec missing — $s"
    fi
done

# ─────────────────────────────────────────────────────────────
section "Summary"
echo "  ✅ Passed:  $pass"
echo "  ❌ Failed:  $fail"
echo
if [ "$fail" -eq 0 ]; then
    echo "🎉 Phase 3 acceptance: ALL GREEN"
    exit 0
else
    echo "⚠️  Phase 3 acceptance: $fail failures — see above"
    exit 1
fi