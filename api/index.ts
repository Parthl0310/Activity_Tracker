import type { Request, Response } from 'express';
import { createApp } from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/database.js';
import { initQueue } from '../backend/src/jobs/queue.js';
import { enrichmentProcessor } from '../backend/src/jobs/worker.js';

let appInstance: any = null;

async function getApp() {
  await connectDatabase();
  if (!appInstance) {
    await initQueue(enrichmentProcessor);
    appInstance = createApp();
  }
  return appInstance;
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
