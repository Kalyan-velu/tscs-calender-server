import { OpenAPIHono } from '@hono/zod-openapi';
import { batchRepository } from '../db/repository/batch.repository.js';
import { studentRepository } from '../db/repository/student.repository.js';
import {
  createStudentRoute,
  deleteStudentRequest,
  getStudentByIdRequest,
  listStudentsRequest,
  updateStudentRequest,
} from '../schemas/student/index.js';

import { err, ok } from '../utils/respond.js';

export const Students = new OpenAPIHono();

Students.openapi(createStudentRoute, async (c) => {
  try {
    const { displayName, email, batchId, pushToken } = c.req.valid('json');

    // Check if batch exists if batchId is provided
    if (batchId) {
      const batchExists = await batchRepository.findById(batchId);
      if (!batchExists) {
        return err(c, 'Batch not found', 404);
      }
    }

    const created = await studentRepository.create({
      displayName,
      email,
      batchId: batchId || null,
      pushToken: pushToken || null,
    });
    return ok(c, created, 201);
  } catch (e: any) {
    if (e.code === '23505' || e.message?.includes('unique')) {
      return err(c, 'Email already exists', 400);
    }
    return err(c, 'Failed to create student', 500);
  }
});

Students.openapi(deleteStudentRequest, async (c) => {
  try {
    const { studentId } = c.req.valid('param');
    const found = await studentRepository.findById(studentId);

    if (!found) {
      return err(c, 'Student not found', 404);
    }
    await studentRepository.deleteStudent(studentId);
    return ok(c, true);
  } catch (e) {
    return err(c, 'Failed to delete student', 500);
  }
});

Students.openapi(listStudentsRequest, async (c) => {
  try {
    const students = await studentRepository.allStudents();
    return ok(c, students);
  } catch (e) {
    return err(c, 'Failed to list students', 500);
  }
});

Students.openapi(getStudentByIdRequest, async (c) => {
  try {
    const { studentId } = c.req.valid('param');
    const found = await studentRepository.findById(studentId);
    if (!found) return err(c, 'Student not found.', 404);
    return ok(c, found);
  } catch (e) {
    return err(c, 'Failed to get student', 500);
  }
});

Students.openapi(updateStudentRequest, async (c) => {
  try {
    const { studentId } = c.req.valid('param');
    const body = c.req.valid('json');

    const found = await studentRepository.findById(studentId);
    if (!found) return err(c, 'Student not found.', 404);

    if (body.batchId) {
      const batchExists = await batchRepository.findById(body.batchId);
      if (!batchExists) {
        return err(c, 'Batch not found', 404);
      }
    }

    const updated = await studentRepository.update(studentId, body);
    return ok(c, updated);
  } catch (e: any) {
    if (e.code === '23505' || e.message?.includes('unique')) {
      return err(c, 'Email already exists', 400);
    }
    return err(c, 'Failed to update student', 500);
  }
});
