-- Check if salary records have encrypted data
SELECT 
    s.salary_id,
    s.employee_id,
    s.pay_period,
    s.gross_salary,
    s.net_paid,
    -- Check if encrypted fields exist
    CASE WHEN s.basic_salary_enc IS NULL THEN 'MISSING' ELSE 'EXISTS' END as basic_enc_status,
    CASE WHEN s.transport_allow_enc IS NULL THEN 'MISSING' ELSE 'EXISTS' END as transport_enc_status,
    CASE WHEN s.housing_allow_enc IS NULL THEN 'MISSING' ELSE 'EXISTS' END as housing_enc_status,
    CASE WHEN s.performance_allow_enc IS NULL THEN 'MISSING' ELSE 'EXISTS' END as performance_enc_status,
    e.full_name,
    e.email
FROM hpms_core.salaries s
LEFT JOIN hpms_core.employees e ON s.employee_id = e.employee_id
ORDER BY s.created_at DESC
LIMIT 5;
