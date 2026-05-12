import {Hono} from 'hono';
import {batchRepository} from '../../db/repository/batch.repository.js';
import {eventRepository} from '../../db/repository/event.repository.js';
import {Layout} from './events.ui.js';

export const batchesUi = new Hono();

// Batch List Component
const BatchList = ({ batches }: { batches: any[] }) => {
  if (batches.length === 0) {
    return (
      <div
        id='batch-list'
        class='mt-8 text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm border border-gray-100'
      >
        No batches found. Create one below.
      </div>
    );
  }

  return (
    <div
      id='batch-list'
      class='mt-8 flex flex-col gap-3'
    >
      {batches.map((batch) => (
        <div class='flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 group'>
          <div class='flex-grow pl-4 border-l-4 border-blue-500'>
            <a href={`/ui/batches/${batch.id}/events`} class='text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer block'>{batch.name}</a>
          </div>
          <button
            hx-delete={`/ui/batches/${batch.id}`}
            hx-target='#batch-list'
            hx-swap='outerHTML'
            hx-confirm={`Are you sure you want to delete ${batch.name}?`}
            class='flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
            title='Delete Batch'
          >
            <svg
              class='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              ></path>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

// Preview Layout component (minimal, for sharing)
const PreviewLayout = ({ children, title }: { children: any; title: string }) => (
  <html lang='en'>
    <head>
      <meta charset='UTF-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <title>{title}</title>
      <script src='https://cdn.tailwindcss.com'></script>
    </head>
    <body class='bg-gray-50 text-gray-900 font-sans antialiased min-h-screen py-10'>
      <div class='max-w-5xl mx-auto px-4'>
        {children}
      </div>
    </body>
  </html>
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
  const events = await eventRepository.findByBatchId(batchId, { from: startOfWeek, to: endOfWeek });

  // Group by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grouped: Record<string, any[]> = {};
  
  days.forEach(d => { grouped[d] = []; });

  events.forEach(ev => {
    const evDate = new Date(ev.scheduledAt);
    const dayIndex = evDate.getDay();
    const dayName = dayIndex === 0 ? 'Sunday' : days[dayIndex - 1];
    grouped[dayName].push(ev);
  });

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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

  return c.html(
    <PreviewLayout title={`${batch.name} - Weekly Schedule`}>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="bg-blue-600 px-6 py-8 text-white text-center relative">
          <a href="/ui/batches" class="absolute left-6 top-6 text-blue-200 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Batches
          </a>
          <h1 class="text-3xl font-bold tracking-tight">{batch.name} - Schedule</h1>
          <p class="mt-2 text-blue-100">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <a href={`/ui/batches/${batchId}/events?date=${formatDate(prevWeek)}`} class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">← Previous Week</a>
          <a href={`/ui/batches/${batchId}/events`} class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Current Week</a>
          <a href={`/ui/batches/${batchId}/events?date=${formatDate(nextWeek)}`} class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Next Week →</a>
        </div>

        <div class="p-6 space-y-8">
          {days.map(dayName => {
            const dayEvents = grouped[dayName];
            
            if (dayEvents.length === 0) {
              return (
                <div class="opacity-50">
                  <h2 class="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">{dayName}</h2>
                  <p class="text-gray-500 italic px-4">No classes scheduled.</p>
                </div>
              );
            }

            return (
              <div>
                <h2 class="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4">{dayName}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayEvents.sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map(ev => (
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col hover:border-blue-300 transition-colors">
                      <div class="font-bold text-gray-900 text-lg mb-1">{ev.title}</div>
                      <div class="text-sm text-gray-600 font-medium mb-2 flex items-center gap-1">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {formatTime(new Date(ev.scheduledAt))} ({ev.durationMinutes} min)
                      </div>
                      {ev.description && <p class="text-sm text-gray-500 mb-3 flex-grow">{ev.description}</p>}
                      {ev.meetLink && (
                        <a href={ev.meetLink} target="_blank" rel="noopener noreferrer" class="mt-auto inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          Join Meeting
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
    </PreviewLayout>
  );
});

// Initial Page Load
batchesUi.get('/', async (c) => {
  const batches = await batchRepository.allBatches();

  return c.html(
    <Layout activePath='/ui/batches'>
      <div class='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8'>
        <h2 class='text-xl font-semibold text-gray-800 mb-4'>
          Create New Batch
        </h2>
        <form
          hx-post='/ui/batches'
          hx-target='#batch-list'
          hx-swap='outerHTML'
          {...{
            'hx-on:htmx:after-request':
              'if(event.detail.successful) this.reset()',
          }}
          class='flex items-end gap-4'
        >
          <div class='flex-grow'>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              Batch Name
            </label>
            <input
              required={true}
              type='text'
              name='name'
              class='focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg py-2 px-3 border'
              placeholder='e.g., Morning Batch A'
            />
          </div>
          <button
            type='submit'
            class='inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
          >
            Create
          </button>
        </form>
      </div>

      <h2 class='text-xl font-semibold text-gray-800 mt-10 mb-2'>
        Existing Batches
      </h2>
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
