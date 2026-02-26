# Manual SSH Connection Guide

Since automated SSH with password is having issues, please try connecting manually:

## Option 1: Use PuTTY (Recommended for Windows)

1. **Download PuTTY** (if not installed): https://www.putty.org/

2. **Configure PuTTY:**
   - Host Name: `10.10.135.228`
   - Port: `2222`
   - Connection type: SSH
   - Click "Open"

3. **Login:**
   - Username: `root`
   - Password: `Pvssw0rd!123`

4. **Once connected, run this command:**
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

## Option 2: Use Windows Terminal/PowerShell

Open PowerShell and run:
```powershell
ssh -p 2222 root@10.10.135.228
```

When prompted for password, type: `Pvssw0rd!123`

## Option 3: Try Password Without Special Characters

Ask your provider if they can temporarily set a simpler password like `TempPassword123` (without special characters) for initial setup.

## What to Do After SSH Works

Once you're logged into the server, run these commands:

### 1. Install Coolify
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Wait 5-10 minutes for installation.

### 2. Access Coolify Dashboard
Open browser: `http://10.10.135.228:8000`

### 3. Create Admin Account
- Set your admin email and password
- Complete initial setup

### 4. Connect GitHub
- Go to Sources → Add Source → GitHub
- Authorize Coolify
- Select repository: `ManziLeila/HPMS`

### 5. Create Application
- New Resource → Application
- Select HPMS repository
- Deployment type: Docker Compose
- Branch: main

### 6. Set Environment Variables
Add all variables from `.env.example`:
```
DB_NAME=hpms
DB_USER=postgres
DB_PASSWORD=<secure-password>
JWT_SECRET=<generate-new>
JWT_REFRESH_SECRET=<generate-new>
ENCRYPTION_KEY=<generate-new>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=manzileila03@gmail.com
EMAIL_PASSWORD=<your-app-password>
EMAIL_FROM=manzileila03@gmail.com
```

### 7. Deploy!
Click "Deploy" button and watch the logs.

---

**Need Help?** Share a screenshot of any errors you encounter!
