import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
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
if (IS_PROD) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
}

app.use('/api/deploy', deployRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
