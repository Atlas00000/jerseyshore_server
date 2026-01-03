import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { requestLogger, errorLogger } from './utils/logging/middleware.js';
import printsRouter from './routes/prints.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (enhanced)
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/prints', printsRouter);

// Error handling middleware (enhanced)
app.use(errorLogger);

// Error response handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    requestId: (req as any).requestId,
  });
});

// 404 handler
app.use((_req, res) => {
  logger.warn('Route not found', {
    context: 'Express',
    metadata: {
      method: _req.method,
      path: _req.path,
    },
  });
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    context: 'Server',
    metadata: {
      env: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN,
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', { context: 'Server' });
  logger.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', { context: 'Server' });
  logger.close();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    context: 'Process',
    error: reason instanceof Error ? reason : new Error(String(reason)),
    metadata: { promise: String(promise) },
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    context: 'Process',
    error,
  });
  process.exit(1);
});



