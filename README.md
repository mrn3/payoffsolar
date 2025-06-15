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

Open [http://localhost:6660](http://localhost:6660) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Server Setup

1. Create Lighsail instance using Node.js template
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
    git clone https://github.com/payoffsolar/payoffsolar.git
    ```
1. Configure environment variables using .env
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
    npm install -g pm2
    ```
1. Set up as daemon in pm2
    ```
    pm2 start "yarn start" --name "payoffsolar"
    ```
1. Set up pm2 to run on boot
    ```
    pm2 startup
    ```
1. Set up apache - https://docs.bitnami.com/general/infrastructure/nodejs/get-started/get-started/
1. Set up SSL - https://docs.bitnami.com/general/faq/administration/generate-configure-certificate-letsencrypt/
1. Install mariadb
    ```
    sudo apt-get install mariadb-server
    sudo systemctl start mariadb.service
    ```
1. Configure mariadb
    ```
    sudo mysql_secure_installation
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
