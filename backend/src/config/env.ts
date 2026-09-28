import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/activity_tracker',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_123',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_456',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
