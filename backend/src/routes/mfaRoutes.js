import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { generateMfaForEmployee, resetMfaForEmployee, getMfaStatus } from '../controllers/mfaController.js';

const router = Router();

/**
 * MFA Management Routes
 * These routes allow HR to manage MFA for employees
 */

// Generate MFA credentials for an employee (HR only)
router.post('/generate', authenticate, requireRole(['HR', 'Admin']), generateMfaForEmployee);

// Reset MFA for an employee (HR only)
router.post('/reset', authenticate, requireRole(['HR', 'Admin']), resetMfaForEmployee);

// Get MFA status for an employee
router.get('/status/:employeeId', authenticate, getMfaStatus);

export default router;
