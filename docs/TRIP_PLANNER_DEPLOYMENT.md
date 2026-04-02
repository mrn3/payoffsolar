# Trip Planner Feature - Deployment Guide

## Overview

The Trip Planner feature allows users to create named delivery trips, add orders to them, reorder delivery sequences with drag-and-drop, and get route distances with Google Maps integration.

## What's New

### Database Tables
- **`trips`** - Stores named trips with description, date, status, and creator
- **`trip_orders`** - Junction table linking orders to trips with sequence ordering

### New Files
- `migrations/add_trips_tables.sql` - Database migration for trips tables
- `src/lib/utils/tripPlanner.ts` - Utility functions for distance calculations and Google Maps
- `src/app/api/trips/route.ts` - API endpoints for listing and creating trips
- `src/app/api/trips/[id]/route.ts` - API endpoints for individual trip operations
- `src/app/api/trips/[id]/orders/route.ts` - API endpoints for managing orders in trips
- `src/app/(dashboard)/dashboard/trip-planner/page.tsx` - Trip Planner UI component

### Modified Files
- `src/lib/models/index.ts` - Added TripModel and TripOrderModel
- `src/components/dashboard/DashboardNavigation.tsx` - Added Trip Planner navigation link

## Deployment Steps

### Method 1: Automated Deployment (Recommended)

The easiest way to deploy is using the existing deployment scripts:

```bash
# From your local machine, commit and push your changes
git add .
git commit -m "Add Trip Planner feature"
git push origin main

# Deploy to server using the remote deploy script
./deploy-remote.sh
```

This will automatically:
1. SSH into your production server
2. Pull the latest changes
3. Install dependencies
4. Run the database migration
5. Build the application
6. Restart PM2

### Method 2: Manual Deployment

If you prefer to deploy manually or need to troubleshoot:

#### Step 1: SSH into Your Server

```bash
ssh payoffsolar
cd /opt/bitnami/projects/payoffsolar
```

#### Step 2: Pull Latest Changes

```bash
git pull origin main
```

#### Step 3: Run Database Migration

```bash
# Run the migration to create trips and trip_orders tables
mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d '=' -f2) < migrations/add_trips_tables.sql
```

Or manually run the migration:

```bash
mysql -u root -p payoffsolar
```

Then paste the SQL from `migrations/add_trips_tables.sql`.

#### Step 4: Install Dependencies

```bash
yarn install
```

#### Step 5: Build the Application

```bash
# Use the appropriate build command based on server memory
yarn build
# Or if low memory:
yarn build-low-memory
```

#### Step 6: Restart PM2

```bash
pm2 restart payoffsolar
```

#### Step 7: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs for any errors
pm2 logs payoffsolar --lines 50

# Test the database migration
mysql -u root -p payoffsolar -e "SHOW TABLES LIKE 'trip%';"
```

You should see:
- `trip_orders`
- `trips`

## Testing the Feature

### 1. Access the Trip Planner

Navigate to: `https://yourdomain.com/dashboard/trip-planner`

### 2. Create a Trip

1. Click "New Trip" button
2. Enter a trip name (e.g., "Monday Deliveries")
3. Optionally add description and date
4. Click "Create Trip"

### 3. Add Orders to Trip

1. Click on a trip card to select it
2. Use search to find specific orders
3. Select orders using checkboxes
4. Click "Add to Trip"

### 4. Test Reordering

1. Drag and drop stops in the delivery route
2. Verify distances recalculate
3. Refresh the page and verify the order persists

### 5. Test Google Maps Links

1. Click individual address links
2. Click "Open Full Route in Google Maps" for multi-stop directions
3. Verify all links open correctly

## Troubleshooting

### Issue: Database collation errors

**Symptom**: Error about "Illegal mix of collations"

**Solution**: The migration script handles this automatically by setting the correct collation. If you still see errors:

```bash
# Verify the trips table collation
mysql -u root -p payoffsolar -e "SHOW CREATE TABLE trips\\G"
```

The table should use `utf8mb4_general_ci` collation.

### Issue: Trip Planner page shows "Failed to load trips"

**Solution**:

1. Check PM2 logs:
   ```bash
   pm2 logs payoffsolar --lines 100
   ```

2. Verify the tables exist:
   ```bash
   mysql -u root -p payoffsolar -e "SHOW TABLES LIKE 'trip%';"
   ```

3. Test the API endpoint:
   ```bash
   curl -i http://localhost:3000/api/trips
   ```

### Issue: Drag-and-drop not working

**Solution**: This is a client-side feature. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

### Issue: Google Maps links not working

**Solution**: Google Maps links don't require API keys for basic linking. If links aren't working:

1. Check browser console for JavaScript errors
2. Verify orders have valid addresses
3. Check if coordinates are populated (use geocoding if needed)

## Database Schema Reference

### trips table

```sql
CREATE TABLE trips (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trip_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### trip_orders table

```sql
CREATE TABLE trip_orders (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  sequence_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_trip_order (trip_id, order_id)
);
```

## Rollback Instructions

If you need to rollback the Trip Planner feature:

```bash
# SSH into server
ssh payoffsolar
cd /opt/bitnami/projects/payoffsolar

# Remove the database tables
mysql -u root -p payoffsolar -e "DROP TABLE IF EXISTS trip_orders; DROP TABLE IF EXISTS trips;"

# Revert to previous commit
git log --oneline  # Find the commit hash before Trip Planner
git checkout <previous-commit-hash>

# Rebuild and restart
yarn install
yarn build
pm2 restart payoffsolar
```

## Support

If you encounter any issues during deployment:

1. Check PM2 logs: `pm2 logs payoffsolar`
2. Check MySQL error logs: `sudo tail -f /var/log/mysql/error.log`
3. Verify database connection: `node scripts/test-db-connection.js`
4. Check server resources: `free -h` (memory) and `df -h` (disk space)

The Trip Planner feature is now ready for production use!
