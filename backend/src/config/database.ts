import mongoose from 'mongoose';
import { config } from './env.js';

let isConnecting = false;

export async function connectDatabase(): Promise<void> {
  // If already connected (1) or connecting (2), reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (isConnecting) {
    return;
  }

  try {
    isConnecting = true;
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected');
  }
}
