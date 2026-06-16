import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET env var is required');
}
if (!process.env.ADMIN_USERNAME) {
  throw new Error('ADMIN_USERNAME env var is required');
}
if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
  throw new Error(
    'ADMIN_PASSWORD_HASH (bcrypt hash, recommended) or ADMIN_PASSWORD env var is required',
  );
}

const SESSION_SECRET = process.env.SESSION_SECRET;
const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

const isProduction = process.env.NODE_ENV === 'production';

const timingSafeEquals = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // Run dummy comparison to prevent length-based timing leak
  crypto.timingSafeEqual(
    bufA.length === bufB.length ? bufA : Buffer.alloc(bufB.length),
    bufB,
  );
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export const validateCredentials = async (
  user: string,
  pass: string,
): Promise<boolean> => {
  if (!timingSafeEquals(user, ADMIN_USER)) return false;
  if (ADMIN_PASS_HASH) return bcrypt.compare(pass, ADMIN_PASS_HASH);
  return timingSafeEquals(pass, ADMIN_PASS!);
};

export const getSessionToken = () => SESSION_SECRET;

export const createStudentToken = (
  studentId: string,
  batchId: string,
): string => {
  const payload = `${studentId}:${batchId}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
};

export const verifyStudentToken = (
  token: string,
): { studentId: string; batchId: string } | null => {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 4) return null;
  const [studentId, batchId, timestampStr, signature] = parts;

  const payload = `${studentId}:${batchId}:${timestampStr}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  if (!timingSafeEquals(signature, expectedSignature)) {
    return null;
  }

  const timestamp = parseInt(timestampStr, 10);
  const age = Date.now() - timestamp;
  if (age > 30 * 24 * 60 * 60 * 1000) {
    // 30 days
    return null;
  }

  return { studentId, batchId };
};

export const authMiddleware = async (c: Context, next: Next) => {
  const path = c.req.path;
  const method = c.req.method;

  if (
    path === '/ui/login' ||
    path === '/ui/lookup' ||
    path.startsWith('/ui/lookup/')
  ) {
    return next();
  }

  // Check strict student access for weekly schedules
  const batchEventsMatch = path.match(/^\/ui\/batches\/([^/]+)\/events$/);
  if (batchEventsMatch) {
    const batchId = batchEventsMatch[1];

    // Admin is authorized to view all
    const adminSession = getCookie(c, 'admin_session');
    if (adminSession === SESSION_SECRET) {
      return next();
    }

    // Student is authorized ONLY for their own batch
    let studentSession = getCookie(c, 'student_session');
    if (!studentSession) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        studentSession = authHeader.substring(7);
      }
    }

    if (studentSession) {
      const verified = verifyStudentToken(studentSession);
      if (verified && verified.batchId === batchId) {
        return next();
      }
    }

    return c.redirect('/ui/lookup');
  }

  const session = getCookie(c, 'admin_session');

  if (session !== SESSION_SECRET) {
    return c.redirect('/ui/login');
  }

  // Set CSRF token cookie (non-httpOnly so JS can read it for double-submit)
  let csrfToken = getCookie(c, 'csrf_token');
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    setCookie(c, 'csrf_token', csrfToken, {
      path: '/',
      httpOnly: false,
      secure: isProduction,
      sameSite: 'Strict',
    });
  }

  // Validate CSRF for mutating UI requests.
  // Accept either:
  //   (a) double-submit cookie token — X-CSRF-Token header matches csrf_token cookie, OR
  //   (b) HTMX request header — combined with SameSite=Lax on the session cookie this
  //       is safe since cross-site XHR cannot include the session cookie.
  if (
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
    path.startsWith('/ui/')
  ) {
    const headerToken = c.req.header('X-CSRF-Token');
    const isHtmxRequest = c.req.header('HX-Request') === 'true';
    const tokenValid = headerToken !== undefined && headerToken === csrfToken;
    if (!tokenValid && !isHtmxRequest) {
      return c.html(
        'CSRF validation failed. Please refresh the page and try again.',
        403,
      );
    }
  }

  return next();
};
