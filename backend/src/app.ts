import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { deployRouter } from './routes/deploy.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/deploy', deployRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
