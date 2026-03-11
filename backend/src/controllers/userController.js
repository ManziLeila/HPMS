import { z } from 'zod';
import systemUserService from '../services/systemUserService.js';
import auditService from '../services/auditService.js';
import { badRequest } from '../utils/httpError.js';

const createUserSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['FinanceOfficer', 'HR', 'ManagingDirector']),
  temporaryPassword: z.string().min(10),
  department: z.string().optional().nullable().transform(v => v || null),
});

const updateUserSchema = z.object({
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['FinanceOfficer', 'HR', 'ManagingDirector']).optional(),
  department: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const userIdSchema = z.object({ userId: z.coerce.number() });

export const createUser = async (req, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);

    const newUser = await systemUserService.createUser({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.temporaryPassword,
      role: payload.role,
      department: payload.department,
    });

    await auditService.log({
      userId: req.user.id,
      actionType: 'CREATE_USER',
      details: { newUserId: newUser.user_id, role: newUser.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const users = await systemUserService.listUsers({ limit, offset });
    res.json({ data: users, pagination: { limit, offset } });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { userId } = userIdSchema.parse(req.params);
    const user = await systemUserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = userIdSchema.parse(req.params);
    const payload = updateUserSchema.parse(req.body);

    const updatedUser = await systemUserService.updateUser(userId, payload);

    if (!updatedUser) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    await auditService.log({
      userId: req.user.id,
      actionType: 'UPDATE_USER',
      details: { targetUserId: userId, changes: payload },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = userIdSchema.parse(req.params);

    if (userId === req.user.id && req.user.userType === 'user') {
      throw badRequest('Cannot delete your own account');
    }

    const deletedUser = await systemUserService.deleteUser(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    await auditService.log({
      userId: req.user.id,
      actionType: 'DELETE_USER',
      details: { targetUserId: userId, userName: deletedUser.full_name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    next(error);
  }
};
