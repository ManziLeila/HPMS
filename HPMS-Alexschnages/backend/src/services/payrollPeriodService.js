import payrollPeriodRepo from '../repositories/payrollPeriodRepo.js';
import approvalHistoryRepo from '../repositories/approvalHistoryRepo.js';
import notificationService from './notificationService.js';
import { decryptField } from './encryptionService.js';
import { APPROVAL_ACTIONS } from '../constants/roles.js';
import { badRequest, notFound } from '../utils/httpError.js';
import nodemailer from 'nodemailer';

// ── Email transport ──────────────────────────────────────────────────────────

let _transporter = null;
const getTransporter = () => {
    if (!_transporter) {
        const cfg = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        };
        if (cfg.auth.user && cfg.auth.pass) {
            _transporter = nodemailer.createTransport(cfg);
        }
    }
    return _transporter;
};

const sendEmail = async (to, subject, html) => {
    try {
        const t = getTransporter();
        if (!t) { console.warn('SMTP not configured — email not sent:', subject); return; }
        const from = `"${process.env.SMTP_FROM_NAME || 'HC Solutions Payroll'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;
        await t.sendMail({ from, to, subject, html });
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

const monthName = (m) =>
    ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1] || m;

// ── Service ──────────────────────────────────────────────────────────────────

class PayrollPeriodService {

    // ── Finance Officer: submit a client+month group for HR review ───────────
    async submitPeriod({ clientId, periodMonth, periodYear, submittedBy, ipAddress, userAgent }) {
        // Prevent duplicate submissions
        const existing = await payrollPeriodRepo.findByKey(clientId, periodMonth, periodYear);
        if (existing) {
            throw badRequest(
                `A payroll period for this client and ${monthName(periodMonth)} ${periodYear} has already been submitted (status: ${existing.status}).`
            );
        }

        const period = await payrollPeriodRepo.create({ clientId, periodMonth, periodYear, submittedBy });

        // Link all matching salary records to this period
        const linked = await payrollPeriodRepo.linkSalaries(period.period_id, clientId, periodMonth, periodYear);

        if (linked === 0) {
            // Nothing to link — remove the just-created period and tell the user
            // (no salaries exist yet for this client+month)
            // We don't delete here — the caller can handle this; just warn
            console.warn(`[PayrollPeriod] No salary records found to link for period ${period.period_id}`);
        }

        // Notify all HR managers
        await notificationService.notifyHRManagers({
            type: 'PAYROLL_SUBMITTED',
            batchId: period.period_id,      // re-using field for legacy compat
            batchName: `${period.client_name || 'Client'} — ${monthName(periodMonth)} ${periodYear}`,
            periodMonth,
            periodYear,
        });

        const hrManagers = await payrollPeriodRepo.getHRManagers();
        for (const hr of hrManagers) {
            await sendEmail(
                hr.email,
                `📋 Payroll Ready for Review — ${monthName(periodMonth)} ${periodYear}`,
                `<p>A payroll submission for <strong>${period.client_name || 'a client'}</strong> (${monthName(periodMonth)} ${periodYear}) has been submitted and is ready for your review.</p>
                 <p>Please log in to the HR Review page to examine and approve or reject the records.</p>`
            );
        }

        await approvalHistoryRepo.create({
            periodId: period.period_id,
            actionBy: submittedBy,
            actionType: 'SUBMIT',
            comments: null,
            previousStatus: null,
            newStatus: 'SUBMITTED',
            ipAddress,
            userAgent,
        });

        return await payrollPeriodRepo.getById(period.period_id);
    }

    // ── HR: approve or reject a period ──────────────────────────────────────
    async hrReview({ periodId, reviewedBy, action, comments, ipAddress, userAgent }) {
        const period = await payrollPeriodRepo.getById(periodId);
        if (!period) throw notFound('Payroll period not found');
        if (period.status !== 'SUBMITTED') {
            throw badRequest(`Period cannot be reviewed. Current status: ${period.status}`);
        }

        const newStatus = action === 'APPROVE' ? 'HR_APPROVED' : 'REJECTED';

        const updated = await payrollPeriodRepo.updateHRReview({
            periodId,
            reviewedBy,
            status: newStatus,
            comments,
        });

        await approvalHistoryRepo.create({
            periodId,
            actionBy: reviewedBy,
            actionType: action === 'APPROVE' ? APPROVAL_ACTIONS.HR_APPROVE : APPROVAL_ACTIONS.HR_REJECT,
            comments,
            previousStatus: 'SUBMITTED',
            newStatus,
            ipAddress,
            userAgent,
        });

        const periodLabel = `${period.client_name} — ${monthName(period.period_month)} ${period.period_year}`;

        if (action === 'APPROVE') {
            // Notify MD for final approval
            await notificationService.notifyManagingDirector({
                type: 'PAYROLL_HR_APPROVED',
                batchId: periodId,
                batchName: periodLabel,
                periodMonth: period.period_month,
                periodYear: period.period_year,
                reviewerName: updated.hr_reviewed_by_name,
            });

            // Email MD
            const mds = await payrollPeriodRepo.getMDManagers();
            for (const md of mds) {
                await sendEmail(
                    md.email,
                    `✅ Payroll HR-Approved — ${periodLabel}`,
                    `<p>The payroll for <strong>${period.client_name}</strong> (${monthName(period.period_month)} ${period.period_year}) has been verified by HR and is awaiting your final approval.</p>`
                );
            }

            // Notify submitting Finance Officer
            if (period.submitted_by) {
                await notificationService.notifyUser({
                    userId: period.submitted_by,
                    type: 'PAYROLL_HR_APPROVED',
                    title: 'Payroll Verified by HR',
                    message: `The payroll for ${periodLabel} has been verified by HR and is now with the Managing Director for final approval.`,
                    batchId: periodId,
                    priority: 'NORMAL',
                });
            }
        } else {
            // Notify Finance Officer of rejection
            if (period.submitted_by) {
                await notificationService.notifyUser({
                    userId: period.submitted_by,
                    type: 'PAYROLL_HR_REJECTED',
                    title: 'Payroll Rejected by HR',
                    message: `The payroll for ${periodLabel} was rejected by HR. Reason: ${comments || 'No reason provided'}.`,
                    batchId: periodId,
                    priority: 'HIGH',
                });
            }

            // Email Finance Officers
            const fos = await payrollPeriodRepo.getFinanceOfficers();
            for (const fo of fos) {
                await sendEmail(
                    fo.email,
                    `❌ Payroll Rejected by HR — ${periodLabel}`,
                    `<p>The payroll for <strong>${period.client_name}</strong> (${monthName(period.period_month)} ${period.period_year}) was rejected by HR.</p>
                     <p><strong>Reason:</strong> ${comments || 'No reason provided'}</p>`
                );
            }
        }

        return await payrollPeriodRepo.getById(periodId);
    }

    // ── MD: final approve or reject ──────────────────────────────────────────
    async mdReview({ periodId, reviewedBy, action, comments, ipAddress, userAgent }) {
        const period = await payrollPeriodRepo.getById(periodId);
        if (!period) throw notFound('Payroll period not found');
        if (period.status !== 'HR_APPROVED') {
            throw badRequest(`Period cannot be reviewed. Current status: ${period.status}`);
        }

        const newStatus = action === 'APPROVE' ? 'MD_APPROVED' : 'REJECTED';

        const updated = await payrollPeriodRepo.updateMDReview({
            periodId,
            reviewedBy,
            status: newStatus,
            comments,
        });

        await approvalHistoryRepo.create({
            periodId,
            actionBy: reviewedBy,
            actionType: action === 'APPROVE' ? APPROVAL_ACTIONS.MD_APPROVE : APPROVAL_ACTIONS.MD_REJECT,
            comments,
            previousStatus: 'HR_APPROVED',
            newStatus,
            ipAddress,
            userAgent,
        });

        const periodLabel = `${period.client_name} — ${monthName(period.period_month)} ${period.period_year}`;

        if (action === 'APPROVE') {
            // Notify Finance Officers to process payroll
            const fos = await payrollPeriodRepo.getFinanceOfficers();
            for (const fo of fos) {
                await notificationService.notifyUser({
                    userId: fo.user_id,
                    type: 'PAYROLL_MD_APPROVED',
                    title: 'Payroll Approved — Ready to Process',
                    message: `The payroll for ${periodLabel} has been fully approved by the MD. You can now send to bank and distribute payslips.`,
                    batchId: periodId,
                    priority: 'HIGH',
                    actionUrl: '/payroll-periods',
                });

                await sendEmail(
                    fo.email,
                    `🎉 Payroll Approved — ${periodLabel}`,
                    `<p>The payroll for <strong>${period.client_name}</strong> (${monthName(period.period_month)} ${period.period_year}) has received final approval from the Managing Director.</p>
                     <p>Please log in to process the bank transfer and send payslip emails.</p>`
                );
            }
        } else {
            // Notify Finance Officers of rejection
            const fos = await payrollPeriodRepo.getFinanceOfficers();
            for (const fo of fos) {
                await notificationService.notifyUser({
                    userId: fo.user_id,
                    type: 'PAYROLL_MD_REJECTED',
                    title: 'Payroll Rejected by MD',
                    message: `The payroll for ${periodLabel} was rejected by the MD. Reason: ${comments || 'No reason provided'}.`,
                    batchId: periodId,
                    priority: 'HIGH',
                });
            }
        }

        return await payrollPeriodRepo.getById(periodId);
    }

    // ── Finance Officer: mark sent to bank ───────────────────────────────────
    async sendToBank({ periodId, userId, ipAddress, userAgent }) {
        const period = await payrollPeriodRepo.getById(periodId);
        if (!period) throw notFound('Payroll period not found');
        if (period.status !== 'MD_APPROVED') {
            throw badRequest('Only MD-approved periods can be sent to bank');
        }

        const updated = await payrollPeriodRepo.markSentToBank(periodId, userId);

        await approvalHistoryRepo.create({
            periodId,
            actionBy: userId,
            actionType: 'SENT_TO_BANK',
            comments: null,
            previousStatus: 'MD_APPROVED',
            newStatus: 'SENT_TO_BANK',
            ipAddress,
            userAgent,
        });

        return updated;
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    async getById(periodId) {
        const period = await payrollPeriodRepo.getById(periodId);
        if (!period) throw notFound('Payroll period not found');
        return period;
    }

    async getSalaryIdsForPeriod(periodId) {
        const salaries = await payrollPeriodRepo.getSalaries(periodId);
        return salaries.map((s) => s.salary_id);
    }

    async getWithSalaries(periodId) {
        const period = await payrollPeriodRepo.getById(periodId);
        if (!period) throw notFound('Payroll period not found');
        const rawSalaries = await payrollPeriodRepo.getSalaries(periodId);
        // Decrypt payroll snapshot for each salary so HR/MD can view full details
        const salaries = rawSalaries.map((row) => {
            const { payroll_snapshot_enc, net_paid_enc, ...rest } = row;
            let snapshot = null;
            let net_salary = null;
            try {
                if (payroll_snapshot_enc) {
                    const raw = decryptField('payroll_snapshot_enc', payroll_snapshot_enc);
                    snapshot = raw ? JSON.parse(raw) : null;
                    net_salary = snapshot?.netPaidToBank ?? snapshot?.netSalary ?? null;
                }
                if (net_salary == null && net_paid_enc) {
                    net_salary = decryptField('net_paid_enc', net_paid_enc);
                }
            } catch (err) {
                console.warn(`[getWithSalaries] Decrypt failed for salary ${row.salary_id}:`, err.message);
            }
            return {
                ...rest,
                net_salary: net_salary != null ? Number(net_salary) : null,
                snapshot, // Full breakdown: basicSalary, allowances, paye, rssbEePension, etc.
            };
        });
        return { ...period, salaries };
    }

    async list(filters = {}) {
        return await payrollPeriodRepo.list(filters);
    }

    async getPendingForHR() {
        return await payrollPeriodRepo.list({ status: 'SUBMITTED' });
    }

    async getPendingForMD() {
        return await payrollPeriodRepo.list({ status: 'HR_APPROVED' });
    }

    async getHRApproved() {
        return await payrollPeriodRepo.list({ status: 'HR_APPROVED' });
    }

    async getMyPeriods(userId) {
        return await payrollPeriodRepo.listBySubmitter(userId);
    }

    async getReadyToSubmit() {
        return await payrollPeriodRepo.getReadyToSubmit();
    }

    // For Approval Dashboard: return periods relevant to each role
    async getDashboardPeriods(userId, role) {
        if (role === 'FinanceOfficer') {
            return await payrollPeriodRepo.listBySubmitter(userId);
        }
        if (role === 'HR') {
            return await payrollPeriodRepo.list({ statuses: ['SUBMITTED', 'HR_APPROVED'] });
        }
        if (role === 'ManagingDirector') {
            return await payrollPeriodRepo.list({ statuses: ['HR_APPROVED', 'MD_APPROVED', 'SENT_TO_BANK'] });
        }
        return [];
    }
}

export default new PayrollPeriodService();
