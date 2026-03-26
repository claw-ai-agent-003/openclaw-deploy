import Redis from 'ioredis';
import { z } from 'zod';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const DeploymentStatus = z.enum(['PENDING', 'PROVISIONING', 'RUNNING', 'FAILED']);
export type DeploymentStatus = z.infer<typeof DeploymentStatus>;

export const DeploymentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  status: DeploymentStatus,
  containerId: z.string().optional(),
  url: z.string().optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  email: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Deployment = z.infer<typeof DeploymentSchema>;

class StatusService {
  private key(id: string): string {
    return `deployment:${id}`;
  }

  async getStatus(id: string): Promise<Deployment | null> {
    const data = await redis.get(this.key(id));
    if (!data) return null;

    try {
      return DeploymentSchema.parse(JSON.parse(data));
    } catch {
      return null;
    }
  }

  async setStatus(id: string, updates: Partial<Omit<Deployment, 'id'>>): Promise<void> {
    const existing = await this.getStatus(id);
    const updated: Deployment = {
      id,
      slug: existing?.slug || '',
      status: existing?.status || 'PENDING',
      containerId: existing?.containerId,
      url: existing?.url,
      error: existing?.error,
      retryCount: existing?.retryCount || 0,
      email: existing?.email,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };

    await redis.set(this.key(id), JSON.stringify(updated));
  }

  async createDeployment(id: string, slug: string, email?: string): Promise<Deployment> {
    const deployment: Deployment = {
      id,
      slug,
      status: 'PENDING',
      retryCount: 0,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(this.key(id), JSON.stringify(deployment));
    return deployment;
  }

  async deleteDeployment(id: string): Promise<void> {
    await redis.del(this.key(id));
  }
}

export const statusService = new StatusService();
