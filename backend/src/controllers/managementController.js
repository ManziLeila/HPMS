import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { randomBytes } from 'node:crypto';
import * as managementRepo from '../repositories/managementRepo.js';
import * as rolePermissionsRepo from '../repositories/rolePermissionsRepo.js';
import userRepo from '../repositories/userRepo.js';
import { ROLE_PERMISSIONS, ROLES, ALL_PERMISSION_KEYS } from '../constants/roles.js';
import { forbidden } from '../utils/httpError.js';
import config from '../config/env.js';
import auditService from '../services/auditService.js';

// Only Admin can access Management Console endpoints
const MANAGEMENT_ROLES = ['Admin'];

const requireAdmin = (req, res, next) => {
  if (!req.user || !MANAGEMENT_ROLES.includes(req.user.role)) {
    next(forbidden('Management Console is only available to administrators'));
    return;
  }
  next();
};

// Best-effort audit logging for management actions
async function logManagementAction(req, actionType, details = {}) {
  try {
    await auditService.log({
      userId: req.user?.id,
      actionType,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });
  } catch (e) {
    console.warn('Management audit log failed:', e.message);
  }
}

// POST /api/management/verify-access - verify current user's password to unlock Management Console
export const verifyManagementAccess = async (req, res, next) => {
  try {
    const password = req.body?.password;
    if (typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: { message: 'Password is required' } });
    }
    if (req.user.userType !== 'user') {
      next(forbidden('Only system users can access the Management Console'));
      return;
    }

    const { rows } = await pool.query(
      'SELECT password_hash FROM hpms_core.users WHERE user_id = $1',
      [req.user.id],
    );

    if (!rows.length) {
      next(forbidden('User not found'));
      return;
    }

    const valid = await bcrypt.compare(password.trim(), rows[0].password_hash);
    if (!valid) {
      return res.status(403).json({ error: { message: 'Incorrect password' } });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// GET /api/management/health - API + DB status
export const getManagementHealth = async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ api: 'ok', database: 'ok' });
  } catch (e) {
    res.status(503).json({ api: 'ok', database: 'error', message: e.message });
  }
};

// GET /api/management/overview - key counts + last login + failed logins
export const getOverview = async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      const [
        usersRes,
        activityRes,
        employeesRes,
        clientsRes,
        batchesRes,
        periodsRes,
        lastLoginRes,
        failedLoginsRes,
      ] = await Promise.all([
        client.query('SELECT COUNT(*)::int AS c FROM hpms_core.users'),
        client.query(
          "SELECT COUNT(*)::int AS c FROM hpms_core.audit_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'",
        ),
        client.query('SELECT COUNT(*)::int AS c FROM hpms_core.employees'),
        client
          .query('SELECT COUNT(*)::int AS c FROM hpms_core.clients')
          .catch(() => ({ rows: [{ c: 0 }] })),
        client
          .query('SELECT COUNT(*)::int AS c FROM hpms_core.payroll_batches')
          .catch(() => ({ rows: [{ c: 0 }] })),
        client
          .query('SELECT COUNT(*)::int AS c FROM hpms_core.payroll_periods')
          .catch(() => ({ rows: [{ c: 0 }] })),
        client.query(
          "SELECT MAX(timestamp) AS last_login FROM hpms_core.audit_logs WHERE action_type = 'ACCESS_GRANTED'",
        ),
        client
          .query(
            "SELECT COUNT(*)::int AS c FROM hpms_core.audit_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND action_type = 'LOGIN_REQUEST' AND details->>'status' = 'FAILED'",
          )
          .catch(() => ({ rows: [{ c: 0 }] })),
      ]);

      const lastLoginRow = lastLoginRes.rows[0];

      res.json({
        totalUsers: usersRes.rows[0].c,
        activityLast24h: activityRes.rows[0].c,
        totalEmployees: employeesRes.rows[0].c,
        totalClients: clientsRes.rows[0].c,
        totalBatches: batchesRes.rows[0].c,
        totalPeriods: periodsRes.rows[0].c,
        lastLoginAt: lastLoginRow?.last_login ?? null,
        failedLogins24h: failedLoginsRes.rows[0].c,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
};

// GET /api/management/activity - paginated audit log
export const getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const { actionType, userId, fromDate, toDate } = req.query;

    const [items, total] = await Promise.all([
      managementRepo.listActivity({ limit, offset, actionType, userId, fromDate, toDate }),
      managementRepo.countActivity({ actionType, userId, fromDate, toDate }),
    ]);

    const totalCount = typeof total === 'number' ? total : Number(total) || 0;
    res.json({ items: items || [], total: totalCount });
  } catch (e) {
    next(e);
  }
};

