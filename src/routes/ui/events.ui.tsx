import type { Context } from 'hono';
import { Hono } from 'hono';
import { batchRepository } from '../../db/repository/batch.repository.js';
import { eventRepository } from '../../db/repository/event.repository.js';
import type { Batch, Event } from '../../db/schema.js';
import { formatTime } from '../../utils/time-format.js';
import { Layout } from './layouts/layout.ui.js';

export interface EventWithBatchIds extends Event {
  batchIds: string[];
  batch: { id: string; name: string }[];
}

export const eventsUi = new Hono();

const formatDate = (date: Date) => {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EventError = ({ message, date }: { message: string; date: string }) => (
  <div
    id="event-list"
    class="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold"
  >
    Error: {message}
    <div class="mt-2">
      <button
        class="text-brand-600 text-xs underline"
        hx-get={`/ui/events/list?date=${date}`}
        hx-target="#event-list"
        hx-swap="outerHTML"
        type={'button'}
      >
        Reload events
      </button>
    </div>
  </div>
);

const EventList = ({
  events,
  date,
}: {
  events: EventWithBatchIds[];
  date: string;
}) => {
  console.log('Rendering EventList with events:', events);
  if (events.length === 0) {
    return (
      <div
        id="event-list"
        class="mt-8 text-center text-slate-500 py-16 bg-white rounded-2xl border border-slate-100 shadow-premium"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>No Events</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p class="text-slate-800 font-medium">
          No events scheduled for this day
        </p>
        <p class="text-sm text-slate-400 mt-1">
          Click the button above to schedule your first class or meeting.
        </p>
      </div>
    );
  }

  return (
    <div id="event-list" class="mt-8 flex flex-col gap-4">
      {events.map((ev) => (
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl shadow-premium border border-slate-100 hover:shadow-premium-hover hover:border-brand-300 transition-all duration-300 cursor-pointer group gap-4 relative overflow-hidden"
          hx-get={`/ui/events/form/${ev.id}`}
          hx-target="#modal-container"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500"></div>

          <div class="flex items-start gap-4 pl-2 grow">
            <div class="w-20 shrink-0 pt-0.5">
              <div class="font-extrabold text-[16px] text-brand-600 leading-tight">
                {formatTime(new Date(ev.scheduledAt))}
              </div>
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                {ev.durationMinutes} min
              </div>
            </div>

            {/* Event Info*/}
            <div class="grow pl-4 border-l border-slate-150">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-[16px] font-bold text-slate-800 group-hover:text-brand-600 transition-colors leading-snug">
                  {ev.title}
                </h3>
                {ev.groupId && (
                  <span class="inline-flex items-center gap-1 text-[9px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100 uppercase tracking-wider">
                    <svg
                      class="w-2.5 h-2.5 animate-[spin_10s_linear_infinite]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>No title</title>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.79"
                      />
                    </svg>
                    Recurring
                  </span>
                )}
              </div>
              {ev.description && (
                <p class="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>
              )}

              {ev.batch && ev.batchIds.length > 0 && (
                <div class="flex flex-wrap gap-1.5 mt-2.5">
                  {ev.batch.map((batch) => (
                    <span
                      id={batch.id}
                      class="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-150"
                    >
                      {batch?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions & Meet Link */}
          <div class="flex items-center gap-2.5 sm:self-center pl-6 sm:pl-0">
            {ev.meetLink && (
              <a
                href={ev.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                onclick="event.stopPropagation()"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Meet Link Icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Join
              </a>
            )}

            {/* Edit Indicator */}
            <span class="p-2 text-slate-400 group-hover:text-brand-500 rounded-xl group-hover:bg-brand-50 transition-all">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Edit Icon</title>

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </span>

            {/* Delete Event Button */}
            {ev.groupId ? (
              <button
                hx-get={`/ui/events/delete-confirm/${ev.id}?date=${date}`}
                hx-target="#modal-container"
                type={'button'}
                onclick="event.stopPropagation()"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Recurring Event"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Delete Icon</title>

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            ) : (
              <button
                hx-delete={`/ui/events/${ev.id}?date=${date}`}
                hx-confirm="Are you sure you want to delete this event?"
                hx-target="#event-list"
                hx-swap="outerHTML"
                onclick="event.stopPropagation()"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Event"
                type={'button'}
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Delete Icon</title>

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
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
  event?: EventWithBatchIds;
  batches: Batch[];
  date: string;
}) => {
  const isEdit = !!event;
  const title = isEdit ? 'Edit Event Details' : 'Schedule New Event';
  const actionPath = isEdit ? `/ui/events/${event.id}` : '/ui/events';
  const method = isEdit ? 'hx-put' : 'hx-post';

  const defaultDate = event ? new Date(event.scheduledAt) : new Date(date);
  const defaultDateStr = formatDate(defaultDate);
  const pad = (n: number) => n?.toString().padStart(2, '0');
  const defaultTimeStr = `${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

  return (
    <div
      id="event-modal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-modal border border-slate-100 overflow-hidden transform translate-y-2 sm:scale-95 opacity-0 animate-[fadeInScale_0.2s_ease-out_forwards] max-h-[92vh] flex flex-col">
        <div class="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-[17px] font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onclick="document.getElementById('event-modal').remove()"
            class="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Meet Link Icon</title>

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          {...{
            [method]: actionPath,
            'hx-on:htmx:after-request':
              "if(event.detail.successful) this.closest('#event-modal').remove()",
          }}
          hx-target="#event-list"
          hx-swap="outerHTML"
          class="m-0 overflow-y-auto flex-1 flex flex-col"
        >
          <div class="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Event Title
                <input
                  required
                  type="text"
                  name="title"
                  value={event?.title || ''}
                  class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                  placeholder="e.g. Modern Web Development Class"
                />
              </label>
            </div>

            {/* Description */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description / Syllabus Details
                <textarea
                  name="description"
                  rows={3}
                  class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all resize-none"
                  placeholder="What topics will be covered during this scheduled event..."
                >
                  {event?.description || ''}
                </textarea>
              </label>
            </div>

            {/* Date & Time */}
            <div class="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {isEdit ? 'Date' : 'Start Date'}
                  <input
                    required
                    type="date"
                    name="date"
                    value={defaultDateStr}
                    class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                  />
                </label>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Start Time
                  <input
                    required
                    type="time"
                    name="time"
                    value={defaultTimeStr}
                    class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                  />
                </label>
              </div>
            </div>

            {/* Duration & Meet Link */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Duration (mins)
                  <input
                    required
                    type="number"
                    name="durationMinutes"
                    value={event?.durationMinutes || 60}
                    class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                  />
                </label>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Virtual Link (Google Meet)
                  <input
                    type="url"
                    name="meetLink"
                    value={event?.meetLink || ''}
                    class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl py-2.5 px-3.5 transition-all"
                    placeholder="https://meet.google.com/..."
                  />
                </label>
              </div>
            </div>

            {/* Target Batches */}
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Groups / Batches
                <select
                  multiple
                  name="batchIds"
                  class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[14px] border border-slate-200 rounded-xl p-3 h-28 bg-white transition-all"
                >
                  {batches.map((b) => (
                    <option
                      value={b.id}
                      selected={event?.batchIds?.includes(b.id)}
                      class="py-1 px-2 rounded hover:bg-slate-50"
                    >
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <p class="mt-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                💡 Hold Ctrl/Cmd to select multiple groups
              </p>
            </div>

            {isEdit && event?.groupId && (
              <div class="border-t border-slate-100 pt-4 mt-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Rescheduling Scope
                </span>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="editScope"
                      value="single"
                      checked
                    />
                    This instance only
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                    <input type="radio" name="editScope" value="future" />
                    This and all future instances
                  </label>
                </div>
              </div>
            )}

            {/* Recurrence Setup (Only for new events) */}
            {!isEdit && (
              <div class="border-t border-slate-100 pt-4 mt-2">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                      Repeat Event Series
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">
                      Create multiple instances over a date range
                    </span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="repeat"
                      value="true"
                      class="sr-only peer"
                      onchange="document.getElementById('recurrence-fields').classList.toggle('hidden', !this.checked)"
                    />
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div
                  id="recurrence-fields"
                  class="hidden md:grid grid-cols-1 gap-4 animate-[slideDown_0.2s_ease-out_forwards]"
                >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Repeat Frequency
                        <select
                          name="repeatInterval"
                          onchange="document.getElementById('custom-days-field').classList.toggle('hidden', this.value !== 'custom')"
                          class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[13px] border border-slate-200 rounded-xl py-2 px-3 bg-white transition-all"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom Weekly Days</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Repeat Until (End Date)
                        <input
                          type="date"
                          name="repeatUntil"
                          class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[13px] border border-slate-200 rounded-xl py-2 px-3 transition-all"
                        />
                      </label>
                    </div>
                  </div>
                  <div
                    id="custom-days-field"
                    class="hidden animate-[slideDown_0.2s_ease-out_forwards]"
                  >
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Specify Days (comma-separated)
                      <input
                        type="text"
                        name="repeatDays"
                        class="w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 text-[13px] border border-slate-200 rounded-xl py-2 px-3 transition-all"
                        placeholder="e.g. MON, WED, FRI"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div class="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
            {isEdit ? (
              event.groupId ? (
                <button
                  type="button"
                  hx-get={`/ui/events/delete-confirm/${event.id}?date=${defaultDateStr}`}
                  hx-target="#modal-container"
                  onclick="document.getElementById('event-modal').remove()"
                  class="px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-350 transition-colors cursor-pointer"
                >
                  Delete Event
                </button>
              ) : (
                <button
                  type="button"
                  hx-delete={`/ui/events/${event.id}?date=${defaultDateStr}`}
                  hx-confirm="Are you sure you want to delete this event?"
                  hx-target="#event-list"
                  hx-swap="outerHTML"
                  {...{
                    'hx-on:htmx:after-request':
                      "document.getElementById('event-modal').remove()",
                  }}
                  class="px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-350 transition-colors cursor-pointer"
                >
                  Delete Event
                </button>
              )
            ) : (
              <div></div>
            )}
            <div class="flex items-center gap-3">
              <button
                type="button"
                onclick="document.getElementById('event-modal').remove()"
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/10 transition-colors"
              >
                {isEdit ? 'Save Changes' : 'Schedule Event'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Custom Delete Confirm Modal Component
const DeleteConfirmModal = ({
  event,
  date,
}: {
  event: EventWithBatchIds;
  date: string;
}) => {
  return (
    <div
      id="delete-confirm-modal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-modal border border-slate-100 overflow-hidden transform translate-y-2 sm:scale-95 opacity-0 animate-[fadeInScale_0.2s_ease-out_forwards]">
        <div class="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-[17px] font-bold text-slate-800">
            Delete Repeating Event
          </h3>
          <button
            type="button"
            onclick="document.getElementById('delete-confirm-modal').remove()"
            class="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Delete Icon</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-600 leading-relaxed">
            The event <strong class="text-slate-800">"{event.title}"</strong> is
            part of a repeated series. How would you like to proceed with
            deletion?
          </p>
        </div>

        <div class="bg-slate-50 px-6 py-5 border-t border-slate-100 flex flex-col gap-2.5">
          {/* Delete Instance */}
          <button
            hx-delete={`/ui/events/${event.id}?date=${date}&scope=instance`}
            hx-target="#event-list"
            hx-swap="outerHTML"
            {...{
              'hx-on:htmx:after-request':
                "document.getElementById('delete-confirm-modal').remove()",
            }}
            class="w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-150 transition-colors text-center cursor-pointer"
          >
            Delete Just This Instance
          </button>

          {/* Delete Series */}
          <button
            hx-delete={`/ui/events/${event.id}?date=${date}&scope=series`}
            hx-target="#event-list"
            hx-swap="outerHTML"
            {...{
              'hx-on:htmx:after-request':
                "document.getElementById('delete-confirm-modal').remove()",
            }}
            class="w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors text-center shadow-md shadow-red-500/10 cursor-pointer"
          >
            Delete Entire Repeated Series
          </button>

          {/* Cancel */}
          <button
            type="button"
            onclick="document.getElementById('delete-confirm-modal').remove()"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors text-center mt-1 cursor-pointer"
          >
            Cancel
          </button>
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
    <Layout activePath="/ui/events">
      {/* Top Header Card */}
      <div class="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-premium mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-wrap">
          <label class="font-bold text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Select Date:
            <input
              type="date"
              name="date"
              value={dateStr}
              class="flex-1 min-w-0 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 font-semibold text-sm border border-slate-200 rounded-xl py-2 px-3 transition-all"
              hx-get="/ui/events/list"
              hx-target="#event-list"
              hx-swap="outerHTML"
            />
          </label>
        </div>

        <button
          hx-get="/ui/events/form"
          type={'button'}
          hx-target="#modal-container"
          hx-vals="js:{date: document.querySelector('input[name=date]').value}"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/15 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Event Icon</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Event
        </button>
      </div>
      <EventList events={events} date={dateStr} />
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

  return c.html(<EventList events={events} date={dateStr} />);
});

// HTMX Endpoint: Get Create Form Modal
eventsUi.get('/form', async (c) => {
  const dateStr = c.req.query('date') || formatDate(new Date());
  const batches = await batchRepository.allBatches();

  return c.html(<EventModal batches={batches} date={dateStr} />);
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

// HTMX Endpoint: Get Delete Confirmation popup
eventsUi.get('/delete-confirm/:id', async (c) => {
  const id = c.req.param('id');
  const date = c.req.query('date') || formatDate(new Date());
  const foundEvent = await eventRepository.findById(id);

  if (!foundEvent) return c.text('Event not found', 404);

  return c.html(<DeleteConfirmModal event={foundEvent} date={date} />);
});

const _MAX_RECURRENCE_INSTANCES = 365;

// Helper to parse form data and return updated list
const handleSave = async (c: Context, id?: string) => {
  const body = await c.req.parseBody({ all: true });
  const getFirst = (val: unknown) =>
    Array.isArray(val) ? (val[0] as string) : (val as string);

  const title = getFirst(body.title);
  const description = getFirst(body.description);
  const date = getFirst(body.date);
  const time = getFirst(body.time);
  const durationMinutesStr = getFirst(body.durationMinutes);
  const meetLink = getFirst(body.meetLink);

  // Server-side validation
  if (!title || title.trim().length === 0 || title.length > 200) {
    return c.html(
      <EventError
        message="Title is required (max 200 characters)."
        date={date}
      />,
    );
  }

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (Number(scheduledAt.getTime())) {
    return c.html(
      <EventError message="Invalid date or time value." date={date} />,
    );
  }

  const durationMinutes = parseInt(durationMinutesStr, 10);
  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return c.html(
      <EventError message="Duration must be a positive number." date={date} />,
    );
  }

  if (meetLink) {
    try {
      new URL(meetLink);
    } catch {
      return c.html(
        <EventError message="Meet link must be a valid URL." date={date} />,
      );
    }
  }

  const batchIds = body.batchIds as string | string[] | undefined;
  const batchIdsArr: string[] = !batchIds
    ? []
    : Array.isArray(batchIds)
      ? batchIds
      : [batchIds];

  const data = {
    title: title.trim(),
    description: description || null,
    scheduledAt,
    durationMinutes,
    meetLink: meetLink || null,
  };

  if (id) {
    const editScope =
      (getFirst(body.editScope) as 'single' | 'future') || 'single';
    const updated = await eventRepository.update(
      id,
      { ...data, editScope },
      batchIdsArr,
    );
    if (!updated) {
      return c.html(<EventError message="Event not found." date={date} />);
    }
  } else {
    const isRepeat =
      getFirst(body.repeat) === 'true' && getFirst(body.repeatUntil);
    if (isRepeat) {
      const repeatUntilDate = new Date(
        `${getFirst(body.repeatUntil)}T23:59:59`,
      );
      if (isNaN(repeatUntilDate.getTime())) {
        return c.html(
          <EventError message="Invalid repeat-until date." date={date} />,
        );
      }
      if (repeatUntilDate <= scheduledAt) {
        return c.html(
          <EventError
            message="Repeat-until date must be after the event start date."
            date={date}
          />,
        );
      }

      const interval = getFirst(body.repeatInterval) || 'daily';
      let recurrencePattern = '';
      if (interval === 'daily') {
        recurrencePattern = 'DAILY';
      } else if (interval === 'weekly') {
        recurrencePattern = 'WEEKLY';
      } else if (interval === 'custom') {
        recurrencePattern = (getFirst(body.repeatDays) || '').trim();
        if (!recurrencePattern) {
          return c.html(
            <EventError
              message="Please specify custom days (e.g. MON, WED, FRI)."
              date={date}
            />,
          );
        }
      }

      await eventRepository.create(
        {
          ...data,
          recurrencePattern,
          recurrenceEndDate: repeatUntilDate,
        },
        batchIdsArr,
      );
    } else {
      await eventRepository.create(data, batchIdsArr);
    }
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventRepository.all({ from: startOfDay, to: endOfDay });

  return c.html(<EventList events={events} date={date} />);
};

eventsUi.post('/', async (c) => {
  return handleSave(c);
});

eventsUi.put('/:id', async (c) => {
  const id = c.req.param('id');
  return handleSave(c, id);
});

eventsUi.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const dateStr = c.req.query('date') || formatDate(new Date());
  const scope = c.req.query('scope') as string;

  const foundEvent = await eventRepository.findById(id);
  if (foundEvent) {
    if (scope === 'series' && foundEvent.groupId) {
      await eventRepository.deleteEventSeries(foundEvent.groupId);
    } else {
      await eventRepository.deleteEventById(id);
    }
  }

  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await eventRepository.all({ from: startOfDay, to: endOfDay });

  return c.html(<EventList events={events} date={dateStr} />);
});
