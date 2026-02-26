import payrollBatchRepo from '../repositories/payrollBatchRepo.js';
import approvalHistoryRepo from '../repositories/approvalHistoryRepo.js';
import notificationService from './notificationService.js';
import { BATCH_STATUS, APPROVAL_ACTIONS } from '../constants/roles.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';

class PayrollBatchService {
    // Create a new payroll batch
    async createBatch({ batchName, periodMonth, periodYear, createdBy, salaryIds }) {
        // Validate that salaries exist and aren't already in a batch
        if (!salaryIds || salaryIds.length === 0) {
            throw badRequest('At least one salary must be included in the batch');
        }

        // Create the batch
        const batch = await payrollBatchRepo.create({
            batchName,
            periodMonth,
            periodYear,
            createdBy,
        });

        // Add salaries to the batch
        await payrollBatchRepo.addSalariesToBatch(batch.batch_id, salaryIds);

        // Log the action
        await approvalHistoryRepo.create({
            batchId: batch.batch_id,
            actionBy: createdBy,
            actionType: APPROVAL_ACTIONS.SUBMIT,
            comments: 'Batch created and submitted for approval',
            previousStatus: null,
            newStatus: BATCH_STATUS.PENDING,
        });

        // Notify HR managers
        await notificationService.notifyHRManagers({
            type: 'PAYROLL_SUBMITTED',
            batchId: batch.batch_id,
            batchName: batch.batch_name,
            periodMonth: batch.period_month,
            periodYear: batch.period_year,
        });

        return this.getBatchById(batch.batch_id);
    }

    // Get batch by ID with full details
    async getBatchById(batchId) {
        const batch = await payrollBatchRepo.getById(batchId);
        if (!batch) {
            throw notFound('Batch not found');
        }

        // Get salaries in the batch
        const salaries = await payrollBatchRepo.getSalariesInBatch(batchId);

        // Get approval history
        const history = await approvalHistoryRepo.getByBatch(batchId);

        return {
            ...batch,
            salaries,
            history,
        };
    }

    // Get batches for Finance Officer
    async getMyBatches(userId, limit, offset) {
        const batches = await payrollBatchRepo.getByCreator(userId, limit, offset);
        const stats = await payrollBatchRepo.getBatchStats(userId, 'FinanceOfficer');

        return { batches, stats };
    }

    // Get pending batches for HR review
    async getPendingForHR() {
        return await payrollBatchRepo.getPendingForHR();
    }

    // Get pending batches for MD review
    async getPendingForMD() {
        return await payrollBatchRepo.getPendingForMD();
    }

    // HR Review (Approve/Reject)
    async hrReview({ batchId, reviewedBy, action, comments, ipAddress, userAgent }) {
        const batch = await payrollBatchRepo.getById(batchId);

        if (!batch) {
            throw notFound('Batch not found');
        }

        if (batch.status !== BATCH_STATUS.PENDING) {
            throw badRequest(`Batch cannot be reviewed. Current status: ${batch.status}`);
        }

        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const previousStatus = batch.status;

        // Update batch
        const updatedBatch = await payrollBatchRepo.updateHRReview({
            batchId,
            reviewedBy,
            status,
            comments,
        });

        // Log the action
        await approvalHistoryRepo.create({
            batchId,
            actionBy: reviewedBy,
            actionType: action === 'APPROVE' ? APPROVAL_ACTIONS.HR_APPROVE : APPROVAL_ACTIONS.HR_REJECT,
            comments,
            previousStatus,
            newStatus: updatedBatch.status,
            ipAddress,
            userAgent,
        });

        // Send notifications
        if (action === 'APPROVE') {
            // Notify MD for final approval
            await notificationService.notifyManagingDirector({
                type: 'PAYROLL_HR_APPROVED',
                batchId,
                batchName: batch.batch_name,
                periodMonth: batch.period_month,
                periodYear: batch.period_year,
                reviewerName: updatedBatch.hr_reviewed_by_name,
            });

            // Notify Finance Officer
            await notificationService.notifyUser({
                userId: batch.created_by,
                type: 'PAYROLL_HR_APPROVED',
                title: 'Payroll Approved by HR',
                message: `Your payroll batch "${batch.batch_name}" has been approved by HR and is awaiting final approval from Managing Director.`,
                batchId,
                priority: 'NORMAL',
            });
        } else {
            // Notify Finance Officer of rejection
            await notificationService.notifyUser({
                userId: batch.created_by,
                type: 'PAYROLL_HR_REJECTED',
                title: 'Payroll Rejected by HR',
                message: `Your payroll batch "${batch.batch_name}" has been rejected by HR. Reason: ${comments || 'No reason provided'}`,
                batchId,
                priority: 'HIGH',
            });
        }

        return this.getBatchById(batchId);
    }

