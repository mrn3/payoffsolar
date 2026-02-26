#!/bin/bash

# Migration script for adding payments table
# Run this on your production server

echo "=== Payoff Solar - Add Payments Table Migration ==="
echo ""

# Check if we're on the server
if [ ! -f "/home/manewman/payoffsolar/.env" ]; then
    echo "Error: This script should be run on the production server"
    echo "Please run: ssh payoffsolar"
    echo "Then run: cd ~/payoffsolar && bash run-migration.sh"
    exit 1
fi

# Load environment variables
source /home/manewman/payoffsolar/.env

echo "Creating backup before migration..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "✗ Backup failed! Aborting migration."
    exit 1
fi

echo ""
echo "Running migration..."

# Run the migration
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
EOF

if [ $? -eq 0 ]; then
    echo "✓ Migration completed successfully!"
    echo ""
    echo "Verifying table creation..."
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE payments;"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Payments table verified!"
        echo ""
        echo "Migration complete. Backup saved as: $BACKUP_FILE"
    else
        echo "✗ Could not verify table. Please check manually."
    fi
else
    echo "✗ Migration failed!"
    echo "Backup is available at: $BACKUP_FILE"
    exit 1
fi

