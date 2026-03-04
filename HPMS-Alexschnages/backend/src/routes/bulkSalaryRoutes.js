import express from 'express';
import multer from 'multer';
import { bulkUploadSalaries, downloadBulkPayslips, sendBulkPayslipEmails } from '../controllers/bulkSalaryController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file upload (in-memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
        }
    },
});

// Bulk upload salaries from Excel file
router.post(
    '/upload',
    authenticate,
    requireRole(['FinanceOfficer', 'HR', 'Admin']),
    upload.single('file'),
    bulkUploadSalaries
);

// Download all payslips as ZIP
router.post(
    '/download-payslips',
    authenticate,
    requireRole(['FinanceOfficer', 'HR', 'Admin']),
    downloadBulkPayslips
);

// Send payslip emails to all employees
router.post(
    '/send-emails',
    authenticate,
    requireRole(['FinanceOfficer', 'HR', 'Admin']),
    sendBulkPayslipEmails
);

export default router;
