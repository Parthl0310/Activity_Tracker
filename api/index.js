const { createApp } = require('../backend/dist/app.js');
const { connectDatabase } = require('../backend/dist/config/database.js');
const { initQueue } = require('../backend/dist/jobs/queue.js');
const { enrichmentProcessor } = require('../backend/dist/jobs/worker.js');

let appInstance = null;

async function getApp() {
  await connectDatabase();
  if (!appInstance) {
    await initQueue(enrichmentProcessor);
    appInstance = createApp();
  }
  return appInstance;
}

module.exports = async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Serverless invocation error',
      error: err && err.message ? err.message : String(err),
    });
  }
};
