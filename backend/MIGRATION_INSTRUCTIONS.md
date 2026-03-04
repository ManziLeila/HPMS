# Database Migration Required

## Issue Found

The encrypted salary columns are **missing from the database schema**. This is why payslips show RF 0 for all values - the encrypted data was never stored in the first place!

## Missing Columns

The following columns need to be added to the `hpms_core.salaries` table:
- `basic_salary_enc` (TEXT)
- `transport_allow_enc` (TEXT)
- `housing_allow_enc` (TEXT)
- `variable_allow_enc` (TEXT)
- `performance_allow_enc` (TEXT)
- `net_paid_enc` (TEXT)
- `include_medical` (BOOLEAN)

## Migration Script Created

I've created a migration script at:
`backend/scripts/migration-encrypted-salary-fields.sql`

## How to Run the Migration

### Option 1: Using pgAdmin (Recommended)
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Navigate to your `hpms_core` database
4. Open the Query Tool (Tools → Query Tool)
5. Open the migration file: `backend/scripts/migration-encrypted-salary-fields.sql`
6. Click Execute (F5)
7. Verify the output shows all columns were added successfully

### Option 2: Using psql Command Line
```bash
psql -U postgres -d hpms_core -f backend/scripts/migration-encrypted-salary-fields.sql
```

## After Migration

1. **Restart the backend server** (it should auto-restart if using `npm run dev`)
2. **Create a new salary record** using the Employee Form
3. **Download the payslip** - it should now show correct values
4. **Old salary records** will still show zeros (they don't have encrypted data)

## Next Steps

After running the migration, we'll:
1. Test that new salary records store encrypted data correctly
2. Verify payslips show correct values
3. Then proceed with adding CRUD functionality
