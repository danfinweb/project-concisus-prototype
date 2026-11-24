#!/usr/bin/env bash
# Copy exported live docs (Markdown) into design/. The only way Claude writes to design/.
# Run it ONLY when the user explicitly asks to refresh design/ (CLAUDE.md › Rules 1).
# Usage: bash scripts/refresh-design.sh <export-dir>
#   <export-dir> holds any of the files below, named exactly as in design/.
set -euo pipefail
src="${1:?usage: refresh-design.sh <export-dir>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
allowed=(design.md strategic-layer.md tactical-layer.md management.md ai.md data-definitions.md presentation-tech.md item-list.md tactical-actions.md strategic-actions.md world-events.md callsigns.md story-lore.md README.md)
copied=0
for f in "${allowed[@]}"; do
  if [ -f "$src/$f" ]; then
    [ -s "$src/$f" ] || { echo "refuse: $src/$f is empty" >&2; exit 1; }
    head -1 "$src/$f" | grep -q '^# ' || { echo "refuse: $src/$f does not start with a doc title" >&2; exit 1; }
    cp "$src/$f" "$root/design/$f"
    echo "design/$f"
    copied=$((copied + 1))
  fi
done
[ "$copied" -gt 0 ] || { echo "no known design files in $src" >&2; exit 1; }
sed -i "s/Last export: [0-9-]*\./Last export: $(date +%F)./" "$root/design/README.md"
