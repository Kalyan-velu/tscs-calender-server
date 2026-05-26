import {serve} from '@hono/node-server';
import {swaggerUI} from '@hono/swagger-ui';
import {OpenAPIHono} from '@hono/zod-openapi';
import {cors} from 'hono/cors';
import {logger} from 'hono/logger';
import {Batches} from './routes/batch.route.js';
import {events} from './routes/event.route.js';
import {Students} from './routes/student.route.js';
import {authUi} from './routes/ui/auth.ui.js';
import {batchesUi} from './routes/ui/batches.ui.js';
import {eventsUi} from './routes/ui/events.ui.js';
import {lookupUi} from './routes/ui/lookup.ui.js';
import {studentsUi} from './routes/ui/students.ui.js';
import {authMiddleware} from './utils/auth.js';

const app = new OpenAPIHono();

app.use('*', logger());
app.use('*', cors({ origin: 'http://localhost:8080' }));
app.use('*', authMiddleware);

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

const server = serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT || '8000'),
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
    console.log(`Swagger UI at http://localhost:${info.port}/ui`);
  },
);

process.on('SIGINT', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
});
