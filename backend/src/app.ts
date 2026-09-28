import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRoutes } from './modules/auth/auth.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { activitiesRoutes } from './modules/activities/activities.routes.js';
import { achievedGoalsRoutes } from './modules/achievedGoals/achievedGoals.routes.js';
import { insightsRoutes } from './modules/insights/insights.routes.js';
import { summariesRoutes } from './modules/summaries/summaries.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { config } from './config/env.js';

export function createApp(): Application {
  const app = express();

  // Global Middlewares - CORS with support for local dev, custom domain, and Vercel preview URLs
  const allowedOrigins = [
    config.frontendUrl,
    config.frontendUrl.replace(/\/$/, ''),
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin === config.frontendUrl
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Simple Request Logger
  app.use((req: Request, _res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'activity-tracker-api',
    });
  });

  // Feature Routes
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);
  app.use('/activities', activitiesRoutes);
  app.use('/achieved-goals', achievedGoalsRoutes);
  app.use('/insights', insightsRoutes);
  app.use('/summaries', summariesRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/search', searchRoutes);
  app.use('/assistant', searchRoutes);

  // 404 Route handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
