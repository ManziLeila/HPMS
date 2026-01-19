import cors from 'cors';
import config from '../config/env.js';

const allowedOrigins = config.cors.origins;

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  exposedHeaders: ['x-correlation-id'],
});

export default corsMiddleware;

