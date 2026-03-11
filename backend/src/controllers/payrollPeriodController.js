import { z } from 'zod';
import payrollPeriodService from '../services/payrollPeriodService.js';
import { ROLES } from '../constants/roles.js';
import { badRequest, forbidden } from '../utils/httpError.js';

const submitSchema = z.object({
    clientId:    z.number().int().positive(),
    periodMonth: z.number().int().min(1).max(12),
    periodYear:  z.number().int().min(2020).max(2100),
});

const reviewSchema = z.object({
    action:   z.enum(['APPROVE', 'REJECT']),
    comments: z.string().optional(),
});

// ── Approval Dashboard: list periods by role ─────────────────────────────────
export const listDashboard = async (req, res, next) => {
    try {
        const periods = await payrollPeriodService.getDashboardPeriods(req.user.id, req.user.role);
        res.json({ success: true, data: periods, count: periods.length });
    } catch (err) { next(err); }
};

// ── Finance Officer: list ready-to-submit and submitted periods ──────────────
export const listMyPeriods = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.FINANCE_OFFICER) {
            throw forbidden('Only Finance Officers can view their payroll periods');
        }

        const [myPeriods, readyToSubmit] = await Promise.all([
            payrollPeriodService.getMyPeriods(req.user.id),
            payrollPeriodService.getReadyToSubmit(),
        ]);

        res.json({ success: true, data: myPeriods, readyToSubmit });
    } catch (err) { next(err); }
};

// ── Finance Officer: submit a client+month for HR review ─────────────────────
export const submitPeriod = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.FINANCE_OFFICER) {
            throw forbidden('Only Finance Officers can submit payroll periods');
        }

        const payload = submitSchema.parse(req.body);
        const period = await payrollPeriodService.submitPeriod({
            ...payload,
            submittedBy: req.user.id,
            ipAddress:   req.ip,
            userAgent:   req.headers['user-agent'],
        });

        res.status(201).json({
            success: true,
            message: 'Payroll period submitted for HR review',
            data: period,
        });
    } catch (err) { next(err); }
};

// ── HR: list submitted periods ───────────────────────────────────────────────
export const listPendingForHR = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.HR) {
            throw forbidden('Only HR Managers can view pending payroll periods');
        }

        const periods = await payrollPeriodService.getPendingForHR();
        res.json({ success: true, data: periods, count: periods.length });
    } catch (err) { next(err); }
};

// ── HR: list periods forwarded to MD ───────────────────────────────────────
export const listHRApproved = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.HR) {
            throw forbidden('Only HR Managers can view forwarded payroll periods');
        }

        const periods = await payrollPeriodService.getHRApproved();
        res.json({ success: true, data: periods, count: periods.length });
    } catch (err) { next(err); }
};

// ── HR: review (approve/reject) a period ────────────────────────────────────
export const hrReview = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.HR) {
            throw forbidden('Only HR Managers can review payroll periods');
        }

        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const { action, comments } = reviewSchema.parse(req.body);

        const period = await payrollPeriodService.hrReview({
            periodId,
            reviewedBy: req.user.id,
            action,
            comments,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: action === 'APPROVE'
                ? 'Payroll period approved and forwarded to Managing Director'
                : 'Payroll period rejected',
            data: period,
        });
    } catch (err) { next(err); }
};

// ── MD: list HR-approved periods ─────────────────────────────────────────────
export const listPendingForMD = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.MANAGING_DIRECTOR) {
            throw forbidden('Only the Managing Director can view this queue');
        }

        const periods = await payrollPeriodService.getPendingForMD();
        res.json({ success: true, data: periods, count: periods.length });
    } catch (err) { next(err); }
};

// ── MD: final approve/reject ─────────────────────────────────────────────────
export const mdReview = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.MANAGING_DIRECTOR) {
            throw forbidden('Only the Managing Director can give final approval');
        }

        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const { action, comments } = reviewSchema.parse(req.body);

        const period = await payrollPeriodService.mdReview({
            periodId,
            reviewedBy: req.user.id,
            action,
            comments,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: action === 'APPROVE'
                ? 'Payroll approved — Finance Officer notified to process payments'
                : 'Payroll period rejected',
            data: period,
        });
    } catch (err) { next(err); }
};

