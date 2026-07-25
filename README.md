# QR Advertising Platform

A production-ready, multi-tenant QR code advertising and lead capture platform built using Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

---

## 🌟 Key Features

1. **Multi-Tenancy isolation**: Advertiser tenants are strictly isolated. Managers can only view campaigns, coupon redemptions, and geodata logs belonging to their brand.
2. **Super Admin console**: Full control dashboard to create advertiser tenants, configure campaigns, batch-generate unique sequential QR codes (`QR000000001`), and track platform performance.
3. **Robust Auth system**: JWT-based session state stored in HTTP-Only cookies. Next.js Edge Middleware enforces role-based path protections.
4. **Interactive Analytics charts**: Real-time dashboards visualizing scan activity, repeat visitors, device/OS breakdowns, map coordinates, and conversion rates.
5. **Dynamic Landing page generator**: High-performance mobile-first screens featuring visual headers, custom offers, live countdown timers, social CTA link pills, and validated lead forms.
6. **Billing Ready & Notifications**: Structured quotas and Stripe webhook scaffolding, alongside live in-app notification alerts for new lead registrations.

---

## ⚙️ Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Radix UI Primitives, Lucide icons, React Hook Form, Zod.
*   **Charts & Tables**: Recharts, TanStack Table.
*   **Database**: PostgreSQL & Prisma ORM.
*   **Authentication**: Custom Web-Crypto API JWT & Role-Based Access Control (RBAC) middleware.
*   **Local Infrastructure**: Docker, docker-compose (PostgreSQL & pgAdmin).

---

## 🚀 Local Development Setup

### 1. Prerequisite Installations
*   Ensure **Node.js 18+**, **pnpm**, and **Docker Desktop** are active on your computer.

### 2. Configure Environment Variables
Create a `.env` file in the root directory (already done for development):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/qr_platform?schema=public"
JWT_SECRET="super-secret-jwt-key-change-in-production-1234567890"
PORT=3000
```

### 3. Spin Up PostgreSQL and pgAdmin Container
Launch the database services in the background:
```bash
docker compose up -d
```
*   **Postgres Port**: `5433` (modified to avoid conflicts with default port `5432`).
*   **pgAdmin UI**: Available at `http://localhost:5050` (Login: `admin@qrplatform.com` / Password: `password`).

### 4. Push Database Schema & Seed Mock Data
Install project libraries, compile schema, create tables, and populate dashboards with mock stats:
```bash
pnpm install
pnpm prisma db push
pnpm prisma db seed
```

### 5. Launch Development Server
Start the Next.js local server:
```bash
pnpm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔑 Seeding Credentials (Local Testing)

The seed script registers two pre-configured accounts for testing platform behaviors:

### A. Super Admin Portal
*   **URL Route**: `/admin/dashboard`
*   **Login Email**: `admin@qrplatform.com`
*   **Password**: `admin123`
*   **Capabilities**: Full CRUD on tenants, campaigns, user management, and sequential QR generator.

### B. Advertiser Tenant Portal
*   **URL Route**: `/advertiser/dashboard`
*   **Login Email**: `advertiser@qrplatform.com`
*   **Password**: `advertiser123`
*   **Tenant Mapping**: Associated with *AquaFlow Bottles* tenant.
*   **Capabilities**: Read-only listings of campaigns, conversion lists, and CSV analytics download.

---

## 📊 Core Flows

### 1. Customer Scan Flow
```
Customer Scans Bottle QR
       ↓
Browser hits API endpoint: /api/q/QR000000001
       ↓
API parses User-Agent (OS, Browser, Device Type) & Geolocation (IP)
       ↓
Increments QR scanCount, logs QrScan record
       ↓