// GET /api/management/activity/export - CSV of audit log
export const exportActivity = async (req, res, next) => {
  try {
    const { actionType, userId, fromDate, toDate } = req.query;
    const rows = await managementRepo.listActivityForExport({
      actionType,
      userId,
      fromDate,
      toDate,
    });

    const header = 'Date,User ID,User Name,Email,Action,IP,Details\n';
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = rows.map((r) =>
      [
        r.timestamp ? new Date(r.timestamp).toISOString() : '',
        r.user_id ?? '',
        escape(r.user_name),
        escape(r.user_email),
        r.action_type ?? '',
        r.ip_address ?? '',
        escape(typeof r.details === 'object' ? JSON.stringify(r.details) : r.details),
      ].join(','),
    );

    const csv = header + lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-log.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
};

// GET /api/management/users - system users only
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userRepo.list({ limit: 500 });
    res.json({
      users: users.map((u) => ({ ...u, type: 'user', id: u.user_id })),
    });
  } catch (e) {
    next(e);
  }
};

const ALLOWED_CREATE_ROLES = ['Admin', 'FinanceOfficer', 'HR', 'ManagingDirector'];

function generateTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let s = '';
  for (let i = 0; i < length; i += 1) s += chars[bytes[i] % chars.length];
  return s;
}

