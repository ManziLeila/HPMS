# Restore latest.sql (Postgres 17 dump) on your Mac

Your co-developer’s dump was made with **PostgreSQL 17**. Your Mac was using **PostgreSQL 12** on port 5432, which doesn’t support that format or some SQL in the dump. These steps switch to Postgres 17 for `hpms_core` and restore the file.

## 1. Stop Postgres 12 and start Postgres 17

In Terminal:

```bash
brew services stop postgresql@12
brew services start postgresql@17
```

Postgres 17 will now listen on **port 5432** (same as before).

## 2. Create an empty database and restore (no --clean)

```bash
# Create database (localhost uses trust auth, no password needed)
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U Bujjnfo -d postgres -c "DROP DATABASE IF EXISTS hpms_core;"
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U Bujjnfo -d postgres -c "CREATE DATABASE hpms_core;"

# Restore the dump
/opt/homebrew/opt/postgresql@17/bin/pg_restore -U Bujjnfo -h localhost -d hpms_core -v /Users/Bujjnfo/Downloads/latest.sql
```

If `psql` asks for a password, your Postgres 17 may have a different auth setup; use the same password you use in pgAdmin for user `Bujjnfo`. If it says "role Bujjnfo does not exist", create it first:

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U Bujjnfo -d postgres -c "CREATE USER Bujjnfo WITH SUPERUSER CREATEDB LOGIN;"
```

(On a fresh Homebrew install, the superuser is usually your Mac user `Bujjnfo`, so the CREATE USER may fail with "already exists" — that’s fine.)

## 3. Set password for the app (if needed)

If your app uses a password in `DATABASE_URL`, set it on Postgres 17:

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U Bujjnfo -d postgres -c "ALTER USER Bujjnfo PASSWORD 'Hpms@250';"
```

(Use the same password you have in `backend/.env` for `DATABASE_URL`.)

## 4. Keep using your app as before

`backend/.env` already points to `localhost:5432/hpms_core`. After the steps above, that connects to **Postgres 17** with the restored data. Restart the backend and use the app as usual.

## 5. pgAdmin

In pgAdmin, keep connecting to **localhost:5432**. You’ll now be talking to Postgres 17 and will see the restored `hpms_core` data.

## If you want Postgres 12 back later

```bash
brew services stop postgresql@17
brew services start postgresql@12
```

Then your app and pgAdmin would use Postgres 12 again (and you’d need to restore a dump that’s compatible with 12 if you want that data back).
