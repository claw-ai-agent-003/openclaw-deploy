import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateApiKey } from '../services/validation.service.js';
import { generateUniqueSlug, buildUrl } from '../services/url.service.js';
import { statusService } from '../services/status.service.js';
import { provisionQueue } from '../queue/queue.config.js';
import { getRunningSlotCount } from '../services/provisioning.service.js';

const router = Router();

const MAX_SLOTS = 10; // TODO: calibrate based on load testing

const DeploySchema = z.object({
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
  email: z.string().email().optional(),
});

const StatusSchema = z.object({
  status: z.enum(['PENDING', 'PROVISIONING', 'RUNNING', 'FAILED']),
  url: z.string().optional(),
  error: z.string().optional(),
});

// POST /api/deploy
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = DeploySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const { apiKey, email } = parsed.data;

    // Check capacity
    const runningCount = await getRunningSlotCount();
    if (runningCount >= MAX_SLOTS) {
      res.status(503).json({
        error: 'High demand — you\'re in the queue. We\'ll notify you when your spot is ready.',
        code: 'CAPACITY_FULL',
        position: runningCount - MAX_SLOTS + 1,
      });
      return;
    }

    // Validate API key
    await validateApiKey(apiKey);

    // Create deployment record
    const deploymentId = uuidv4();
    const slug = await generateUniqueSlug();

    await statusService.createDeployment(deploymentId, slug, email);

    // Enqueue provisioning job (API key passed via job data — not persisted)
    await provisionQueue.add('provision', {
      deploymentId,
      slug,
      apiKey,
    });

    console.log(`[Deploy] Created deployment ${deploymentId} for slug ${slug}`);

    res.status(202).json({ id: deploymentId });
  })
);

// GET /api/deploy/:id/status
router.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deployment = await statusService.getStatus(id);

    if (!deployment) {
      res.status(404).json({
        error: 'Deployment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      status: deployment.status,
      url: deployment.url,
      error: deployment.error,
    });
  })
);

// DELETE /api/deploy/:id (for cleanup)
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deployment = await statusService.getStatus(id);

    if (!deployment) {
      res.status(404).json({
        error: 'Deployment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // TODO: implement container removal
    await statusService.deleteDeployment(id);

    res.json({ deleted: true });
  })
);

export { router as deployRouter };
