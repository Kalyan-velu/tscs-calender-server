import { createRoute, z } from "@hono/zod-openapi";
import { commonErrorResponses, successSchema } from "../response.schema.js";
import { EventSchema } from "../event/index.js";

export const BatchSchema = z.object({ id: z.string(), name: z.string() });

export const createBatchRoute = createRoute({
  method: "post",
  tags: ["Batches"],
  path: "/",
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ name: z.string() }) },
      },
    },
  },
  responses: {
    ...commonErrorResponses,
    201: {
      description: "Batch created",
      content: {
        "application/json": { schema: successSchema(BatchSchema) },
      },
    },
  },
});

export const deleteBatchRequest = createRoute({
  method: "delete",
  path: "/{batchId}",
  tags: ["Batches"],
  request: {
    params: z.object({
      batchId: z.string().openapi({
        param: {
          name: "batchId",
          in: "path",
        },
        example: "batch-id",
      }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: "Batch deleted",
      content: {
        "application/json": { schema: successSchema(z.boolean()) },
      },
    },
  },
});

export const listBatchesRequest = createRoute({
  method: "get",
  tags: ["Batches"],
  path: "/",
  responses: {
    ...commonErrorResponses,
    200: {
      description: "List of batches",
      content: {
        "application/json": { schema: successSchema(z.array(BatchSchema)) },
      },
    },
  },
});

export const getBatchByIdRequest = createRoute({
  method: "get",
  path: "/{batchId}",
  tags: ["Batches"],
  request: {
    params: z.object({
      batchId: z.string().openapi({
        param: {
          name: "batchId",
          in: "path",
        },
        example: "batch-id",
      }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: "Batch details",
      content: {
        "application/json": { schema: successSchema(BatchSchema) },
      },
    },
  },
});

export const getBatchEventsRequest = createRoute({
  method: "get",
  path: "/{batchId}/events",
  tags: ["Batches"],
  request: {
    params: z.object({
      batchId: z.string().openapi({
        param: {
          name: "batchId",
          in: "path",
        },
      }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: "List of events for the batch",
      content: {
        "application/json": { schema: successSchema(z.array(EventSchema)) },
      },
    },
  },
});
