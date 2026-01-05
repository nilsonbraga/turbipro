import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { modelRouter } from './routes/modelRouter';
import { authRouter } from './routes/authRouter';

const app = express();

app.use(helmet());
app.use(cors());
// Increase body size limits to handle base64 images (Studio, uploads, etc.)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/api', modelRouter);

app.use(errorHandler);

export { app };
