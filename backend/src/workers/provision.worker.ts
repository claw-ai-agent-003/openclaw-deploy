import { Worker } from 'bullmq';
import { connection } from '../queue/queue.config.js';
import { handleProvision } from '../queue/jobs/provision.job.js';

export const CONCURRENCY = 3;

export const provisionWorker = new Worker('provision', handleProvision, {
  connection,
  concurrency: CONCURRENCY,
});

provisionWorker.on('completed', (job) => {
  console.log(`[ProvisionWorker] Job ${job.id} completed successfully`);
});

provisionWorker.on('failed', (job, err) => {
  console.error(`[ProvisionWorker] Job ${job?.id} failed:`, err.message);
});

provisionWorker.on('error', (err) => {
  console.error('[ProvisionWorker] Worker error:', err);
});

console.log(`[ProvisionWorker] Started with concurrency ${CONCURRENCY}`);
