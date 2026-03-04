import logger from '../config/logger.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Derive HTTP status, treating Zod validation failures as 400
  let status = err.status || err.statusCode || 500;
  const isZodError = err?.name === 'ZodError';
  if (isZodError && !err.status && !err.statusCode) {
    status = 400;
  }
  const correlationId = req.id;

  if (status >= 500) {
    logger.error({ err, correlationId }, 'Unhandled server error');
  } else {
    logger.warn({ err, correlationId }, 'Client error');
  }

  const basePayload = {
    code: err.code || (isZodError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'),
    message:
      status === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Something went wrong',
    correlationId,
  };

  // Attach safe validation details for Zod errors
  if (isZodError && Array.isArray(err.issues)) {
    basePayload.details = err.issues.map((issue) => ({
      path: issue.path?.join('.') || '',
      message: issue.message,
      code: issue.code,
    }));
  }

  res.status(status).json({ error: basePayload });
};

export default errorHandler;

