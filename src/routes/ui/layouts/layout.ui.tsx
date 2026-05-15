export const Layout = ({
  children,
  activePath,
}: {
  children: any;
  activePath?: string;
}) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Schedule Manager</title>
      <script src="https://unpkg.com/htmx.org@2.0.10"></script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen pb-10">
      <nav class="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div class="max-w-5xl mx-auto flex items-center gap-6">
          <div class="font-bold text-xl text-gray-800 tracking-tight">
            TSCS Schedules
          </div>
          <a
            href="/dashboard/events"
            class={`px-3 py-2 rounded-lg font-medium transition-colors ${activePath === "/ui/events" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Events
          </a>
          <a
            href="/dashboard/batches"
            class={`px-3 py-2 rounded-lg font-medium transition-colors ${activePath === "/ui/batches" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Batches
          </a>
        </div>
      </nav>
      <div class="max-w-4xl mx-auto pt-8 px-4">{children}</div>

      {/* Container for modals loaded via HTMX */}
      <div id="modal-container"></div>
    </body>
  </html>
);
