import { makeServer } from './server.ts'

const port = Number(process.env.PORT ?? 8796)
const server = makeServer({
  upstream: { base: process.env.PLATFORM_API_URL ?? 'http://platform-api:8780' },
  version: process.env.ENGINE_VERSION ?? 'dev',
  commit: process.env.ENGINE_COMMIT ?? 'unknown',
})
server.listen(port, () => process.stdout.write(`bifrost-engine listening on :${port}\n`))
for (const sig of ['SIGTERM', 'SIGINT'] as const) process.on(sig, () => server.close(() => process.exit(0)))
