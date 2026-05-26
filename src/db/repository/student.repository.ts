import { db } from '../index.js';
import { student, batch, type NewStudent } from '../schema.js';
import { eq } from 'drizzle-orm';

export const studentRepository = {
  create: async (data: NewStudent) => {
    const [created] = await db.insert(student).values(data).returning();
    return created;
  },
  deleteStudent: async (id: string) => {
    return db.delete(student).where(eq(student.id, id));
  },
  findById: async (id: string) => {
    const [found] = await db.select().from(student).where(eq(student.id, id));
    return found;
  },
  findByEmail: async (email: string) => {
    const [found] = await db
      .select()
      .from(student)
      .where(eq(student.email, email.toLowerCase().trim()));
    return found;
  },
  allStudents: async () => {
    // Select student and join with batch to get the batch name
    const rows = await db
      .select({
        student: student,
        batchName: batch.name,
      })
      .from(student)
      .leftJoin(batch, eq(student.batchId, batch.id))
      .orderBy(student.displayName);

    return rows.map((r) => ({
      ...r.student,
      batchName: r.batchName || 'Unassigned',
    }));
  },
  findByBatchId: async (batchId: string) => {
    return db.select().from(student).where(eq(student.batchId, batchId));
  },
  update: async (id: string, data: Partial<NewStudent>) => {
    const [updated] = await db
      .update(student)
      .set(data)
      .where(eq(student.id, id))
      .returning();
    return updated;
  },
};
