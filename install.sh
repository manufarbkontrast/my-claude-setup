#!/bin/bash
set -euo pipefail

# --------------------------------------------------
# Prompt Optimizer - Install Script
# Run: curl -fsSL <raw-url>/install.sh | bash
# Or:  git clone ... && cd my-claude-setup && ./install.sh
# --------------------------------------------------

INSTALL_DIR="${PROMPT_OPTIMIZER_DIR:-$HOME/my-claude-setup}"
REPO_URL="https://github.com/manufarbkontrast/my-claude-setup.git"

echo ""
echo "  Prompt Optimizer Installer"
echo "  =========================="
echo ""

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js >= 20 first."
  echo "       https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js >= 20 required. Found: $(node -v)"
  exit 1
fi

echo "[1/5] Node.js $(node -v) found"

# 2. Clone or update repo
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "[2/5] Updating existing repo..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || echo "  (pull skipped, local changes)"
else
  echo "[2/5] Cloning repo..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# 3. Install dependencies
echo "[3/5] Installing dependencies..."
npm install 2>&1 | tail -2

# 4. Build
echo "[4/5] Compiling TypeScript..."
npx tsc

echo "[4/5] Building registry..."
node dist/build-registry.js

# 5. Link globally
echo "[5/5] Linking CLI globally..."
npm link 2>/dev/null || sudo npm link

echo ""
echo "  Installation complete!"
echo "  ======================"
echo ""
echo "  Usage:"
echo "    prompt-optimizer \"Your prompt here\""
echo "    po \"Your prompt here\"                   (short alias)"
echo "    po --stats                               (show registry stats)"
echo "    po --build                               (rebuild registry)"
echo ""
echo "  Location: $INSTALL_DIR"
echo ""
