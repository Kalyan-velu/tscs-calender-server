import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || '';

export const validateCredentials = (user: string, pass: string): boolean => {
  return user === ADMIN_USER && pass === ADMIN_PASS;
};

export const getSessionToken = () => SESSION_SECRET;

export const authMiddleware = async (c: Context, next: Next) => {
  const path = c.req.path;
  const method = c.req.method;

  // Allow public assets, docs, login, lookups, and read-only GET requests for batches/events
  if (
    path.startsWith('/doc') ||
    path === '/ui' || // Swagger UI
    path === '/ui/login' ||
    path === '/ui/lookup' || // Public student schedule lookup
    path.startsWith('/ui/lookup/') ||
    (method === 'GET' &&
      (path.startsWith('/batch') || path.startsWith('/event'))) || // Public read-only access to batch and event schedules
    (path.endsWith('/events') && path.includes('/ui/batches/')) // Shared weekly batch schedule UI
  ) {
    return next();
  }

  const session = getCookie(c, 'admin_session');

  if (session !== SESSION_SECRET) {
    // If it's an API request under /batch, /event, or /student, return 401
    if (
      path.startsWith('/batch') ||
      path.startsWith('/event') ||
      path.startsWith('/student')
    ) {
      return c.json({ status: false, error: { message: 'Unauthorized' } }, 401);
    }

    // For UI pages, redirect to login
    return c.redirect('/ui/login');
  }

  return next();
};
