import { z } from 'zod';
import { decryptField } from '../services/encryptionService.js';
import salaryRepo from '../repositories/salaryRepo.js';
import { notFound } from '../utils/httpError.js';
import { generatePayslipPdf } from '../services/payslipService.js';
import { sendPayslipEmail } from '../services/emailService.js';
import smsService from '../services/smsService.js';
import fileStorageService from '../services/fileStorageService.js';

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
 * Send payslip email manually.
 * Payslip emails are only allowed after the full approval chain and after money has been sent to the bank,
 * so the email confirms payment was sent (not before HR/MD approve).
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

        // Only allow sending after payroll has been sent to the bank (everyone has approved and money sent)
        if (employeeData.hr_status !== 'SENT_TO_BANK') {
            return res.status(403).json({
                success: false,
                message: 'Payslip emails can only be sent after the payroll has been sent to the bank (HR and MD approved, and Finance has marked "Sent to bank").',
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

        const periodStr = employeeData.pay_period ? new Date(employeeData.pay_period).toISOString().slice(0, 10) : 'unknown';
        const safeName = (employeeData.full_name || 'employee').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        const filename = `payslip-${safeName}-${periodStr}.pdf`;

        // Save to filesystem (organized by months)
        await fileStorageService.savePayslip(pdfBuffer, filename, employeeData.pay_period);

        // Calculate payment date (display only)
        const payDate = new Date(employeeData.pay_period);
        payDate.setDate(payDate.getDate() + 2);
        const formattedPayDate = payDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // ── 5. Delivery (Email VS SMS) ──────────────────────
        const formattedPayPeriod = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary);
        const displayMonth = new Date(employeeData.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        if (employeeData.email) {
            // Normal behavior — Email with attachment
            const emailResult = await sendPayslipEmail({
                employeeEmail: employeeData.email,
                employeeName: employeeData.full_name,
                employeeId: employeeData.employee_id,
                payPeriod: displayMonth,
                netSalary: formattedPayPeriod,
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
                method: 'EMAIL'
            });
        } else if (employeeData.phone_number) {
            // Fallback behavior — SMS
            console.log(`[SMS FALLBACK] Employee ${employeeData.full_name} has no email. Sending SMS to ${employeeData.phone_number}`);

            const smsResult = await smsService.sendPayslipSms({
                phoneNumber: employeeData.phone_number,
                employeeName: employeeData.full_name,
                netSalary: formattedPayPeriod,
                payPeriod: displayMonth
            });

            if (!smsResult.success) {
                throw new Error(smsResult.error || 'Failed to send SMS');
            }

            res.json({
                success: true,
                message: `Payslip summary sent via SMS to ${employeeData.phone_number}`,
                sentTo: employeeData.phone_number,
                method: 'SMS'
            });
        } else {
            // Nowhere to send!
            return res.status(400).json({
                success: false,
                message: "This employee has neither an email nor a phone number. Cannot deliver payslip notification."
            });
        }
    } catch (error) {
        next(error);
    }
};
