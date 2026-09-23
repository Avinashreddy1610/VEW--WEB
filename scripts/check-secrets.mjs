// Prints file paths only, never secret values. Also covers untracked deliverables.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { parseEnv } from 'node:util'
const secrets = []
for (const path of ['.env.local', '.deploy.env', 'vercel-import.env']) {
  if (!fs.existsSync(path)) continue
  for (const [key, value] of Object.entries(parseEnv(fs.readFileSync(path, 'utf8')))) {
    if (/SECRET|TOKEN|API_KEY|MONGO_URL|MONGODB_URI/.test(key) && value.length >= 8) secrets.push(value)
    if (/MONGO_URL|MONGODB_URI/.test(key)) {
      try { const pass = decodeURIComponent(new URL(value).password); if (pass.length >= 8) secrets.push(pass) } catch { /* Config validation handles malformed URIs. */ }
    }
  }
}
const paths = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean))]
const violations = []
for (const path of paths) {
  if (!fs.existsSync(path) || !fs.statSync(path).isFile()) continue
  const value = fs.readFileSync(path, 'utf8')
  if ((/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.example')) || path.endsWith('.deploy.env') || path.endsWith('vercel-import.env') || secrets.some(secret => value.includes(secret))) violations.push(path)
}
if (violations.length) { console.error('Potential secret exposure in:', violations.join(', ')); process.exitCode = 1 }
else console.log('No saved secret values or private environment files found in tracked/unignored deliverables.')
