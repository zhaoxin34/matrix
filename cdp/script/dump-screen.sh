#!/bin/bash
#
# dump-screen.sh - Dump the screen output of a Zellij pane by type
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pane_type=$1
pane_id_file="$SCRIPT_DIR/${pane_type}.pane_id"

if [ -z "$pane_type" ]; then
  echo "Usage: $0 <frontend|backend>"
  exit 1
fi

pane_id=$(cat "$pane_id_file" 2>/dev/null || true)

if [ -n "$pane_id" ] && zellij action list-panes | grep -q "^${pane_id} "; then
  zellij action dump-screen --pane-id "$pane_id"
else
  echo "warning: pane-id for [$pane_type] does not exist"
fi
