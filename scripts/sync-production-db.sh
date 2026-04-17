#!/bin/bash

# Script to sync production database to local development environment
# Usage: ./sync-production-db.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_status() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Load local environment variables
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

source .env

# Local database configuration
LOCAL_DB_HOST="${MYSQL_HOST:-localhost}"
LOCAL_DB_USER="${MYSQL_USER:-root}"
LOCAL_DB_PASSWORD="${MYSQL_PASSWORD}"
LOCAL_DB_NAME="${MYSQL_DATABASE:-payoffsolar}"

print_status "Starting production database sync..."
echo ""

# Create a timestamp for the dump file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="production_dump_${TIMESTAMP}.sql"
LOCAL_BACKUP_FILE="local_backup_${TIMESTAMP}.sql"

print_status "Step 1: Creating backup of local database..."
if mysqldump -h "$LOCAL_DB_HOST" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" > "$LOCAL_BACKUP_FILE" 2>/dev/null; then
    print_success "Local database backed up to: $LOCAL_BACKUP_FILE"
else
    print_warning "Local database backup failed (database might not exist yet)"
fi
echo ""

print_status "Step 2: Dumping production database..."
print_status "Connecting to production server via SSH..."

# SSH to production server and dump the database
ssh payoffsolar << ENDSSH
#!/bin/bash
set -e

cd /opt/bitnami/projects/payoffsolar

# Load production environment variables
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found on production server!"
    exit 1
fi


source .env

PROD_DB_HOST="\${MYSQL_HOST:-localhost}"
PROD_DB_USER="\${MYSQL_USER:-root}"
PROD_DB_PASSWORD="\${MYSQL_PASSWORD}"
PROD_DB_NAME="\${MYSQL_DATABASE:-payoffsolar}"

echo "Dumping production database: \$PROD_DB_NAME"
mysqldump -h "\$PROD_DB_HOST" -u "\$PROD_DB_USER" -p"\$PROD_DB_PASSWORD" "\$PROD_DB_NAME" > /tmp/${DUMP_FILE}

if [ \$? -eq 0 ]; then
    echo "✓ Production database dumped successfully"
    echo "✓ Dump file created: /tmp/${DUMP_FILE}"
else
    echo "✗ Production database dump failed!"
    exit 1
fi
ENDSSH

if [ $? -ne 0 ]; then
    print_error "Failed to dump production database"
    exit 1
fi

print_success "Production database dumped successfully"
echo ""

print_status "Step 3: Copying dump file from production server..."
scp payoffsolar:/tmp/${DUMP_FILE} ./${DUMP_FILE}

if [ $? -eq 0 ]; then
    print_success "Dump file copied to local machine: ${DUMP_FILE}"
else
    print_error "Failed to copy dump file from production server"
    exit 1
fi
echo ""

print_status "Step 4: Cleaning up remote dump file..."
ssh payoffsolar "rm -f /tmp/${DUMP_FILE}"
print_success "Remote dump file removed"
echo ""

print_status "Step 5: Restoring production data to local database..."
print_status "Dropping and recreating local database..."

# Drop and recreate the database
mysql -h "$LOCAL_DB_HOST" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" -e "DROP DATABASE IF EXISTS $LOCAL_DB_NAME;" 2>/dev/null || true
mysql -h "$LOCAL_DB_HOST" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" -e "CREATE DATABASE $LOCAL_DB_NAME;" 2>/dev/null

print_status "Importing production data..."
mysql -h "$LOCAL_DB_HOST" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" < "${DUMP_FILE}"

if [ $? -eq 0 ]; then
    print_success "Production data imported successfully"
else
    print_error "Failed to import production data"
    exit 1
fi
echo ""

print_status "Step 6: Verifying database..."
TABLE_COUNT=$(mysql -h "$LOCAL_DB_HOST" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" -e "SHOW TABLES;" | wc -l)
print_success "Database contains $((TABLE_COUNT - 1)) tables"
echo ""

print_success "========================================="
print_success "Production database sync complete!"
print_success "========================================="
echo ""
print_status "Summary:"
echo "  • Production dump file: ${DUMP_FILE}"
echo "  • Local backup file: ${LOCAL_BACKUP_FILE}"
echo "  • Local database: ${LOCAL_DB_NAME}"
echo ""
print_warning "The dump files have been kept for your records."
print_warning "You can safely delete them once you've verified everything works:"
echo "  rm ${DUMP_FILE} ${LOCAL_BACKUP_FILE}"
