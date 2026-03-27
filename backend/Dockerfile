FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# ─── Build frontend ────────────────────────────────────────────────
COPY frontend/package*.json frontend/
RUN npm ci --workspace=frontend
COPY frontend/ frontend/
RUN npm run build --workspace=frontend

# ─── Build backend ─────────────────────────────────────────────────
COPY backend/package*.json backend/
RUN npm install --workspace=backend
COPY backend/tsconfig.json backend/
COPY backend/src/ backend/src/
RUN npm run build --workspace=backend

# ─── Production image ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy backend production deps (hoisted to /app/node_modules)
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/backend/dist ./dist/
COPY --from=builder /app/backend/package*.json ./

# Copy frontend static files
COPY --from=builder /app/frontend/dist ./frontend/dist/

ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_URL=redis://redis:6379

EXPOSE 3000

CMD ["node", "dist/app.js"]
