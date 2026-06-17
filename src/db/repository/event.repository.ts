import crypto from 'node:crypto';
import {and, eq, gte, inArray, lte, type SQL} from 'drizzle-orm';
import type {EventWithBatchIds} from '../../routes/ui/events.ui.js';
import {getCached, invalidate, invalidatePattern, setCached,} from '../../utils/cache.js';
import {generateOccurrences} from '../../utils/recurrence.js';
import {db} from '../index.js';
import {batch, event, eventBatch, type NewEvent} from '../schema.js';

/** Joins batch assignments onto an array of events in a single batched query. */
const withBatchIds = async <T extends { id: string }>(
  events: T[],
): Promise<T[]> => {
  if (!events.length)
    return events.map((item) => ({ ...item, batchIds: [] as string[] }));

  const links = await db
    .select({
      eventId: eventBatch.eventId,
      batchId: eventBatch.batchId,
      batch: batch.name,
    })
    .from(eventBatch)
    .innerJoin(batch, eq(batch.id, eventBatch.batchId))
    .where(
      inArray(
        eventBatch.eventId,
        events.map((item) => item.id),
      ),
    );

  const batchesByEventId = new Map<string, { id: string; name: string }[]>();
  for (const link of links) {
    const existing = batchesByEventId.get(link.eventId) ?? [];
    existing.push({ id: link.batchId, name: link.batch });
    batchesByEventId.set(link.eventId, existing);
  }

  return events.map((item) => {
    const batches = batchesByEventId.get(item.id) ?? [];
    return {
      ...item,
      batches,
    };
  });
};

const asWhereClause = (conditions: SQL[]) => {
  if (!conditions.length) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
};

/**
 * Returns batch IDs linked to an event. Must be called before deletion since
 * the cascade on `eventBatch` removes these rows when the event is deleted.
 * @param eventId - Event UUID.
 */
const getEventBatchIds = async (eventId: string): Promise<string[]> => {
  const links = await db
    .select({ batchId: eventBatch.batchId })
    .from(eventBatch)
    .where(eq(eventBatch.eventId, eventId));
  return links.map((l) => l.batchId);
};

/**
 * Returns deduplicated batch IDs across all events in a recurrence group.
 * @param groupId - Recurrence group UUID.
 */
const getGroupBatchIds = async (groupId: string): Promise<string[]> => {
  const links = await db
    .select({ batchId: eventBatch.batchId })
    .from(eventBatch)
    .innerJoin(event, eq(event.id, eventBatch.eventId))
    .where(eq(event.groupId, groupId));
  return [...new Set(links.map((l) => l.batchId))];
};

/**
 * Invalidates all `events:batch:{id}:*` cache entries for the given batch IDs in parallel.
 * @param batchIds - Batch IDs whose event caches should be cleared.
 */
const invalidateBatchEventCaches = (batchIds: string[]): Promise<Awaited<void>[]> =>
  Promise.all(batchIds.map((id) => invalidatePattern(`events:batch:${id}:*`)));

