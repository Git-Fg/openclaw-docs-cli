#!/usr/bin/env bash
# Sync npm package.json metadata from GitHub repo
# Run from project root

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_FILE="$REPO_ROOT/package.json"

cd "$REPO_ROOT"

echo "🔄 Fetching metadata from GitHub..."
META=$(gh repo view --json description,repositoryTopics,url,owner,name,licenseInfo,homepageUrl)

# Extract values (with defaults)
DESC=$(echo "$META" | jq -r '.description // ""')
TOPICS=$(echo "$META" | jq -r '.repositoryTopics // [] | map(.name) // []')
HOMEPAGE=$(echo "$META" | jq -r '.homepageUrl // ""')
REPO_URL=$(echo "$META" | jq -r '.url // ""')
OWNER=$(echo "$META" | jq -r '.owner.login // ""')
LICENSE_KEY=$(echo "$META" | jq -r '.licenseInfo.key // ""')

# Build derived URLs
ISSUES_URL="${REPO_URL%/}/issues"
GIT_URL="git+${REPO_URL#https://}.git"

echo ""
echo "📋 Metadata from GitHub:"
echo "  description: $( [ -n "$DESC" ] && echo "$DESC" || echo "(empty)" )"
echo "  topics: $( [ "$(echo "$TOPICS" | jq 'length')" -gt 0 ] && echo "$TOPICS" || echo "(none)" )"
echo "  homepage: $( [ -n "$HOMEPAGE" ] && echo "$HOMEPAGE" || echo "(none, using repo URL)" )"
echo "  repository: $REPO_URL"
echo "  bugs: $ISSUES_URL"
echo "  license: $LICENSE_KEY"
echo ""

# Build jq update program as proper JSON
JQ_UPDATE=$(
  jq -n \
    --arg desc "$DESC" \
    --argjson topics "$TOPICS" \
    --arg homepage "${HOMEPAGE:-$REPO_URL}" \
    --arg issues "$ISSUES_URL" \
    --arg git_url "$GIT_URL" \
    '
    {
      description: $desc,
      keywords: $topics,
      homepage: $homepage,
      bugs: { url: $issues },
      repository: { type: "git", url: $git_url }
    }
    '
)

# Show diff preview
echo "🔍 Changes to apply:"
echo "$JQ_UPDATE" | jq -r 'to_entries | .[] | "  + \(.key) = \(.value)"'
echo ""

read -p "Apply changes? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 0
fi

# Merge with existing package.json
jq --argjson update "$JQ_UPDATE" '. *= $update' "$PKG_FILE" > "$PKG_FILE.tmp" && mv "$PKG_FILE.tmp" "$PKG_FILE"

echo "✅ Updated package.json"
echo ""
echo "💡 Tip: Add topics to your GitHub repo for better npm discoverability:"
echo "   https://github.com/Git-Fg/openclaw-docs-search/settings/topics"
