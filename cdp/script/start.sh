#!/bin/bash
#
# start.sh - Start frontend and backend services in Zellij floating panes
#
# Usage:
#   ./start.sh              # Start all services (frontend + frontend2 + backend)
#   ./start.sh frontend     # Start only frontend (port 3001)
#   ./start.sh frontend2    # Start only frontend2 (port 3002)
#   ./start.sh backend      # Start only backend
#   ./start.sh all          # Same as no arguments (start all)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_CMD="cd $SCRIPT_DIR/../frontend && make dev"
FRONTEND2_CMD="cd $SCRIPT_DIR/../frontend2 && make dev"
BACKEND_CMD="cd $SCRIPT_DIR/../backend && make dev"

PANE_WIDTH=140
PANE_HEIGHT=30
PANE_X=2

# Default: start all
START_FRONTEND=${START_FRONTEND:-true}
START_FRONTEND2=${START_FRONTEND2:-true}
START_BACKEND=${START_BACKEND:-true}

# Parse arguments
case "${1:-all}" in
  frontend)
    START_FRONTEND=true
    START_FRONTEND2=false
    START_BACKEND=false
    ;;
  frontend2)
    START_FRONTEND=false
    START_FRONTEND2=true
    START_BACKEND=false
    ;;
  backend)
    START_FRONTEND=false
    START_FRONTEND2=false
    START_BACKEND=true
    ;;
  all|"")
    START_FRONTEND=true
    START_FRONTEND2=true
    START_BACKEND=true
    ;;
  *)
    echo "Usage: $0 [frontend|frontend2|backend|all]"
    exit 1
    ;;
esac

function pane_exists() {
  local pane_id=$1
  [ -n "$pane_id" ] && zellij action list-panes | grep -q "^${pane_id} "
}

function new_pane() {
  local pane_type=$1
  local cmd=$2
  local pane_y=$3
  local pane_id_file="$SCRIPT_DIR/${pane_type}.pane_id"
  local pane_id

  pane_id=$(cat "$pane_id_file" 2>/dev/null || true)

  if pane_exists "$pane_id"; then
    echo "Pane $pane_type already exists (${pane_id}), skipping"
  else
    pane_id=$(zellij action new-pane --floating --width $PANE_WIDTH --height $PANE_HEIGHT --x $PANE_X --y "$pane_y" -c -- bash -c "$cmd")
    echo "$pane_id" > "$pane_id_file"
    echo "Created $pane_type pane, pane-id=$pane_id"
  fi
}

cur_pane_id=$ZELLIJ_PANE_ID

# Frontend (port 3001)
if $START_FRONTEND; then
  new_pane frontend "$FRONTEND_CMD" 2
fi

# Frontend2 (port 3002)
if $START_FRONTEND2; then
  new_pane frontend2 "$FRONTEND2_CMD" 17
fi

# Backend
if $START_BACKEND; then
  new_pane backend "$BACKEND_CMD" 33
fi