export const eventRepository = {
  /**
   * Returns all events ordered by scheduled date, with batch assignments joined.
   * Not cached — callers always pass dynamic date ranges.
   * @param filters - Optional date range to filter by `scheduledAt`.
   */
  all: async (filters?: { from?: Date; to?: Date }) => {
    const conditions: SQL[] = [];

    if (filters?.from) conditions.push(gte(event.scheduledAt, filters.from));
    if (filters?.to) conditions.push(lte(event.scheduledAt, filters.to));

    const foundEvents = await db
      .select()
      .from(event)
      .where(asWhereClause(conditions))
      .orderBy(event.scheduledAt);

    return withBatchIds(foundEvents as (EventWithBatchIds & { id: string })[]);
  },
  /**
   * Returns events for a batch, cached per unique batchId + filter combination.
   * Cache key encodes filter dates as epoch ms. TTL 120s.
   * @param batchId - Batch UUID to filter by.
   * @param filters - Optional date range to filter by `scheduledAt`.
   */
  findByBatchId: async (
    batchId: string,
    filters?: {
      from?: Date;
      to?: Date;
    },
  ) => {
    const cacheKey = `events:batch:${batchId}:${filters?.from?.getTime() ?? ''}:${filters?.to?.getTime() ?? ''}`;
    const cached = await getCached<EventWithBatchIds[]>(cacheKey);
    if (cached) return cached;

    const conditions: SQL[] = [eq(eventBatch.batchId, batchId)];

    if (filters?.from) conditions.push(gte(event.scheduledAt, filters.from));
    if (filters?.to) conditions.push(lte(event.scheduledAt, filters.to));

    const rows = await db
      .select({ event })
      .from(event)
      .innerJoin(eventBatch, eq(eventBatch.eventId, event.id))
      .where(asWhereClause(conditions))
      .orderBy(event.scheduledAt);

    const result = await withBatchIds(rows.map((r) => r.event));
    void setCached(cacheKey, result, 120);
    return result;
  },
  /**
   * Returns a single event with its batch assignments. Cached at `event:{id}`, TTL 300s.
   * @param id - Event UUID.
   */
  findById: async (id: string) => {
    const cached = await getCached<EventWithBatchIds>(`event:${id}`);
    if (cached) return cached;
    const [found] = await db.select().from(event).where(eq(event.id, id));
    if (!found) return found;
    const [eventWithBatchIds] = await withBatchIds([
      found,
    ] as EventWithBatchIds[]);
    void setCached(`event:${id}`, eventWithBatchIds, 300);
    return eventWithBatchIds;
  },
  /**
   * Creates a single event or a full recurrence series, then links batch assignments.
   * Invalidates `events:batch:*` for all assigned batches after the transaction.
   * @param data - Event fields; if `recurrencePattern` and `recurrenceEndDate` are set, a series is generated.
   * @param batchIds - Batch UUIDs to assign to the created event(s).
   */
  create: async (data: NewEvent, batchIds: string[]) => {
    const uniqueBatchIds = [...new Set(batchIds)];

    return db
      .transaction(async (tx) => {
        if (data.recurrencePattern && data.recurrenceEndDate) {
          const occurrences = generateOccurrences(
            new Date(data.scheduledAt),
            new Date(data.recurrenceEndDate),
            data.recurrencePattern,
          );

          if (occurrences.length > 0) {
            const groupId = crypto.randomUUID();
            const eventsToInsert = occurrences.map((occDate) => ({
              ...data,
              groupId,
              scheduledAt: occDate,
            }));

            const createdEvents = await tx
              .insert(event)
              .values(eventsToInsert)
              .returning();

            if (uniqueBatchIds.length > 0) {
              const batchLinks = createdEvents.flatMap((created) =>
                uniqueBatchIds.map((batchId) => ({
                  eventId: created.id,
                  batchId,
                })),
              );
              await tx.insert(eventBatch).values(batchLinks);
            }

            const mainEvent = createdEvents[0];
            return {
              ...mainEvent,
              batchIds: uniqueBatchIds,
            };
          }
        }

        const [created] = await tx.insert(event).values(data).returning();
        if (uniqueBatchIds.length) {
          await tx.insert(eventBatch).values(
            uniqueBatchIds.map((batchId) => ({
              eventId: created.id,
              batchId,
            })),
          );
        }
        return {
          ...created,
          batchIds: uniqueBatchIds,
        };
      })
      .then(async (result) => {
        await invalidateBatchEventCaches(uniqueBatchIds);
        return result;
      });
  },
  /**
   * Links additional batches to an existing event, ignoring duplicates.
   * Invalidates cache for both previously assigned and newly assigned batches.
   * @param eventId - Event UUID.
   * @param batchIds - Batch UUIDs to add.
   */
  assignToBatches: async (eventId: string, batchIds: string[]) => {
    const foundEvent = await eventRepository.findById(eventId);
    if (!foundEvent) throw new Error('Event not found.');
    const uniqueBatchIds = [...new Set(batchIds)];
    const oldBatchIds = await getEventBatchIds(eventId);
    if (uniqueBatchIds.length) {
      await db
        .insert(eventBatch)
        .values(
          uniqueBatchIds.map((batchId) => ({
            eventId: foundEvent.id,
            batchId,
          })),
        )
        .onConflictDoNothing();
    }
    const allAffected = [...new Set([...oldBatchIds, ...uniqueBatchIds])];
    await Promise.all([
      invalidate(`event:${eventId}`),
      invalidateBatchEventCaches(allAffected),
    ]);
    return eventRepository.findById(eventId);
  },
  /**
   * Deletes a single event and invalidates its cache and all related batch event caches.
   * Batch IDs are fetched before deletion since the cascade removes `eventBatch` rows.
   * @param id - Event UUID.
   */
  deleteEventById: async (id: string) => {
    const batchIds = await getEventBatchIds(id);
    await db.delete(event).where(eq(event.id, id));
    await Promise.all([
      invalidate(`event:${id}`),
      invalidateBatchEventCaches(batchIds),
    ]);
  },
  /**
   * Deletes all events sharing a `groupId` (a full recurrence series).
   * @param groupId - Recurrence group UUID.
   */
  deleteEventSeries: async (groupId: string) => {
    const batchIds = await getGroupBatchIds(groupId);
    await db.delete(event).where(eq(event.groupId, groupId));
    await invalidateBatchEventCaches(batchIds);
  },
  /**
   * Updates an event. When `editScope` is `'future'`, all events in the series
   * from this event onward are updated with a time-shifted `scheduledAt`.
   * Invalidates `event:{id}` and batch event caches for all affected batches.
   * @param id - Event UUID to update.
   * @param data - Fields to update; `editScope` controls single vs. future-series edit.
   * @param batchIds - If provided, replaces the event's batch assignments entirely.
   */
  update: async (
    id: string,
    data: Partial<NewEvent> & { editScope?: 'single' | 'future' },
    batchIds?: string[],
  ) => {
    const oldBatchIds = await getEventBatchIds(id);
    return db
      .transaction(async (tx) => {
        const [foundEvent] = await tx
          .select()
          .from(event)
          .where(eq(event.id, id));
        if (!foundEvent) return undefined;

        const editScope = data.editScope || 'single';
        const cleanData = { ...data };
        delete cleanData.editScope;

        if (editScope === 'future' && foundEvent.groupId) {
          const futureEvents = await tx
            .select()
            .from(event)
            .where(
              and(
                eq(event.groupId, foundEvent.groupId),
                gte(event.scheduledAt, foundEvent.scheduledAt),
              ),
            );

          let timeShiftMs = 0;
          if (cleanData.scheduledAt) {
            timeShiftMs =
              new Date(cleanData.scheduledAt).getTime() -
              new Date(foundEvent.scheduledAt).getTime();
          }

          for (const fev of futureEvents) {
            const fevData = { ...cleanData };
            if (timeShiftMs !== 0) {
              fevData.scheduledAt = new Date(
                new Date(fev.scheduledAt).getTime() + timeShiftMs,
              );
            } else {
              delete fevData.scheduledAt;
            }

            if (Object.keys(fevData).length > 0) {
              await tx
                .update(event)
                .set({ ...fevData, updatedAt: new Date() })
                .where(eq(event.id, fev.id));
            }

            if (batchIds !== undefined) {
              const uniqueBatchIds = [...new Set(batchIds)];
              await tx.delete(eventBatch).where(eq(eventBatch.eventId, fev.id));
              if (uniqueBatchIds.length > 0) {
                await tx.insert(eventBatch).values(
                  uniqueBatchIds.map((batchId) => ({
                    eventId: fev.id,
                    batchId,
                  })),
                );
              }
            }
          }
        } else {
          if (foundEvent.groupId) {
            cleanData.groupId = null;
            cleanData.recurrencePattern = null;
            cleanData.recurrenceEndDate = null;
          }

          if (Object.keys(cleanData).length > 0) {
            await tx
              .update(event)
              .set({ ...cleanData, updatedAt: new Date() })
              .where(eq(event.id, id));
          }

          if (batchIds !== undefined) {
            const uniqueBatchIds = [...new Set(batchIds)];
            await tx.delete(eventBatch).where(eq(eventBatch.eventId, id));
            if (uniqueBatchIds.length > 0) {
              await tx
                .insert(eventBatch)
                .values(
                  uniqueBatchIds.map((batchId) => ({ eventId: id, batchId })),
                );
            }
          }
        }

        const [finalEvent] = await tx
          .select()
          .from(event)
          .where(eq(event.id, id));
        if (!finalEvent) return undefined;

        const links = await tx
          .select({ batchId: eventBatch.batchId })
          .from(eventBatch)
          .where(eq(eventBatch.eventId, id));

        return { ...finalEvent, batchIds: links.map((l) => l.batchId) };
      })
      .then(async (result) => {
        const newBatchIds = batchIds ?? [];
        const allAffected = [...new Set([...oldBatchIds, ...newBatchIds])];
        await Promise.all([
          invalidate(`event:${id}`),
          invalidateBatchEventCaches(allAffected),
        ]);
        return result;
      });
  },
};
