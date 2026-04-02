# Trip Planner - Quick Deployment Guide

## 🚀 Quick Start (3 Simple Steps)

### Option 1: Automated Deployment (Easiest!)

```bash
# Run the automated deployment script
./deploy-trip-planner.sh
```

That's it! The script will:
- Commit your changes (with your confirmation)
- Push to git
- Deploy to your production server
- Run database migrations
- Build and restart the application
- Verify the deployment

### Option 2: Use Existing Deploy Script

```bash
# If you've already committed and pushed your changes
./deploy-remote.sh
```

### Option 3: Manual Deployment

```bash
# 1. SSH into your server
ssh payoffsolar

# 2. Navigate to project directory
cd /opt/bitnami/projects/payoffsolar

# 3. Pull latest changes
git pull origin main

# 4. Run database migration
mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d '=' -f2) < migrations/add_trips_tables.sql

# 5. Install dependencies and build
yarn install
yarn build

# 6. Restart PM2
pm2 restart payoffsolar

# 7. Check status
pm2 logs payoffsolar --lines 20
```

## ✅ Verify Deployment

1. **Check the database tables were created:**
   ```bash
   ssh payoffsolar 'mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d "=" -f2) payoffsolar -e "SHOW TABLES LIKE \"trip%\";"'
   ```

   You should see:
   - `trip_orders`
   - `trips`

2. **Test the application:**
   - Visit: `https://yourdomain.com/dashboard/trip-planner`
   - You should see the Trip Planner page with "New Trip" button

3. **Create a test trip:**
   - Click "New Trip"
   - Enter a name like "Test Trip"
   - Click "Create Trip"
   - You should see it appear in the trips list

## 🔧 Troubleshooting

### Issue: "Failed to load trips" error

**Solution:**
```bash
# Check PM2 logs
ssh payoffsolar 'pm2 logs payoffsolar --lines 50'

# Verify database tables exist
ssh payoffsolar 'mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d "=" -f2) payoffsolar -e "SHOW TABLES LIKE \"trip%\";"'
```

### Issue: Build fails due to memory

**Solution:**
```bash
# Use low-memory build
ssh payoffsolar 'cd /opt/bitnami/projects/payoffsolar && yarn build-low-memory'
```

### Issue: PM2 not restarting properly

**Solution:**
```bash
ssh payoffsolar 'pm2 delete payoffsolar && pm2 start "yarn start" --name payoffsolar'
```

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All changes are saved locally
- [ ] You've tested the feature locally (run `npm run dev` and visit http://localhost:3000/dashboard/trip-planner)
- [ ] You have SSH access to your server (`ssh payoffsolar` works)
- [ ] Your server has enough disk space (`ssh payoffsolar 'df -h'`)
- [ ] MySQL/MariaDB is running on the server

## 🎯 What Gets Deployed

### New Files:
- `migrations/add_trips_tables.sql` - Database schema
- `src/lib/utils/tripPlanner.ts` - Trip utilities
- `src/app/api/trips/route.ts` - Trips API
- `src/app/api/trips/[id]/route.ts` - Trip details API
- `src/app/api/trips/[id]/orders/route.ts` - Trip orders API
- `src/app/(dashboard)/dashboard/trip-planner/page.tsx` - UI component
- `docs/TRIP_PLANNER_DEPLOYMENT.md` - Detailed documentation
- `deploy-trip-planner.sh` - Deployment script

### Modified Files:
- `src/lib/models/index.ts` - Added Trip models
- `src/components/dashboard/DashboardNavigation.tsx` - Added navigation link

## 📖 Need More Help?

- **Detailed Documentation**: See `docs/TRIP_PLANNER_DEPLOYMENT.md`
- **General Deployment Guide**: See `docs/SERVER_DEPLOYMENT_GUIDE.md`
- **Check Server Logs**: `ssh payoffsolar 'pm2 logs payoffsolar'`
- **Check MySQL Logs**: `ssh payoffsolar 'sudo tail -f /var/log/mysql/error.log'`

## 🎉 After Successful Deployment

Once deployed, you can:

1. **Create Trips**: Name your delivery routes (e.g., "Monday Northwest Route")
2. **Add Orders**: Select multiple orders and add them to a trip
3. **Reorder Stops**: Drag and drop to optimize delivery sequence
4. **View Distances**: See distance between each stop
5. **Navigate**: Open routes in Google Maps for turn-by-turn directions

Happy routing! 🚚📍
