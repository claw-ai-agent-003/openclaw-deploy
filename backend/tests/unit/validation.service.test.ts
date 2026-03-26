import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { validateApiKey } from '../../src/services/validation.service.js';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

describe('validation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws on empty API key', async () => {
    await expect(validateApiKey('')).rejects.toThrow('Invalid API key format');
  });

  it('throws on API key shorter than 10 chars', async () => {
    await expect(validateApiKey('sk-short')).rejects.toThrow('Invalid API key format');
  });

  it('returns valid: true on 200 response', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ status: 200, data: { valid: true } });

    const result = await validateApiKey('sk-valid-api-key-1234567890');

    expect(result).toEqual({ valid: true });
  });

  it('throws INVALID_KEY on 401/403', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { status: 401 },
      isAxiosError: true,
    });

    await expect(validateApiKey('sk-invalid-key-1234567890')).rejects.toThrow(
      'Invalid API key — please check and try again'
    );
  });

  it('throws AUTH_TIMEOUT on request timeout', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue({
      code: 'ECONNABORTED',
      isAxiosError: true,
    });

    await expect(validateApiKey('sk-timeout-key-1234567890')).rejects.toThrow(
      'Verification taking longer than expected — please try again'
    );
  });

  it('throws AUTH_UNAVAILABLE on non-timeout/non-auth errors', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { status: 500 },
      isAxiosError: true,
    });

    await expect(validateApiKey('sk-error-key-1234567890')).rejects.toThrow(
      'Verification service unavailable — please try again later'
    );
  });
});
