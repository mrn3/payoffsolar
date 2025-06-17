# Order Status Migration: Remove "Followed Up"

This directory contains a migration script to remove the "Followed Up" status from orders and update all existing orders with that status to "Complete".

## What this migration does

1. **Database Changes**: Updates all orders with status "Followed Up" to "Complete"
2. **Code Changes**: Removes "Followed Up" from all dropdowns, validation, and UI components

## Files Modified

### Database Migration
- `src/lib/mysql/migrations/remove_followed_up_status.sql` - SQL migration script
- `scripts/migrate-followed-up-orders.js` - Node.js script to run the migration

### Code Changes
- `src/app/api/orders/bulk-update/route.ts` - Removed from validation
- `src/app/(dashboard)/dashboard/orders/page.tsx` - Removed from dropdown and status colors
- `src/app/(dashboard)/dashboard/orders/new/page.tsx` - Removed from status dropdown
- `src/app/(dashboard)/dashboard/orders/[id]/edit/page.tsx` - Removed from status dropdown
- `src/app/(dashboard)/dashboard/orders/[id]/page.tsx` - Removed from status colors
- `src/components/orders/DuplicateOrdersModal.tsx` - Removed from dropdown and status colors
- `src/components/orders/BulkMergeOrdersModal.tsx` - Removed from dropdown and status colors
- `src/app/api/orders/[id]/receipt/route.ts` - Removed from receipt styling

## Running the Migration

### Prerequisites
- Node.js installed
- MySQL database running
- Database credentials configured in environment variables or defaults

### Environment Variables
The script will automatically load from `.env.local`. Make sure these are set:
```bash
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=payoffsolar
MYSQL_PORT=3306
```

Or the legacy format:
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payoffsolar
DB_PORT=3306
```

### Run the Migration
```bash
# Navigate to the project root
cd /path/to/payoffsolar

# Install dependencies if not already installed
yarn install

# Run the migration script
node scripts/migrate-followed-up-orders.js
```

### What to Expect
1. The script will show current order status distribution
2. It will identify how many orders have "Followed Up" status
3. It will ask for confirmation before proceeding
4. It will update all "Followed Up" orders to "Complete"
5. It will show the final status distribution
6. It will verify no "Followed Up" orders remain

### Manual SQL Alternative
If you prefer to run the SQL directly:
```sql
-- Update all orders with "Followed Up" status to "Complete"
UPDATE orders SET status = 'Complete' WHERE status = 'Followed Up';

-- Verify the migration
SELECT 
    COUNT(*) as total_orders,
    SUM(CASE WHEN status = 'Followed Up' THEN 1 ELSE 0 END) as followed_up_count,
    SUM(CASE WHEN status = 'Complete' THEN 1 ELSE 0 END) as complete_count
FROM orders;
```

## Valid Order Statuses After Migration
- Cancelled
- Complete
- Paid
- Proposed
- Scheduled

The "Followed Up" status has been completely removed from the system.
