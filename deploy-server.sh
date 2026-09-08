#!/bin/bash

# Production server deployment. Accepts a locally built Next.js artifact from
# deploy-remote.sh, while retaining a server-build fallback for manual use.

set -Eeuo pipefail

ARTIFACT_PATH=""
EXPECTED_COMMIT=""
STAGING_DIR=""
ACTIVATED_ARTIFACT=false

while [ "$#" -gt 0 ]; do
    case "$1" in
        --artifact)
            ARTIFACT_PATH="${2:-}"
            shift 2
            ;;
        --commit)
            EXPECTED_COMMIT="${2:-}"
            shift 2
            ;;
        *)
            echo "❌ Unknown argument: $1"
            exit 1
            ;;
    esac
done

cleanup() {
    if [ -n "$STAGING_DIR" ] && [ -d "$STAGING_DIR" ]; then
        rm -rf "$STAGING_DIR"
    fi
    if [ -n "$ARTIFACT_PATH" ] && [ -f "$ARTIFACT_PATH" ]; then
        rm -f "$ARTIFACT_PATH"
    fi
}
trap cleanup EXIT

echo "🚀 Starting Payoff Solar server deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating from template..."
    cp .env.local .env
    echo "📝 Please edit .env file with your production settings:"
    echo "   - MYSQL_PASSWORD"
    echo "   - NEXT_PUBLIC_SITE_URL"
    echo "   - AWS_REGION"
    echo "   - SES_FROM_EMAIL"
    echo "   - SES_FROM_NAME"
    echo "   - JWT_SECRET"
    echo "   - (Optional) AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "Press Enter when you've updated the .env file..."
    read
fi

# Check if MariaDB/MySQL is running
echo "🔍 Checking database service..."
if ! systemctl is-active --quiet mariadb; then
    echo "⚠️  MariaDB is not running. Starting it..."
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull --ff-only

if [ -n "$EXPECTED_COMMIT" ] && [ "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]; then
    echo "❌ Server checkout does not match the commit used for the local build."
    exit 1
fi

# Install dependencies
#
# The server environment may have a corporate/internal npm registry
# (e.g. an Adobe Artifactory URL) configured via env vars or a global
# ~/.npmrc, which requires auth this server doesn't have and causes
# "401 Unauthorized" errors. Yarn's env vars take precedence over the
# project's .yarnrc, so explicitly unset them and force the public
# registry for this install.
echo "📦 Installing dependencies..."
unset NPM_CONFIG_REGISTRY YARN_REGISTRY npm_config_registry
if [ -n "$ARTIFACT_PATH" ]; then
    yarn install --frozen-lockfile --production=true --registry https://registry.npmjs.org
else
    yarn install --frozen-lockfile --registry https://registry.npmjs.org
fi

# Test database connection
echo "🔍 Testing database connection..."
if node scripts/setup-db.js; then
    echo "✅ Database setup successful"
else
    echo "❌ Database setup failed. Please check your .env configuration."
    exit 1
fi

# Setup upload directories
echo "🗂️  Setting up upload directories..."
if node scripts/setup-uploads.js; then
    echo "✅ Upload directories setup successful"
else
    echo "⚠️  Upload directories setup had issues, but continuing..."
fi

# Activate a local build artifact, or retain the manual server-build fallback.
if [ -n "$ARTIFACT_PATH" ]; then
    echo "📦 Activating locally built application..."
    if [ ! -f "$ARTIFACT_PATH" ]; then
        echo "❌ Build artifact not found: $ARTIFACT_PATH"
        exit 1
    fi

    STAGING_DIR="$(mktemp -d ./.deploy-next.XXXXXX)"
    tar -xzf "$ARTIFACT_PATH" -C "$STAGING_DIR"
    if [ ! -f "$STAGING_DIR/.next/BUILD_ID" ]; then
        echo "❌ Invalid build artifact: .next/BUILD_ID is missing."
        exit 1
    fi

    rm -rf .next.previous
    if [ -d .next ]; then
        mv .next .next.previous
    fi
    mv "$STAGING_DIR/.next" .next
    rm -rf "$STAGING_DIR"
    STAGING_DIR=""
    ACTIVATED_ARTIFACT=true
else
    echo "🏗️  No artifact supplied; building application on the server..."
    yarn build
fi

# Restart PM2
echo "🔄 Restarting PM2 process..."
if pm2 describe payoffsolar >/dev/null 2>&1; then
    pm2 restart payoffsolar --update-env
else
    echo "⚠️  PM2 process 'payoffsolar' not found. Starting new process..."
    pm2 start "yarn start" --name "payoffsolar"
fi

# Verify the new process and restore the previous build if it cannot serve HTTP.
echo "🩺 Checking application health..."
HEALTHY=false
for attempt in $(seq 1 12); do
    if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/ >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    sleep 2
done

if [ "$HEALTHY" != true ]; then
    echo "❌ Application health check failed."
    if [ "$ACTIVATED_ARTIFACT" = true ] && [ -d .next.previous ]; then
        echo "↩️  Restoring previous build..."
        rm -rf .next
        mv .next.previous .next
        pm2 restart payoffsolar --update-env
    fi
    exit 1
fi

if [ "$ACTIVATED_ARTIFACT" = true ]; then
    rm -rf .next.previous
fi

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To check logs: pm2 logs payoffsolar"
echo "🌐 Test your site: curl -I http://localhost:3000"
echo ""
echo "If you still see 'data is not defined' errors:"
echo "1. Check PM2 logs: pm2 logs payoffsolar"
echo "2. Verify .env file has correct database credentials"
echo "3. Test database connection: node scripts/setup-db.js"
echo "4. Clear browser cache and cookies"
