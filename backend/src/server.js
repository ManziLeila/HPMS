import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import logger from './config/logger.js';
import corsMiddleware from './middleware/cors.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));

app.use('/api', routes);
app.use(errorHandler);

if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    logger.info(`HPMS backend listening on port ${config.port}`);
  });
}

export default app;

