# How to Connect HPMS to Your Database

This guide explains how to connect the HPMS backend to your **existing (initial) PostgreSQL database**.

---

## 1. Where the app reads the connection

The backend reads the connection from **environment variables**. It loads a `.env` file from the **backend** folder when you start the server.

- **File to use:** `backend/.env`
- **If you don't have it:** Copy `backend/.env.example` to `backend/.env`, then edit the values.

```bash
cd backend
cp .env.example .env
# Edit .env with your database details (see below)
```

---

## 2. Set your database URL

The only variable the app **must** have to connect is **`DATABASE_URL`**.

Format:

```
postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Examples:**

| Your setup | Example `DATABASE_URL` |
|------------|------------------------|
| Local PostgreSQL, database `hpms`, user `postgres`, password `mypass` | `postgres://postgres:mypass@localhost:5432/hpms` |
| Same but database named `hpms_core` | `postgres://postgres:mypass@localhost:5432/hpms_core` |
| Remote server | `postgres://myuser:mypass@db.example.com:5432/hpms` |
| With SSL (e.g. cloud DB) | Same URL + set `DATABASE_SSL=true` in `.env` |

Put this in **`backend/.env`**:

```env
# Required: your existing database
DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE_NAME

# Optional: set to true if your provider requires SSL
DATABASE_SSL=false
```

Replace:

- `YOUR_USER` – PostgreSQL username
- `YOUR_PASSWORD` – PostgreSQL password
- `YOUR_HOST` – `localhost` or your server hostname/IP
- `YOUR_DATABASE_NAME` – **the name of your initial database** (e.g. `hpms`, `hpms_core`, or whatever you already have)

---

## 3. Schema: hpms_core

The application does **not** use the default `public` schema. All tables are expected to live in a schema named **`hpms_core`**.

So in your database you need:

- A **database** (the one you put in `DATABASE_URL`), and
- A **schema** inside it named **`hpms_core`** with the HPMS tables (e.g. `employees`, `salaries`, etc.).

If your initial database already has:

- A schema `hpms_core` and the core tables → just set `DATABASE_URL` and you're done.
- No schema `hpms_core` or tables missing → create the schema and run the migrations (see step 5).

---

## 4. Verify the connection

From the **backend** directory:

```bash
cd backend
node check_db.mjs
```

If the connection works, you'll see something like:

```
Columns: advance_amount, basic_salary_enc, ...
```

If it fails, you'll see an error (e.g. connection refused, authentication failed). Fix `DATABASE_URL` (and `DATABASE_SSL` if needed) and try again.

You can also start the server; it will fail at startup if the DB connection is invalid:

```bash
cd backend
npm run dev
```

---

## 5. If your initial DB is missing the schema or tables

If the database exists but doesn't yet have the `hpms_core` schema and tables (or you're not sure), run the migrations.

1. **Create the schema** (if it doesn't exist):

   ```sql
   CREATE SCHEMA IF NOT EXISTS hpms_core;
   ```

2. **Run the migration scripts** in order, for example:

   ```bash
   cd backend
   psql -U YOUR_USER -d YOUR_DATABASE_NAME -f migrations/001_multi_level_approval_system.sql
   # If you have more migrations (e.g. 002_contracts.sql), run them next.
   ```

   Or open the `.sql` files in your SQL client and run them against your database.

After that, the app should see the `hpms_core` tables and connect correctly.

---

## 6. Other required variables in backend/.env

For the app to run fully (not only DB), you also need:

| Variable | Purpose |
|----------|--------|
| `JWT_SECRET` | At least 32 characters; used to sign login tokens. |
| `ENCRYPTION_MASTER_KEY` | At least 32 characters; used to encrypt salary-related data. |

Generate random values, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use one output for `JWT_SECRET` and a different one for `ENCRYPTION_MASTER_KEY`.

Optional but useful:

- `PORT` – default is 4000.
- `CORS_ORIGINS` – frontend origin(s), e.g. `http://localhost:5173` for local dev.
- SMTP variables – only if you want payslip/notification emails.

---

## Quick checklist

1. Create or edit **`backend/.env`**.
2. Set **`DATABASE_URL`** to your initial database (user, password, host, port, database name).
3. Set **`DATABASE_SSL`** to `true` only if your DB requires SSL.
4. Ensure the database has a **schema `hpms_core`** and the expected tables; if not, run the migrations.
5. Set **`JWT_SECRET`** and **`ENCRYPTION_MASTER_KEY`** (each ≥ 32 chars).
6. Run **`node check_db.mjs`** or **`npm run dev`** from the `backend` folder to confirm the connection.

After that, HPMS is connected to your initial database.
