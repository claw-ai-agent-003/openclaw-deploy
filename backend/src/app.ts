import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { deployRouter } from './routes/deploy.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend in production
const distPath = IS_PROD ? path.join(__dirname, '../frontend/dist') : '';
if (IS_PROD) {
  app.use(express.static(distPath));
}

app.use('/api/deploy', deployRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug: placeholder root response
app.get('/api/debug', (_req, res) => {
  res.json({
    node: process.version,
    env: process.env.NODE_ENV,
    __dirname,
    files: {
      frontendDist: fs.existsSync(distPath),
      indexHtml: fs.existsSync(path.join(__dirname, '../frontend/dist/index.html')),
    },
  });
});

// SPA fallback — serve index.html for non-API routes
if (IS_PROD) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
