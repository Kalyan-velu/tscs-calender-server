import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const batch = pgTable('batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const event = pgTable(
  'event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    meetLink: text('meet_link'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    groupId: uuid('group_id'),
    recurrencePattern: text('recurrence_pattern'),
    recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_event_scheduled_at').on(table.scheduledAt),
    index('idx_event_group_id').on(table.groupId),
  ],
);

export const eventBatch = pgTable(
  'event_batch',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batch.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.batchId] }),
    index('idx_event_batch_batch_id').on(table.batchId),
  ],
);

export const student = pgTable(
  'student',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: text('display_name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    batchId: uuid('batch_id').references(() => batch.id),
    pushToken: text('push_token'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_student_batch_id').on(table.batchId)],
);

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

export type Batch = typeof batch.$inferSelect;
export type NewBatch = typeof batch.$inferInsert;
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type Student = typeof student.$inferSelect;
export type NewStudent = typeof student.$inferInsert;
