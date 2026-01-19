import { z } from 'zod';
import { decryptField } from '../services/encryptionService.js';
import salaryRepo from '../repositories/salaryRepo.js';
import { notFound } from '../utils/httpError.js';
import { generatePayslipPdf } from '../services/payslipService.js';
import { sendPayslipEmail } from '../services/emailService.js';

const salaryIdParams = z.object({
    salaryId: z.coerce.number(),
});

const decryptPayrollSnapshot = (encryptedData) => {
    try {
        return JSON.parse(decryptField('payroll_snapshot_enc', encryptedData));
    } catch (err) {
        throw new Error('Failed to decrypt payroll snapshot');
    }
};

/**
 * Send payslip email manually
 * POST /api/salaries/:salaryId/send-email
 */
export const sendPayslipEmailManually = async (req, res, next) => {
    try {
        const { salaryId } = salaryIdParams.parse(req.params);
        const { customMessage } = req.body || {}; // Get custom message from request body

        // Get salary record with employee data
        const employeeData = await salaryRepo.findByIdWithEmployee(salaryId);

        if (!employeeData) {
            throw notFound('Salary record not found');
        }

        console.log('Employee data retrieved:', {
            salary_id: employeeData.salary_id,
            full_name: employeeData.full_name,
            has_payroll_snapshot: !!employeeData.payroll_snapshot_enc,
        });

        // Decrypt payroll snapshot
        if (!employeeData.payroll_snapshot_enc) {
            console.error('Payroll snapshot missing for salary_id:', salaryId);
            throw new Error('This salary record is missing payroll data. Please create a new salary record to generate a fresh payslip.');
        }

        const payrollSnapshot = decryptPayrollSnapshot(employeeData.payroll_snapshot_enc);

        if (!payrollSnapshot) {
            throw new Error('Failed to decrypt payroll snapshot');
        }

        console.log('Payroll snapshot decrypted successfully:', {
            grossSalary: payrollSnapshot.grossSalary,
            netSalary: payrollSnapshot.netSalary,
        });

        // Decrypt bank account if available
        let bankAccountNumber = null;
        if (employeeData.account_number_enc) {
            try {
                bankAccountNumber = decryptField('account_number_enc', employeeData.account_number_enc);
            } catch (err) {
                console.error('Failed to decrypt bank account:', err.message);
            }
        }

        // Generate payslip PDF
        const pdfBuffer = await generatePayslipPdf({
            employee: {
                fullName: employeeData.full_name,
                email: employeeData.email,
                bankName: employeeData.bank_name,
                accountNumber: bankAccountNumber,
                accountHolderName: employeeData.account_holder_name,
            },
            salary: {
                payPeriod: employeeData.pay_period,
                frequency: employeeData.pay_frequency || 'monthly', // Use pay_frequency from database
                baseSalary: employeeData.base_salary,
                transportAllowance: employeeData.transport_allowance,
                housingAllowance: employeeData.housing_allowance,
                variableAllowance: employeeData.variable_allowance,
                performanceAllowance: employeeData.performance_allowance,
            },
            payrollSnapshot,
        });

        // Send email with PDF attachment
        const filename = `payslip-${employeeData.full_name.replace(/\s+/g, '-').toLowerCase()}-${employeeData.pay_period}.pdf`;

        // Calculate payment date (typically 2 business days after processing)
        const payDate = new Date(employeeData.pay_period);
        payDate.setDate(payDate.getDate() + 2);
        const formattedPayDate = payDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const emailParams = {
            employeeEmail: employeeData.email,
            employeeName: employeeData.full_name,
            employeeId: employeeData.employee_id,
            payPeriod: new Date(employeeData.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            netSalary: new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary),
            payDate: formattedPayDate,
            pdfBuffer,
            filename,
            companyName: 'HC Solutions',
            hrContact: 'HR Department',
            responseDays: '5',
            senderName: 'Payroll Team',
            jobTitle: 'Payroll Administrator',
            companyEmail: 'payroll@hcsolutions.rw',
            companyPhone: '+250 788 000 000',
            customMessage, // Pass custom message if provided
        };

        console.log('=== SEND EMAIL DEBUG ===');
        console.log('Email params:', JSON.stringify(emailParams, null, 2));
        console.log('Employee data:', {
            email: employeeData.email,
            full_name: employeeData.full_name,
            employee_id: employeeData.employee_id,
            pay_period: employeeData.pay_period,
        });

        // Validate required parameters
        const requiredParams = ['employeeEmail', 'employeeName', 'employeeId', 'payPeriod', 'payDate'];
        for (const param of requiredParams) {
            if (!emailParams[param]) {
                console.error(`Missing required parameter: ${param}`);
                throw new Error(`Missing required parameter: ${param}`);
            }
        }

        // Ensure all string parameters are actually strings
        Object.keys(emailParams).forEach(key => {
            if (emailParams[key] !== null && emailParams[key] !== undefined && typeof emailParams[key] !== 'object') {
                emailParams[key] = String(emailParams[key]);
            }
        });

        console.log('Validated email params:', emailParams);

        await sendPayslipEmail(emailParams);

        res.json({
            success: true,
            message: `Payslip email sent successfully to ${employeeData.email}`,
            sentTo: employeeData.email,
        });
    } catch (error) {
        next(error);
    }
};
