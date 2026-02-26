import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as payrollBatchController from '../controllers/payrollBatchController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new payroll batch (Finance Officer)
router.post('/', payrollBatchController.createBatch);

// Get batches created by current user (Finance Officer)
router.get('/my-batches', payrollBatchController.getMyBatches);

// Get dashboard statistics
router.get('/stats', payrollBatchController.getDashboardStats);

// Get pending batches for HR review (HR only)
router.get('/pending-hr', payrollBatchController.getPendingForHR);

// Get pending batches for MD review (MD only)
router.get('/pending-md', payrollBatchController.getPendingForMD);

// HR review (approve/reject)
router.post('/hr-review', payrollBatchController.hrReview);

// MD review (final approve/reject)
router.post('/md-review', payrollBatchController.mdReview);

// Send to bank
router.post('/send-to-bank', payrollBatchController.sendToBank);

// Get batch by ID
router.get('/:id', payrollBatchController.getBatchById);

// Delete batch (only if pending)
router.delete('/:id', payrollBatchController.deleteBatch);

export default router;
