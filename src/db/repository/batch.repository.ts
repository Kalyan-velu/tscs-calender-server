import { db } from "../index.js";
import { batch, type NewBatch } from "../schema.js";
import { eq, inArray } from "drizzle-orm";
import { eventRepository } from "./event.repository.js";

export const batchRepository = {
  create: async (data: NewBatch) => {
    const [created] = await db.insert(batch).values(data).returning();
    return created;
  },
  deleteBatch: async (id: string) => {
    return db.delete(batch).where(eq(batch.id, id));
  },
  findById: async (batchId: string) => {
    const [found] = await db.select().from(batch).where(eq(batch.id, batchId));
    return found;
  },
  findByIds: async (batchIds: string[]) => {
    if (!batchIds.length) return [];
    return db.select().from(batch).where(inArray(batch.id, batchIds));
  },
  allBatches: async () => {
    return db.select().from(batch);
  },
  events: async (batchId: string) => {
    return eventRepository.findByBatchId(batchId);
  },
};
