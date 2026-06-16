export const BaseLayout = ({
  children,
  title = 'Schedule Manager | Takshashila SCS',
  bodyClass = 'text-slate-900 min-h-screen antialiased',
}: {
  children: any;
  title?: string;
  bodyClass?: string;
}) => (
  <html lang="en" class="h-full">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <script src="https://unpkg.com/htmx.org@2.0.10"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/static/app.css" />
    </head>
    <body class={bodyClass}>{children}</body>
  </html>
);

export const Layout = ({
  children,
  activePath,
}: {
  children: any;
  activePath?: string;
}) => (
  <BaseLayout bodyClass="text-slate-900 min-h-screen flex flex-col antialiased">
    {/* Sticky Premium Nav Bar */}
    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div class="flex items-center gap-4 sm:gap-8">
          <div class="flex items-center gap-2.5 group cursor-pointer">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>App Logo</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-[15px] tracking-tight text-slate-800 leading-none">
                TSCS Scheduler
              </span>
              <span class="text-[10px] font-semibold uppercase tracking-wider text-brand-600 mt-0.5">
                Manager Portal
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <div class="hidden md:flex items-center gap-1.5">
            <a
              href="/ui/events"
              class={`px-4 py-2 rounded-xl text-[14px] font-semibold tracking-tight transition-all duration-200 ${
                activePath === '/ui/events'
                  ? 'bg-brand-50 text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Events
            </a>
            <a
              href="/ui/batches"
              class={`px-4 py-2 rounded-xl text-[14px] font-semibold tracking-tight transition-all duration-200 ${
                activePath === '/ui/batches'
                  ? 'bg-brand-50 text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Batches
            </a>
            <a
              href="/ui/students"
              class={`px-4 py-2 rounded-xl text-[14px] font-semibold tracking-tight transition-all duration-200 ${
                activePath === '/ui/students'
                  ? 'bg-brand-50 text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Students
            </a>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span class="hidden sm:inline-block text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
            v1.2.0 Stable
          </span>
          <a
            href="/ui/logout"
            class="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Logout Icon</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Log Out
          </a>
        </div>
      </div>
    </nav>

    {/* Main Content Area */}
    <main class="flex-grow max-w-6xl mx-auto w-full pt-6 sm:pt-8 px-4 sm:px-6 pb-28 md:pb-20">
      {children}
    </main>

    {/* Container for modals loaded via HTMX */}
    <div id="modal-container"></div>

    {/* Attach CSRF token to all HTMX requests (double-submit cookie pattern) */}
    <script>{`
      (function() {
        function getCsrfCookie() {
          var pairs = document.cookie.split(';');
          for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].trim();
            var idx = pair.indexOf('=');
            if (idx > 0 && pair.substring(0, idx) === 'csrf_token') {
              return decodeURIComponent(pair.substring(idx + 1));
            }
          }
          return null;
        }
        document.addEventListener('htmx:configRequest', function(evt) {
          if (!evt.detail || !evt.detail.headers) return;
          var token = getCsrfCookie();
          if (token) evt.detail.headers['X-CSRF-Token'] = token;
        });
      })();
    `}</script>

    {/* Mobile Bottom Navigation */}
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      <div class="flex items-center justify-around h-16 px-2">
        <a
          href="/ui/events"
          class={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors ${activePath === '/ui/events' ? 'text-brand-600' : 'text-slate-400'}`}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Events Icon</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span
            class={`text-[10px] font-bold uppercase tracking-wider ${activePath === '/ui/events' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            Events
          </span>
        </a>
        <a
          href="/ui/batches"
          class={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors ${activePath === '/ui/batches' ? 'text-brand-600' : 'text-slate-400'}`}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Batches Icon</title>

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span
            class={`text-[10px] font-bold uppercase tracking-wider ${activePath === '/ui/batches' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            Batches
          </span>
        </a>
        <a
          href="/ui/students"
          class={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors ${activePath === '/ui/students' ? 'text-brand-600' : 'text-slate-400'}`}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Students Icon</title>

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span
            class={`text-[10px] font-bold uppercase tracking-wider ${activePath === '/ui/students' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            Students
          </span>
        </a>
        <a
          href="/ui/logout"
          class="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors text-red-400"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Logout Icon</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span class="text-[10px] font-bold uppercase tracking-wider">
            Logout
          </span>
        </a>
      </div>
    </nav>
  </BaseLayout>
);
