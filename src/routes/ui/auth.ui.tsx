import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { validateCredentials, getSessionToken } from "../../utils/auth.js";
import { BaseLayout } from "./layouts/layout.ui.js";

export const authUi = new Hono();

const LoginLayout = ({ children, error }: { children: any; error?: string }) => (
  <BaseLayout
    title="Sign In | Schedule Manager"
    bodyClass="text-slate-900 min-h-screen flex items-center justify-center p-4 sm:p-6 antialiased"
  >
    <div class="w-full max-w-md">
      {/* Logo/Icon */}
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Access Schedule Manager</h2>
        <p class="text-sm text-slate-400 font-medium mt-1">Sign in with administrator credentials</p>
      </div>

      {/* Card */}
      <div class="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-[0_15px_40px_-15px_rgba(66,88,255,0.08)]">
        {error && (
          <div class="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-600">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {children}
      </div>

      {/* Guest access schedule lookup */}
      <div class="text-center mt-6">
        <a href="/ui/lookup" class="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
          Are you a student? Look up weekly class schedule →
        </a>
      </div>
    </div>
  </BaseLayout>
);

const LoginForm = ({ username }: { username?: string }) => (
  <form action="/ui/login" method="post" class="space-y-5 m-0">
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        Admin Username
      </label>
      <input
        required
        type="text"
        name="username"
        value={username || ""}
        class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
        placeholder="e.g. admin"
      />
    </div>
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        Security Password
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
      Sign In
    </button>
  </form>
);

authUi.get("/login", async (c) => {
  return c.html(
    <LoginLayout>
      <LoginForm />
    </LoginLayout>
  );
});

authUi.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;

  if (validateCredentials(username, password)) {
    setCookie(c, "admin_session", getSessionToken(), {
      path: "/",
      httpOnly: true,
      secure: false,
      maxAge: 86400,
    });
    return c.redirect("/ui/events");
  }

  return c.html(
    <LoginLayout error="Invalid admin username or password. Please verify credentials.">
      <LoginForm username={username} />
    </LoginLayout>
  );
});

authUi.get("/logout", async (c) => {
  deleteCookie(c, "admin_session");
  return c.redirect("/ui/login");
});
