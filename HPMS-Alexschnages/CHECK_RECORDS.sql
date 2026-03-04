-- Check if any salary records exist in the database
SELECT 
    s.salary_id,
    s.employee_id,
    s.pay_period,
    s.pay_frequency,
    s.gross_salary,
    s.net_paid,
    s.created_at,
    e.full_name,
    e.email
FROM hpms_core.salaries s
LEFT JOIN hpms_core.employees e ON s.employee_id = e.employee_id
ORDER BY s.created_at DESC
LIMIT 10;

-- Also check if any employees exist
SELECT employee_id, full_name, email, created_at
FROM hpms_core.employees
ORDER BY created_at DESC
LIMIT 10;