    // MD Review (Final Approve/Reject)
    async mdReview({ batchId, reviewedBy, action, comments, ipAddress, userAgent }) {
        const batch = await payrollBatchRepo.getById(batchId);

        if (!batch) {
            throw notFound('Batch not found');
        }

        if (batch.status !== BATCH_STATUS.HR_APPROVED) {
            throw badRequest(`Batch cannot be reviewed. Current status: ${batch.status}`);
        }

        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const previousStatus = batch.status;

        // Update batch
        const updatedBatch = await payrollBatchRepo.updateMDReview({
            batchId,
            reviewedBy,
            status,
            comments,
        });

        // Log the action
        await approvalHistoryRepo.create({
            batchId,
            actionBy: reviewedBy,
            actionType: action === 'APPROVE' ? APPROVAL_ACTIONS.MD_APPROVE : APPROVAL_ACTIONS.MD_REJECT,
            comments,
            previousStatus,
            newStatus: updatedBatch.status,
            ipAddress,
            userAgent,
        });

        // Send notifications
        if (action === 'APPROVE') {
            // Notify Finance Officer - ready to send
            await notificationService.notifyUser({
                userId: batch.created_by,
                type: 'PAYROLL_MD_APPROVED',
                title: 'Payroll Fully Approved!',
                message: `Your payroll batch "${batch.batch_name}" has been fully approved by Managing Director. You can now send it to the bank.`,
                batchId,
                priority: 'HIGH',
                actionUrl: `/bulk-upload`,
            });

            // Notify HR Manager
            await notificationService.notifyUser({
                userId: batch.hr_reviewed_by,
                type: 'PAYROLL_MD_APPROVED',
                title: 'Payroll Fully Approved',
                message: `Payroll batch "${batch.batch_name}" has been fully approved by Managing Director.`,
                batchId,
                priority: 'NORMAL',
            });
        } else {
            // Notify Finance Officer of rejection
            await notificationService.notifyUser({
                userId: batch.created_by,
                type: 'PAYROLL_MD_REJECTED',
                title: 'Payroll Rejected by Managing Director',
                message: `Your payroll batch "${batch.batch_name}" has been rejected by Managing Director. Reason: ${comments || 'No reason provided'}`,
                batchId,
                priority: 'URGENT',
            });

            // Notify HR Manager
            await notificationService.notifyUser({
                userId: batch.hr_reviewed_by,
                type: 'PAYROLL_MD_REJECTED',
                title: 'Payroll Rejected by MD',
                message: `Payroll batch "${batch.batch_name}" was rejected by Managing Director.`,
                batchId,
                priority: 'NORMAL',
            });
        }

        return this.getBatchById(batchId);
    }

    // Send to Bank
    async sendToBank({ batchId, sentBy, ipAddress, userAgent }) {
        const batch = await payrollBatchRepo.getById(batchId);

        if (!batch) {
            throw notFound('Batch not found');
        }

        if (batch.status !== BATCH_STATUS.MD_APPROVED) {
            throw badRequest(`Batch cannot be sent to bank. Current status: ${batch.status}. Must be MD_APPROVED.`);
        }

        const previousStatus = batch.status;

        // Mark as sent
        const updatedBatch = await payrollBatchRepo.markAsSent({
            batchId,
            sentBy,
        });

        // Log the action
        await approvalHistoryRepo.create({
            batchId,
            actionBy: sentBy,
            actionType: APPROVAL_ACTIONS.SEND_TO_BANK,
            comments: 'Payroll sent to bank',
            previousStatus,
            newStatus: BATCH_STATUS.SENT_TO_BANK,
            ipAddress,
            userAgent,
        });

        // Notify all stakeholders
        const notifications = [
            {
                userId: batch.created_by,
                type: 'PAYROLL_SENT_TO_BANK',
                title: 'Payroll Sent to Bank',
                message: `Payroll batch "${batch.batch_name}" has been successfully sent to the bank.`,
                batchId,
                priority: 'HIGH',
            },
        ];

        if (batch.hr_reviewed_by) {
            notifications.push({
                userId: batch.hr_reviewed_by,
                type: 'PAYROLL_SENT_TO_BANK',
                title: 'Payroll Sent to Bank',
                message: `Payroll batch "${batch.batch_name}" has been sent to the bank.`,
                batchId,
                priority: 'NORMAL',
            });
        }

        if (batch.md_reviewed_by) {
            notifications.push({
                userId: batch.md_reviewed_by,
                type: 'PAYROLL_SENT_TO_BANK',
                title: 'Payroll Sent to Bank',
                message: `Payroll batch "${batch.batch_name}" has been sent to the bank.`,
                batchId,
                priority: 'NORMAL',
            });
        }

        await notificationService.createBulk(notifications);

        await this.sendPayslipsForBatch(batchId, sentBy);

        return this.getBatchById(batchId);
    }

