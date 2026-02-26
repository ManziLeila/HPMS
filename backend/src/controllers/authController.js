import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { initiateLogin, verifyMfa } from '../services/authService.js';
import auditService from '../services/auditService.js';
import pool from '../config/database.js';


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
  const { rows } = await pool.query(
    'SELECT full_name FROM hpms_core.employees WHERE employee_id = $1',
    [req.user.id]
  );
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    fullName: rows[0]?.full_name || null,
    sessionId: req.user.sessionId,
  });
};

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Fetch stored password hash
    const { rows } = await pool.query(
      'SELECT password_hash FROM hpms_core.employees WHERE employee_id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: { message: 'User not found' } });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: { message: 'Current password is incorrect' } });

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE hpms_core.employees SET password_hash = $1, updated_at = NOW() WHERE employee_id = $2',
      [newHash, req.user.id]
    );

    await auditService.log({
      userId: req.user.id,
      actionType: 'CHANGE_PASSWORD',
      details: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

