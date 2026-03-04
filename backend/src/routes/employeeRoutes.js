import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { createEmployee, listEmployees, getEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';

const router = Router();

// Allow HR, Admin (legacy), and Finance Officer to manage employees
router.use(authenticate, requireRole(['Admin', 'HR', 'FinanceOfficer']));
router.post('/', createEmployee);
router.get('/', listEmployees);
router.get('/:employeeId', getEmployee);
router.put('/:employeeId', updateEmployee);
router.delete('/:employeeId', deleteEmployee);

export default router;

