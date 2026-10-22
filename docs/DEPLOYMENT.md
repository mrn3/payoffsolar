# PayoffSolar Deployment Guide

## Runtime and SEO rollout

- Use Node.js **20.9 or newer** (prefer a currently supported LTS release) and Yarn 1.x.
  Next.js is pinned to 16.4.2 and React/React DOM to 19.3.1. Install with
  `yarn install --frozen-lockfile`; rebuild and restart the application to activate patches.
- Build and development commands explicitly use webpack to preserve the existing
  low-memory webpack configuration. `yarn lint` now uses ESLint directly.
  The pre-existing build-time TypeScript bypass remains; run `yarn tsc --noEmit`
  separately when validating types.
- Canonical URLs intentionally use `https://payoffsolar.com`, not the incoming
  host or `NEXT_PUBLIC_BASE_URL`. Configure the web server/CDN to redirect HTTP
  and `www` to that origin.
- Verify `/robots.txt` and `/sitemap.xml` after deployment. The sitemap queries
  MySQL at request time and includes core pages, categories, active products,
  and published CMS content. A database error must fail rather than publish an
  empty or partial sitemap. Submit the sitemap in Google Search Console and Bing
  Webmaster Tools.
- Catalog/category pages and product details now include product content in
  server-rendered HTML. Search, sorting, pagination, cart, affiliate codes, and
  analytics remain interactive. Pagination has crawlable links.
- Missing/inactive products return 404; out-of-stock active products remain
  available. Legacy product-ID URLs permanently redirect to the slug URL when
  available, preserving query parameters (including affiliate referrals).
  Legacy category shortcuts also permanently redirect.
- Titles, descriptions, canonicals, social metadata, Organization JSON-LD,
  and Product/Offer JSON-LD are emitted from server-side data. No review scores
  or unverified ratings are included in structured data.

### Actions outside this repository

1. Check ownership and availability of the former `utahsolarforall.com` domain
   with your registrar. The report's availability claim has not been verified.
   If you recover it, enable renewal and configure HTTPS plus permanent redirects
   to the matching current pages. Do not redirect every retired product to the
   homepage; use a genuine replacement where one exists, otherwise keep a 404.
2. Investigate the backlink report in Search Console. Do not automatically disavow
   links solely because a third-party tool labels them spam; evaluate Google's
   guidance and evidence of a manual action or manipulative link building first.
3. Confirm the deployed Node.js version, framework version, HTTP status codes,
   raw HTML product links, canonical URLs, and structured data using production
   checks and Google's Rich Results Test. Re-crawl after the deployment.
4. Review the remainder of the external report; only the findings visible in the
   supplied screenshot were in scope for this rollout.

## Browser and API hardening

- Next.js is already pinned to **16.4.2**, satisfying the 16.4.x target. Rebuild
  after any dependency change; changing the package version alone does not update
  a running process. Confirm `node -p "require('next/package.json').version"` and
  the deployed `.next/BUILD_ID`. Where exposed, `window.next?.version` in the
  browser console can provide an additional runtime check.
- `next.config.js` disables the image optimizer with `images.unoptimized: true`
  and explicitly keeps `dangerouslyAllowSVG: false`. Existing `next/image`
  components serve their original files; product uploads continue to use
  `/uploads/`. After rebuilding, direct `/_next/image` requests must return 404.
