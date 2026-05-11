import {db} from "../index.js";
import {batch, type NewBatch} from "../schema.js";
import {eq} from "drizzle-orm";

export  const batchRepository={
  create:async(data: NewBatch)=>{
    const [created]=await db.insert(batch).values(data).returning()
    return created
  },
  deleteBatch:async(id:string)=>{
    return db.delete(batch).where(eq(batch.id,id))
  },
  findById:async(batchId:string)=>{
    const [found]=await db.select().from(batch).where(eq(batch.id,batchId))
    return found
  }
}