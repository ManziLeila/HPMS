import logger from '../config/logger.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const correlationId = req.id;

  if (status >= 500) {
    logger.error({ err, correlationId }, 'Unhandled server error');
  } else {
    logger.warn({ err, correlationId }, 'Client error');
  }

  res.status(status).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message:
        status === 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Something went wrong',
      correlationId,
    },
  });
};

export default errorHandler;

