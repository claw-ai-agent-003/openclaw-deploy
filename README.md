# OpenClaw One-Click Deployment

Deploy OpenClaw to your own cloud server in under 3 minutes. Paste your API key, click deploy, get a running server.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/claw-ai-agent-003/openclaw-deploy.git
cd openclaw-deploy

# Configure environment
cp backend/.env.example backend/.env  # edit with your values

# Start services
docker-compose -f infra/docker-compose.yml up -d

# Development
npm install
npm run dev  # runs frontend + backend concurrently
```

## Architecture

```
Browser → nginx → React SPA (static)
                 → Express API (:3000)
                       → Redis
                       → Docker socket
                             → OpenClaw containers (per deployment)
```

## Project Structure

```
openclaw-deploy/
├── frontend/          # React SPA
├── backend/           # Express API + BullMQ workers
├── infra/            # docker-compose, nginx, cron, server setup
├── .github/
│   └── workflows/
│       ├── ci.yml          # Type check + tests on every push
│       └── deploy.yml      # Build + push + SSH restart on main
└── README.md
```

## CI/CD

### GitHub Actions Secrets (required for Deploy workflow)

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Your server IP or hostname (e.g. `deploy.openclaw.com`) |
| `DEPLOY_USER` | SSH user on the server (e.g. `root`) |
| `DEPLOY_SSH_KEY` | Private SSH key with access to the server |

The deploy workflow runs on every push to `main`:
1. Builds and pushes `ghcr.io/<owner>/openclaw-deploy` Docker image
2. SSHs to your server
3. Pulls the new image + rebuilds frontend + restarts services

### CI Checks

The `ci.yml` workflow runs on every push/PR:
- Backend: `npm run build --workspace=backend` (TypeScript type check)
- Backend: `npm run test --workspace=backend` (Vitest unit tests)
- Frontend: `npm run build --workspace=frontend` (TypeScript + Vite build)
- Frontend: `npm run test --workspace=frontend` (Vitest unit tests)

## Server Setup

Run once on a fresh server:

```bash
curl -fsSL https://raw.githubusercontent.com/claw-ai-agent-003/openclaw-deploy/main/infra/server-setup.sh | bash
```

Then clone the repo and configure:

```bash
git clone https://github.com/claw-ai-agent-003/openclaw-deploy.git /opt/openclaw-deploy
cd /opt/openclaw-deploy
cp backend/.env.example backend/.env
# Edit .env with your OPENCLAW_AUTH_URL and DEPLOY_DOMAIN
docker-compose up -d
```

## Production Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

The backend container has the Docker socket mounted, so it can spawn sibling containers for deployments.

## Blocking Dependencies

1. **`Dockerfile.openclaw`** — you must build and push your custom OpenClaw image that:
   - Exposes port 18789
   - Accepts `OPENCLAW_API_KEY` and `OPENCLAW_PASSWORD` env vars
   - Has a `/health` endpoint

2. **`OPENCLAW_AUTH_URL`** — must be set in `backend/.env` to your API key validation endpoint
