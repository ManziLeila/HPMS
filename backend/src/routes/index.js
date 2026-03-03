import { Router } from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import clientRoutes from './clientRoutes.js';
import salaryRoutes from './salaryRoutes.js';
import bulkSalaryRoutes from './bulkSalaryRoutes.js';
import mfaRoutes from './mfaRoutes.js';
import payrollBatchRoutes from './payrollBatchRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import contractRoutes from './contractRoutes.js';
import contractTemplateRoutes, { downloadContractPDF } from './contractTemplateRoutes.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { sendTestEmailHandler, getEmailStatus, getEmailPreview } from '../controllers/emailController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { listAllClientContracts } from '../controllers/clientContractController.js';

const router = Router();

router.use('/auth', authRoutes);
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.use('/clients', clientRoutes);
router.get('/client-contracts', authenticate, requireRole(['Admin', 'HR', 'FinanceOfficer', 'ManagingDirector']), listAllClientContracts);
router.use('/employees', employeeRoutes);
router.use('/salaries', salaryRoutes);
router.use('/salaries/bulk', bulkSalaryRoutes);
router.use('/mfa', mfaRoutes);
router.use('/payroll-batches', payrollBatchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contracts', contractRoutes);
router.get('/contracts/:id/pdf', authenticate, downloadContractPDF);
router.use('/contract-templates', contractTemplateRoutes);

// Email routes
router.get('/email/status', authenticate, getEmailStatus);
router.post('/email/test', authenticate, sendTestEmailHandler);
router.post('/email/preview', authenticate, getEmailPreview);

export default router;