Redirects to Landing Page URL: /l/[landingPageId]?qr=QR000000001
```

### 2. Lead Capture & Reward Flow
*   On the landing page, the customer fills in their details (Name, Phone, Email, City).
*   Form posts to `/api/landing-pages/[id]/lead`.
*   The system saves the lead, validates the campaign limits, marks an active coupon code redemption (e.g. `AQUA20`), and sends in-app notifications to advertiser managers and admins.
*   The browser displays the unlocked coupon discount ticket with copy-to-clipboard functionality.

---

## 🌐 Ubuntu VPS Deployment Guide (Production)

Follow these instructions to deploy the platform directly onto an Ubuntu Linux VPS without using Docker for PostgreSQL.

### Step 1: Install PostgreSQL on Ubuntu
Connect to your VPS shell and run:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Configure Production Database & Users
Access the PostgreSQL command line to set credentials:
```bash
sudo -i -u postgres psql
```
Execute the following SQL commands to configure the database:
```sql
CREATE DATABASE qr_platform_prod;
CREATE USER qr_admin WITH PASSWORD 'StrongSecureDBPassword123!';
GRANT ALL PRIVILEGES ON DATABASE qr_platform_prod TO qr_admin;
ALTER DATABASE qr_platform_prod OWNER TO qr_admin;
\q
```
*Note: Make sure to update the firewall if connecting externally, but Nginx/Node running on the same host can connect locally.*

### Step 3: Install Node.js & pnpm on the Host
Install Node.js 18+ and configure the pnpm package manager globally:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify install
node -v
npm -v

# Install pnpm
sudo npm install -g pnpm
```

### Step 4: Clone Code & Configure Production Environment
Clone your repository to `/var/www/qr-platform`:
```bash
sudo mkdir -p /var/www/qr-platform
sudo chown -R $USER:$USER /var/www/qr-platform
git clone <your-repo-git-url> /var/www/qr-platform
cd /var/www/qr-platform
```

Create a production `.env` file pointing directly to the VPS PostgreSQL server:
```env
DATABASE_URL="postgresql://qr_admin:StrongSecureDBPassword123!@localhost:5432/qr_platform_prod?schema=public"
JWT_SECRET="generate-a-very-long-random-string-for-prod-signing-key"
PORT=3000
NODE_ENV="production"
```

### Step 5: Sync Schema & Build Production Bundle
Run Prisma migrations to construct tables, generate the client, and build the Next.js production build:
```bash
pnpm install
pnpm prisma migrate deploy
pnpm run build
```

### Step 6: Configure Process Manager (PM2)
Install and configure PM2 to keep the Next.js server running continuously:
```bash
sudo npm install -g pm2
pm2 start npm --name "qr-platform" -- start

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### Step 7: Configure Nginx as a Reverse Proxy
Install Nginx to handle incoming domain requests and map them to the Next.js port:
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```
Create a site configuration file:
```bash
sudo nano /etc/nginx/sites-available/qrplatform.com
```
Add the following Nginx server block:
```nginx
server {
    listen 80;
    server_name qrplatform.com www.qrplatform.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded-for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 20M; # Support file uploads up to 20MB
}
```
Activate the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/qrplatform.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default # Remove default site
sudo nginx -t # Test configuration syntax
sudo systemctl restart nginx
```

### Step 8: Install SSL Certificates (Certbot / Let's Encrypt)
Apply HTTPS encryption to secure cookie exchanges and user logins:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d qrplatform.com -d www.qrplatform.com
# Follow the prompts and select option to redirect HTTP traffic to HTTPS
```

---

## 🔒 Production Security Checklist

*   [ ] **JWT Secret**: Verify that `JWT_SECRET` is changed to a high-entropy string in production.
*   [ ] **Database Access**: Ensure the PostgreSQL port `5432` is not open to public traffic (bind to `127.0.0.1` inside postgres configuration).
*   [ ] **HTTPS Enforcement**: Ensure Certbot SSL is active, and cookies are transmitted only over encrypted connections.
*   [ ] **Suspension verification**: The login route checks advertiser suspension status, instantly disabling access for users under suspended tenants.
*   [ ] **Tenant Scoping verification**: Double-check that all advertiser queries filter records strictly using the tenant's authenticated `advertiserId`.
*   [ ] **Storage backup plan**: For production scale, modify `src/lib/storage.ts` to swap local uploads with AWS S3 / Cloudflare R2 file storage bucket hooks.
