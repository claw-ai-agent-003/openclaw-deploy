#!/bin/bash
# Health check cron script — runs every minute via crontab:
# * * * * * /opt/openclaw/health-check.sh >> /var/log/openclaw-health.log 2>&1

set -euo pipefail

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting health check"

# Find all running OpenClaw containers
CONTAINERS=$(docker ps --filter label=openclaw-deploy=true --format '{{.Names}}')

if [ -z "$CONTAINERS" ]; then
  echo "$LOG_PREFIX No OpenClaw containers running"
  exit 0
fi

for CONTAINER in $CONTAINERS; do
  echo "$LOG_PREFIX Checking $CONTAINER"

  # Check if container is running
  if ! docker ps --filter name="$CONTAINER" --filter status=running | grep -q "$CONTAINER"; then
    echo "$LOG_PREFIX $CONTAINER is not running — attempting restart"

    RESTART_COUNT=$(docker inspect "$CONTAINER" --format '{{.RestartCount}}' 2>/dev/null || echo 0)

    if [ "$RESTART_COUNT" -ge 3 ]; then
      echo "$LOG_PREFIX $CONTAINER has failed 3+ restarts — skipping (manual intervention needed)"
      # TODO: send alert email (Phase 2)
      continue
    fi

    docker start "$CONTAINER" || {
      echo "$LOG_PREFIX Failed to start $CONTAINER"
      # TODO: send alert email (Phase 2)
    }
  else
    echo "$LOG_PREFIX $CONTAINER is healthy"
  fi
done

echo "$LOG_PREFIX Health check complete"
