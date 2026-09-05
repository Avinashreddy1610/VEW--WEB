// Disposable UI preview. Never reads .env.local or connects to Atlas.
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { hashPassword } from '../lib/server/security.mjs'
const server = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } })
const client = await new MongoClient(server.getUri()).connect()
const db = client.db('vew_ui_preview')
for (const [id, role] of [['owner','customer'],['manager','manager'],['customer','customer']]) {
  await db.collection('users').insertOne({ id, email: `${id}@example.test`, firstName: id, lastName: 'Preview', phoneNorm: `1555000000${id.length}`, role, isActive: true, emailVerifiedAt: new Date().toISOString(), sessionVersion: 0, passwordHash: await hashPassword('PreviewOnly42!') })
}
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3001'], {
  cwd: new URL('../',import.meta.url), stdio: 'inherit',
  env: { ...process.env, MONGO_URL: server.getUri(), MONGODB_URI: server.getUri(), DB_NAME: 'vew_ui_preview', AUTH_SECRET: randomBytes(32).toString('hex'), OWNER_EMAIL: 'owner@example.test', APP_URL: 'http://localhost:3001', RESEND_API_KEY: '', EMAIL_FROM: '' },
})
let stopping = false
async function stop() { if (stopping) return; stopping = true; child.kill('SIGTERM'); await client.close(); await server.stop(); process.exit() }
process.on('SIGINT',stop); process.on('SIGTERM',stop); child.on('exit',stop)
