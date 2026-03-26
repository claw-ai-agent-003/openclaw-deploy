FROM node:20-alpine AS builder

WORKDIR /app

# Build frontend
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci && npm run build

# Build backend
COPY backend/package*.json backend/
RUN cd backend && npm install

COPY backend/tsconfig.json backend/
COPY backend/src/ backend/src/

RUN cd backend && npm run build

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
