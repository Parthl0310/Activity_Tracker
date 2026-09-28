/**
 * Enrichment Queue
 *
 * Uses BullMQ + Redis when available.
 * Falls back to in-process background execution when Redis is unavailable.
 */
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || '';

type JobData = { activityId: string; userId: string };
type JobProcessor = (data: JobData) => Promise<void>;

let jobProcessor: JobProcessor | null = null;
let enrichmentQueue: Queue | null = null;
let redisAvailable = false;

async function tryInitBullMQ(processor: JobProcessor) {
  try {
    const isTLS = REDIS_URL.startsWith('rediss://');

    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5000,
      retryStrategy: () => null, // Never retry — fail fast
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
    });

    // Suppress all raw socket errors — we test the connection manually
    connection.on('error', () => {});

    // Verify connection actually works before enabling queue
    await connection.connect();
    await connection.ping();

    enrichmentQueue = new Queue('activity-enrichment', {
      connection,
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    });

    const worker = new Worker(
      'activity-enrichment',
      async (job) => { await processor(job.data as JobData); },
      { connection }
    );
    worker.on('error', () => {});
    worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    redisAvailable = true;
    console.log('[Redis] Connected — background AI jobs enabled via BullMQ');
  } catch {
    redisAvailable = false;
    enrichmentQueue = null;
    console.warn('[Redis] Unavailable — AI enrichment will run in-process (data still saves to MongoDB)');
  }
}

/**
 * Initialize the queue system. Must be called once at startup.
 */
export async function initQueue(processor: JobProcessor) {
  jobProcessor = processor;
  if (REDIS_URL) {
    await tryInitBullMQ(processor);
  } else {
    console.warn('[Queue] No REDIS_URL set — using in-process AI enrichment');
  }
}

/**
 * Add an enrichment job.
 * Uses BullMQ if Redis is available, otherwise runs in-process after the request.
 */
export async function addEnrichmentJob(data: JobData) {
  if (redisAvailable && enrichmentQueue) {
    try {
      await enrichmentQueue.add('enrich', data);
      return;
    } catch {
      // Fall through to in-process
    }
  }

  // In-process fallback — runs after the current HTTP response is sent
  if (jobProcessor) {
    setImmediate(async () => {
      try {
        await jobProcessor!(data);
      } catch (err: any) {
        console.error('[Queue] In-process enrichment failed:', err.message);
      }
    });
  }
}
