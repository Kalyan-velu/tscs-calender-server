import { OpenAPIHono } from '@hono/zod-openapi';
import bcrypt from 'bcryptjs';
import { batchRepository } from '../db/repository/batch.repository.js';
import { studentRepository } from '../db/repository/student.repository.js';
import type { NewStudent } from '../db/schema.js';
import { createStudentToken } from '../utils/auth.js';
import {
  createStudentRoute,
  deleteStudentRequest,
  getStudentByIdRequest,
  listStudentsRequest,
  updateStudentRequest,
  studentLoginRoute,
} from '../schemas/student/index.js';

import { err, ok } from '../utils/respond.js';

export const Students = new OpenAPIHono();

Students.openapi(createStudentRoute, async (c) => {
  try {
    const { displayName, email, batchId, pushToken, password } = c.req.valid('json');

    // Check if batch exists if batchId is provided
    if (batchId) {
      const batchExists = await batchRepository.findById(batchId);
      if (!batchExists) {
        return err(c, 'Batch not found', 404);
      }
    }

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const created = await studentRepository.create({
      displayName,
      email,
      batchId: batchId || null,
      pushToken: pushToken || null,
      passwordHash,
    });
    return ok(c, created, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    const code = (e as { code?: string }).code;
    if (code === '23505' || msg.includes('unique')) {
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

    const { password, ...rest } = body;
    const updateData: Partial<NewStudent> = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await studentRepository.update(studentId, updateData);
    return ok(c, updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    const code = (e as { code?: string }).code;
    if (code === '23505' || msg.includes('unique')) {
      return err(c, 'Email already exists', 400);
    }
    return err(c, 'Failed to update student', 500);
  }
});

Students.openapi(studentLoginRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    const student = await studentRepository.findByEmail(email);
    if (!student || !student.passwordHash) {
      return err(c, 'Invalid email or password.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, student.passwordHash);
    if (!passwordMatch) {
      return err(c, 'Invalid email or password.', 401);
    }

    if (!student.batchId) {
      return err(c, 'Student is not assigned to any batch/cohort.', 400);
    }

    const token = createStudentToken(student.id, student.batchId);
    
    // Format student details response to match StudentSchema (exclude passwordHash)
    const { passwordHash, ...safeStudent } = student;

    return ok(c, {
      token,
      student: {
        ...safeStudent,
        createdAt: student.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return err(c, 'Failed to log in student', 500);
  }
});
