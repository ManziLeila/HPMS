import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as c from '../controllers/payrollPeriodController.js';

const router = express.Router();
router.use(authenticate);

// Approval Dashboard (all roles — returns role-appropriate periods)
router.get('/dashboard', c.listDashboard);

// Finance Officer
router.get('/my-periods',   c.listMyPeriods);
router.get('/ready-detail', c.getReadyDetail);
router.post('/submit',      c.submitPeriod);
router.post('/:id/unsubmit', c.unsubmitPeriod);
router.post('/:id/send-emails', c.sendPeriodEmails);
router.post('/:id/download-payslips', c.downloadPeriodPayslips);

// HR
router.get('/pending-hr',   c.listPendingForHR);
router.get('/hr-approved',  c.listHRApproved);
router.post('/:id/hr-review', c.hrReview);

// MD
router.get('/pending-md',   c.listPendingForMD);
router.post('/:id/md-review', c.mdReview);

// Shared — detail view with salary records
router.get('/:id',          c.getPeriod);

// Download computation summary PDF (HR/MD before approval)
router.get('/:id/computation-summary', c.downloadComputationSummary);

export default router;