- All Next.js responses receive HSTS (`max-age=31536000; includeSubDomains`),
  `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, Permissions-Policy,
  and Content-Security-Policy headers. `X-Powered-By` is disabled. Ensure every
  subdomain supports HTTPS before enabling the HSTS policy in production.
- The CSP preserves Google Analytics/Tag Manager, Google Places, Stripe checkout,
  YouTube/Vimeo embeds, external HTTPS images, and map tiles. Inline scripts and
  styles remain allowed for existing Next.js hydration, CMS content, and editor
  styling. This is a compatibility baseline, not a nonce-based strict CSP.
  `unsafe-eval` and local WebSocket connections are development-only. Review the
  browser console when adding integrations rather than weakening the policy to
  allow arbitrary external scripts.
- Protected users, orders, content, and settings handlers return JSON **401**
  before business queries when no valid session exists; existing role checks
  return **403**. Order analytics require an administrator. Customer order
  history continues to be scoped to that customer's account.
- Checkout order creation (`POST /api/orders/public`), customer invoice HTML/PDF
  links, and explicitly public settings remain public. Public settings use
  `/api/settings?public=true`; an individual setting now requires
  `/api/settings/<key>?public=true`. That lookup queries only public settings and
  returns 404 for private or missing keys. Without the flag, single-key reads
  require an administrator before querying the setting.

### Apache HTTPS redirects and HTTP/2

Apache terminates TLS and may serve uploads without proxying them through
Next.js. Its configuration is outside the repository. Back up the active virtual
host files before editing; preserve existing certificate, proxy, upload, and ACME
challenge directives.

In the existing port-80 virtual host, replace its temporary HTTPS redirect with
this permanent canonical redirect, after any ACME challenge exclusions:

```apache
ServerName payoffsolar.com
ServerAlias www.payoffsolar.com
RewriteEngine On
RewriteRule ^ https://payoffsolar.com%{REQUEST_URI} [R=301,L,NE]
```

Do not add a second redirect alongside an existing `Redirect` or rewrite rule.
The original path and query string must be preserved. Apply any existing
HTTPS-`www` canonical redirect with status 301 as well.

In the existing port-443 virtual host, enable HTTP/2 if not already active:

```apache
Protocols h2 http/1.1
```

The `http2`, `ssl`, `rewrite`, and `headers` modules must be loaded. HTTP/2 also
needs a compatible MPM; do not replace a PHP-dependent prefork MPM blindly.
For Bitnami, inspect and validate the active configuration before gracefully
reloading Apache:

```bash
sudo /opt/bitnami/apache/bin/apachectl -M
sudo /opt/bitnami/apache/bin/apachectl -S
sudo /opt/bitnami/apache/bin/apachectl -t
sudo /opt/bitnami/apache/bin/apachectl -k graceful
```

If Apache serves `/uploads/` directly, apply the following headers in the TLS
virtual host too. Unsetting the normal response table first prevents duplicates
on proxied Next.js responses:

```apache
Header onsuccess unset Strict-Transport-Security
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header onsuccess unset X-Content-Type-Options
Header always set X-Content-Type-Options "nosniff"
Header onsuccess unset X-Frame-Options
Header always set X-Frame-Options "SAMEORIGIN"
Header onsuccess unset Referrer-Policy
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header onsuccess unset X-Powered-By
Header always unset X-Powered-By
```

Verify after deployment without submitting orders or payments:

```bash
curl -sI 'http://payoffsolar.com/products?search=panel'
# Expect 301 and Location: https://payoffsolar.com/products?search=panel
curl --http2 -sI https://payoffsolar.com/
# Expect HTTP/2 and the security headers above, with no X-Powered-By
curl -si https://payoffsolar.com/api/users
curl -si https://payoffsolar.com/api/orders
curl -si https://payoffsolar.com/api/content
curl -si https://payoffsolar.com/api/settings
# Expect JSON 401, not a login redirect or 500
curl -si 'https://payoffsolar.com/_next/image?url=%2Flogo-sun.svg&w=64&q=75'
# Expect 404
```

In a browser, check hydration and navigation, uploaded images, the checkout card
field, Places address suggestions, video embeds, and authenticated order editing.
Do not perform a live charge as part of a smoke test.

## Memory Requirements & Optimizations

This application has been optimized to build on servers with limited memory. Here are the available build options:

### Build Commands by Memory Availability

| Available Memory | Command | Node.js Heap Size | Recommended For |
|-----------------|---------|-------------------|-----------------|
| 1.5GB+ | `yarn build-1gb` | 1024MB | Production servers |
| 800MB+ | `yarn build` | 768MB | Standard VPS |
| 640MB+ | `yarn build-low-memory` | 640MB | Low-memory VPS |
| <640MB | Not supported | - | Upgrade required |

### Automated Build Script

Use the automated build script that detects your system memory and chooses the appropriate build command:

```bash
./scripts/build-deploy.sh
```

This script will:
- Check available system memory
- Clean up previous builds and caches
- Choose the optimal build command
- Optionally create swap space on Linux systems
- Run the build process

### Manual Memory Optimization

If you're still experiencing memory issues, try these additional steps:

#### 1. Create Swap Space (Linux)

```bash
# Create 1GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent by adding to /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 2. Close Other Services

Before building, stop unnecessary services:

```bash
# Stop web server temporarily
sudo systemctl stop nginx
sudo systemctl stop apache2

# Stop database if not needed during build
sudo systemctl stop mysql
sudo systemctl stop postgresql
```

#### 3. Clear System Cache

```bash
# Clear system cache
sudo sync && sudo sysctl vm.drop_caches=3

# Clear yarn cache
yarn cache clean

# Clear npm cache
npm cache clean --force
```

### Build Optimizations Applied

The following optimizations have been implemented to reduce memory usage:

1. **Reduced Node.js heap size** - Configured for different memory tiers
2. **Disabled webpack caching** - Reduces memory usage during compilation
3. **Single-threaded compilation** - Prevents memory spikes from parallel processing
4. **Disabled source maps** - Saves memory in production builds
5. **Optimized webpack configuration** - Reduced parallelism and caching

### Deployment Options

#### Option 1: Build Locally, Deploy Files

If your production server has insufficient memory:

1. Build on a local machine or CI/CD with sufficient memory
2. Upload the `.next` folder to your server
3. Run `yarn start` on the server

#### Option 2: Use CI/CD Pipeline

Set up GitHub Actions or similar with sufficient memory:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '24'
      - run: yarn install
      - run: yarn build-1gb
      - name: Deploy to server
        # Add your deployment steps here
```

#### Option 3: Upgrade Server Memory

The most straightforward solution is upgrading to a VPS with at least 2GB of memory.

### Troubleshooting

#### "JavaScript heap out of memory" Error

1. Check available memory: `free -h`
2. Try a lower memory build command
3. Create swap space
4. Close other running services

#### Build Takes Too Long

1. The low-memory builds are slower due to reduced parallelism
2. Consider building locally and deploying the built files
3. Use a CI/CD pipeline with more memory

#### Out of Disk Space

1. Clean up old builds: `rm -rf .next`
2. Clear caches: `yarn cache clean`
3. Remove unused dependencies: `yarn install --production`

### Production Recommendations

For production deployments:

1. **Minimum 2GB RAM** for comfortable building and running
2. **SSD storage** for faster I/O during builds
3. **Swap space** equal to RAM size as backup
4. **CI/CD pipeline** for automated deployments
5. **Load balancer** for zero-downtime deployments

### Environment Variables

Make sure these are set in production:

```bash
NODE_ENV=production
DATABASE_URL=your_mysql_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://yourdomain.com
```

### Support

If you continue to experience memory issues after trying these optimizations, consider:

1. Upgrading to a server with more memory
2. Using a build server separate from your production server
3. Implementing a CI/CD pipeline with sufficient resources
