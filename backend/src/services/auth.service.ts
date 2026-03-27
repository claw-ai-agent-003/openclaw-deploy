import Redis from 'ioredis';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder_client_id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder_client_secret';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export interface AppUser {
  id: string;
  githubId: number;
  username: string;
  email: string | null;
  avatarUrl: string;
  createdAt: string;
}

function userKey(githubId: number): string {
  return `user:${githubId}`;
}

function sessionKey(token: string): string {
  return `session:${token}`;
}

export function buildGitHubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    },
    {
      headers: { Accept: 'application/json' },
    }
  );
  const data = response.data as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error || 'Failed to exchange code for token');
  }
  return data.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await axios.get<GitHubUser>('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function upsertUser(githubUser: GitHubUser): Promise<AppUser> {
  const existing = await redis.get(userKey(githubUser.id));
  if (existing) {
    return JSON.parse(existing) as AppUser;
  }

  const appUser: AppUser = {
    id: uuidv4(),
    githubId: githubUser.id,
    username: githubUser.login,
    email: githubUser.email,
    avatarUrl: githubUser.avatar_url,
    createdAt: new Date().toISOString(),
  };

  await redis.set(userKey(githubUser.id), JSON.stringify(appUser));
  return appUser;
}

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  await redis.setex(
    sessionKey(token),
    SESSION_EXPIRY_SECONDS,
    JSON.stringify({ userId })
  );
  return token;
}

export async function getSession(token: string): Promise<{ userId: string } | null> {
  const data = await redis.get(sessionKey(token));
  if (!data) return null;
  return JSON.parse(data) as { userId: string };
}

export async function deleteSession(token: string): Promise<void> {
  await redis.del(sessionKey(token));
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  // Scan all user keys to find by id field — stored as user:{githubId}
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const user = JSON.parse(data) as AppUser;
        if (user.id === userId) return user;
      }
    }
  } while (cursor !== '0');
  return null;
}
