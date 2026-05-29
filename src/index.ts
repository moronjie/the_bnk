import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';
import config from './config';
import cors from 'cors';
import { connectDB } from './config/db';
import redis from './config/redis.config';
import applyRoutes from './router';
import logger from './config/logger.config';
import { requestIdMiddleware, requestLoggerMiddleware } from './middleware/request.middleware';
import { globalRateLimiter } from './middleware/ratelimit.middleware';
import { auditLoggerMiddleware } from './middleware/audit.middleware';

const app = express();
const PORT = config.port || 5000;

app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
  crossOriginEmbedderPolicy: config.nodeEnv === 'production',
}));

app.use(
  cors({
    origin: [config.frontendUrl || 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(globalRateLimiter);
app.use(auditLoggerMiddleware);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redis.status === 'ready' ? 'connected' : 'disconnected',
    },
  });
});

// Routes
app.use('/api', applyRoutes);

app.use(errorHandler);

connectDB(
  config.dbUrl!,
  config.dbName!,
);

redis.connect().catch((err) => {
  logger.error('Failed to connect to Redis', { error: err });
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err });
  process.exit(1);
});

mongoose.connection.once('connected', () => {
  logger.info('Connected to MongoDB', { database: config.dbName });
  
  app.listen(PORT, () => {
    logger.info(`Server started successfully`, {
      port: PORT,
      environment: config.nodeEnv,
      nodeVersion: process.version,
    });
  });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  await mongoose.connection.close();
  await redis.disconnect();
  
  logger.info('Connections closed. Exiting process');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  
  await mongoose.connection.close();
  await redis.disconnect();
  
  logger.info('Connections closed. Exiting process');
  process.exit(0);
});
