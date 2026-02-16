#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
REGISTRY="$SCRIPT_DIR/registry.json"

# Check if built
if [ ! -f "$DIST_DIR/optimize-prompt.js" ]; then
  echo "Building prompt optimizer..." >&2
  cd "$SCRIPT_DIR" && npm run build >&2
fi

# Check if registry exists
if [ ! -f "$REGISTRY" ]; then
  echo "Building registry..." >&2
  node "$DIST_DIR/build-registry.js" >&2
fi

# Interactive mode if no args
if [ $# -eq 0 ]; then
  echo "Prompt Optimizer" >&2
  echo "Paste your prompt (end with Ctrl+D):" >&2
  node "$DIST_DIR/optimize-prompt.js"
else
  node "$DIST_DIR/optimize-prompt.js" "$@"
fi
