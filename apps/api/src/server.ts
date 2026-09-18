import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { planRouter } from './routes/plan';
import { profileRouter } from './routes/profile';
import { programsRouter } from './routes/programs';
import { explainRouter } from './routes/explain';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/plan', planRouter);
app.use('/api/profile', profileRouter);
app.use('/api/programs', programsRouter);
app.use('/api/explain', explainRouter);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', service: 'apps/api' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
