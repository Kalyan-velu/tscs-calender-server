// src/schemas/response.schema.ts
import { z } from '@hono/zod-openapi';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const successSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal(true),
    data: dataSchema,
  });

export const errorSchema = z.object({
  status: z.literal(false),
  error: z.object({
    message: z.string(),
  }),
});

export const commonErrorResponses = {
  400: {
    description: 'Bad request',
    content: { 'application/json': { schema: errorSchema } },
  },
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: errorSchema } },
  },
  500: {
    description: 'Internal server error',
    content: { 'application/json': { schema: errorSchema } },
  },
} as unknown as Record<
  ContentfulStatusCode,
  { description: string; content: Record<string, { schema: z.ZodTypeAny }> }
>;
