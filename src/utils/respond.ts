// src/utils/respond.ts
import type {Context} from 'hono'

export const ok = <T>(c: Context, data: T) =>
  c.json({ status: true as const, data }, 200)

export const err = (c: Context, message: string, code: 400 | 404 | 500) =>
  c.json({ status: false as const, error: { message } }, code)