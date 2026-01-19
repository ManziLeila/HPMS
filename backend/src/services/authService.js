import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { randomUUID } from 'node:crypto';
import config from '../config/env.js';
import userService from './userService.js';
import auditService from './auditService.js';
import { unauthorized, badRequest } from '../utils/httpError.js';

const signToken = (payload, options = {}) => {
  const { privateKey, secret } = config.jwt;
  const signKey = privateKey || secret;
  const algorithm = privateKey ? 'RS256' : 'HS256';

  if (!signKey) {
    throw new Error('JWT signing key is missing');
  }

  return jwt.sign(payload, signKey, {
    algorithm,
    expiresIn: options.expiresIn ?? '15m',
  });
};

export const initiateLogin = async ({
  email,
  password,
  ipAddress,
  userAgent,
  correlationId,
}) => {
  const user = await userService.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    await auditService.log({
      userId: user?.employee_id,
      actionType: 'LOGIN_REQUEST',
      details: { email, status: 'FAILED' },
      ipAddress,
      userAgent,
      correlationId,
    });
    throw unauthorized('Invalid credentials');
  }

  if (!config.auth.mfaRequired) {
    const sessionId = randomUUID();
    const finalToken = signToken(
      {
        sub: user.employee_id,
        email: user.email,
        role: user.role,
        sessionId,
        mfa: true,
      },
      { expiresIn: '1h' },
    );

    await auditService.log({
      userId: user.employee_id,
      actionType: 'ACCESS_GRANTED',
      details: { sessionId, method: 'PASSWORD_ONLY' },
      ipAddress,
      userAgent,
      correlationId,
    });

    return { token: finalToken, sessionId, requiresMfa: false };
  }

  const preToken = signToken(
    {
      sub: user.employee_id,
      email: user.email,
      role: user.role,
      mfa: false,
      stage: 'MFA_PENDING',
    },
    { expiresIn: '5m' },
  );

  await auditService.log({
    userId: user.employee_id,
    actionType: 'LOGIN_REQUEST',
    details: { email, status: 'MFA_REQUIRED' },
    ipAddress,
    userAgent,
    correlationId,
  });

  return { preToken, user, requiresMfa: true };
};

export const verifyMfa = async ({ token, code, ipAddress, userAgent, correlationId }) => {
  if (!config.auth.mfaRequired) {
    throw badRequest('MFA is currently disabled');
  }

  let claims;
  try {
    const { publicKey, secret } = config.jwt;
    const verifyKey = publicKey || secret;
    const algorithms = publicKey ? ['RS256'] : ['HS256'];
    claims = jwt.verify(token, verifyKey, { algorithms });
  } catch {
    throw unauthorized('Invalid or expired MFA token');
  }

  if (claims.stage !== 'MFA_PENDING') {
    throw badRequest('Token is not in MFA pending stage');
  }

  const user = await userService.findByEmail(claims.email);
  if (!user) {
    throw unauthorized('User not found');
  }

  const isValid = authenticator.verify({
    token: code,
    secret: user.mfa_secret,
  });

  if (!isValid) {
    await auditService.log({
      userId: user.employee_id,
      actionType: 'MFA_CHALLENGE',
      details: { status: 'FAILED' },
      ipAddress,
      userAgent,
      correlationId,
    });
    throw unauthorized('Invalid MFA code');
  }

  const sessionId = randomUUID();
  const finalToken = signToken(
    {
      sub: user.employee_id,
      email: user.email,
      role: user.role,
      sessionId,
      mfa: true,
    },
    { expiresIn: '1h' },
  );

  await auditService.log({
    userId: user.employee_id,
    actionType: 'ACCESS_GRANTED',
    details: { sessionId },
    ipAddress,
    userAgent,
    correlationId,
  });

  return { token: finalToken, sessionId };
};

