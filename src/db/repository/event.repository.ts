import {event, eventBatch, type NewEvent} from "../schema.js";
import {and, eq, gte, inArray, lte} from "drizzle-orm";
import {db} from "../index.js";

const withBatchIds = async <T extends { id: string }>(events: T[]) => {
  if (!events.length) return events.map((item) => ({ ...item, batchIds: [] as string[] }));

  const links = await db
    .select({
      eventId: eventBatch.eventId,
      batchId: eventBatch.batchId,
    })
    .from(eventBatch)
    .where(inArray(eventBatch.eventId, events.map((item) => item.id)));

  const batchIdsByEventId = new Map<string, string[]>();
  for (const link of links) {
    const existing = batchIdsByEventId.get(link.eventId) ?? [];
    existing.push(link.batchId);
    batchIdsByEventId.set(link.eventId, existing);
  }

  return events.map((item) => ({
    ...item,
    batchIds: batchIdsByEventId.get(item.id) ?? [],
  }));
};

const asWhereClause = (conditions: Array<ReturnType<typeof eq>>) => {
  if (!conditions.length) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
};

export const eventRepository = {
  all: async (filters?: {
    from?: Date;
    to?: Date;
  }) => {
    const conditions = [];

    if (filters?.from) conditions.push(gte(event.scheduledAt, filters.from));
    if (filters?.to) conditions.push(lte(event.scheduledAt, filters.to));

    const foundEvents = await db
      .select()
      .from(event)
      .where(asWhereClause(conditions))
      .orderBy(event.scheduledAt);

    return withBatchIds(foundEvents);
  },
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
      .where(asWhereClause(conditions))
      .orderBy(event.scheduledAt);
    
    return withBatchIds(rows.map(r => r.event));
  },
  findById: async(id: string) => {
    const [found]=await db.select().from(event).where(eq(event.id, id));
    if (!found) return found;
    const [eventWithBatchIds] = await withBatchIds([found]);
    return eventWithBatchIds;
  },
  create: async (data: NewEvent, batchIds: string[]) => {
    const uniqueBatchIds = [...new Set(batchIds)];

    return db.transaction(async (tx) => {
      const [created] = await tx.insert(event).values(data).returning();
      if (uniqueBatchIds.length) {
        await tx.insert(eventBatch).values(
          uniqueBatchIds.map(batchId => ({ eventId: created.id, batchId }))
        );
      }
      return {
        ...created,
        batchIds: uniqueBatchIds,
      };
    });
  },
  assignToBatches:async(eventId:string, batchIds:string[])=>{
    const foundEvent=await eventRepository.findById(eventId)
    if (!foundEvent) throw new Error("Event not found.")
    const uniqueBatchIds = [...new Set(batchIds)]
    if (uniqueBatchIds.length){
      await db.insert(eventBatch).values(
        uniqueBatchIds.map(batchId=>({ eventId: foundEvent.id, batchId }))
      ).onConflictDoNothing()
    }
    return eventRepository.findById(eventId)
  },
  deleteEventById: async (id: string) => {
    return db.delete(event).where(eq(event.id, id));
  }
}
