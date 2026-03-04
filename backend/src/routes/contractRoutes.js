import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as cc from '../controllers/contractController.js';

const router = Router();
router.use(authenticate);

router.get('/stats', cc.getStats);
router.get('/expiring', cc.getExpiring);           // ?days=14
router.post('/notify', cc.runNotifications);      // manual trigger
router.get('/employee/:employeeId', cc.getByEmployee);
router.get('/:id/download', cc.downloadContractDocument);
router.get('/:id', cc.getById);
router.get('/', cc.list);
router.post('/', cc.create);
router.patch('/:id', cc.update);

export default router;
