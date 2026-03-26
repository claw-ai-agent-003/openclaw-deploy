import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSlug, generateUniqueSlug, buildUrl } from '../../src/services/url.service.js';

const mockGetStatus = vi.fn();

vi.mock('../../src/services/status.service.js', () => ({
  get statusService() {
    return {
      getStatus: mockGetStatus,
    };
  },
}));

describe('url.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('returns an 8-character hex string', () => {
      const slug = generateSlug();
      expect(slug).toMatch(/^[a-f0-9]{8}$/);
    });

    it('returns different values on successive calls', () => {
      const slug1 = generateSlug();
      const slug2 = generateSlug();
      expect(slug1).not.toEqual(slug2);
    });
  });

  describe('generateUniqueSlug', () => {
    it('returns slug when no collision', async () => {
      mockGetStatus.mockResolvedValue(null);

      const slug = await generateUniqueSlug();

      expect(slug).toMatch(/^[a-f0-9]{8}$/);
      expect(mockGetStatus).toHaveBeenCalledWith(slug);
    });

    it('retries on collision', async () => {
      mockGetStatus
        .mockResolvedValueOnce({ id: '1', slug: 'aaaaaaa', status: 'RUNNING' } as any)
        .mockResolvedValueOnce({ id: '2', slug: 'bbbbbbb', status: 'RUNNING' } as any)
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueSlug();

      expect(slug).toMatch(/^[a-f0-9]{8}$/);
      expect(mockGetStatus).toHaveBeenCalledTimes(3);
    });

    it('throws after 3 collisions', async () => {
      mockGetStatus.mockResolvedValue({ id: 'x', slug: 'taken', status: 'RUNNING' } as any);

      await expect(generateUniqueSlug()).rejects.toThrow(
        'Unable to generate unique deployment URL'
      );
      expect(mockGetStatus).toHaveBeenCalledTimes(3);
    });
  });

  describe('buildUrl', () => {
    it('returns a full URL with slug', () => {
      const url = buildUrl('abc12345');
      expect(url).toBe('https://abc12345.deploy.openclaw.com/');
    });
  });
});
