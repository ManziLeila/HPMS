# Shared Database Setup (Co-Development)

This guide covers **local** setup first (each has their own DB), then **shared** and **switching** when you want to work together.

---

## Start here: each developer has their own local database

**Do this first.** Each of you sets up PostgreSQL on your own machine and uses your own copy of the data. No coordination needed.

### What you need

- PostgreSQL installed (and pgAdmin optional) on **your** machine.
- The project's dump: **`hmps.sql`** (in the repo root).

### Steps (each developer, on their own machine)

1. **Create the database**
   - In pgAdmin: right‑click **Databases** → Create → Database → name: **`hpms_core`**.
   - Or in terminal:  
     `psql -U postgres -h localhost -c "CREATE DATABASE hpms_core;"`

2. **Restore the dump into `hpms_core`**
   - In pgAdmin: right‑click **hpms_core** → Restore → choose **`hmps.sql`** → set format to **Custom or tar** → Restore.
   - Or in terminal (from the folder that contains `hmps.sql`):  
     `pg_restore -U postgres -h localhost -d hpms_core -v hmps.sql`

3. **Point the app at your local DB**
   - In the **backend** folder, create or edit **`.env`** and set:
   ```env
   DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/hpms_core
   DATABASE_SSL=false
   JWT_SECRET=at_least_32_characters_long
   ENCRYPTION_MASTER_KEY=another_32_characters_minimum
   PORT=4000
   CORS_ORIGINS=http://localhost:5173
   ```
   Replace `YOUR_POSTGRES_PASSWORD` with your local PostgreSQL password.

4. **Run the app**
   ```bash
   cd backend
   node check_db.mjs   # optional: verify connection
   npm run dev
   ```

After this, **each of you has your own database** and can work independently. When you want to use a **shared** database or switch between shared and local, see the sections below.

---

## Later: use one shared database (optional)

When you want **both** of you to see the same data and each other's changes, use **one** PostgreSQL database that you both connect to.

### Overview

1. **One place** runs PostgreSQL (your machine, hers, or the cloud).
2. **One database** `hpms_core` is created and restored from `hmps.sql` (once).
3. **Both of you** set `DATABASE_URL` in `backend/.env` to point at that same database.
4. **Credentials** are shared securely (e.g. password in a chat or env file, not committed to git).

---

## Option A: One developer’s computer hosts the database

One person runs PostgreSQL and restores the dump; the other connects over the network.

### Who hosts

- **If she hosts:** She does steps 1–3 below on her machine and gives you the connection details.
- **If you host:** You do steps 1–3 on your machine and give her the connection details.

### Step 1: PostgreSQL is running and reachable

