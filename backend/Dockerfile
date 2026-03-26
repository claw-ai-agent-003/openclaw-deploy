FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_URL=redis://redis:6379

EXPOSE 3000

CMD ["node", "dist/app.js"]
