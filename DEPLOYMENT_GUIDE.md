# HC Solutions Payroll Management System - Deployment Guide

## 🚀 Quick Start with Docker

This guide will help you deploy the HC Solutions Payroll Management System using Docker and Coolify.

## Prerequisites

- Docker and Docker Compose installed locally (for testing)
- Git installed
- GitHub account
- Server with Ubuntu 20.04+ (for production deployment)
- VPN access to your server (as provided by your hosting provider)

## Part 1: Local Docker Testing

### Step 1: Create Environment File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your values:
   ```bash
   # Generate secure secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Use the output to replace:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ENCRYPTION_KEY`

3. Set your database password and email credentials

### Step 2: Build and Run with Docker

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Access the Application

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database: localhost:5432

### Step 4: Initialize Database

The database will be automatically initialized with the scripts in `backend/scripts/` on first run.

If you need to run migrations manually:
```bash
docker-compose exec backend npm run migrate
```

### Step 5: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data!)
docker-compose down -v
```

## Part 2: GitHub Setup

### Step 1: Initialize Git Repository

```bash
cd "c:\Users\kezal\Desktop\hcsolutions payroll"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Dockerized payroll system"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `hcsolutions-payroll`)
3. Choose **Private** for security
4. Don't initialize with README (we already have files)

### Step 3: Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/hcsolutions-payroll.git

# Push code
git branch -M main
git push -u origin main
```

### Step 4: Verify

- Go to your GitHub repository
- Verify `.env` files are NOT visible (they should be ignored)
- Verify `.env.example` files ARE visible

## Part 3: Server Setup with Coolify

### Step 1: Connect to Server via VPN

1. Connect to your provider's VPN using the credentials they provided
2. SSH into your server:
   ```bash
   ssh username@server-ip-address
   ```

### Step 2: Install Coolify

Run this one-liner on your server:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Wait for installation to complete (5-10 minutes).

### Step 3: Access Coolify Dashboard

1. Open browser: `http://YOUR_SERVER_IP:8000`
2. Create admin account
3. Complete initial setup

### Step 4: Add GitHub Repository

1. In Coolify dashboard, go to **Sources**
2. Click **Add Source** → **GitHub**
3. Authorize Coolify to access your GitHub
4. Select your `hcsolutions-payroll` repository

### Step 5: Create New Application

1. Click **New Resource** → **Application**
2. Select your GitHub repository
3. Choose **Docker Compose** as deployment type
4. Set branch to `main`

### Step 6: Configure Environment Variables

In Coolify, go to **Environment Variables** and add:

```env
DB_NAME=hpms
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD
BACKEND_PORT=3000
FRONTEND_PORT=80
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<generate-new-64-char-hex>
JWT_REFRESH_SECRET=<generate-new-64-char-hex>
ENCRYPTION_KEY=<generate-new-64-char-hex>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Important**: Generate NEW secrets for production! Don't use development values.

### Step 7: Configure Domain

1. In Coolify, go to **Domains**
2. Add your domain (e.g., `payroll.yourdomain.com`)
3. Coolify will automatically:
   - Configure Nginx reverse proxy
   - Generate SSL certificate via Let's Encrypt
   - Set up HTTPS redirect

### Step 8: Deploy

1. Click **Deploy** button
2. Watch the deployment logs
3. Wait for all services to start (2-5 minutes)

### Step 9: Verify Deployment

1. Visit `https://yourdomain.com`
2. You should see the login page
3. Check backend health: `https://yourdomain.com/api/health`

## Part 4: Post-Deployment

### Create Initial Admin User

SSH into your server and run:
```bash
# Access the backend container
docker exec -it hpms-backend sh

# Run migration to create admin (if you have a script)
# Or use psql to insert directly
```

### Set Up Database Backups

In Coolify:
1. Go to **Database** section
2. Enable **Automated Backups**
3. Set schedule (e.g., daily at 2 AM)
4. Configure backup retention (e.g., keep 7 days)

### Monitor Application

Coolify provides:
- Real-time logs
- Resource usage graphs
- Uptime monitoring
- Email alerts on failures

## Part 5: Continuous Deployment

### Automatic Deployments

Coolify can auto-deploy when you push to GitHub:

1. In Coolify, enable **Auto Deploy**
2. Now whenever you push to `main` branch:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```
3. Coolify automatically:
   - Pulls latest code
   - Rebuilds containers
   - Deploys with zero downtime

### Manual Deployment

Click **Deploy** button in Coolify dashboard anytime.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

1. Verify `DATABASE_URL` in environment variables
2. Check if database container is running: `docker-compose ps`
3. Test connection: `docker-compose exec database psql -U postgres -d hpms`

### Frontend Can't Reach Backend

1. Check `VITE_API_BASE_URL` in frontend environment
2. Verify CORS settings in backend `.env`
3. Check Coolify proxy configuration

### SSL Certificate Issues

1. Verify domain DNS points to server IP
2. Check Coolify logs for Let's Encrypt errors
3. Ensure ports 80 and 443 are open

## Useful Commands

```bash
# View all running containers
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Access backend container shell
docker-compose exec backend sh

# Access database
docker-compose exec database psql -U postgres -d hpms

# Backup database
docker-compose exec database pg_dump -U postgres hpms > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres hpms < backup.sql
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated new JWT secrets
- [ ] Generated new encryption key
- [ ] Configured firewall (only ports 80, 443, 22 open)
- [ ] Enabled HTTPS/SSL
- [ ] Set up database backups
- [ ] Configured email alerts
- [ ] Reviewed CORS settings
- [ ] Enabled MFA for admin users
- [ ] Set up monitoring

## Support

For issues:
1. Check Coolify logs
2. Check Docker container logs
3. Review this guide
4. Contact your development team

---

**Last Updated**: January 2026