- Install PostgreSQL if needed (e.g. [postgresql.org](https://www.postgresql.org/download/)).
- Ensure the **other developer can reach your machine**:
  - **Same Wi‑Fi / same network:** Use your computer’s local IP (e.g. `192.168.1.10`).
  - **Different networks:** Use a tunnel (e.g. ngrok, Tailscale) or put the DB in the cloud (Option B).

- Allow remote connections (only if the other dev is on another machine):
  - Edit `pg_hba.conf` to allow your co-developer’s IP (or `0.0.0.0/0` for any IP, only for dev).
  - Edit `postgresql.conf`: set `listen_addresses = '*'` (or your IP).
  - Restart PostgreSQL.

### Step 2: Create the database and restore the dump (host does this once)

On the machine that hosts PostgreSQL:

```bash
# Create database
psql -U postgres -h localhost -c "CREATE DATABASE hpms_core;"

# Restore (run from folder containing hmps.sql)
pg_restore -U postgres -h localhost -d hpms_core -v hmps.sql
```

Or in pgAdmin: create database `hpms_core`, then Right‑click it → Restore → choose `hmps.sql`, format **Custom or tar**.

### Step 3: Create a user for your co-developer (recommended)

Using one dedicated user per developer is safer than sharing `postgres`:

```sql
-- Run as postgres (e.g. in pgAdmin Query Tool or psql)
CREATE USER co_dev_user WITH PASSWORD 'a_strong_shared_password';
GRANT ALL PRIVILEGES ON DATABASE hpms_core TO co_dev_user;
\c hpms_core
GRANT USAGE ON SCHEMA hpms_core TO co_dev_user;
GRANT ALL ON ALL TABLES IN SCHEMA hpms_core TO co_dev_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA hpms_core TO co_dev_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA hpms_core TO co_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA hpms_core GRANT ALL ON TABLES TO co_dev_user;
```

Share `co_dev_user` and `a_strong_shared_password` only via a secure channel (not in git).

### Step 4: Connection details to share

The host collects:

- **Host:** Their IP (e.g. `192.168.1.10`) or `localhost` if you’re on the same machine.
- **Port:** `5432`
- **Database:** `hpms_core`
- **User:** `co_dev_user` (or `postgres` if you didn’t create a user).
- **Password:** the password you set.

**Example URL (host gives this to the other):**

```text
postgres://co_dev_user:SECRET_PASSWORD@192.168.1.10:5432/hpms_core
```

The **other developer** puts that in `backend/.env` as `DATABASE_URL` (see Step 5).

---

## Option B: Cloud PostgreSQL (good when not on same network)

Use a free/cheap hosted PostgreSQL so both of you connect to the same server from anywhere.

### 1. Create a project and database

Pick one provider and create a PostgreSQL instance:

- **[Neon](https://neon.tech)** – free tier, simple.
- **[Supabase](https://supabase.com)** – free tier, includes a Postgres DB.
- **[Railway](https://railway.app)** – free tier.
- **[ElephantSQL](https://www.elephantsql.com)** – free tier.

Create a database and note:

- Host  
- Port (usually 5432)  
- Database name  
- User  
- Password  

They often give you a **connection string** like:

```text
postgres://user:password@host.region.provider.com:5432/dbname
```

### 2. Load the schema and data (one time)

The dump is custom format, so use `pg_restore` from your machine (install PostgreSQL client tools if needed):

```bash
pg_restore -U USER -h HOST -p 5432 -d DBNAME -v hmps.sql
```

Replace `USER`, `HOST`, `DBNAME` with the cloud provider’s values (you’ll be prompted for password, or use `PGPASSWORD=...`). If the cloud DB is empty and doesn’t have the `hpms_core` database/schema, you may need to:

- Create database `hpms_core` in the cloud UI (or use the default DB they gave you and restore into that), then
- Run `pg_restore` into that database.

Some providers create one database per project; then you restore into that and your app will use that DB name in `DATABASE_URL`.

### 3. Share the connection string

One person restores; then share the **same** connection string with the other (via secure channel, not git). Both use it in `backend/.env`.

---

## Step 5: Both developers – set `backend/.env`

Each of you, on your own machine:

1. Open or create **`backend/.env`**.
2. Set the **same** `DATABASE_URL` (and optional `DATABASE_SSL`):

```env
# Same value for both developers (shared DB)
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/hpms_core
DATABASE_SSL=false
```

For cloud providers that require SSL, they often tell you to use `?sslmode=require` in the URL or set `DATABASE_SSL=true`.

3. Add other required vars (each dev can have their own JWT/encryption keys for local auth, or share the same for dev):

```env
JWT_SECRET=at_least_32_characters_long_shared_or_not
ENCRYPTION_MASTER_KEY=another_32_characters_minimum_key
```

4. **Do not commit** `.env` to git (it should be in `.gitignore`). Share `DATABASE_URL` and secrets via a secure channel (e.g. 1Password, Signal, or your team’s secret store).

---

## Step 6: Verify both can connect

**Developer A (host or person who restored):**

```bash
cd backend
node check_db.mjs
npm run dev
```

**Developer B:**

Same commands with the **shared** `DATABASE_URL` in their `backend/.env`. They should see the same data (e.g. same columns from `check_db.mjs`, same employees/salaries in the app).

---

## Summary

| Step | Who | What |
|------|-----|------|
| 1 | One person or cloud | Have PostgreSQL running and reachable (same network or cloud). |
| 2 | One person | Create database `hpms_core`, restore `hmps.sql` (pg_restore or pgAdmin). |
| 3 | One person | (Optional) Create a DB user; share connection string securely. |
| 4 | Both | Put the **same** `DATABASE_URL` in `backend/.env`. |
| 5 | Both | Run `node check_db.mjs` and `npm run dev`; you both see the same data and changes. |

After this, when either of you creates or updates data through the app, the other sees it (after refresh or next request) because you’re using the same shared database.

---

## Shared + local (use both, switch when needed)

You can have **both** a shared database (for when you're both working) and a **local** database (for when one is away). Switch by changing which `DATABASE_URL` the app uses.

### How it works

| Mode    | DATABASE_URL points to       | When to use |
|---------|------------------------------|-------------|
| **Shared** | Same remote/cloud server     | Both of you working; you see each other's changes. |
| **Local**  | `localhost` (your own machine) | One person away; you work offline on your own copy. |

You **don't** run two backends at once. You choose one DB per session by which `.env` is active.

### Step 1: Set up shared DB (once)

Do Option A or B above so the **shared** database exists and you have its connection string, e.g.:

```text
postgres://user:password@shared-host:5432/hpms_core
```

### Step 2: Set up local DB (each developer, once)

On **your** machine:

1. Install PostgreSQL and pgAdmin (or use existing).
2. Create database **`hpms_core`** (e.g. in pgAdmin).
3. Restore **hmps.sql** into it (pgAdmin: Restore → `hmps.sql`, format **Custom or tar**, or use `pg_restore`).

Your **local** connection URL will be something like:

```text
postgres://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/hpms_core
```

Your co-developer does the same on her machine with her own local PostgreSQL and password.

### Step 3: Two env files (recommended)

In the **backend** folder, keep two files (do **not** commit them; they are listed in `.gitignore`):

- **`.env.shared`** – used when you want to work on the shared DB.
- **`.env.local`** – used when you want to work on your local DB.

**`.env.shared`** (same for both of you when using shared):

```env
DATABASE_URL=postgres://USER:PASSWORD@SHARED_HOST:5432/hpms_core
DATABASE_SSL=false
JWT_SECRET=your_shared_or_personal_jwt_secret_at_least_32_chars
ENCRYPTION_MASTER_KEY=your_encryption_key_at_least_32_chars
PORT=4000
CORS_ORIGINS=http://localhost:5173
```

**`.env.local`** (each developer uses their own local DB URL):

```env
DATABASE_URL=postgres://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/hpms_core
DATABASE_SSL=false
JWT_SECRET=your_shared_or_personal_jwt_secret_at_least_32_chars
ENCRYPTION_MASTER_KEY=your_encryption_key_at_least_32_chars
PORT=4000
CORS_ORIGINS=http://localhost:5173
```

The app only reads **`.env`**. So you **switch** by copying one of these over `.env`:

- **Use shared DB:**  
  `cp .env.shared .env`  
  (or on Windows: `copy .env.shared .env`)
- **Use local DB:**  
  `cp .env.local .env`

Then run `npm run dev` as usual.

### Step 4: Optional – npm scripts to switch

In **`backend/package.json`** the following scripts are already added (cross‑platform; works on Windows too):

```json
"env:shared": "node scripts/use-env.js shared",
"env:local": "node scripts/use-env.js local"
```

From the **backend** folder:

- **Use shared:** `npm run env:shared` then `npm run dev`
- **Use local:** `npm run env:local` then `npm run dev`

### Step 5: Syncing local with shared (when one was away)

If you worked **local** for a while and want to bring your changes to the **shared** DB:

- **Option A – App-only changes:** Re-do the important changes (e.g. create employees, run payroll) while connected to **shared**.
- **Option B – Full refresh from shared:** Dump from shared, then restore into your local DB so your local copy matches shared again (see below).

If the **other** person was working on **shared** and you were offline, when you come back:

- **Use shared** again (`cp .env.shared .env`) so you see their latest data.
- Optionally, **refresh your local** from shared so your local copy is up to date for next time you work offline:
  - From shared: `pg_dump -U user -h SHARED_HOST -d hpms_core -Fc -f hpms_from_shared.sql`
  - On your machine: drop and recreate local `hpms_core` (or use `pg_restore --clean`), then `pg_restore -U postgres -h localhost -d hpms_core -v hpms_from_shared.sql`

### Quick reference

| I want to…              | Do this |
|-------------------------|--------|
| Work together, see each other's changes | Use **shared**: `cp .env.shared .env` (or `npm run env:shared`) then start backend. |
| Work alone (other is away)             | Use **local**: `cp .env.local .env` (or `npm run env:local`) then start backend. |
| Get latest from shared into my local   | Dump from shared DB, restore into local `hpms_core` (see Step 5 above). |

This way you have **both** shared and local; you switch when needed so the one who's around can keep working.
