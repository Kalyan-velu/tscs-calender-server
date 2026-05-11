import {Hono} from "hono";

export const events=new Hono()

events.get("/:id",(c)=>{
  return c.json({
    status:true,
    data:[]
  },200)
})