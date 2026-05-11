import {event, eventBatch, type NewEvent} from "../schema.js";
import {and, eq, gte, lte} from "drizzle-orm";
import {db} from "../index.js";

export const eventRepository = {
  findByBatchId: async (batchId: string, filters?: {
    from?: Date;
    to?: Date;
  }) => {
    const conditions = [eq(eventBatch.batchId, batchId)];
    
    if (filters?.from) conditions.push(gte(event.scheduledAt, filters.from));
    if (filters?.to)   conditions.push(lte(event.scheduledAt, filters.to));
    
    const rows = await db
      .select({ event })
      .from(event)
      .innerJoin(eventBatch, eq(eventBatch.eventId, event.id))
      .where(and(...conditions))
      .orderBy(event.scheduledAt);
    
    return rows.map(r => r.event);
  },
  findById: async(id: string) => {
    const [found]=await db.select().from(event).where(eq(event.id, id));
    return found;
  },
  create: async (data: NewEvent, batchIds: string[]) => {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(event).values(data).returning();
      if (batchIds.length) {
        await tx.insert(eventBatch).values(
          batchIds.map(batchId => ({ eventId: created.id, batchId }))
        );
      }
      return created;
    });
  },
  deleteEventById: async (id: string) => {
    await eventRepository.findById(id);
    return db.delete(event).where(eq(event.id, id));
  }
}
