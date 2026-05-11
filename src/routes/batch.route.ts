import {err, ok} from '../utils/respond.js'
import {OpenAPIHono} from "@hono/zod-openapi";
import {batchRepository} from "../db/repository/batch.repository.js";
import {
  createBatchRoute,
  deleteBatchRequest,
  getBatchByIdRequest,
  getBatchEventsRequest,
  listBatchesRequest
} from "../schemas/batch/index.js";

export const Batches=new OpenAPIHono()

Batches.openapi(createBatchRoute, async (c) => {
  try {
    const { name } = c.req.valid('json')
    const created = await batchRepository.create({ name })
    return ok(c, created, 201)
  } catch (e) {
    return err(c, 'Failed to create batch', 500)
  }
})

Batches.openapi(deleteBatchRequest,async(c)=>{
  try {
    const {batchId}=c.req.valid('param')
    const batch = await batchRepository.findById(batchId)
    
    if (!batch) {
      return err(c,'Batch not found',404)
    }
    await batchRepository.deleteBatch(batchId)
    
    return ok(c,true)
  }catch (e){
    return err(c,'Failed to delete batch',500)
  }
})

Batches.openapi(listBatchesRequest,async(c)=>{
  try{
    const batches=await batchRepository.allBatches()
    return ok(c, batches)
  }catch (e) {
    return err(c, 'Failed to list batches', 500)
  }
})

Batches.openapi(getBatchByIdRequest,async(c)=>{
  try{
    const {batchId}=c.req.valid("param")
    const batch=await batchRepository.findById(batchId)
    if (!batch) return err(c,"Batch not found.",404)
    return ok(c,batch)
  }catch(e){
    return err(c,'Failed to get batch',500)
  }
})

Batches.openapi(getBatchEventsRequest,async(c)=>{
  try{
    const {batchId}=c.req.valid("param")
    const batch = await batchRepository.findById(batchId)
    if (!batch) return err(c, "Batch not found.", 404)
    const events=await batchRepository.events(batchId)
    return ok(c,events)
  }catch (e) {
    return err(c, "Failed to get events for the batch.", 500)
  }
})
