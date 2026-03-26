import { Job } from 'bullmq';
import { statusService } from '../../services/status.service.js';
import { createContainer, startContainer, removeContainer } from '../../services/provisioning.service.js';

export interface ProvisionJobData {
  deploymentId: string;
  slug: string;
  apiKey: string;
}

export async function handleProvision(job: Job<ProvisionJobData>): Promise<void> {
  const { deploymentId, slug, apiKey } = job.data;

  console.log(`[ProvisionJob] Starting deployment ${deploymentId} (attempt ${job.attemptsMade + 1})`);

  await statusService.setStatus(deploymentId, { status: 'PROVISIONING' });

  try {
    // Create the container
    const result = await createContainer(apiKey, deploymentId, slug);

    // Start the container
    await startContainer(result.containerId);

    // Update status to RUNNING
    await statusService.setStatus(deploymentId, {
      status: 'RUNNING',
      containerId: result.containerId,
      url: result.url,
    });

    console.log(`[ProvisionJob] Deployment ${deploymentId} is running at ${result.url}`);
  } catch (err) {
    const error = err as Error;
    console.error(`[ProvisionJob] Deployment ${deploymentId} failed:`, error.message);

    const deployment = await statusService.getStatus(deploymentId);
    const retryCount = (deployment?.retryCount || 0) + 1;

    await statusService.setStatus(deploymentId, {
      status: 'FAILED',
      error: error.message,
      retryCount,
    });

    throw error;
  }
}
