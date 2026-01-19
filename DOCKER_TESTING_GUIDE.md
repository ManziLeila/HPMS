# 🧪 Docker Testing Guide - Step by Step

## What We're Testing

We're going to:
1. ✅ Build Docker containers for your app
2. ✅ Start all services (database, backend, frontend)
3. ✅ Verify everything works
4. ✅ Test the application in your browser

## Prerequisites Check

Before starting, make sure:
- ✅ Docker Desktop is installed and running
- ✅ You're in the project directory

## Step-by-Step Testing Process

### Step 1: Stop Your Current Development Servers

First, stop the npm dev servers that are currently running:

**In the terminal running backend:**
```
Press Ctrl+C
```

**In the terminal running frontend:**
```
Press Ctrl+C
```

This is important because Docker will use the same ports (3000 and 80).

---

### Step 2: Verify Docker is Running

Open a new PowerShell terminal and run:
```powershell
docker --version
docker-compose --version
```

You should see version numbers. If not, start Docker Desktop.

---

### Step 3: Navigate to Project Directory

```powershell
cd "c:\Users\kezal\Desktop\hcsolutions payroll"
```

---

### Step 4: Build Docker Images

This creates the containers for your application:

```powershell
docker-compose build
```

**What happens:**
- Downloads base images (Node.js, PostgreSQL, Nginx)
- Installs dependencies
- Builds your frontend
- Creates optimized containers

**Expected time:** 5-10 minutes (first time only)

**What you'll see:**
```
[+] Building 234.5s (45/45) FINISHED
 => [backend internal] load build definition
 => [frontend internal] load build definition
 => [database] pulling image
...
```

---

### Step 5: Start All Services

```powershell
docker-compose up -d
```

The `-d` flag means "detached mode" (runs in background).

**What happens:**
- Starts PostgreSQL database
- Starts backend API server
- Starts frontend web server
- Creates network between them

**What you'll see:**
```
[+] Running 3/3
 ✔ Container hpms-database  Started
 ✔ Container hpms-backend   Started
 ✔ Container hpms-frontend  Started
```

---

### Step 6: Check if Services are Running

```powershell
docker-compose ps
```

**Expected output:**
```
NAME              STATUS          PORTS
hpms-database     Up 30 seconds   0.0.0.0:5432->5432/tcp
hpms-backend      Up 25 seconds   0.0.0.0:3000->3000/tcp
hpms-frontend     Up 20 seconds   0.0.0.0:80->80/tcp
```

All should show "Up" status.

---

### Step 7: View Logs (Optional but Recommended)

To see what's happening inside the containers:

**All services:**
```powershell
docker-compose logs -f
```

**Just backend:**
```powershell
docker-compose logs -f backend
```

**Just frontend:**
```powershell
docker-compose logs -f frontend
```

Press `Ctrl+C` to stop viewing logs (containers keep running).

**What to look for:**
- Backend: "HPMS backend listening on port 3000"
- Database: "database system is ready to accept connections"
- No error messages

---

### Step 8: Test the Application

#### Test 1: Frontend
Open your browser and go to:
```
http://localhost
```

You should see the login page!

#### Test 2: Backend Health Check
In browser, go to:
```
http://localhost:3000/health
```

You should see:
```json
{"status":"ok"}
```

#### Test 3: Database Connection
```powershell
docker-compose exec database psql -U postgres -d hpms
```

You should see a PostgreSQL prompt. Type `\q` to exit.

---

### Step 9: Run Database Migrations

If the database is empty, you need to run migrations:

```powershell
# First, check if tables exist
docker-compose exec database psql -U postgres -d hpms -c "\dt hpms_core.*"

# If no tables, run your initialization scripts
docker-compose exec database psql -U postgres -d hpms -f /docker-entrypoint-initdb.d/fix-audit-enum.sql
```

---

### Step 10: Create Test User (If Needed)

If you need to create an admin user:

```powershell
# Access the database
docker-compose exec database psql -U postgres -d hpms

# Then run SQL to create user (example)
# INSERT INTO hpms_core.users ...
```

---

### Step 11: Test Full Application Flow

1. **Login**: Try logging in with your credentials
2. **Navigate**: Check all pages (Dashboard, Employees, Reports)
3. **Create Salary**: Try creating a salary record
4. **Download Payslip**: Test the download functionality
5. **Reset Period**: Test the new reset button we just added!

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
Stop your npm dev servers or change ports in `.env`:
```env
BACKEND_PORT=3001
FRONTEND_PORT=8080
```

---

### Issue 2: Database Connection Failed

**Error in logs:**
```
Error: connect ECONNREFUSED database:5432
```

**Solution:**
Wait 30 seconds for database to fully start, then restart backend:
```powershell
docker-compose restart backend
```

---

### Issue 3: Frontend Shows Blank Page

**Solution:**
1. Check browser console (F12) for errors
2. Verify API URL in frontend container:
```powershell
docker-compose exec frontend cat /usr/share/nginx/html/index.html
```

---

### Issue 4: Can't Access on Port 80

**Solution:**
Port 80 might need admin rights. Use different port:
```env
FRONTEND_PORT=8080
```

Then access at `http://localhost:8080`

---

## Useful Commands

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services
```powershell
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services
```powershell
# Stop all (keeps data)
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

### Rebuild After Code Changes
```powershell
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Access Container Shell
```powershell
# Backend container
docker-compose exec backend sh

# Database
docker-compose exec database psql -U postgres -d hpms

# Frontend (nginx)
docker-compose exec frontend sh
```

### Check Resource Usage
```powershell
docker stats
```

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Docker Desktop is running
- [ ] `docker-compose build` completed successfully
- [ ] `docker-compose up -d` started all services
- [ ] `docker-compose ps` shows all containers "Up"
- [ ] No errors in `docker-compose logs`
- [ ] Frontend loads at http://localhost
- [ ] Backend health check works at http://localhost:3000/health
- [ ] Can connect to database
- [ ] Can log in to the application
- [ ] Can navigate all pages
- [ ] Can create/view/delete salary records
- [ ] Can download payslips
- [ ] Reset period button works

---

## What's Different from npm run dev?

| Aspect | npm run dev | Docker |
|--------|-------------|--------|
| **Setup** | Need Node.js, PostgreSQL installed | Just need Docker |
| **Startup** | Run 2 commands (backend, frontend) | One command: `docker-compose up` |
| **Environment** | Uses your local machine | Isolated containers |
| **Database** | Your local PostgreSQL | Container PostgreSQL |
| **Ports** | Backend: 4000, Frontend: 5173 | Backend: 3000, Frontend: 80 |
| **Production-like** | Development mode | Production mode |

---

## Next Steps After Testing

Once Docker works locally:

1. ✅ **Commit to Git**
   ```powershell
   git add .
   git commit -m "Add Docker configuration"
   ```

2. ✅ **Push to GitHub**
   ```powershell
   git push
   ```

3. ✅ **Wait for VPN credentials**

4. ✅ **Deploy to Coolify**
   - Same `docker-compose.yml` will work!
   - Just configure environment variables in Coolify
   - Push to GitHub → Auto-deploy!

---

## Quick Start Commands

For future reference, here's the minimal workflow:

```powershell
# Start everything
cd "c:\Users\kezal\Desktop\hcsolutions payroll"
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

**Need Help?** 
- Check logs: `docker-compose logs -f`
- Restart: `docker-compose restart`
- Rebuild: `docker-compose up -d --build`
- Ask for help with specific error messages!
