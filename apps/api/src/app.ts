import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import analyticsRoutes from './routes/analytics';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';

export const app = express();

// Security Headers (Chapter 18)
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Strict CORS (Chapter 18 & 29: Narrow allowlist, no credentials with wildcard)
const allowedOrigins = [
  config.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by FinPilot Strict Policy'));
    },
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Redacting Request Logger
app.use(requestLogger);

// Global Rate Limiter
app.use('/api', apiRateLimiter);

// Mount Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);

// Centralized Error Handling
app.use(errorHandler);
