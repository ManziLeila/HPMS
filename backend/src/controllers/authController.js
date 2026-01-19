import { z } from 'zod';
import { initiateLogin, verifyMfa } from '../services/authService.js';
import auditService from '../services/auditService.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'number' ? String(val) : val))
    .refine((val) => typeof val === 'string' && val.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
});

const mfaSchema = z.object({
  token: z.string(),
  code: z.string().length(6),
});

export const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await initiateLogin({
      ...payload,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });
    if (result.requiresMfa) {
      res.status(200).json({ preToken: result.preToken, requiresMfa: true });
      return;
    }

    res.status(200).json({
      token: result.token,
      sessionId: result.sessionId,
      requiresMfa: false,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyMfaCode = async (req, res, next) => {
  try {
    const payload = mfaSchema.parse(req.body);
    const { token, sessionId } = await verifyMfa({
      ...payload,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });
    res.status(200).json({ token, sessionId });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await auditService.log({
      userId: req.user?.id,
      actionType: 'LOGOUT',
      details: { sessionId: req.user?.sessionId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    sessionId: req.user.sessionId,
  });
};

