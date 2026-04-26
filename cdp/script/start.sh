#!/bin/bash
#
# start.sh - Start frontend and backend services in Zellij floating panes
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_CMD="cd $SCRIPT_DIR/../frontend && make dev"
BACKEND_CMD="cd $SCRIPT_DIR/../backend && make dev"

PANE_WIDTH=140
PANE_HEIGHT=30
PANE_X=2

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
    echo "$pane_id" >"$pane_id_file"
    zellij action focus-pane-id "$cur_pane_id"
    echo "Created $pane_type pane, pane-id=$pane_id"
  fi
}

cur_pane_id=$ZELLIJ_PANE_ID
new_pane frontend "$FRONTEND_CMD" 2
new_pane backend "$BACKEND_CMD" 33
