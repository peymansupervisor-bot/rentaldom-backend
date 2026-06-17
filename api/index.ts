import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from '../src/lib/rateLimit';

import authRouter from '../src/routes/auth';
import listingsRouter from '../src/routes/listings';
import aiRouter from '../src/routes/ai';
import messagesRouter from '../src/routes/messages';
import placesRouter from '../src/routes/places';
import notificationsRouter from '../src/routes/notifications';
import applicationsRouter from '../src/routes/applications';

const app = express();

app.set('trust proxy', 1);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/places', placesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/applications', applicationsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

export default app;
