import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  createSalary,
  previewSalary,
  getSalary,
  updateSalary,
  deleteSalary,
  resetPeriod,
  listSalariesByEmployee,
  getMonthlyReport,
  listRecentSalaries,
  downloadPayslip,
  exportMonthlyReportToExcel,
} from '../controllers/salaryController.js';
import { sendPayslipEmailManually } from '../controllers/sendPayslipManually.js';

const router = Router();

// Allow HR, Admin (legacy), and Finance Officer to manage salaries
router.use(authenticate, requireRole(['Admin', 'HR', 'FinanceOfficer']));
router.post('/', createSalary);
router.post('/preview', previewSalary);
router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/monthly/export', exportMonthlyReportToExcel);
router.delete('/reports/monthly/reset', resetPeriod);
router.get('/recent', listRecentSalaries);
router.get('/employee/:employeeId', listSalariesByEmployee);
router.get('/:salaryId/payslip', downloadPayslip);
router.post('/:salaryId/send-email', sendPayslipEmailManually); // Manual email send
router.get('/:salaryId', getSalary);
router.put('/:salaryId', updateSalary);
router.delete('/:salaryId', deleteSalary);

export default router;
