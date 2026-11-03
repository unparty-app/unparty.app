#!/bin/sh
#
# Git hooks installer for theunpartyapp
# 
# Installs:
#   pre-commit  blocks oversized covers, stamps story dates, generates frontmatter
#   pre-push    reports spelling/grammar on the prose being pushed (never blocks)
#
# Safe to run again at any time.
#

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo "Error: Not a git repository. Run this from the project root."
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Each hook is a two-line wrapper that runs the tracked script, so pulling
# changes to scripts/pre-commit-frontmatter or scripts/pre-push-spellcheck
# updates the hooks too. (Copies went stale: an April install never got the
# cover-size check added later.)
install_hook() {
  NAME="$1"
  SCRIPT="$2"
  TARGET="$HOOKS_DIR/$NAME"

  # Back up a hook that is not already one of these wrappers
  if [ -f "$TARGET" ] && ! grep -q "scripts/$SCRIPT" "$TARGET"; then
    echo "Backing up existing $NAME hook to $NAME.backup"
    cp "$TARGET" "$TARGET.backup"
  fi

  printf '#!/bin/sh\n# Installed by npm run frontmatter:install-hooks\nexec sh "$(git rev-parse --show-toplevel)/scripts/%s" "$@"\n' "$SCRIPT" > "$TARGET"
  chmod +x "$TARGET"
}

install_hook pre-commit pre-commit-frontmatter
echo "✓ Installed pre-commit hook: cover sizes, story dates, frontmatter"

install_hook pre-push pre-push-spellcheck
echo "✓ Installed pre-push hook for spelling and grammar"
echo ""
echo "The pre-commit hook blocks commits that stage oversized cover images in"
echo "public/covers/, stamps updated-at on the stories you commit, and generates"
echo "frontmatter for new markdown files in src/app/theunparty* directories."
echo ""
echo "The pre-push hook reports spelling and grammar issues in the prose you're"
echo "pushing. It never blocks the push — see docs/guides/SPELLCHECK.md."
echo ""
echo "To skip the hooks, use: git commit --no-verify / git push --no-verify"
