import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/authMiddleware.js';
import { login, verifyMfaCode, logout, me, changePassword } from '../controllers/authController.js';

const router = Router();

// Basic rate limiting to protect login and MFA from brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max attempts per IP in window
  standardHeaders: true,
  legacyHeaders: false,
});

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/mfa', mfaLimiter, verifyMfaCode);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router;
