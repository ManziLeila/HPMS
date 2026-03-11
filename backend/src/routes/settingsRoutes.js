import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { getNotificationSettings, updateNotificationSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate, requireRole(['FinanceOfficer', 'HR', 'ManagingDirector', 'Admin']));

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

export default router;
