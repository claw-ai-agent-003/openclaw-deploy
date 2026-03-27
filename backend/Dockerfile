FROM node:20-alpine AS builder

WORKDIR /app

# Build frontend (monorepo workspace — needs root lockfile)
COPY package.json package-lock.json ./
COPY frontend/package*.json frontend/
RUN npm ci --workspace=frontend
COPY frontend/ frontend/
RUN npm run build --workspace=frontend

# Build backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/frontend/dist ./frontend/dist/
COPY --from=builder /app/backend/dist ./dist/
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules/

ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_URL=redis://redis:6379

EXPOSE 3000

CMD ["node", "dist/app.js"]
