# Quick Database Check

Run this query in pgAdmin to see what's in the salaries table:

```sql
SELECT 
    salary_id,
    employee_id,
    pay_period,
    basic_salary_enc IS NULL as basic_is_null,
    transport_allow_enc IS NULL as transport_is_null,
    housing_allow_enc IS NULL as housing_is_null,
    gross_salary,
    net_paid
FROM hpms_core.salaries
WHERE salary_id = 1;
```

This will tell us if the encrypted fields are NULL or have values.

If they're NULL, that's the problem - the salary creation isn't encrypting the values properly.
