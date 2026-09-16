// Checks only public image addresses already embedded in the website.
import fs from 'node:fs/promises'
const source = await fs.readFile(new URL('../app/page.js', import.meta.url), 'utf8')
let failed = false
for (const [, name, address] of source.matchAll(/const (HERO_IMG|IMG_\w+|GAL_\d+) = '([^']+)'/g)) {
  const url = new URL(address)
  url.searchParams.set('w', '640')
  url.searchParams.set('q', '75')
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    console.log(`${name}: ${response.status}`)
    if (!response.ok) failed = true
  } catch { console.log(`${name}: unavailable`); failed = true }
}
if (failed) process.exitCode = 1
