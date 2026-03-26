#!/bin/bash
# Server setup script — run once on new server
set -euo pipefail

echo "Setting up OpenClaw Deploy server..."

# Install prerequisites
apt-get update && apt-get install -y \
  curl \
  nginx \
  certbot \
  docker.io \
  cron \
  && apt-get clean

# Add current user to docker group (so backend can access docker socket)
usermod -aG docker $USER || true

# Start Redis via docker-compose
cd /opt/openclaw/infra
docker-compose up -d redis

# Pre-pull the OpenClaw Docker image (required for 30-second deployment SLA)
echo "Pulling OpenClaw Docker image..."
docker pull openclaw/openclaw:latest || echo "Warning: could not pull image — will pull on first deployment"

# Set up cron health check
echo "Setting up health check cron..."
(crontab -l 2>/dev/null | grep -v health-check.sh; echo "* * * * * /opt/openclaw/infra/cron/health-check.sh >> /var/log/openclaw-health.log 2>&1") | crontab -

# Configure nginx
cp /opt/openclaw/infra/nginx.conf /etc/nginx/sites-available/openclaw
ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Enable and start backend service (when deployed)
# systemctl enable openclaw-backend

echo "Server setup complete!"
