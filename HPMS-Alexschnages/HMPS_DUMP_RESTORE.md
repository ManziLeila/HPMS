# Using Your Initial Database (hmps.sql)

**hmps.sql** is a PostgreSQL **custom-format dump** of the HPMS database. It contains:

- **Database:** `hpms_core`
- **Schema:** `hpms_core`
- **Tables:** employees, salaries, payroll_batches, approval_history, notifications, contracts, contract_templates, audit_logs
- **View:** v_batch_details
- **Types:** employee_role, audit_action
- **Functions:** encrypt_text, decrypt_text, triggers, etc.

This matches what the HPMS app expects, so once restored you only need to point the app at it.

---

## 1. Restore the dump

Because the file is **custom format** (not plain SQL), use **pg_restore**, not psql.

### Option A: Create the database first, then restore into it

```bash
# Create an empty database (run as a user that can create databases, e.g. postgres)
psql -U postgres -h localhost -c "CREATE DATABASE hpms_core;"

# Restore the dump into it
pg_restore -U postgres -h localhost -d hpms_core -v hmps.sql
```

(`-v` is verbose; you can omit it.)

### Option B: Let pg_restore create the database

If your pg_restore version supports it and you have permissions:

```bash
pg_restore -U postgres -h localhost -C -d postgres hmps.sql
```

(`-C` means “create the database before restoring.” The `-d postgres` connects to the default `postgres` database so that the new `hpms_core` database can be created.)

### If you get errors

- **“database already exists”** – You already have a database named `hpms_core`. Either drop it and re-run, or restore without `-C`:

  ```bash
  pg_restore -U postgres -h localhost -d hpms_core -v hmps.sql
  ```

- **Permission denied** – Use a superuser (e.g. `postgres`) or a user with `CREATEDB` for the create step.

---

## 2. Connect the HPMS app

After the restore, set **`backend/.env`** so the app uses this database:

```env
DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/hpms_core
DATABASE_SSL=false
```

Replace `YOUR_USER` and `YOUR_PASSWORD` with a PostgreSQL user that can access the `hpms_core` database (and the `hpms_core` schema inside it). The database name must be **hpms_core** to match what you restored.

---

## 3. Verify

```bash
cd backend
node check_db.mjs
```

You should see a list of columns from `hpms_core.salaries`. Then start the app:

```bash
npm run dev
```

---

**Summary:** Restore `hmps.sql` with **pg_restore** into a database named **hpms_core**, then set **DATABASE_URL** in `backend/.env` to `postgres://USER:PASSWORD@HOST:5432/hpms_core`. No pgAdmin required.
