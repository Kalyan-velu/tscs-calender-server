import { createRoute, z } from '@hono/zod-openapi';
import { commonErrorResponses, successSchema } from '../response.schema.js';

export const EventSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  meetLink: z.string().nullable(),
  scheduledAt: z.iso.datetime(),
  durationMinutes: z.number().int(),
  batchIds: z.array(z.uuid()),
  groupId: z.string().uuid().nullable().optional(),
  recurrencePattern: z.string().nullable().optional(),
  recurrenceEndDate: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateEventSchema = z.object({
  title: z.string().openapi({
    example: 'Live class 1',
  }),
  description: z.string().nullable().optional().openapi({
    example: 'Introduction class',
  }),
  meetLink: z.string().url().nullable().optional().openapi({
    example: 'https://meet.google.com/abc-defg-hij',
  }),
  scheduledAt: z.iso.datetime().openapi({
    example: '2026-05-11T10:00:00.000Z',
  }),
  durationMinutes: z.number().int().positive().openapi({
    example: 60,
  }),
  batchIds: z.array(z.uuid()).min(1).openapi({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  }),
  recurrencePattern: z.string().nullable().optional().openapi({
    example: 'MON,WED,FRI',
  }),
  recurrenceEndDate: z.iso.datetime().nullable().optional().openapi({
    example: '2026-06-30T23:59:59.000Z',
  }),
});

export const AssignEventBatchesSchema = z.object({
  batchIds: z
    .array(z.uuid())
    .min(1)
    .openapi({
      example: ['550e8400-e29b-41d4-a716-446655440000'],
    }),
});

export const UpdateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  meetLink: z.string().url().nullable().optional(),
  scheduledAt: z.iso.datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  batchIds: z.array(z.uuid()).optional(),
  recurrencePattern: z.string().nullable().optional(),
  recurrenceEndDate: z.iso.datetime().nullable().optional(),
  editScope: z.enum(['single', 'future']).optional(),
});

// Routes
export const createEventRoute = createRoute({
  method: 'post',
  tags: ['Events'],
  path: '/',
  request: {
    body: {
      content: { 'application/json': { schema: CreateEventSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    201: {
      description: 'Event created',
      content: {
        'application/json': { schema: successSchema(EventSchema) },
      },
    },
  },
});

export const deleteEventRequest = createRoute({
  method: 'delete',
  path: '/{eventId}',
  tags: ['Events'],
  request: {
    params: z.object({
      eventId: z.string().openapi({
        param: {
          name: 'eventId',
          in: 'path',
        },
        example: 'event-id',
      }),
    }),
    query: z.object({
      scope: z.enum(['instance', 'series']).optional().openapi({
        description: 'Delete scope: delete only this instance, or the entire series.',
        example: 'instance'
      }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Event deleted',
      content: {
        'application/json': { schema: successSchema(z.boolean()) },
      },
    },
  },
});

export const listEventsRequest = createRoute({
  method: 'get',
  tags: ['Events'],
  path: '/',
  request: {
    query: z.object({
      batchId: z.uuid().optional(),
      from: z.iso.datetime().optional(),
      to: z.iso.datetime().optional(),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'List of events',
      content: {
        'application/json': { schema: successSchema(z.array(EventSchema)) },
      },
    },
  },
});

export const getEventByIdRequest = createRoute({
  method: 'get',
  path: '/{eventId}',
  tags: ['Events'],
  request: {
    params: z.object({
      eventId: z.string().openapi({
        param: {
          name: 'eventId',
          in: 'path',
        },
        example: 'event-id',
      }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Event details',
      content: {
        'application/json': { schema: successSchema(EventSchema) },
      },
    },
  },
});

export const updateEventRoute = createRoute({
  method: 'put',
  path: '/{eventId}',
  tags: ['Events'],
  request: {
    params: z.object({
      eventId: z.string().openapi({
        param: { name: 'eventId', in: 'path' },
        example: 'event-id',
      }),
    }),
    body: {
      content: { 'application/json': { schema: UpdateEventSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Event updated',
      content: {
        'application/json': { schema: successSchema(EventSchema) },
      },
    },
  },
});

export const assignEventBatchesRequest = createRoute({
  method: 'post',
  path: '/{eventId}/batches',
  tags: ['Events'],
  request: {
    params: z.object({
      eventId: z.string().openapi({
        param: {
          name: 'eventId',
          in: 'path',
        },
        example: 'event-id',
      }),
    }),
    body: {
      content: { 'application/json': { schema: AssignEventBatchesSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Event batches assigned',
      content: {
        'application/json': { schema: successSchema(EventSchema) },
      },
    },
  },
});
