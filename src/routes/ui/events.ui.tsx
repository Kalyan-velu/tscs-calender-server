import {Hono} from 'hono';
import {batchRepository} from '../../db/repository/batch.repository.js';
import {eventRepository} from '../../db/repository/event.repository.js';

export const eventsUi = new Hono();

export const Layout = ({
  children,
  activePath,
}: {
  children: any;
  activePath?: string;
}) => (
  <html lang='en'>
    <head>
      <meta charset='UTF-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1.0'
      />
      <title>Schedule Manager</title>
      <script src='https://unpkg.com/htmx.org@1.9.11'></script>
      <script src='https://cdn.tailwindcss.com'></script>
      <script
        defer
        src='https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js'
      ></script>
    </head>
    <body class='bg-gray-50 text-gray-900 font-sans antialiased min-h-screen pb-10'>
      <nav class='bg-white border-b border-gray-200 px-4 py-3 shadow-sm'>
        <div class='max-w-4xl mx-auto flex items-center gap-6'>
          <div class='font-bold text-xl text-gray-800 tracking-tight'>
            TSCS Schedules
          </div>
          <a
            href='/ui/events'
            class={`px-3 py-2 rounded-lg font-medium transition-colors ${activePath === '/ui/events' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Events
          </a>
          <a
            href='/ui/batches'
            class={`px-3 py-2 rounded-lg font-medium transition-colors ${activePath === '/ui/batches' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Batches
          </a>
        </div>
      </nav>
      <div class='max-w-4xl mx-auto pt-8 px-4'>{children}</div>

      {/* Container for modals loaded via HTMX */}
      <div id='modal-container'></div>
    </body>
  </html>
);

// Helper to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  console.log(d);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Event List Component
const EventList = ({ events, date }: { events: any[]; date: string }) => {
  if (events.length === 0) {
    return (
      <div
        id='event-list'
        class='mt-8 text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm border border-gray-100'
      >
        No events scheduled for this day.
      </div>
    );
  }

  return (
    <div
      id='event-list'
      class='mt-8 flex flex-col gap-3'
    >
      {events.map((ev) => (
        <div
          class='flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group'
          hx-get={`/ui/events/form/${ev.id}`}
          hx-target='#modal-container'
        >
          <div class='w-24 font-semibold text-gray-700 flex-shrink-0 text-lg'>
            {formatTime(new Date(ev.scheduledAt))}
          </div>
          <div class='flex-grow pl-4 border-l border-gray-200'>
            <h3 class='text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors'>
              {ev.title}
            </h3>
            {ev.description && (
              <p class='text-sm text-gray-500 mt-1 line-clamp-1'>
                {ev.description}
              </p>
            )}
          </div>
          <div class='flex-shrink-0 text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100'>
            {ev.durationMinutes} min
          </div>
        </div>
      ))}
    </div>
  );
};

// Modal Form Component (Create/Edit)
const EventModal = ({
  event,
  batches,
  date,
}: {
  event?: any;
  batches: any[];
  date: string;
}) => {
  const isEdit = !!event;
  const title = isEdit ? 'Edit Event' : 'Create Event';
  const actionPath = isEdit ? `/ui/events/${event.id}` : '/ui/events';
  const method = isEdit ? 'hx-put' : 'hx-post';

  // Default values
  const defaultDate = event ? new Date(event.scheduledAt) : new Date(date);
  const defaultDateStr = formatDate(defaultDate);
  const pad = (n: number) => n?.toString().padStart(2, '0');
  const defaultTimeStr = `${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

  return (
    <div
      id='event-modal'
      class='fixed inset-0 z-50 overflow-y-auto'
      aria-labelledby='modal-title'
      role='dialog'
      aria-modal='true'
      x-data='{ show: true }'
      x-show='show'
    >
      <div class='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
        {/* Backdrop */}
        <div
          class='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          aria-hidden='true'
          x-show='show'
          x-transition:enter='ease-out duration-300'
          x-transition:enter-start='opacity-0'
          x-transition:enter-end='opacity-100'
          x-transition:leave='ease-in duration-200'
          x-transition:leave-start='opacity-100'
          x-transition:leave-end='opacity-0'
          {...{ onclick: "document.getElementById('event-modal').remove()" }}
        ></div>

        <span
          class='hidden sm:inline-block sm:align-middle sm:h-screen'
          aria-hidden='true'
        >
          &#8203;
        </span>

        {/* Modal Panel */}
        <div
          class='inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100'
          x-show='show'
          x-transition:enter='ease-out duration-300'
          x-transition:enter-start='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          x-transition:enter-end='opacity-100 translate-y-0 sm:scale-100'
          x-transition:leave='ease-in duration-200'
          x-transition:leave-start='opacity-100 translate-y-0 sm:scale-100'
          x-transition:leave-end='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
        >
          <form
            {...{
              [method]: actionPath,
              'hx-on:htmx:after-request':
                "if(event.detail.successful) this.closest('#event-modal').remove()",
            }}
            hx-target='#event-list'
            hx-swap='outerHTML'
            class='m-0'
          >
            <div class='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
              <div class='sm:flex sm:items-start'>
                <div class='mt-3 text-center sm:mt-0 sm:text-left w-full'>
                  <h3
                    class='text-xl leading-6 font-semibold text-gray-900'
                    id='modal-title'
                  >
                    {title}
                  </h3>

                  <div class='mt-6 space-y-4'>
                    <div>
                      <label class='block text-sm font-medium text-gray-700'>
                        Title
                      </label>
                      <input
                        required
                        type='text'
                        name='title'
                        value={event?.title || ''}
                        class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                        placeholder='Event Title'
                      />
                    </div>

                    <div>
                      <label class='block text-sm font-medium text-gray-700'>
                        Description
                      </label>
                      <textarea
                        name='description'
                        rows={3}
                        class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                        placeholder='Event Description'
                      >
                        {event?.description || ''}
                      </textarea>
                    </div>

                    <div class='grid grid-cols-2 gap-4'>
                      <div>
                        <label class='block text-sm font-medium text-gray-700'>
                          Date
                        </label>
                        <input
                          required
                          type='date'
                          name='date'
                          value={defaultDateStr}
                          class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                        />
                      </div>
                      <div>
                        <label class='block text-sm font-medium text-gray-700'>
                          Time
                        </label>
                        <input
                          required
                          type='time'
                          name='time'
                          value={defaultTimeStr}
                          class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                        />
                      </div>
                    </div>

                    <div class='grid grid-cols-2 gap-4'>
                      <div>
                        <label class='block text-sm font-medium text-gray-700'>
                          Duration (mins)
                        </label>
                        <input
                          required
                          type='number'
                          name='durationMinutes'
                          value={event?.durationMinutes || 60}
                          class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                        />
                      </div>
                      <div>
                        <label class='block text-sm font-medium text-gray-700'>
                          Meet Link
                        </label>
                        <input
                          type='url'
                          name='meetLink'
                          value={event?.meetLink || ''}
                          class='mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border'
                          placeholder='https://...'
                        />
                      </div>
                    </div>

                    <div>
                      <label class='block text-sm font-medium text-gray-700'>
                        Batches
                      </label>
                      <select
                        multiple
                        name='batchIds'
                        class='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border'
                      >
                        {batches.map((b) => (
                          <option
                            value={b.id}
                            selected={event?.batchIds?.includes(b.id)}
                          >
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <p class='mt-1 text-xs text-gray-500'>
                        Hold Ctrl/Cmd to select multiple
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-gray-100'>
              <button
                {...{onclick : "setTimeout(() => this.closest('#event-modal').remove(), 200)"}}
                type='submit'
                class='w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors'
              >
                Save Event
              </button>
              <button
                type='button'
                {...{ onclick: "document.getElementById('event-modal').remove()" }}
                class='mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Initial Page Load
eventsUi.get('/', async (c) => {
  const today = new Date();
  const dateStr = formatDate(today);

  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventRepository.all({ from: startOfDay, to: endOfDay });

  return c.html(
    <Layout activePath='/ui/events'>
      <div class='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center justify-between'>
        <div class='flex items-center gap-4'>
          <label class='font-medium text-gray-700'>Date:</label>
          <input
            type='date'
            name='date'
            value={dateStr}
            class='focus:ring-blue-500 focus:border-blue-500 block shadow-sm sm:text-sm border-gray-300 rounded-lg py-2 px-3 border'
            hx-get='/ui/events/list'
            hx-target='#event-list'
            hx-swap='outerHTML'
          />
        </div>
        <button
          hx-get='/ui/events/form'
          hx-target='#modal-container'
          hx-vals="js:{date: document.querySelector('input[name=date]').value}"
          class='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors'
        >
          <svg
            class='-ml-1 mr-2 h-5 w-5'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            aria-hidden='true'
          >
            <path
              fill-rule='evenodd'
              d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
              clip-rule='evenodd'
            />
          </svg>
          Create Event
        </button>
      </div>

      <EventList
        events={events}
        date={dateStr}
      />
    </Layout>,
  );
});

// HTMX Endpoint: Get Event List for a date
eventsUi.get('/list', async (c) => {
  const dateStr = c.req.query('date') || formatDate(new Date());

  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventRepository.all({ from: startOfDay, to: endOfDay });

  return c.html(
    <EventList
      events={events}
      date={dateStr}
    />,
  );
});

// HTMX Endpoint: Get Create Form Modal
eventsUi.get('/form', async (c) => {
  const dateStr = c.req.query('date') || formatDate(new Date());
  const batches = await batchRepository.allBatches();
  return c.html(
    <EventModal
      batches={batches}
      date={dateStr}
    />,
  );
});

// HTMX Endpoint: Get Edit Form Modal
eventsUi.get('/form/:id', async (c) => {
  const id = c.req.param('id');
  const event = await eventRepository.findById(id);
  const batches = await batchRepository.allBatches();

  if (!event) return c.text('Not found', 404);

  return c.html(
    <EventModal
      event={event}
      batches={batches}
      date={formatDate(new Date(event.scheduledAt))}
    />,
  );
});

// Helper to parse form data and return updated list
const handleSave = async (c: any, id?: string) => {
  const body = await c.req.parseBody({ all: true });
  const getFirst = (val: any) => Array.isArray(val) ? val[0] : val;

  const title = getFirst(body.title) as string;
  const description = getFirst(body.description) as string;
  const date = getFirst(body.date) as string;
  const time = getFirst(body.time) as string;
  const durationMinutes = getFirst(body.durationMinutes) as string;
  const meetLink = getFirst(body.meetLink) as string;

  let batchIds = body.batchIds;
  if (!batchIds) {
    batchIds = [];
  } else if (!Array.isArray(batchIds)) {
    batchIds = [batchIds];
  }

  const scheduledAt = new Date(`${date}T${time}:00`);

  const data = {
    title: title as string,
    description: (description as string) || null,
    scheduledAt,
    durationMinutes: parseInt(durationMinutes as string, 10),
    meetLink: (meetLink as string) || null,
  };

  if (id) {
    await eventRepository.update(id, data, batchIds as string[]);
  } else {
    await eventRepository.create(data as any, batchIds as string[]);
  }

  // Return the updated list for that date
  const startOfDay = new Date(date as string);
  const endOfDay = new Date(date as string);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventRepository.all({ from: startOfDay, to: endOfDay });

  return c.html(
    <EventList
      events={events}
      date={date as string}
    />,
  );
};

// HTMX Endpoint: Create Event
eventsUi.post('/', async (c) => {
  return handleSave(c);
});

// HTMX Endpoint: Update Event
eventsUi.put('/:id', async (c) => {
  const id = c.req.param('id');
  return handleSave(c, id);
});
