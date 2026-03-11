import { Router } from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import userRoutes from './userRoutes.js';
import clientRoutes from './clientRoutes.js';
import salaryRoutes from './salaryRoutes.js';
import bulkSalaryRoutes from './bulkSalaryRoutes.js';
import mfaRoutes from './mfaRoutes.js';
import payrollPeriodRoutes from './payrollPeriodRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import contractRoutes from './contractRoutes.js';
import contractTemplateRoutes, { downloadContractPDF } from './contractTemplateRoutes.js';
import managementRoutes from './managementRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { sendTestEmailHandler, getEmailStatus, getEmailPreview } from '../controllers/emailController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { listAllClientContracts, getExpiringClientContracts } from '../controllers/clientContractController.js';

const router = Router();

router.use('/auth', authRoutes);
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.get('/client-contracts/expiring', authenticate, getExpiringClientContracts);
router.get('/client-contracts', authenticate, requireRole(['HR', 'FinanceOfficer', 'ManagingDirector']), listAllClientContracts);
router.use('/employees', employeeRoutes);
router.use('/salaries', salaryRoutes);
router.use('/salaries/bulk', bulkSalaryRoutes);
router.use('/mfa', mfaRoutes);
router.use('/payroll-periods', payrollPeriodRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contracts', contractRoutes);
router.get('/contracts/:id/pdf', authenticate, downloadContractPDF);
router.use('/contract-templates', contractTemplateRoutes);
router.use('/management', managementRoutes);
router.use('/settings', settingsRoutes);

// Email routes
router.get('/email/status', authenticate, getEmailStatus);
router.post('/email/test', authenticate, sendTestEmailHandler);
router.post('/email/preview', authenticate, getEmailPreview);

export default router;

