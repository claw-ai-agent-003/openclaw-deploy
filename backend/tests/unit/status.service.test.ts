import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statusService, DeploymentStatus } from '../../src/services/status.service.js';
import Redis from 'ioredis';

vi.mock('ioredis', () => {
  const mRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };
  return { default: vi.fn(() => mRedis) };
});

describe('status.service', () => {
  let mockRedis: ReturnType<typeof Redis>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const RedisMock = vi.mocked(Redis);
    mockRedis = new RedisMock();
  });

  describe('getStatus', () => {
    it('returns null when key not found', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await statusService.getStatus('nonexistent');

      expect(result).toBeNull();
    });

    it('returns parsed deployment when found', async () => {
      const deployment = {
        id: '123',
        slug: 'abc12345',
        status: 'RUNNING' as DeploymentStatus,
        containerId: 'container-1',
        url: 'https://abc12345.deploy.openclaw.com/',
        retryCount: 0,
        createdAt: '2026-03-26T00:00:00Z',
        updatedAt: '2026-03-26T00:01:00Z',
      };
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(deployment));

      const result = await statusService.getStatus('123');

      expect(result).toMatchObject({ id: '123', slug: 'abc12345', status: 'RUNNING' });
    });

    it('returns null on parse error', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('not valid json');

      const result = await statusService.getStatus('bad-data');

      expect(result).toBeNull();
    });
  });

  describe('createDeployment', () => {
    it('stores deployment in Redis', async () => {
      vi.mocked(mockRedis.set).mockResolvedValue('OK');

      const result = await statusService.createDeployment('id-123', 'slug-abc');

      expect(result).toMatchObject({ id: 'id-123', slug: 'slug-abc', status: 'PENDING' });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'deployment:id-123',
        expect.stringContaining('"id":"id-123"')
      );
    });
  });

  describe('setStatus', () => {
    it('merges updates with existing deployment', async () => {
      const existing = {
        id: 'id-123',
        slug: 'slug-abc',
        status: 'PENDING' as DeploymentStatus,
        retryCount: 0,
        createdAt: '2026-03-26T00:00:00Z',
        updatedAt: '2026-03-26T00:00:00Z',
      };
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(existing));
      vi.mocked(mockRedis.set).mockResolvedValue('OK');

      await statusService.setStatus('id-123', { status: 'RUNNING', url: 'https://x.y/' });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'deployment:id-123',
        expect.stringContaining('"status":"RUNNING"')
      );
    });
  });

  describe('deleteDeployment', () => {
    it('deletes key from Redis', async () => {
      vi.mocked(mockRedis.del).mockResolvedValue(1);

      await statusService.deleteDeployment('id-123');

      expect(mockRedis.del).toHaveBeenCalledWith('deployment:id-123');
    });
  });
});
