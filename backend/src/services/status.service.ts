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
  userId: z.string().optional(),
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
      userId: existing?.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };

    await redis.set(this.key(id), JSON.stringify(updated));
  }

  async createDeployment(id: string, slug: string, email?: string, userId?: string): Promise<Deployment> {
    const deployment: Deployment = {
      id,
      slug,
      status: 'PENDING',
      retryCount: 0,
      email,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(this.key(id), JSON.stringify(deployment));
    return deployment;
  }

  async deleteDeployment(id: string): Promise<void> {
    await redis.del(this.key(id));
  }

  async getDeploymentsByUser(userId: string): Promise<Deployment[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, k] = await redis.scan(cursor, 'MATCH', 'deployment:*', 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...k);
    } while (cursor !== '0');

    const deployments: Deployment[] = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        try {
          const d = DeploymentSchema.parse(JSON.parse(data));
          if (d.userId === userId) {
            deployments.push(d);
          }
        } catch {
          // ignore malformed
        }
      }
    }

    // Sort by createdAt descending
    deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deployments;
  }
}

export const statusService = new StatusService();
