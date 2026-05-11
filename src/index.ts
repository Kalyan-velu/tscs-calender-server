import {OpenAPIHono} from '@hono/zod-openapi'
import {swaggerUI} from '@hono/swagger-ui'
import {serve} from '@hono/node-server'
import {logger} from "hono/logger"
import {cors} from "hono/cors"
import {Batches} from "./routes/batch.route.js"
import {events} from "./routes/event.route.js"

const app = new OpenAPIHono()

app.use('*', logger())
app.use('*', cors({ origin: "http://localhost:8080" }))

app.route('/batch', Batches)
app.route('/event', events)

// Auto-generated spec from all registered routes
app.doc('/doc', {
  openapi: '3.1.0',
  info: { title: 'Scheduler API', version: 'v1' },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

const server = serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '8000')
}, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
  console.log(`Swagger UI at http://localhost:${info.port}/ui`)
})

process.on('SIGINT', () => {
  server.close((err) => {
    if (err) { console.error(err); process.exit(1) }
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) { console.error(err); process.exit(1) }
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)
})