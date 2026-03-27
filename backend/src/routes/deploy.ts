import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateApiKey } from '../services/validation.service.js';
import { generateUniqueSlug, buildUrl } from '../services/url.service.js';
import { statusService } from '../services/status.service.js';
import { provisionQueue } from '../queue/queue.config.js';
import { getRunningSlotCount } from '../services/provisioning.service.js';
import { requireAuth } from '../middleware/auth.js';

export interface CreateDeployRouterOptions {
  skipAuth?: boolean;
}

export function createDeployRouter(options: CreateDeployRouterOptions = {}): Router {
  const router = Router();
  const auth = options.skipAuth
    ? ((_req: any, _res: any, next: any) => next())
    : requireAuth;

  const MAX_SLOTS = 10; // TODO: calibrate based on load testing

  const DeploySchema = z.object({
    apiKey: z.string().min(10, 'API key must be at least 10 characters'),
    email: z.string().email().optional(),
  });

  // POST /api/deploy
  router.post(
    '/',
    auth as any,
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
      const userId = req.user!.id;

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

      await statusService.createDeployment(deploymentId, slug, email, userId);

      // Enqueue provisioning job
      await provisionQueue.add('provision', {
        deploymentId,
        slug,
        apiKey,
        userId,
      });

      console.log(`[Deploy] Created deployment ${deploymentId} for user ${userId} slug ${slug}`);

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

      // Include email/password only for the owner
      const isOwner = req.user?.id === deployment.userId;
      const response: Record<string, unknown> = {
        status: deployment.status,
        url: deployment.url,
        error: deployment.error,
      };

      if (isOwner) {
        response.email = deployment.email;
      }

      res.json(response);
    })
  );

  // DELETE /api/deploy/:id
  router.delete(
    '/:id',
    auth as any,
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

      if (deployment.userId && deployment.userId !== req.user!.id) {
        res.status(403).json({
          error: 'Not authorized to delete this deployment',
          code: 'FORBIDDEN',
        });
        return;
      }

      await statusService.setStatus(id, { status: 'FAILED', error: 'Cancelled by user' });

      res.json({ deleted: true });
    })
  );

  return router;
}

// Default export for backwards compat
export { createDeployRouter as deployRouter };
