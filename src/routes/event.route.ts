import { OpenAPIHono } from '@hono/zod-openapi';
import {
  assignEventBatchesRequest,
  createEventRoute,
  deleteEventRequest,
  getEventByIdRequest,
  listEventsRequest,
} from '../schemas/event/index.js';
import { err, ok } from '../utils/respond.js';
import { eventRepository } from '../db/repository/event.repository.js';
import { batchRepository } from '../db/repository/batch.repository.js';

export const events = new OpenAPIHono();

events.openapi(createEventRoute, async (c) => {
  try {
    const {
      title,
      description,
      meetLink,
      scheduledAt,
      durationMinutes,
      batchIds,
    } = c.req.valid('json');
    const batches = await batchRepository.findByIds(batchIds);

    if (batches.length !== batchIds.length) {
      return err(c, 'One or more batches were not found', 404);
    }

    const createdEvent = await eventRepository.create(
      {
        title,
        description: description ?? null,
        meetLink: meetLink ?? null,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
      },
      batchIds,
    );

    return ok(c, createdEvent, 201);
  } catch (e) {
    return err(c, 'Failed to create event', 500);
  }
});

events.openapi(listEventsRequest, async (c) => {
  try {
    const { batchId, from, to } = c.req.valid('query');

    if (from && to && new Date(from) > new Date(to)) {
      return err(c, '`from` must be earlier than or equal to `to`', 400);
    }

    const filters = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };

    if (batchId) {
      const batch = await batchRepository.findById(batchId);
      if (!batch) {
        return err(c, 'Batch not found', 404);
      }

      const foundEvents = await eventRepository.findByBatchId(batchId, filters);
      return ok(c, foundEvents);
    }

    const foundEvents = await eventRepository.all(filters);
    return ok(c, foundEvents);
  } catch (e) {
    return err(c, 'Failed to list events', 500);
  }
});

events.openapi(getEventByIdRequest, async (c) => {
  try {
    const { eventId } = c.req.valid('param');
    const foundEvent = await eventRepository.findById(eventId);

    if (!foundEvent) {
      return err(c, 'Event not found', 404);
    }

    return ok(c, foundEvent);
  } catch (e) {
    return err(c, 'Failed to get event', 500);
  }
});

events.openapi(deleteEventRequest, async (c) => {
  try {
    const { eventId } = c.req.valid('param');
    const foundEvent = await eventRepository.findById(eventId);

    if (!foundEvent) {
      return err(c, 'Event not found', 404);
    }

    await eventRepository.deleteEventById(eventId);
    return ok(c, true);
  } catch (e) {
    return err(c, 'Failed to delete event', 500);
  }
});

events.openapi(assignEventBatchesRequest, async (c) => {
  try {
    const { eventId } = c.req.valid('param');
    const { batchIds } = c.req.valid('json');

    const foundEvent = await eventRepository.findById(eventId);
    if (!foundEvent) {
      return err(c, 'Event not found', 404);
    }

    const batches = await batchRepository.findByIds(batchIds);
    if (batches.length !== [...new Set(batchIds)].length) {
      return err(c, 'One or more batches were not found', 404);
    }

    const updatedEvent = await eventRepository.assignToBatches(
      eventId,
      batchIds,
    );
    return ok(c, updatedEvent);
  } catch (e) {
    return err(c, 'Failed to assign event to batches', 500);
  }
});
