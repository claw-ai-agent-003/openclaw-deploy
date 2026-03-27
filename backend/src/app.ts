import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { deployRouter } from './routes/deploy.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Serve frontend in production
const distPath = IS_PROD ? path.join(__dirname, '../frontend/dist') : '';
if (IS_PROD) {
  app.use(express.static(distPath));
}

app.use('/api/deploy', deployRouter());
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback — serve index.html for non-API routes
if (IS_PROD) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
