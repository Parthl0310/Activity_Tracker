import type { Request, Response } from 'express';
import { createApp } from '../dist/app.js';
import { connectDatabase } from '../dist/config/database.js';
import { initQueue } from '../dist/jobs/queue.js';
import { enrichmentProcessor } from '../dist/jobs/worker.js';

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
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Serverless invocation error',
      error: err?.message || String(err),
    });
  }
}
