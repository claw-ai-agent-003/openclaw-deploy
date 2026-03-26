import Docker from 'dockerode';
import { randomBytes } from 'crypto';
import { AppError } from '../middleware/error-handler.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const IMAGE = process.env.OPENCLAW_IMAGE || 'openclaw/openclaw:latest';
const DOMAIN = process.env.DEPLOY_DOMAIN || 'deploy.openclaw.com';

export interface ProvisioningResult {
  containerId: string;
  slug: string;
  url: string;
  password: string;
}

function generatePassword(): string {
  return randomBytes(8).toString('base64');
}

export async function createContainer(
  apiKey: string,
  deploymentId: string,
  slug: string
): Promise<ProvisioningResult> {
  const password = generatePassword();

  const containerName = `openclaw-${slug}`;

  try {
    await docker.createContainer({
      name: containerName,
      Image: IMAGE,
      Env: [
        `OPENCLAW_API_KEY=${apiKey}`,
        `OPENCLAW_PASSWORD=${password}`,
        `DEPLOYMENT_ID=${deploymentId}`,
      ],
      Labels: {
        'openclaw-deploy': 'true',
        'deployment-id': deploymentId,
        'deployment-slug': slug,
      },
      HostConfig: {
        Memory: 2 * 1024 * 1024 * 1024,
        NanoCpus: 1 * 1e9,
        PortBindings: {
          '18789/tcp': [{ HostPort: undefined }], // dynamic port mapping
        },
        Healthcheck: {
          Test: ['CMD', 'wget', '-q', '--spider', 'http://localhost:18789/health'],
          Interval: 30 * 1000 * 1000 * 1000, // 30 seconds in nanoseconds
          Timeout: 5 * 1000 * 1000 * 1000, // 5 seconds
          Retries: 3,
        },
      },
      ExposedPorts: {
        '18789/tcp': {},
      },
    });

    const container = docker.getContainer(containerName);
    const info = await container.inspect();

    return {
      containerId: info.Id,
      slug,
      url: `https://${slug}.${DOMAIN}/`,
      password,
    };
  } catch (err) {
    const dockerErr = err as { message?: string; code?: string };
    console.error('[Provisioning] createContainer failed:', dockerErr.message);

    throw new AppError(
      500,
      'Failed to provision deployment container',
      'PROVISIONING_ERROR'
    );
  }
}

export async function startContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.start();

    // Wait for container to be healthy
    let attempts = 0;
    while (attempts < 10) {
      const info = await container.inspect();
      const health = info.state.Health?.Status;

      if (health === 'healthy') return;
      if (health === 'unhealthy') {
        throw new AppError(500, 'Container health check failed', 'HEALTH_CHECK_FAILED');
      }

      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
    }
  } catch (err) {
    if (err instanceof AppError) throw err;

    const dockerErr = err as { message?: string };
    console.error('[Provisioning] startContainer failed:', dockerErr.message);

    throw new AppError(500, 'Failed to start deployment container', 'START_ERROR');
  }
}

export async function removeContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.remove({ force: true });
  } catch (err) {
    const dockerErr = err as { message?: string; code?: string };
    // Container not found is OK — already removed
    if (dockerErr.code !== 'ENOENT' && dockerErr.code !== 'NOT_FOUND') {
      console.warn('[Provisioning] removeContainer warning:', dockerErr.message);
    }
  }
}

export async function getContainerStatus(containerId: string): Promise<string> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.state.Status;
  } catch {
    return 'unknown';
  }
}

export async function getRunningSlotCount(): Promise<number> {
  try {
    const containers = await docker.listContainers({
      all: false,
      filters: { label: ['openclaw-deploy=true'] },
    });
    return containers.length;
  } catch {
    return 0;
  }
}
