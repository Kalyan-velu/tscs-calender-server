import {integer, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';

// Batches (e.g. "APSC 2025 Group A")
export const batch = pgTable('batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

// Class events
export const event = pgTable('event', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  meetLink: text('meet_link'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table — one event can belong to many batches
export const eventBatch = pgTable('event_batch', {
  eventId: uuid('event_id').notNull().references(() => event.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').notNull().references(() => batch.id, { onDelete: 'cascade' }),
});

// Students
export const student = pgTable('student', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  email: text('email').notNull().unique(),
  batchId: uuid('batch_id').references(() => batch.id),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations (for Drizzle query builder)
export const batchRelations = relations(batch, ({ many }) => ({
  eventBatches: many(eventBatch),
  students: many(student),
}));

export const eventRelations = relations(event, ({ many }) => ({
  eventBatches: many(eventBatch),
}));

export const eventBatchRelations = relations(eventBatch, ({ one }) => ({
  event: one(event, { fields: [eventBatch.eventId], references: [event.id] }),
  batch: one(batch, { fields: [eventBatch.batchId], references: [batch.id] }),
}));

export const studentRelations = relations(student, ({ one }) => ({
  batch: one(batch, { fields: [student.batchId], references: [batch.id] }),
}));

// Types
export type Batch = typeof batch.$inferSelect;
export type NewBatch = typeof batch.$inferInsert;
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type Student = typeof student.$inferSelect;
export type NewStudent = typeof student.$inferInsert;