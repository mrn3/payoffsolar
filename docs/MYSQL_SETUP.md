# MySQL Setup for Payoff Solar

This project has been migrated from Supabase to use a local MySQL database. Follow these steps to set up your local development environment.

## Prerequisites

1. **MySQL Server**: Install MySQL 8.0 or later
   - **macOS**: `brew install mysql` or download from [MySQL.com](https://dev.mysql.com/downloads/mysql/)
   - **Windows**: Download from [MySQL.com](https://dev.mysql.com/downloads/mysql/)
   - **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian)

2. **Node.js**: Version 18 or later

## Setup Steps

### 1. Install Dependencies
```bash
yarn install
```

### 2. Start MySQL Service
```bash
# macOS (if installed via Homebrew)
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows - MySQL should start automatically, or use MySQL Workbench
```

### 3. Configure MySQL (First Time Only)
```bash
# Connect to MySQL as root
mysql -u root

# Set a password for root user (optional but recommended)
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your-password';

# Exit MySQL
exit
```

### 4. Update Environment Variables
Copy the example environment file and update it with your MySQL credentials:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and update the MySQL settings:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password-if-set
MYSQL_DATABASE=payoffsolar
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 5. Initialize Database
Run the automated setup script:
```bash
yarn setup-db
```

Or manually:
```bash
# Create database and tables
mysql -u root -p < src/lib/mysql/schema.sql

# Seed with initial data
yarn init-db
```

### 6. Start Development Server
```bash
yarn dev
```

## Database Schema

The MySQL database includes the following main tables:
- `users` - User authentication
- `profiles` - User profiles and roles
- `customers` - Customer information
- `products` - Product catalog
- `orders` - Order management
- `inventory` - Inventory tracking
- `warehouses` - Warehouse locations
- `content` - CMS content

## Authentication

The app now uses JWT-based authentication instead of Supabase Auth:
- Passwords are hashed using bcrypt
- Sessions are managed with HTTP-only cookies
- JWT tokens expire after 7 days

## Troubleshooting

### MySQL Connection Issues
1. Make sure MySQL is running: `brew services list | grep mysql`
2. Check if you can connect: `mysql -u root -p`
3. Verify the database exists: `SHOW DATABASES;`

### Permission Issues
If you get permission errors:
```sql
GRANT ALL PRIVILEGES ON payoffsolar.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Reset Database
To completely reset the database:
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS payoffsolar;"
yarn setup-db
```

## Migration Notes

This project was migrated from Supabase to MySQL. Key changes:
- Replaced Supabase client with MySQL2
- Implemented custom JWT authentication
- Updated all database queries to use SQL
- Removed Supabase-specific features (RLS, etc.)

The application functionality remains the same, but now runs entirely on your local MySQL instance.
