-- Check the actual salary record details
SELECT 
    s.salary_id,
    s.employee_id,
    s.pay_period,
    s.pay_frequency,
    TO_CHAR(s.pay_period, 'YYYY-MM') as period_formatted,
    EXTRACT(YEAR FROM s.pay_period) as year,
    EXTRACT(MONTH FROM s.pay_period) as month,
    s.gross_salary,
    s.net_paid,
    s.created_at,
    e.full_name,
    e.email
FROM hpms_core.salaries s
LEFT JOIN hpms_core.employees e ON s.employee_id = e.employee_id;
