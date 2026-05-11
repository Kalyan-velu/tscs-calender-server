import {commonErrorResponses, successSchema} from '../schemas/response.schema.js'
import {err, ok} from '../utils/respond.js'
import {createRoute, OpenAPIHono, z} from "@hono/zod-openapi";
import {batchRepository} from "../db/repository/batch.repository.js";

export const batches=new OpenAPIHono()

const BatchSchema = z.object({ id: z.string(), name: z.string() })

const createBatchRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ name: z.string() }) } },
    },
  },
  responses: {
    200: {
      description: 'Batch created',
      content: {
        'application/json': { schema: successSchema(BatchSchema) },
      },
    },
    ...commonErrorResponses,
  },
})

batches.openapi(createBatchRoute, async (c) => {
  try {
    const { name } = c.req.valid('json')
    const created = await batchRepository.create({ name })
    return ok(c, created)
  } catch (e) {
    return err(c, 'Failed to create batch', 500)
  }
})