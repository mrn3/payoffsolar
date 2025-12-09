This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
yarn dev
# or
npm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Server Setup

1. Create Lighsail instance using Node.js template
1. Go to Namecheap and point payoffsolar.com and www.payoffsolar.com to the instance
1. Open port 80 and 443, but make port 22 only accessible from your IP
1. SSH to instance
1. Update packages
    ```
    sudo apt-get update
    sudo apt-get upgrade
    ```
1. Make directory
    ```
    sudo mkdir /opt/bitnami/projects
    sudo chown $USER /opt/bitnami/projects
    ```
1. Change to projects directory
    ```
    cd /opt/bitnami/projects
    ```
1. Clone the repo
    ```
    git clone https://github.com/mrn3/payoffsolar.git
    ```
1. Change directory
    ```
    cd payoffsolar
    ```
1. Configure environment variables using .env - use .env.example as a template
    ```
    vi .env
    ```
1. Install dependencies
    ```
    yarn install
    ```
1. Build the project
    ```
    yarn build
    ```
1. Install pm2
    ```
    sudo npm install -g pm2
    ```
1. Set up as daemon in pm2
    ```
    pm2 start "yarn start" --name "payoffsolar"
    ```
1. Set up pm2 to run on boot
    ```
    pm2 startup
    ```
1. Set up Apache - just the first half of Step 3 on https://docs.bitnami.com/general/infrastructure/nodejs/get-started/get-started/
1. Set up SSL - https://docs.bitnami.com/general/faq/administration/generate-configure-certificate-letsencrypt/
    1. Domain list []: payoffsolar.com,www.payoffsolar.com
    1. Enable HTTP to HTTPS redirection [Y/n]: Y
    1. Enable non-www to www redirection [Y/n]: n
    1. Enable www to non-www redirection [y/N]: y
    1. Do you agree to these changes? [Y/n]: Y
    1. E-mail address []: mattrobertnewman@gmail.com
    1. Do you agree to the Let's Encrypt Subscriber Agreement? [Y/n]: Y
1. Install mariadb
    ```
    sudo apt-get install mariadb-server
    sudo systemctl start mariadb.service
    ```
1. Configure mariadb
    ```
    sudo mysql_secure_installation
    ```
    1. Switch to unix_socket authentication [Y/n] n
    1. Change the root password? [Y/n] Y
    1. New password: <your-password-from-MYSQL_PASSWORD-in-.env>
    1. Re-enter new password: <your-password-from-MYSQL_PASSWORD-in-.env>
    1. Remove anonymous users? [Y/n] Y
    1. Disallow root login remotely? [Y/n] Y
    1. Remove test database and access to it? [Y/n] Y
    1. Reload privilege tables now? [Y/n] Y
1. Set up fresh database or import production dump file
    ```
    node ./scripts/setup-db.js
    OR
    scp dump.sql payoffsolarnew:/opt/bitnami/projects/payoffsolar
    mysql -u root -p payoffsolar < dump.sql
    ```
1. Copy all the files over from old server
    ```
    scp -r payoffsolarold:/opt/bitnami/projects/payoffsolar/public/uploads/ payoffsolar:/opt/bitnami/projects/payoffsolar/public/
    ```
1. Install depdencies for PDF generation
    ```
    
    ```
1. Harden server with fail2ban and other stuff - have AI properly configure this on the new server
    ```
    sudo apt-get install fail2ban
    sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    ```

## Deploy

### Automated Deployment (Recommended)

For production server deployment, use the automated deploy script:

```bash
cd /opt/bitnami/projects/payoffsolar
./deploy.sh
```

The deploy script will:
- Check prerequisites and dependencies
- Create a backup of the current build
- Pull latest changes from git
- Install/update dependencies
- Run database setup if needed
- Build the application
- Restart the PM2 process
- Verify the deployment

### Local Development Deployment

For local development and testing:

```bash
# Production build and start
./deploy-local.sh

# Development mode with hot reload
./deploy-local.sh dev

# Show help
./deploy-local.sh --help
```

### Manual Deployment

If you prefer manual deployment or need to troubleshoot:

1. Get to directory
    ```
    cd /opt/bitnami/projects/payoffsolar
    ```
1. Pull latest changes
    ```
    git pull
    ```
1. Install dependencies
    ```
    yarn install
    ```
1. Build the project
    ```
    yarn build
    ```
1. Restart pm2
    ```
    pm2 restart payoffsolar
    ```
