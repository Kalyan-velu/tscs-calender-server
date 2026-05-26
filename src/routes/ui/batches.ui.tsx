import {Hono} from 'hono';
import {getCookie} from 'hono/cookie';
import {batchRepository} from '../../db/repository/batch.repository.js';
import {eventRepository} from '../../db/repository/event.repository.js';
import {getSessionToken} from '../../utils/auth.js';
import {BaseLayout, Layout} from './layouts/layout.ui.js';

export const batchesUi = new Hono();

// Batch List Component (Grid representation)
const BatchList = ({ batches }: { batches: any[] }) => {
  if (batches.length === 0) {
    return (
      <div
        id="batch-list"
        class="mt-8 text-center text-slate-500 py-16 bg-white rounded-2xl border border-slate-100 shadow-premium"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>No Title</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p class="text-slate-800 font-medium">No batches created yet</p>
        <p class="text-sm text-slate-400 mt-1">
          Use the form above to add a new cohort group.
        </p>
      </div>
    );
  }

  return (
    <div id="batch-list" class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
      {batches.map((batch) => (
        <div class="flex flex-col justify-between p-6 bg-white rounded-2xl shadow-premium border border-slate-100 hover:shadow-premium-hover hover:border-brand-200 transition-all duration-300 relative group overflow-hidden">
          {/* Accent top border */}
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-400 opacity-80"></div>

          <div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-[17px] text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors">
                    {batch.name}
                  </h3>
                  <span class="inline-block mt-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Cohort ID: {batch.id.substring(0, 8)}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button
                hx-delete={`/ui/batches/${batch.id}`}
                hx-target="#batch-list"
                hx-swap="outerHTML"
                hx-confirm={`Are you sure you want to delete ${batch.name}? This action cannot be undone.`}
                class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                title="Delete Batch"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <a
              href={`/ui/batches/${batch.id}/events`}
              class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3.5 py-2 rounded-xl transition-all"
            >
              <svg
                class="w-4 h-4"
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
              Weekly Schedule
            </a>
            <button
              onclick={`const url = window.location.origin + '/ui/batches/${batch.id}/events'; navigator.clipboard.writeText(url); const btn = this; const orig = btn.innerHTML; btn.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> Copied!'; btn.classList.add('text-emerald-600'); setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('text-emerald-600') }, 2000);`}
              class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-brand-600 transition-colors"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h5m-5 4h5m-5 10h5"
                />
              </svg>
              Copy Link
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Preview Layout component (minimal, for sharing)
const PreviewLayout = ({
  children,
  title,
}: {
  children: any;
  title: string;
}) => (
  <BaseLayout
    title={`${title} | Takshashila SCS`}
    bodyClass="text-slate-900 min-h-screen py-4 sm:py-10 px-3 sm:px-4 antialiased"
  >
    <div class="max-w-5xl mx-auto">{children}</div>
  </BaseLayout>
);

// HTMX Endpoint: Weekly Schedule Preview for a single batch
batchesUi.get('/:batchId/events', async (c) => {
  const batchId = c.req.param('batchId');
  const batch = await batchRepository.findById(batchId);

  if (!batch) {
    return c.text('Batch not found', 404);
  }

  const dateQuery = c.req.query('date');
  let baseDate = new Date();
  if (dateQuery) {
    baseDate = new Date(dateQuery);
  }

  // Calculate Monday to Sunday of the week
  const day = baseDate.getDay();
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Fetch events only for this batch
  const events = await eventRepository.findByBatchId(batchId, {
    from: startOfWeek,
    to: endOfWeek,
  });

  // Group by day
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const grouped: Record<string, any[]> = {};

  days.forEach((d) => {
    grouped[d] = [];
  });

  events.forEach((ev) => {
    const evDate = new Date(ev.scheduledAt);
    const dayIndex = evDate.getDay();
    const dayName = dayIndex === 0 ? 'Sunday' : days[dayIndex - 1];
    grouped[dayName].push(ev);
  });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Formatting for next/prev buttons
  const prevWeek = new Date(startOfWeek);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(startOfWeek);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isLoggedIn = getCookie(c, 'admin_session') === getSessionToken();

  return c.html(
    <PreviewLayout title={`${batch.name} - Weekly Schedule`}>
      <div class="bg-white rounded-3xl shadow-[0_15px_40px_-15px_rgba(66,88,255,0.08)] border border-slate-100 overflow-hidden">
        {/* Prev / Current / Next Controls */}
        <div class="bg-slate-50 px-4 sm:px-8 py-3 sm:py-3.5 border-b border-slate-150 flex justify-between items-center gap-2 sm:gap-4 flex-wrap">
          <a
            href={`/ui/batches/${batchId}/events?date=${formatDate(prevWeek)}`}
            class="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200"
          >
            ← Prev Week
          </a>
          <a
            href={`/ui/batches/${batchId}/events`}
            class="text-xs font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 px-4 py-2 rounded-xl border border-brand-100"
          >
            Current Week
          </a>
          <a
            href={`/ui/batches/${batchId}/events?date=${formatDate(nextWeek)}`}
            class="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200"
          >
            Next Week →
          </a>
        </div>

        {/* Days and Events Listing */}
        <div class="p-4 sm:p-8 space-y-8 sm:space-y-10">
          {days.map((dayName) => {
            const dayEvents = grouped[dayName];

            if (dayEvents.length === 0) {
              return (
                <div class="opacity-60 group">
                  <h2 class="text-lg font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
                    {dayName}
                  </h2>
                  <p class="text-slate-400 text-sm italic pl-2">
                    No classes scheduled.
                  </p>
                </div>
              );
            }

            return (
              <div>
                <h2 class="text-[17px] font-extrabold text-slate-800 border-b-2 border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
                  {dayName}
                  <span class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md ml-1">
                    {dayEvents.length} session{dayEvents.length > 1 ? 's' : ''}
                  </span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dayEvents
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledAt).getTime() -
                        new Date(b.scheduledAt).getTime(),
                    )
                    .map((ev) => (
                      <div class="bg-white p-5 rounded-2xl border border-slate-150 flex flex-col hover:border-brand-300 hover:shadow-premium transition-all duration-300 relative overflow-hidden">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>

                        <div class="font-bold text-slate-800 text-[15px] mb-1.5 leading-snug">
                          {ev.title}
                        </div>
                        <div class="text-[12px] text-slate-500 font-semibold mb-3.5 flex items-center gap-1.5">
                          <svg
                            class="w-4 h-4 text-brand-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2.5"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          {formatTime(new Date(ev.scheduledAt))} (
                          {ev.durationMinutes} min)
                        </div>
                        {ev.description && (
                          <p class="text-sm text-slate-500 mb-4 flex-grow leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                        {ev.meetLink && (
                          <a
                            href={ev.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-150 transition-colors"
                          >
                            <svg
                              class="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              ></path>
                            </svg>
                            Join Online Class
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PreviewLayout>,
  );
});

// Initial Page Load
batchesUi.get('/', async (c) => {
  const batches = await batchRepository.allBatches();

  return c.html(
    <Layout activePath="/ui/batches">
      {/* Create New Batch Form Block */}
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium mb-8">
        <h2 class="text-lg font-bold text-slate-800 mb-1">
          Create New Class Batch
        </h2>
        <p class="text-sm text-slate-500 mb-6">
          Setup class cohorts and assign weekly schedules for learners.
        </p>

        <form
          hx-post="/ui/batches"
          hx-target="#batch-list"
          hx-swap="outerHTML"
          {...{
            'hx-on:htmx:after-request':
              'if(event.detail.successful) this.reset()',
          }}
          class="flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
        >
          <div class="flex-grow">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Batch / Cohort Name
            </label>
            <input
              required={true}
              type="text"
              name="name"
              class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
              placeholder="e.g. UPSC General Studies Batch A"
            />
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/15 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            Create Batch
          </button>
        </form>
      </div>

      <div class="flex items-center justify-between mt-10 mb-4">
        <h2 class="text-lg font-bold text-slate-800">Cohort Registry</h2>
        <span class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          {batches.length} Batch{batches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <BatchList batches={batches} />
    </Layout>,
  );
});

// HTMX Endpoint: Get Batch List
batchesUi.get('/list', async (c) => {
  const batches = await batchRepository.allBatches();
  return c.html(<BatchList batches={batches} />);
});

// HTMX Endpoint: Create Batch
batchesUi.post('/', async (c) => {
  const body = await c.req.parseBody();
  const { name } = body;

  if (name) {
    await batchRepository.create({ name: name as string });
  }

  const batches = await batchRepository.allBatches();
  return c.html(<BatchList batches={batches} />);
});

// HTMX Endpoint: Delete Batch
batchesUi.delete('/:id', async (c) => {
  const id = c.req.param('id');

  if (id) {
    await batchRepository.deleteBatch(id);
  }

  const batches = await batchRepository.allBatches();
  return c.html(<BatchList batches={batches} />);
});
