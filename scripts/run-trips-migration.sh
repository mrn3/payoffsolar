#!/bin/bash

# Migration script for adding trips tables
# Run this on your production server

echo "=== Payoff Solar - Add Trips Tables Migration ==="
echo ""

# Check if .env file exists in current directory
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in current directory"
    echo "Please make sure you're in the project directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Load environment variables
source .env

# Support both MYSQL_* and DB_* env var conventions
DB_HOST="${DB_HOST:-$MYSQL_HOST}"
DB_USER="${DB_USER:-$MYSQL_USER}"
DB_PASSWORD="${DB_PASSWORD:-$MYSQL_PASSWORD}"
DB_NAME="${DB_NAME:-$MYSQL_DATABASE}"

echo "Creating backup before migration..."
BACKUP_FILE="backup_trips_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "✗ Backup failed! Aborting migration."
    exit 1
fi

echo ""
echo "Running trips migration..."

# Run the migration
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < migrations/add_trips_tables.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration completed successfully!"
    echo ""
    echo "Verifying tables creation..."
    
    echo ""
    echo "=== Trips Table ==="
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE trips;"
    
    echo ""
    echo "=== Trip Orders Table ==="
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE trip_orders;"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Tables verified!"
        echo ""
        echo "Migration complete. Backup saved as: $BACKUP_FILE"
    else
        echo "✗ Could not verify tables. Please check manually."
    fi
else
    echo "✗ Migration failed!"
    echo "Backup is available at: $BACKUP_FILE"
    exit 1
fi
