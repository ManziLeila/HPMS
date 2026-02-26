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
        const { customMessage } = req.body || {};

        // Get salary record with employee data
        const employeeData = await salaryRepo.findByIdWithEmployee(salaryId);

        if (!employeeData) {
            throw notFound('Salary record not found');
        }

        // 🚨 Security/Workflow check: Only allow sending if HR has approved
        if (employeeData.hr_status !== 'HR_APPROVED' && employeeData.hr_status !== 'MD_APPROVED' && employeeData.hr_status !== 'SENT_TO_BANK') {
            return res.status(403).json({
                success: false,
                message: `Cannot send payslip. Current status is ${employeeData.hr_status || 'PENDING'}. Record must be HR Approved first.`
            });
        }

        console.log('Employee data retrieved for email:', {
            salary_id: employeeData.salary_id,
            full_name: employeeData.full_name,
            status: employeeData.hr_status
        });

        // Decrypt payroll snapshot
        if (!employeeData.payroll_snapshot_enc) {
            throw new Error('This salary record is missing payroll data snapshot.');
        }

        const payrollSnapshot = decryptPayrollSnapshot(employeeData.payroll_snapshot_enc);

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
                frequency: employeeData.pay_frequency || 'monthly',
                baseSalary: employeeData.base_salary,
                transportAllowance: employeeData.transport_allowance,
                housingAllowance: employeeData.housing_allowance,
                variableAllowance: employeeData.variable_allowance,
                performanceAllowance: employeeData.performance_allowance,
            },
            payrollSnapshot,
        });

        const filename = `payslip-${employeeData.full_name.replace(/\s+/g, '-').toLowerCase()}-${employeeData.pay_period}.pdf`;

        // Calculate payment date (display only)
        const payDate = new Date(employeeData.pay_period);
        payDate.setDate(payDate.getDate() + 2);
        const formattedPayDate = payDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const emailResult = await sendPayslipEmail({
            employeeEmail: employeeData.email,
            employeeName: employeeData.full_name,
            employeeId: employeeData.employee_id,
            payPeriod: new Date(employeeData.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            netSalary: new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary),
            payDate: formattedPayDate,
            pdfBuffer,
            filename,
            companyName: 'HC Solutions',
            senderName: req.user?.email || 'Payroll Team',
            customMessage,
        });

        if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send email');
        }

        res.json({
            success: true,
            message: `Payslip email sent successfully to ${employeeData.email}`,
            sentTo: employeeData.email,
        });
    } catch (error) {
        next(error);
    }
};
