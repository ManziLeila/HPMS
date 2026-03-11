# Sync Database With Your Colleague

Use this guide so you and your colleague have the **same database** (schema + data + fixes).

---

## You (person with the current database)

### 1. Create the dump

```bash
cd HPMS-Alexschnages/backend
node scripts/create-dump.mjs
```

This creates `hpms_core_backup.sql` in the backend folder.

**If pg_dump is not found:** Install PostgreSQL or use pgAdmin → Right-click database → Backup. Save as `hpms_core_backup.sql` in the backend folder.

### 2. Share with your colleague

Send them:

1. **hpms_core_backup.sql** (from `backend/` folder)
2. **The whole project** (or at least the `backend/` folder with scripts)

They need the same code so they have:
- `run-fix-scripts.mjs`
- `scripts/restore-dump.mjs`
- `scripts/fix-notifications-sequence.sql`
- `scripts/fix-approved-salaries-status.sql`
- All migrations

---

## Your Colleague (person receiving the dump)

### 1. Get the files

- Receive `hpms_core_backup.sql` from you
- Place it in `HPMS-Alexschnages/backend/` (same folder as `package.json`)

### 2. Create the database (if needed)

```sql
CREATE DATABASE hpms_core;
```

### 3. Configure .env

Copy `backend/.env.example` to `backend/.env` and set:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/hpms_core
```

Use their own PostgreSQL username and password.

### 4. Run migrations (if starting fresh)

```bash
cd HPMS-Alexschnages/backend
node run-all-migrations.mjs
```

*(Skip if the dump already includes schema.)*

### 5. Restore the dump

```bash
node scripts/restore-dump.mjs
```

### 6. Run fix scripts

```bash
node run-fix-scripts.mjs
```

### 7. Start the app

```bash
npm run dev
```

---

## Quick reference

| Step | You | Colleague |
|------|-----|-----------|
| 1 | `node scripts/create-dump.mjs` | Get `hpms_core_backup.sql` + project |
| 2 | Send file + code | Put `hpms_core_backup.sql` in `backend/` |
| 3 | — | `node scripts/restore-dump.mjs` |
| 4 | — | `node run-fix-scripts.mjs` |

---

## When to re-sync

Run the dump + restore whenever you change data (employees, clients, payroll, etc.) and want your colleague to have the same.

**Code changes** (migrations, fix scripts) are shared via Git. **Data** is shared via the dump file.
