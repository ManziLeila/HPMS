# 🚀 Quick Reference - Docker & Deployment

## Local Development with Docker

### First Time Setup
```bash
# 1. Create environment file
cp .env.example .env

# 2. Generate secrets (run 3 times for different keys)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Edit .env and paste the generated secrets

# 4. Build and start
docker-compose up -d

# 5. View logs
docker-compose logs -f
```

### Daily Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## GitHub Push
```bash
git add .
git commit -m "Your message"
git push
```

## Coolify Auto-Deploy
✅ Push to GitHub → Coolify automatically deploys!

## Access Points

### Local (Docker)
- Frontend: http://localhost
- Backend: http://localhost:3000/api
- Database: localhost:5432

### Production (Coolify)
- App: https://yourdomain.com
- Health: https://yourdomain.com/api/health

## Troubleshooting

### Can't connect to database?
```bash
docker-compose logs database
docker-compose restart database
```

### Frontend not loading?
```bash
docker-compose logs frontend
docker-compose restart frontend
```

### Backend errors?
```bash
docker-compose logs backend
# Check .env file has all required variables
```

### Need to reset everything?
```bash
docker-compose down -v  # ⚠️ Deletes all data!
docker-compose up -d
```

## Important Files

- `docker-compose.yml` - Defines all services
- `.env` - Your secrets (NEVER commit!)
- `.env.example` - Template for .env
- `backend/Dockerfile` - Backend container config
- `frontend/Dockerfile` - Frontend container config
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions

## Need Help?

1. Check logs: `docker-compose logs -f`
2. Read `DEPLOYMENT_GUIDE.md`
3. Verify `.env` file is correct
4. Restart services: `docker-compose restart`
