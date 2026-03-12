import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { getNotificationSettings, updateNotificationSettings, testNotificationEmail } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate, requireRole(['FinanceOfficer', 'HR', 'ManagingDirector', 'Admin']));

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.post('/notifications/test', testNotificationEmail);

export default router;
