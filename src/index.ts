import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimiter, RedisStore } from 'hono-rate-limiter';
import { redis } from './cache/redis.js';
import { pool } from './db/index.js';
import { Batches } from './routes/batch.route.js';
import { events } from './routes/event.route.js';
import { Students } from './routes/student.route.js';
import { authUi } from './routes/ui/auth.ui.js';
import { batchesUi } from './routes/ui/batches.ui.js';
import { eventsUi } from './routes/ui/events.ui.js';
import { lookupUi } from './routes/ui/lookup.ui.js';
import { studentsUi } from './routes/ui/students.ui.js';
import { authMiddleware } from './utils/auth.js';
import { startScheduler } from './utils/scheduler.js';

const app = new OpenAPIHono();
await redis.connect();

app.use(
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (c) => c.req.header('x-forwarded-for') ?? '',
    store: new RedisStore({
      client: redis,
      prefix: 'hrl:',
      resetExpiryOnChange: true,
    }),
    handler: (c) => {
      return c.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: c.res.headers.get('Retry-After'),
        },
        429,
      );
    },
  }),
);

app.use('*', logger());
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use('*', cors({ origin: corsOrigins }));
app.use('/ui/*', authMiddleware);
app.use(
  '/static/*',
  serveStatic({
    root: './public',
    rewriteRequestPath: (p) => p.replace(/^\/static/, ''),
  }),
);
app
  .route('/batch', Batches)
  .route('/event', events)
  .route('/student', Students)
  .route('/ui', authUi)
  .route('/ui/lookup', lookupUi)
  .route('/ui/events', eventsUi)
  .route('/ui/batches', batchesUi)
  .route('/ui/students', studentsUi);

// Auto-generated spec from all registered routes
app.doc('/v1', {
  openapi: '3.1.0',
  info: { title: 'Scheduler API', version: 'v1' },
});

app.get('/docs', swaggerUI({ url: '/v1' }));

let schedulerTimer: NodeJS.Timeout | undefined;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  schedulerTimer = startScheduler();
}

const server = serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT || '8000', 10),
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
    console.log(`Swagger UI at http://localhost:${info.port}/docs`);
  },
);

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  if (schedulerTimer) clearInterval(schedulerTimer);
  server.close((err) => {
    if (err) console.error(err);
    pool.end(async () => {
      await redis.disconnect();
      process.exit(err ? 1 : 0);
    });
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
  setTimeout(() => process.exit(1), 10_000).unref();
});
