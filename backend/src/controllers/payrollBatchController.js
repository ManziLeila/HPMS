import { z } from 'zod';
import payrollBatchService from '../services/payrollBatchService.js';
import { ROLES } from '../constants/roles.js';
import { badRequest, forbidden } from '../utils/httpError.js';

// Validation schemas
const createBatchSchema = z.object({
    batchName: z.string().min(3, 'Batch name must be at least 3 characters'),
    periodMonth: z.number().min(1).max(12),
    periodYear: z.number().min(2020).max(2100),
    salaryIds: z.array(z.number()).min(1, 'At least one salary must be included'),
});

const reviewSchema = z.object({
    batchId: z.union([z.number(), z.literal('ALL')]),
    action: z.enum(['APPROVE', 'REJECT']),
    comments: z.string().optional(),
});

const sendToBankSchema = z.object({
    batchId: z.number(),
});

// Create a new payroll batch
export const createBatch = async (req, res, next) => {
    try {
        // Only Finance Officers can create batches
        if (req.user.role !== ROLES.FINANCE_OFFICER && req.user.role !== ROLES.ADMIN) {
            throw forbidden('Only Finance Officers can create payroll batches');
        }

        const payload = createBatchSchema.parse(req.body);

        const batch = await payrollBatchService.createBatch({
            ...payload,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Payroll batch created and submitted for approval',
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

// Get batches created by the current user (Finance Officer)
export const getMyBatches = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const offset = Number(req.query.offset) || 0;

        const result = await payrollBatchService.getMyBatches(req.user.id, limit, offset);

        res.json({
            success: true,
            data: result.batches,
            stats: result.stats,
            pagination: { limit, offset },
        });
    } catch (error) {
        next(error);
    }
};

// Get batch by ID
export const getBatchById = async (req, res, next) => {
    try {
        const batchId = Number(req.params.id);

        if (isNaN(batchId)) {
            throw badRequest('Invalid batch ID');
        }

        const batch = await payrollBatchService.getBatchById(batchId);

        res.json({
            success: true,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

// Get pending batches for HR review
export const getPendingForHR = async (req, res, next) => {
    try {
        // Only HR can access this
        if (req.user.role !== ROLES.HR && req.user.role !== ROLES.ADMIN) {
            throw forbidden('Only HR Managers can access pending approvals');
        }

        const batches = await payrollBatchService.getPendingForHR();

        res.json({
            success: true,
            data: batches,
            count: batches.length,
        });
    } catch (error) {
        next(error);
    }
};

// Get pending batches for MD review
export const getPendingForMD = async (req, res, next) => {
    try {
        // Only MD can access this
        if (req.user.role !== ROLES.MANAGING_DIRECTOR && req.user.role !== ROLES.ADMIN) {
            throw forbidden('Only Managing Director can access final approvals');
        }

        const batches = await payrollBatchService.getPendingForMD();

        res.json({
            success: true,
            data: batches,
            count: batches.length,
        });
    } catch (error) {
        next(error);
    }
};

// HR Review (Approve/Reject)
export const hrReview = async (req, res, next) => {
    try {
        // Only HR can review
        if (req.user.role !== ROLES.HR && req.user.role !== ROLES.ADMIN) {
            throw forbidden('Only HR Managers can review payroll');
        }

        const payload = reviewSchema.parse(req.body);

        const batch = await payrollBatchService.hrReview({
            ...payload,
            reviewedBy: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: `Payroll batch ${payload.action.toLowerCase()}d successfully`,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

// MD Review (Final Approve/Reject) — supports batchId 'ALL'
export const mdReview = async (req, res, next) => {
    try {
        // Only MD can give final approval
        if (req.user.role !== ROLES.MANAGING_DIRECTOR && req.user.role !== ROLES.ADMIN) {
            throw forbidden('Only Managing Director can give final approval');
        }

        const payload = reviewSchema.parse(req.body);

        // ── Handle "Approve All" ─────────────────────────────────────
        if (payload.batchId === 'ALL') {
            const pending = await payrollBatchService.getPendingForMD();
            if (!pending.length) {
                return res.json({ success: true, message: 'No HR-approved batches to process', data: [] });
            }

            const results = await Promise.allSettled(
                pending.map((b) =>
                    payrollBatchService.mdReview({
                        batchId: b.batch_id,
                        action: payload.action,
                        comments: payload.comments,
                        reviewedBy: req.user.id,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                    })
                )
            );

            const succeeded = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;

            return res.json({
                success: true,
                message: `Processed ${pending.length} batches: ${succeeded} approved, ${failed} failed`,
                data: results.map((r, i) => ({
                    batchId: pending[i].batch_id,
                    status: r.status,
                    ...(r.status === 'rejected' ? { error: r.reason?.message } : {}),
                })),
            });
        }

        // ── Handle single batch ──────────────────────────────────────
        const batch = await payrollBatchService.mdReview({
            ...payload,
            reviewedBy: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: `Payroll batch ${payload.action.toLowerCase()}d successfully`,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

// Send to Bank
export const sendToBank = async (req, res, next) => {
    try {
        // Finance Officer or MD can send to bank
        const allowedRoles = [ROLES.FINANCE_OFFICER, ROLES.MANAGING_DIRECTOR, ROLES.ADMIN];
        if (!allowedRoles.includes(req.user.role)) {
            throw forbidden('Insufficient permissions to send payroll to bank');
        }

        const payload = sendToBankSchema.parse(req.body);

        const batch = await payrollBatchService.sendToBank({
            batchId: payload.batchId,
            sentBy: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: 'Payroll successfully sent to bank',
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

// Send payslips for a batch manually
export const sendBatchEmails = async (req, res, next) => {
    try {
        const batchId = Number(req.params.id);
        if (isNaN(batchId)) throw badRequest('Invalid batch ID');

        const allowedRoles = [ROLES.FINANCE_OFFICER, ROLES.MANAGING_DIRECTOR, ROLES.ADMIN];
        if (!allowedRoles.includes(req.user.role)) {
            throw forbidden('Insufficient permissions to send payslips');
        }

        const stats = await payrollBatchService.sendPayslipsForBatch(batchId, req.user.id);

        res.json({
            success: true,
            message: `Processed ${stats.total} records: ${stats.success} sent, ${stats.failed} failed`,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await payrollBatchService.getDashboardStats(req.user.id, req.user.role);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

// Delete a batch (only if pending)
export const deleteBatch = async (req, res, next) => {
    try {
        const batchId = Number(req.params.id);

        if (isNaN(batchId)) {
            throw badRequest('Invalid batch ID');
        }

        const deleted = await payrollBatchService.deleteBatch(batchId, req.user.id);

        res.json({
            success: true,
            message: 'Batch deleted successfully',
            data: deleted,
        });
    } catch (error) {
        next(error);
    }
};
