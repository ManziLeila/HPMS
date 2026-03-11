import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get Database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:keza123@localhost:5432/hpms_core';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function createPayrollBatch() {
    const client = await pool.connect();

    try {
        console.log('🔍 Searching for HR-approved salary records...\n');

        // Find salary records with HR_APPROVED status
        const salaryResult = await client.query(`
            SELECT 
                s.salary_id,
                e.full_name,
                e.email,
                s.gross_salary,
                s.hr_status
            FROM hpms_core.salaries s
            JOIN hpms_core.employees e ON s.employee_id = e.employee_id
            WHERE s.hr_status = 'HR_APPROVED'
            ORDER BY s.salary_id
            LIMIT 10
        `);

        if (salaryResult.rows.length === 0) {
            console.log('❌ No HR-approved salary records found');
            return;
        }

        console.log(`✅ Found ${salaryResult.rows.length} HR-approved employees:\n`);
        
        const salaryIds = [];
        salaryResult.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. ${row.full_name.padEnd(20)} | Salary ID: ${row.salary_id} | Gross Salary: RWF ${parseFloat(row.gross_salary).toLocaleString()}`);
            salaryIds.push(row.salary_id);
        });

        console.log(`\n📋 Creating payroll batch with ${salaryIds.length} employees...\n`);

        // Find a Finance Officer to be the creator
        const financeOfficerResult = await client.query(`
            SELECT employee_id, full_name, email
            FROM hpms_core.employees
            WHERE role = 'FinanceOfficer'
            LIMIT 1
        `);

        if (financeOfficerResult.rows.length === 0) {
            console.log('❌ No Finance Officer found in system');
            return;
        }

        const financeOfficer = financeOfficerResult.rows[0];
        console.log(`👤 Finance Officer: ${financeOfficer.full_name} (ID: ${financeOfficer.employee_id})\n`);

        // Get current month and year
        const now = new Date();
        const periodMonth = now.getMonth() + 1;
        const periodYear = now.getFullYear();

        // Create the batch
        const batchResult = await client.query(`
            INSERT INTO hpms_core.payroll_batches (
                batch_name,
                period_month,
                period_year,
                created_by,
                status,
                hr_status,
                md_status,
                total_employees,
                total_gross_salary,
                total_net_salary
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING batch_id, batch_name, created_at
        `, [
            `March 2024 Payroll - Test Batch`,
            periodMonth,
            periodYear,
            financeOfficer.employee_id,
            'PENDING',
            'PENDING',
            'PENDING',
            salaryIds.length,
            0,
            0
        ]);

        const batch = batchResult.rows[0];
        console.log(`✅ Batch created successfully!\n`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Batch ID:       #${batch.batch_id}`);
        console.log(`Batch Name:     ${batch.batch_name}`);
        console.log(`Period:         ${periodMonth}/${periodYear}`);
        console.log(`Status:         PENDING (Awaiting HR Review)`);
        console.log(`Employees:      ${salaryIds.length}`);
        console.log(`Created At:     ${batch.created_at}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Add salaries to batch
        for (const salaryId of salaryIds) {
            await client.query(`
                UPDATE hpms_core.salaries
                SET batch_id = $1
                WHERE salary_id = $2
            `, [batch.batch_id, salaryId]);
        }

        // Create approval history record
        await client.query(`
            INSERT INTO hpms_core.approval_history (
                batch_id,
                action_by,
                action_type,
                comments,
                previous_status,
                new_status
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            batch.batch_id,
            financeOfficer.employee_id,
            'SUBMIT',
            'Batch created and submitted for approval',
            null,
            'PENDING'
        ]);

        console.log(`📧 Next Steps:`);
        console.log(`   1. HR Manager reviews batch at: http://localhost:5173/hr-review`);
        console.log(`   2. Check approval dashboard: http://localhost:5173/approval-dashboard`);
        console.log(`   3. Batch status: View at /my-batches\n`);

        console.log(`🎯 What Happens Next:`);
        console.log(`   • HR Manager will review salary records`);
        console.log(`   • HR can approve or reject the batch`);
        console.log(`   • If approved, goes to MD for final approval`);
        console.log(`   • If MD approves, Finance Officer can send to bank`);
        console.log(`   • Payslips automatically sent to employees\n`);

    } catch (error) {
        console.error('❌ Error creating batch:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createPayrollBatch();