    // Send payslip emails for a batch
    async sendPayslipsForBatch(batchId, userId) {
        const salaries = await payrollBatchRepo.getSalariesInBatch(batchId);
        const { sendPayslipEmail } = await import('./emailService.js');
        const { generatePayslipPdf } = await import('./payslipService.js');
        const { decryptField } = await import('./encryptionService.js');
        const fileStorageService = (await import('./fileStorageService.js')).default;

        const results = { total: salaries.length, success: 0, failed: 0, errors: [] };

        for (const record of salaries) {
            try {
                // 1. Decrypt payroll snapshot
                let payrollSnapshot = null;
                if (record.payroll_snapshot_enc) {
                    try {
                        const raw = decryptField('payroll_snapshot_enc', record.payroll_snapshot_enc);
                        payrollSnapshot = JSON.parse(raw);
                    } catch (e) {
                        console.error('Failed to decrypt snapshot for', record.email, e);
                    }
                }

                if (!payrollSnapshot) {
                    results.failed++;
                    results.errors.push(`Missing payroll data for ${record.full_name}`);
                    continue;
                }

                // 2. Decrypt bank account
                let bankAccountNumber = null;
                if (record.account_number_enc) {
                    try {
                        bankAccountNumber = decryptField('account_number_enc', record.account_number_enc);
                    } catch (e) {
                        console.warn('Bank account decryption failed for', record.full_name);
                    }
                }

                // 3. Generate PDF
                const pdfBuffer = await generatePayslipPdf({
                    employee: {
                        fullName: record.full_name,
                        email: record.email,
                        bankName: record.bank_name,
                        accountNumber: bankAccountNumber,
                        accountHolderName: record.account_holder_name,
                    },
                    salary: {
                        payPeriod: record.pay_period,
                        frequency: record.pay_frequency || 'monthly',
                        baseSalary: record.base_salary,
                        transportAllowance: record.transport_allowance,
                        housingAllowance: record.housing_allowance,
                        variableAllowance: record.variable_allowance,
                        performanceAllowance: record.performance_allowance,
                    },
                    payrollSnapshot,
                });

                const filename = `payslip-${record.full_name.replace(/\s+/g, '-').toLowerCase()}-${record.pay_period}.pdf`;
                const payDate = new Date(record.pay_period);
                payDate.setDate(payDate.getDate() + 2);

                // 4. Save to filesystem (organized by months)
                await fileStorageService.savePayslip(pdfBuffer, filename, record.pay_period);

                // 5. Send Email
                await sendPayslipEmail({
                    employeeEmail: record.email,
                    employeeName: record.full_name,
                    employeeId: record.employee_id,
                    payPeriod: new Date(record.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                    netSalary: new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary),
                    payDate: payDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    pdfBuffer,
                    filename,
                    companyName: 'HC Solutions',
                    senderName: 'Payroll Team',
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Failed for ${record.full_name}: ${err.message}`);
                console.error('Failed to send payslip email for', record.email, err);
            }
        }
        return results;
    }

    // Get dashboard stats
    async getDashboardStats(userId, userRole) {
        return await payrollBatchRepo.getBatchStats(userId, userRole);
    }

    // Delete a batch (only if pending)
    async deleteBatch(batchId, userId) {
        const batch = await payrollBatchRepo.getById(batchId);

        if (!batch) {
            throw notFound('Batch not found');
        }

        if (batch.created_by !== userId) {
            throw forbidden('You can only delete your own batches');
        }

        if (batch.status !== BATCH_STATUS.PENDING) {
            throw badRequest('Only pending batches can be deleted');
        }

        return await payrollBatchRepo.delete(batchId);
    }
}

export default new PayrollBatchService();
