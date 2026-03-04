import cors from 'cors';
import config from '../config/env.js';

const allowedOrigins = config.cors.origins;
const isDev = config.nodeEnv === 'development';

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

    // In development, allow any localhost/127.0.0.1 origin (Vite may use 5173, 5174, 5175, etc.)
    if (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
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

