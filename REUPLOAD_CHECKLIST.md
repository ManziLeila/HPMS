# Re-upload checklist — production & local

The app is configured to run in both environments with **one frontend build**:

| Environment | Frontend URL | API base |
|-------------|--------------|----------|
| **Production** | https://payroll.hcsolutions-rw.com | Same origin → `https://payroll.hcsolutions-rw.com/api` |
| **Local** | http://localhost:5173 | `http://localhost:4000/api` (or `VITE_API_BASE_URL` if set) |

No hardcoded production URLs in code: production domain comes from `window.location.origin` (frontend) and from `CORS_ORIGINS` / `APP_URL` (backend).

---

## Files relevant for domain / env (re-upload these if you changed them)

- **Frontend:** `frontend/src/api/client.js`, `frontend/.env.example`
- **Backend:** `backend/src/config/env.js`, `backend/.env.example`
- **Backend (links/emails):** `backend/src/services/emailService.js`, `backend/src/controllers/salaryController.js`, `backend/src/utils/approvalEmailTemplates.js`
- **Root:** `.env.example`

---

## On the server (after re-upload)

1. **Backend env**
   - Copy `backend/.env.example` to `backend/.env`.
   - Set at least:
     - `NODE_ENV=production`
     - `CORS_ORIGINS=https://payroll.hcsolutions-rw.com`
     - `APP_URL=https://payroll.hcsolutions-rw.com`
     - `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY` (and SMTP if you use email).

2. **Frontend build**
   - Do **not** set `VITE_API_BASE_URL` when building (so the app uses same-origin `/api`).
   - From project root: `cd frontend && npm ci && npm run build`.
   - Deploy the contents of `frontend/dist/` to the web root for https://payroll.hcsolutions-rw.com.

3. **Backend**
   - `cd backend && npm ci` (or `npm install`).
   - Run migrations if needed.
   - Start the API (e.g. `node src/index.js` or your process manager) so it serves `/api` on the same host or behind the same reverse proxy.

4. **Reverse proxy**
   - Ensure requests to `https://payroll.hcsolutions-rw.com/api` are proxied to the backend (e.g. Node on port 4000 or 3000).

---

## Quick verification

- **Production:** Open https://payroll.hcsolutions-rw.com, log in, and check the Network tab: requests should go to `https://payroll.hcsolutions-rw.com/api/...`, not localhost.
- **Local:** Open http://localhost:5173 with the backend running on port 4000; requests should go to `http://localhost:4000/api/...`.

If anything still points to localhost in production, ensure you rebuilt the frontend **without** `VITE_API_BASE_URL` and redeployed the new `frontend/dist/`.
