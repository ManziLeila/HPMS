import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  createSalary,
  previewSalary,
  getSalary,
  getSalaryDetail,
  hrReviewSalary,
  bulkHrReviewSalaries,
  updateSalary,
  deleteSalary,
  resetPeriod,
  listSalariesByEmployee,
  getMonthlyReport,
  submitMonthForReview,
  listRecentSalaries,
  downloadPayslip,
  downloadMonthPayslips,
  exportMonthlyReportToExcel,
} from '../controllers/salaryController.js';
import { sendPayslipEmailManually } from '../controllers/sendPayslipManually.js';

const router = Router();

router.use(authenticate, requireRole(['HR', 'FinanceOfficer']));
router.post('/', createSalary);
router.post('/preview', previewSalary);
router.get('/reports/monthly', getMonthlyReport);
router.post('/reports/monthly/submit', submitMonthForReview);
router.get('/reports/monthly/export', exportMonthlyReportToExcel);
router.get('/reports/monthly/payslips-zip', downloadMonthPayslips);
router.delete('/reports/monthly/reset', resetPeriod);
router.get('/recent', listRecentSalaries);

// ── HR Review endpoints (must be before /:salaryId to avoid conflicts) ─
router.post('/hr-review/bulk', bulkHrReviewSalaries);          // Bulk approve/reject a whole period
router.post('/:salaryId/hr-review', hrReviewSalary);           // Single approve/reject
router.get('/:salaryId/detail', getSalaryDetail);              // Full decrypted breakdown

router.get('/employee/:employeeId', listSalariesByEmployee);
router.get('/:salaryId/payslip', downloadPayslip);
router.post('/:salaryId/send-email', sendPayslipEmailManually);
router.get('/:salaryId', getSalary);
router.put('/:salaryId', updateSalary);
router.delete('/:salaryId', deleteSalary);

export default router;
