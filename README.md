# OpenClaw One-Click Deployment

Deploy OpenClaw to your own cloud server in under 3 minutes. Paste your API key, click deploy, get a running server.

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/openclaw-deploy.git
cd openclaw-deploy

# 2. Set up server
# Copy backend/.env.example to backend/.env and configure
cp backend/.env.example backend/.env

# 3. Install dependencies
npm install

# 4. Start services
docker-compose -f infra/docker-compose.yml up -d

# 5. Start backend (development)
npm run dev

# 6. Start frontend (development)
npm run dev:frontend
```

## Architecture

```
Browser → nginx → React SPA (static)
                 → Express API (backend)
                       → Redis (state + queue)
                       → Docker socket
                             → OpenClaw containers (per deployment)
```

## Project Structure

```
openclaw-deploy/
├── frontend/          # React SPA
├── backend/           # Express API
├── infra/            # docker-compose, nginx, cron
└── README.md
```

## Blocking Dependencies

1. **`Dockerfile.openclaw`** — you must build and push your custom OpenClaw image
2. **`OPENCLAW_AUTH_URL`** — your API key validation endpoint
