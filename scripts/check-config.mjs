import fs from 'node:fs'
import { parseEnv } from 'node:util'
import { MongoClient } from 'mongodb'
import { emailSettings } from '../lib/server/auth.mjs'
const local = new URL('../.env.local', import.meta.url)
if (fs.existsSync(local)) {
  for (const [key,value] of Object.entries(parseEnv(fs.readFileSync(local,'utf8')))) if (!process.env[key]) process.env[key] = value
}
let failed = false
for (const key of ['AUTH_SECRET','APP_URL','RESEND_API_KEY','EMAIL_FROM']) {
  const present = !!process.env[key] && (key !== 'AUTH_SECRET' || process.env[key].length >= 32)
  console.log(`${key}: ${present ? 'configured' : 'missing or invalid'}`)
  if (!present) failed = true
}
try { emailSettings(); console.log('Email configuration: valid (delivery not attempted)') } catch { console.log('Email configuration: incomplete'); failed = true }
const uri = process.env.MONGO_URL || process.env.MONGODB_URI
if (!uri) { console.log('Database: missing connection string'); failed = true }
else {
  let client
  try { client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }); await client.connect(); await client.db(process.env.DB_NAME || 'vew_gears').command({ ping: 1 }); console.log('Database: connected') }
  catch (error) { console.log('Database: connection failed', { code: error.code || error.name }); failed = true }
  finally { if (client) await client.close() }
}
process.exitCode = failed ? 1 : 0
