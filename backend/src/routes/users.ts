import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { statusService } from '../services/status.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/users/me/deployments
router.get(
  '/me/deployments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const deployments = await statusService.getDeploymentsByUser(userId);

    res.json({
      deployments: deployments.map((d) => ({
        id: d.id,
        slug: d.slug,
        status: d.status,
        url: d.url,
        error: d.error,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  })
);

// DELETE /api/users/me/deployments/:id
router.delete(
  '/me/deployments/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const deployment = await statusService.getStatus(id);

    if (!deployment) {
      res.status(404).json({
        error: 'Deployment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (deployment.userId !== userId) {
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

export { router as usersRouter };
