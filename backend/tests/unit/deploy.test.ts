import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { deployRouter } from '../../src/routes/deploy.js';
import * as validation from '../../src/services/validation.service.js';
import * as urlService from '../../src/services/url.service.js';
import * as statusService from '../../src/services/status.service.js';
import * as provisioning from '../../src/services/provisioning.service.js';
import * as queue from '../../src/queue/queue.config.js';
import { AppError } from '../../src/middleware/error-handler.js';

vi.mock('../../src/services/validation.service.js');
vi.mock('../../src/services/url.service.js');
vi.mock('../../src/services/status.service.js');
vi.mock('../../src/services/provisioning.service.js');
vi.mock('../../src/queue/queue.config.js');

const mockedValidation = vi.mocked(validation);
const mockedUrlService = vi.mocked(urlService);
const mockedStatus = vi.mocked(statusService);
const mockedProvisioning = vi.mocked(provisioning);
const mockedQueue = vi.mocked(queue);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/deploy', deployRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
}

describe('deploy routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/deploy', () => {
    it('returns 400 for empty apiKey', async () => {
      const app = createApp();

      const res = await request(app)
        .post('/api/deploy')
        .send({ apiKey: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for apiKey shorter than 10 chars', async () => {
      const app = createApp();

      const res = await request(app)
        .post('/api/deploy')
        .send({ apiKey: 'sk-short' });

      expect(res.status).toBe(400);
    });

    it('returns 202 with deployment id on success', async () => {
      vi.mocked(mockedValidation.validateApiKey).mockResolvedValue({ valid: true });
      vi.mocked(mockedUrlService.generateUniqueSlug).mockResolvedValue('abc12345');
      vi.mocked(mockedStatus.statusService.createDeployment).mockResolvedValue({} as any);
      vi.mocked(mockedProvisioning.getRunningSlotCount).mockResolvedValue(0);
      vi.mocked(mockedQueue.provisionQueue.add).mockResolvedValue({} as any);

      const app = createApp();

      const res = await request(app)
        .post('/api/deploy')
        .send({ apiKey: 'sk-valid-api-key-1234567890' });

      expect(res.status).toBe(202);
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 for invalid API key', async () => {
      vi.mocked(mockedValidation.validateApiKey).mockRejectedValue(
        new AppError(400, 'Invalid API key', 'INVALID_KEY')
      );

      const app = createApp();

      const res = await request(app)
        .post('/api/deploy')
        .send({ apiKey: 'sk-invalid-key-1234567890' });

      expect(res.status).toBe(400);
    });

    it('returns 503 when at capacity', async () => {
      vi.mocked(mockedProvisioning.getRunningSlotCount).mockResolvedValue(10);

      const app = createApp();

      const res = await request(app)
        .post('/api/deploy')
        .send({ apiKey: 'sk-capacity-key-1234567890' });

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('CAPACITY_FULL');
    });
  });

  describe('GET /api/deploy/:id/status', () => {
    it('returns 404 for unknown deployment', async () => {
      vi.mocked(mockedStatus.statusService.getStatus).mockResolvedValue(null);

      const app = createApp();

      const res = await request(app).get('/api/deploy/unknown-id/status');

      expect(res.status).toBe(404);
    });

    it('returns status for known deployment', async () => {
      vi.mocked(mockedStatus.statusService.getStatus).mockResolvedValue({
        id: 'id-123',
        slug: 'abc12345',
        status: 'RUNNING' as const,
        url: 'https://abc12345.deploy.openclaw.com/',
        retryCount: 0,
        createdAt: '2026-03-26T00:00:00Z',
        updatedAt: '2026-03-26T00:01:00Z',
      });

      const app = createApp();

      const res = await request(app).get('/api/deploy/id-123/status');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RUNNING');
      expect(res.body.url).toBe('https://abc12345.deploy.openclaw.com/');
    });
  });
});
