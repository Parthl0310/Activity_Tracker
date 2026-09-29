import type { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import { initQueue } from '../src/jobs/queue.js';
import { enrichmentProcessor } from '../src/jobs/worker.js';

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
