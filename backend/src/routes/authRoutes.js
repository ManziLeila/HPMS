import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { login, verifyMfaCode, logout, me } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/mfa', verifyMfaCode);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;

