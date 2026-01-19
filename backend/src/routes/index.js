import { Router } from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import salaryRoutes from './salaryRoutes.js';
import mfaRoutes from './mfaRoutes.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.use('/employees', employeeRoutes);
router.use('/salaries', salaryRoutes);
router.use('/mfa', mfaRoutes);

export default router;