// POST /api/management/users - create a new system user
export const createUser = async (req, res, next) => {
  try {
    const fullName = req.body?.full_name?.trim();
    const email = req.body?.email?.trim();
    const role = req.body?.role;
    const department = req.body?.department?.trim() || null;
    const password = req.body?.password != null ? String(req.body.password) : null;
    const generatePassword = Boolean(req.body?.generate_password);

    if (!fullName || !email) {
      return res.status(400).json({ error: { message: 'Full name and email are required' } });
    }

    if (!ALLOWED_CREATE_ROLES.includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid role' } });
    }

    let finalPassword = password;
    if (generatePassword) {
      finalPassword = generateTemporaryPassword();
    }

    if (!finalPassword || finalPassword.length < 8) {
      return res.status(400).json({
        error: {
          message: 'Provide a password (min 8 characters) or check "Generate temporary password"',
        },
      });
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: { message: 'A user with this email already exists' } });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);
    const mfaSecret = authenticator.generateSecret();
    const created = await userRepo.create({
      fullName,
      email,
      passwordHash,
      mfaSecret,
      role,
      department,
    });

    const issuer = config.auth?.mfaIssuer || 'HC Solutions Payroll';
    const otpauthUrl = authenticator.keyuri(email, issuer, mfaSecret);

    await logManagementAction(req, 'CREATE_USER', {
      createdUserId: created.user_id,
      email: created.email,
      role: created.role,
    });

    res.status(201).json({
      user: {
        user_id: created.user_id,
        full_name: created.full_name,
        email: created.email,
        role: created.role,
        department: created.department,
      },
      temporaryPassword: generatePassword ? finalPassword : undefined,
      mfaSecret,
      otpauthUrl,
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/management/permissions - role permission matrix
export const getPermissions = async (req, res, next) => {
  try {
    let matrix = [];
    try {
      matrix = await rolePermissionsRepo.getAllRolePermissions();
    } catch (dbErr) {
      if (dbErr.code !== '42P01' && dbErr.code !== '42P07') throw dbErr;
      matrix = [];
    }

    if (!matrix || matrix.length === 0) {
      matrix = Object.keys(ROLE_PERMISSIONS).map((role) => ({
        role,
        permissions: ROLE_PERMISSIONS[role] || [],
      }));
    }

    res.json({
      roles: Object.values(ROLES),
      matrix,
      permissionKeys: ALL_PERMISSION_KEYS,
    });
  } catch (e) {
    next(e);
  }
};

// PUT /api/management/roles/:role/permissions - update permissions for a role
export const updateRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    const allowedRoles = ['Admin', 'FinanceOfficer', 'HR', 'ManagingDirector', 'Employee'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid role' } });
    }

    const list = Array.isArray(permissions) ? permissions : [];
    const validKeys = new Set(ALL_PERMISSION_KEYS);
    const invalid = list.filter((p) => typeof p !== 'string' || !validKeys.has(p));

    if (invalid.length > 0) {
      return res
        .status(400)
        .json({ error: { message: `Invalid permission(s): ${invalid.join(', ')}` } });
    }

    const updated = await rolePermissionsRepo.setRolePermissions(role, list);
    if (!updated) {
      return res.status(500).json({ error: { message: 'Failed to update permissions' } });
    }

    await logManagementAction(req, 'UPDATE_ROLE_PERMISSIONS', {
      role,
      permissionCount: list.length,
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// PUT /api/management/users/:id/role - update a system user's role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['Admin', 'FinanceOfficer', 'HR', 'ManagingDirector'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid role' } });
    }

    const updated = await userRepo.update({
      userId: parseInt(id, 10),
      role,
    });

    if (!updated) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    await logManagementAction(req, 'UPDATE_USER_ROLE', {
      userId: parseInt(id, 10),
      newRole: role,
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// PUT /api/management/users/:id - update a system user
export const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: { message: 'Invalid user ID' } });
    }

    const fullName = req.body?.full_name?.trim();
    const email = req.body?.email?.trim();
    const role = req.body?.role;
    const department = req.body?.department?.trim() || null;
    const password = req.body?.password != null ? String(req.body.password) : null;
    const generatePassword = Boolean(req.body?.generate_password);

    const existing = await userRepo.findById(userId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    if (email && email !== existing.email) {
      const byEmail = await userRepo.findByEmail(email);
      if (byEmail) {
        return res.status(409).json({ error: { message: 'Another user already has this email' } });
      }
    }

    const updates = {
      userId,
      fullName: fullName || existing.full_name,
      email: email || existing.email,
      role: ALLOWED_CREATE_ROLES.includes(role) ? role : existing.role,
      department: department !== undefined ? department : existing.department,
    };

    const updated = await userRepo.update(updates);

    await logManagementAction(req, 'UPDATE_USER', {
      userId,
      email: updates.email,
      role: updates.role,
    });

    if (generatePassword || (password && password.length >= 8)) {
      const newPassword = generatePassword ? generateTemporaryPassword() : password;
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await userRepo.updatePassword({ userId, passwordHash });
      res.json({
        ...updated,
        temporaryPassword: generatePassword ? newPassword : undefined,
      });
      return;
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/management/users/:id - remove a system user
export const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: { message: 'Invalid user ID' } });
    }

    const existing = await userRepo.findById(userId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    if (existing.role === 'Admin') {
      const admins = await userRepo.findByRole('Admin');
      if (admins.length <= 1) {
        return res.status(403).json({
          error: {
            message:
              'Cannot delete the last Administrator. At least one Admin is required to manage the site.',
          },
        });
      }
    }

    const deleted = await userRepo.delete(userId);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    await logManagementAction(req, 'DELETE_USER', {
      userId: deleted.user_id,
      email: existing.email,
    });

    res.status(200).json({ message: 'User deleted', user_id: deleted.user_id });
  } catch (e) {
    next(e);
  }
};

export { requireAdmin };
