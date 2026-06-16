import { eq } from 'drizzle-orm';
import { getCached, invalidate, setCached } from '../../utils/cache.js';
import { db } from '../index.js';
import { batch, student, type NewStudent, type Student } from '../schema.js';

type StudentWithBatch = Student & { batchName: string };

export const studentRepository = {
  /**
   * Creates a student (email normalized to lowercase) and invalidates the
   * all-students and batch-students caches for the assigned batch.
   * @param data - Student fields.
   */
  create: async (data: NewStudent) => {
    const normalized = { ...data, email: data.email.toLowerCase().trim() };
    const [created] = await db.insert(student).values(normalized).returning();
    await Promise.all([
      invalidate('students:all'),
      created.batchId ? invalidate(`students:batch:${created.batchId}`) : Promise.resolve(),
    ]);
    return created;
  },

  /**
   * Deletes a student and invalidates all related caches.
   * The student is fetched first to resolve email and batchId cache keys
   * before the row is removed.
   * @param id - Student UUID.
   */
  deleteStudent: async (id: string) => {
    const existing = await studentRepository.findById(id);
    await Promise.all([
      invalidate('students:all'),
      invalidate(`student:${id}`),
      existing?.email ? invalidate(`student:email:${existing.email}`) : Promise.resolve(),
      existing?.batchId ? invalidate(`students:batch:${existing.batchId}`) : Promise.resolve(),
    ]);
    return db.delete(student).where(eq(student.id, id));
  },

  /**
   * Returns a student by ID. Cached at `student:{id}`, TTL 300s.
   * @param id - Student UUID.
   */
  findById: async (id: string) => {
    const cached = await getCached<Student>(`student:${id}`);
    if (cached) return cached;
    const [found] = await db.select().from(student).where(eq(student.id, id));
    if (found) void setCached(`student:${found.id}`, found, 300);
    return found;
  },

  /**
   * Returns a student by email (normalized). Cached at `student:email:{email}`, TTL 300s.
   * @param email - Student email address.
   */
  findByEmail: async (email: string) => {
    const normalized = email.toLowerCase().trim();
    const cached = await getCached<Student>(`student:email:${normalized}`);
    if (cached) return cached;
    const [found] = await db.select().from(student).where(eq(student.email, normalized));
    if (found) void setCached(`student:email:${normalized}`, found, 300);
    return found;
  },

  /**
   * Returns all students joined with their batch name, ordered by display name.
   * Cached at `students:all`, TTL 300s.
   */
  allStudents: async () => {
    const cached = await getCached<StudentWithBatch[]>('students:all');
    if (cached) return cached;
    const rows = await db
      .select({ student: student, batchName: batch.name })
      .from(student)
      .leftJoin(batch, eq(student.batchId, batch.id))
      .orderBy(student.displayName);
    const result = rows.map((r) => ({ ...r.student, batchName: r.batchName || 'Unassigned' }));
    void setCached('students:all', result, 300);
    return result;
  },

  /**
   * Returns all students in a batch. Cached at `students:batch:{batchId}`, TTL 300s.
   * @param batchId - Batch UUID.
   */
  findByBatchId: async (batchId: string) => {
    const cached = await getCached<Student[]>(`students:batch:${batchId}`);
    if (cached) return cached;
    const found = await db.select().from(student).where(eq(student.batchId, batchId));
    void setCached(`students:batch:${batchId}`, found, 300);
    return found;
  },

  /**
   * Updates a student's fields and invalidates all affected caches.
   * If `batchId` changed, the new batch's student cache is also invalidated.
   * @param id - Student UUID.
   * @param data - Partial student fields to update.
   */
  update: async (id: string, data: Partial<NewStudent>) => {
    const existing = await studentRepository.findById(id);
    const normalized =
      data.email !== undefined
        ? { ...data, email: data.email.toLowerCase().trim() }
        : data;
    const [updated] = await db
      .update(student)
      .set({ ...normalized, updatedAt: new Date() })
      .where(eq(student.id, id))
      .returning();
    await Promise.all([
      invalidate('students:all'),
      invalidate(`student:${id}`),
      existing?.email ? invalidate(`student:email:${existing.email}`) : Promise.resolve(),
      existing?.batchId ? invalidate(`students:batch:${existing.batchId}`) : Promise.resolve(),
      updated?.batchId && updated.batchId !== existing?.batchId
        ? invalidate(`students:batch:${updated.batchId}`)
        : Promise.resolve(),
    ]);
    return updated;
  },
};
