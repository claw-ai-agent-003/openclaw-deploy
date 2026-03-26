import axios from 'axios';
import { AppError } from '../middleware/error-handler.js';

const AUTH_URL = process.env.OPENCLAW_AUTH_URL || 'https://auth.openclaw.com/api/validate';
const TIMEOUT_MS = 500;

export interface ValidationResult {
  valid: boolean;
}

export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new AppError(400, 'Invalid API key format', 'INVALID_KEY_FORMAT');
  }

  try {
    const response = await axios.post(
      AUTH_URL,
      { apiKey },
      { timeout: TIMEOUT_MS }
    );

    if (response.status === 200 && response.data.valid === true) {
      return { valid: true };
    }

    throw new AppError(400, 'Invalid API key — please check and try again', 'INVALID_KEY');
  } catch (err) {
    if (err instanceof AppError) throw err;

    const axiosErr = err as { code?: string; response?: { status?: number } };

    if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ETIMEDOUT') {
      throw new AppError(
        503,
        'Verification taking longer than expected — please try again',
        'AUTH_TIMEOUT'
      );
    }

    if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
      throw new AppError(400, 'Invalid API key — please check and try again', 'INVALID_KEY');
    }

    throw new AppError(
      503,
      'Verification service unavailable — please try again later',
      'AUTH_UNAVAILABLE'
    );
  }
}
