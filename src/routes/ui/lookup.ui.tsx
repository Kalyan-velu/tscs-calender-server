import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { studentRepository } from '../../db/repository/student.repository.js';
import { createStudentToken } from '../../utils/auth.js';
import { BaseLayout } from './layouts/layout.ui.js';

export const lookupUi = new Hono();

const LookupLayout = ({
  children,
  error,
}: {
  children: unknown;
  error?: string;
}) => (
  <BaseLayout
    title="Schedule Lookup | Takshashila SCS"
    bodyClass="text-slate-900 min-h-screen flex items-center justify-center p-4 sm:p-6 antialiased"
  >
    <div class="w-full max-w-md">
      {/* Logo/Icon */}
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mb-3">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          n
        </div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">
          Student Schedule Lookup
        </h2>
        <p class="text-sm text-slate-400 font-medium mt-1">
          Lookup your weekly class cohort timetable
        </p>
      </div>

      {/* Card */}
      <div class="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-[0_15px_40px_-15px_rgba(66,88,255,0.08)]">
        {error && (
          <div class="mb-5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-amber-700">
            <svg
              class="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {children}
      </div>

      {/* Portal Access */}
      <div class="text-center mt-6">
        <a
          href="/ui/login"
          class="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Administrative Portal Sign In
        </a>
      </div>
    </div>
  </BaseLayout>
);

const LookupForm = ({ email }: { email?: string }) => (
  <form action="/ui/lookup" method="post" class="space-y-5 m-0">
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        Registered Email Address
      </label>
      <input
        required
        type="email"
        name="email"
        value={email || ''}
        class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
        placeholder="student@example.com"
      />
    </div>
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        Password
      </label>
      <input
        required
        type="password"
        name="password"
        class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
        placeholder="••••••••"
      />
    </div>
    <button
      type="submit"
      class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/15 transition-all duration-200 cursor-pointer"
    >
      Sign In & View Schedule
    </button>
  </form>
);

lookupUi.get('/', async (c) => {
  return c.html(
    <LookupLayout>
      <LookupForm />
    </LookupLayout>,
  );
});

lookupUi.post('/', async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  if (!email || !password) {
    return c.html(
      <LookupLayout error="Please enter a valid email and password.">
        <LookupForm email={email} />
      </LookupLayout>,
    );
  }

  const student = await studentRepository.findByEmail(email);

  if (!student || !student.passwordHash) {
    return c.html(
      <LookupLayout error="Invalid email or password. Please verify credentials.">
        <LookupForm email={email} />
      </LookupLayout>,
    );
  }

  const passwordMatch = await bcrypt.compare(password, student.passwordHash);
  if (!passwordMatch) {
    return c.html(
      <LookupLayout error="Invalid email or password. Please verify credentials.">
        <LookupForm email={email} />
      </LookupLayout>,
    );
  }

  if (!student.batchId) {
    return c.html(
      <LookupLayout
        error={`Hi ${student.displayName}, you are not currently assigned to any class cohort group. Please request your coordinator to register you to a batch.`}
      >
        <LookupForm email={email} />
      </LookupLayout>,
    );
  }

  // Set student session cookie
  const token = createStudentToken(student.id, student.batchId);
  setCookie(c, 'student_session', token, {
    path: '/',
    httpOnly: true,
    secure: false, // Set true in production if running HTTPS
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return c.redirect(`/ui/batches/${student.batchId}/events`);
});

lookupUi.get('/logout', async (c) => {
  deleteCookie(c, 'student_session');
  return c.redirect('/ui/lookup');
});
