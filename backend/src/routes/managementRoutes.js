import { Router } from 'express';
import {
  getOverview,
  getActivity,
  exportActivity,
  getManagementHealth,
  getAllUsers,
  getPermissions,
  updateUserRole,
  updateRolePermissions,
  verifyManagementAccess,
  createUser,
  updateUser,
  deleteUser,
  requireAdmin,
} from '../controllers/managementController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/health', getManagementHealth);
router.post('/verify-access', verifyManagementAccess);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/overview', getOverview);
router.get('/activity/export', exportActivity);
router.get('/activity', getActivity);
router.get('/permissions', getPermissions);
router.put('/roles/:role/permissions', updateRolePermissions);

export default router;
