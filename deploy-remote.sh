#!/bin/bash
# Build locally, upload the Next.js build artifact, and activate it remotely.

set -Eeuo pipefail

REMOTE_HOST="${DEPLOY_HOST:-payoffsolar}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/bitnami/projects/payoffsolar}"
LOCAL_ARTIFACT="$(mktemp -t payoffsolar-next)"
ARTIFACT_NAME="payoffsolar-next-$(date +%Y%m%d%H%M%S)-$$.tar.gz"
REMOTE_ARTIFACT="/tmp/${ARTIFACT_NAME}"

cleanup() {
    rm -f "$LOCAL_ARTIFACT"
}
trap cleanup EXIT

if [ ! -f package.json ]; then
    echo "❌ Run this script from the project root."
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "❌ The working tree has uncommitted files. Commit and push them before deploying."
    exit 1
fi

UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [ -z "$UPSTREAM" ]; then
    echo "❌ The current branch has no upstream branch."
    exit 1
fi

echo "🔍 Checking that the current commit is pushed..."
git fetch --quiet
LOCAL_COMMIT="$(git rev-parse HEAD)"
UPSTREAM_COMMIT="$(git rev-parse "$UPSTREAM")"
if [ "$LOCAL_COMMIT" != "$UPSTREAM_COMMIT" ]; then
    echo "❌ Local HEAD does not match $UPSTREAM. Push or pull before deploying."
    exit 1
fi

echo "📦 Installing local dependencies..."
yarn install --frozen-lockfile

echo "🏗️  Building application locally..."
yarn build
if [ ! -f .next/BUILD_ID ]; then
    echo "❌ Local build did not produce .next/BUILD_ID."
    exit 1
fi

echo "📦 Packaging build artifact..."
tar --exclude='.next/cache' -czf "$LOCAL_ARTIFACT" .next

echo "📤 Uploading build artifact to $REMOTE_HOST..."
scp "$LOCAL_ARTIFACT" "${REMOTE_HOST}:${REMOTE_ARTIFACT}"

echo "🚀 Activating build on the production server..."
ssh "$REMOTE_HOST" "set -e; trap 'rm -f \"$REMOTE_ARTIFACT\"' EXIT; cd '$REMOTE_DIR'; git pull --ff-only; ./deploy-server.sh --artifact '$REMOTE_ARTIFACT' --commit '$LOCAL_COMMIT'"

echo "✅ Remote deployment complete. The production server did not run next build."
