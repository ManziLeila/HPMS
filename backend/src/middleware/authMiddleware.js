import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { unauthorized, forbidden } from '../utils/httpError.js';
import * as rolePermissionsRepo from '../repositories/rolePermissionsRepo.js';

const verifyToken = (token) => {
  const { publicKey, secret } = config.jwt;
  const verifyKey = publicKey || secret;
  const algorithms = publicKey ? ['RS256'] : ['HS256'];

  if (!verifyKey) {
    throw new Error('JWT verification keys are not configured');
  }

  return jwt.verify(token, verifyKey, { algorithms });
};

export const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;

    if (!token) {
      throw unauthorized('Missing bearer token');
    }

    const claims = verifyToken(token);

    if (!claims.mfa || claims.mfa !== true) {
      throw unauthorized('MFA validation required');
    }

    req.user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      userType: claims.userType || 'user',
      sessionId: claims.sessionId,
    };

    next();
  } catch (error) {
    next(unauthorized(error.message || 'Invalid token'));
  }
};

export const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    next(unauthorized());
    return;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  // Admin can access any route
  if (req.user.role === 'Admin') {
    next();
    return;
  }

  if (roles.length && !roles.includes(req.user.role)) {
    next(forbidden('Insufficient permissions'));
    return;
  }

  next();
};

/**
 * Require that the user's role has the given permission (from DB role_permissions).
 * Admin always passes. Use after authenticate.
 */
export const requirePermission = (permission) => async (req, res, next) => {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.user.role === 'Admin') {
    next();
    return;
  }
  try {
    const permissions = await rolePermissionsRepo.getRolePermissions(req.user.role);
    const hasIt = permissions.includes('all') || permissions.includes(permission);
    if (!hasIt) {
      next(forbidden('Insufficient permissions'));
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
};

