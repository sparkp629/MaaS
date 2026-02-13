import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`MaaS API http://localhost:${PORT}`);
});
