import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import logger from '../config/logger.js';

const requestLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    correlationId: req.id,
  }),
  genReqId: (req) => {
    const existingCorrelation = req.headers['x-correlation-id'];
    return existingCorrelation || randomUUID();
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, error) =>
    `Error on ${req.method} ${req.url} -> ${res.statusCode} :: ${error.message}`,
});

export default (req, res, next) => {
  requestLogger(req, res, () => {
    res.setHeader('x-correlation-id', req.id);
    next();
  });
};

