import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { unauthorized, forbidden } from '../utils/httpError.js';

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

  if (roles.length && !roles.includes(req.user.role)) {
    next(forbidden('Insufficient permissions'));
    return;
  }

  next();
};

