import { createRoute, z } from '@hono/zod-openapi';
import { commonErrorResponses, successSchema } from '../response.schema.js';

export const StudentSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  email: z.string().email(),
  batchId: z.string().uuid().nullable(),
  pushToken: z.string().nullable(),
  createdAt: z.string(),
});

export const StudentWithBatchNameSchema = StudentSchema.extend({
  batchName: z.string(),
});

export const CreateStudentSchema = z.object({
  displayName: z.string().openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john.doe@example.com' }),
  password: z
    .string()
    .min(6)
    .optional()
    .openapi({ example: 'password123' }),
  batchId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  pushToken: z.string().nullable().optional().openapi({ example: 'token123' }),
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export const createStudentRoute = createRoute({
  method: 'post',
  tags: ['Students'],
  path: '/',
  request: {
    body: {
      content: { 'application/json': { schema: CreateStudentSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    201: {
      description: 'Student created',
      content: {
        'application/json': { schema: successSchema(StudentSchema) },
      },
    },
  },
});

export const deleteStudentRequest = createRoute({
  method: 'delete',
  path: '/{studentId}',
  tags: ['Students'],
  request: {
    params: z.object({
      studentId: z
        .string()
        .uuid()
        .openapi({
          param: {
            name: 'studentId',
            in: 'path',
          },
          example: 'student-id',
        }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Student deleted',
      content: {
        'application/json': { schema: successSchema(z.boolean()) },
      },
    },
  },
});

export const listStudentsRequest = createRoute({
  method: 'get',
  tags: ['Students'],
  path: '/',
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'List of students',
      content: {
        'application/json': {
          schema: successSchema(z.array(StudentWithBatchNameSchema)),
        },
      },
    },
  },
});

export const getStudentByIdRequest = createRoute({
  method: 'get',
  path: '/{studentId}',
  tags: ['Students'],
  request: {
    params: z.object({
      studentId: z
        .string()
        .uuid()
        .openapi({
          param: {
            name: 'studentId',
            in: 'path',
          },
        }),
    }),
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Student details',
      content: {
        'application/json': { schema: successSchema(StudentSchema) },
      },
    },
  },
});

export const updateStudentRequest = createRoute({
  method: 'patch',
  path: '/{studentId}',
  tags: ['Students'],
  request: {
    params: z.object({
      studentId: z
        .string()
        .uuid()
        .openapi({
          param: {
            name: 'studentId',
            in: 'path',
          },
        }),
    }),
    body: {
      content: { 'application/json': { schema: UpdateStudentSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Student updated',
      content: {
        'application/json': { schema: successSchema(StudentSchema) },
      },
    },
  },
});

export const StudentLoginSchema = z.object({
  email: z.string().email().openapi({ example: 'student@example.com' }),
  password: z.string().openapi({ example: 'password123' }),
});

export const StudentLoginResponseSchema = z.object({
  token: z.string(),
  student: StudentSchema,
});

export const studentLoginRoute = createRoute({
  method: 'post',
  tags: ['Students'],
  path: '/login',
  request: {
    body: {
      content: { 'application/json': { schema: StudentLoginSchema } },
      required: true,
    },
  },
  responses: {
    ...commonErrorResponses,
    200: {
      description: 'Login successful',
      content: {
        'application/json': { schema: successSchema(StudentLoginResponseSchema) },
      },
    },
  },
});
