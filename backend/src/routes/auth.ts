import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  buildGitHubAuthUrl,
  exchangeCodeForToken,
  fetchGitHubUser,
  upsertUser,
  createSession,
  deleteSession,
} from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// GET /api/auth/github — redirect to GitHub authorize
router.get('/github', (_req, res) => {
  const url = buildGitHubAuthUrl();
  res.redirect(url);
});

// GET /api/auth/github/callback — handle OAuth callback
router.get(
  '/github/callback',
  asyncHandler(async (req, res) => {
    const { code, error } = req.query;

    if (error || !code) {
      res.redirect('/login?error=github_denied');
      return;
    }

    try {
      const accessToken = await exchangeCodeForToken(code as string);
      const githubUser = await fetchGitHubUser(accessToken);
      const appUser = await upsertUser(githubUser);
      const sessionToken = await createSession(appUser.id);

      res.cookie('session_token', sessionToken, COOKIE_OPTIONS);
      res.redirect('/dashboard');
    } catch (err) {
      console.error('[Auth] GitHub callback error:', err);
      res.redirect('/login?error=auth_failed');
    }
  })
);

// GET /api/auth/me — return current user info
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      id: req.user!.id,
      username: req.user!.username,
      email: req.user!.email,
      avatarUrl: req.user!.avatarUrl,
    });
  })
);

// POST /api/auth/logout — delete session
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.session_token;
    if (token) {
      await deleteSession(token);
    }
    res.clearCookie('session_token', COOKIE_OPTIONS);
    res.json({ ok: true });
  })
);

export { router as authRouter };
