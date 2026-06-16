import { eq, inArray } from 'drizzle-orm';
import { getCached, invalidate, setCached } from '../../utils/cache.js';
import { db } from '../index.js';
import { batch, type Batch, type NewBatch } from '../schema.js';
import { eventRepository } from './event.repository.js';

const KEY = 'batches';

export const batchRepository = {
  /**
   * Creates a batch and invalidates the all-batches cache.
   * @param data - Batch fields.
   */
  create: async (data: NewBatch) => {
    const [created] = await db.insert(batch).values(data).returning();
    await invalidate(`${KEY}:all`);
    return created;
  },

  /**
   * Deletes a batch by ID and invalidates both the per-batch and all-batches caches.
   * @param id - Batch UUID.
   */
  deleteBatch: async (id: string) => {
    await Promise.all([invalidate(`${KEY}:all`), invalidate(`batch:${id}`)]);
    return db.delete(batch).where(eq(batch.id, id));
  },

  /**
   * Returns a batch by ID. Cached at `batch:{id}`, TTL 300s.
   * @param batchId - Batch UUID.
   */
  findById: async (batchId: string) => {
    const cached = await getCached<Batch>(`batch:${batchId}`);
    if (cached) return cached;
    const [found] = await db.select().from(batch).where(eq(batch.id, batchId));
    if (found) void setCached(`batch:${found.id}`, found, 300);
    return found;
  },

  /**
   * Returns multiple batches by their IDs. Not cached due to variable input.
   * @param batchIds - Array of batch UUIDs.
   */
  findByIds: async (batchIds: string[]) => {
    if (!batchIds.length) return [];
    return db.select().from(batch).where(inArray(batch.id, batchIds));
  },

  /**
   * Returns all batches. Cached at `batches:all`, TTL 300s.
   */
  allBatches: async () => {
    const cached = await getCached<Batch[]>(`${KEY}:all`);
    if (cached) return cached;
    const all = await db.select().from(batch);
    void setCached(`${KEY}:all`, all, 300);
    return all;
  },

  /**
   * Returns all events assigned to a batch.
   * @param batchId - Batch UUID.
   */
  events: async (batchId: string) => {
    return eventRepository.findByBatchId(batchId);
  },
};
