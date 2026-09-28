import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initQueue } from './jobs/queue.js';
import { enrichmentProcessor } from './jobs/worker.js';

async function bootstrap() {
  await connectDatabase();

  // Initialize job queue (Redis if available, otherwise in-process fallback)
  await initQueue(enrichmentProcessor);

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Activity Tracker API running at http://localhost:${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
// Trigger tsx watch reload with updated gemini configuration