// ── Finance Officer: send to bank ────────────────────────────────────────────
export const sendToBank = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.FINANCE_OFFICER) {
            throw forbidden('Only Finance Officers can initiate bank transfers');
        }

        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const period = await payrollPeriodService.sendToBank({
            periodId,
            userId:    req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ success: true, message: 'Payroll sent to bank successfully', data: period });
    } catch (err) { next(err); }
};

// ── Get ready-to-submit detail (FO preview before submit) ────────────────────
export const getReadyDetail = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.FINANCE_OFFICER) {
            throw forbidden('Only Finance Officers can preview ready-to-submit payroll');
        }
        const clientId = Number(req.query.clientId);
        const periodMonth = Number(req.query.periodMonth);
        const periodYear = Number(req.query.periodYear);
        if (!clientId || !periodMonth || !periodYear) {
            throw badRequest('clientId, periodMonth, periodYear are required');
        }
        const detail = await payrollPeriodService.getReadyDetail(clientId, periodMonth, periodYear);
        res.json({ success: true, data: detail });
    } catch (err) { next(err); }
};

// ── Get a single period with its salary records ──────────────────────────────
export const getPeriod = async (req, res, next) => {
    try {
        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const period = await payrollPeriodService.getWithSalaries(periodId);
        res.json({ success: true, data: period });
    } catch (err) { next(err); }
};

// ── Send payslip emails for a period (only after status is SENT_TO_BANK) ─────
export const sendPeriodEmails = async (req, res, next) => {
    try {
        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const period = await payrollPeriodService.getById(periodId);
        if (period.status !== 'SENT_TO_BANK') {
            return res.status(403).json({
                success: false,
                message: 'Payslip emails can only be sent after the payroll has been sent to the bank (HR and MD approved, and Finance has marked "Sent to bank").',
            });
        }

        const salaryIds = await payrollPeriodService.getSalaryIdsForPeriod(periodId);
        if (!salaryIds.length) throw badRequest('No salary records in this period');
        req.body = { salaryIds };
        const { sendBulkPayslipEmails } = await import('./bulkSalaryController.js');
        return sendBulkPayslipEmails(req, res, next);
    } catch (err) { next(err); }
};

// ── Download payslips ZIP for a period ───────────────────────────────────────
export const downloadPeriodPayslips = async (req, res, next) => {
    try {
        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');
        const salaryIds = await payrollPeriodService.getSalaryIdsForPeriod(periodId);
        if (!salaryIds.length) throw badRequest('No salary records in this period');
        req.body = { salaryIds };
        const { downloadBulkPayslips } = await import('./bulkSalaryController.js');
        return downloadBulkPayslips(req, res, next);
    } catch (err) { next(err); }
};

// ── Finance Officer: unsubmit a period (remove from HR queue, salaries go back to ready) ─
export const unsubmitPeriod = async (req, res, next) => {
    try {
        if (req.user.role !== ROLES.FINANCE_OFFICER) {
            throw forbidden('Only Finance Officers can unsubmit payroll periods');
        }
        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');
        await payrollPeriodService.unsubmitPeriod(periodId);
        res.json({ success: true, message: 'Payroll period removed. Salaries are back in Ready to Submit.' });
    } catch (err) { next(err); }
};

// ── Download computation summary PDF (formulas + amounts) for HR/MD review ───
export const downloadComputationSummary = async (req, res, next) => {
    try {
        const periodId = Number(req.params.id);
        if (!periodId) throw badRequest('Invalid period ID');

        const period = await payrollPeriodService.getWithSalaries(periodId);
        if (!period?.salaries?.length) throw badRequest('No salary records in this period');

        const { generateComputationSummaryPdf } = await import('../services/computationSummaryService.js');
        const pdf = await generateComputationSummaryPdf({ period, salaries: period.salaries });

        if (!pdf || pdf.length === 0) {
            throw new Error('Failed to generate computation summary');
        }

        const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][period.period_month - 1] || period.period_month;
        const filename = `Computation-Summary-${period.client_name || 'Client'}-${monthName}-${period.period_year}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);
    } catch (err) { next(err); }
};
