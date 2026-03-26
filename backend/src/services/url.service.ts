import { randomBytes } from 'crypto';
import { AppError } from '../middleware/error-handler.js';
import { statusService } from './status.service.js';

const DOMAIN = process.env.DEPLOY_DOMAIN || 'deploy.openclaw.com';
const MAX_RETRIES = 3;

export function generateSlug(): string {
  return randomBytes(4).toString('hex');
}

export async function generateUniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const slug = generateSlug();
    const existing = await statusService.getStatus(slug);

    if (!existing) {
      return slug;
    }
  }

  throw new AppError(500, 'Unable to generate unique deployment URL', 'SLUG_EXHAUSTED');
}

export function buildUrl(slug: string): string {
  return `https://${slug}.${DOMAIN}/`;
}
