import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authMiddleware.js';
import { createEmployee, listEmployees, getEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';

const router = Router();

router.use(authenticate, requirePermission('view_employees'));
router.post('/', createEmployee);
router.get('/', listEmployees);
router.get('/:employeeId', getEmployee);
router.put('/:employeeId', updateEmployee);
router.delete('/:employeeId', deleteEmployee);

export default router;

