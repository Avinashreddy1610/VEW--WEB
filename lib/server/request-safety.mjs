import { HttpError, tokenHash, text } from './security.mjs'

export async function boundedBody(request, max = 3800000) {
  if (Number(request.headers.get('content-length')) > max) throw new HttpError(413, 'Request is too large. Keep attachments under 2.5 MB.')
  const reader = request.clone().body?.getReader()
  if (!reader) return
  let size = 0
  const parts = []
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.length
      if (size > max) { void reader.cancel().catch(() => {}); throw new HttpError(413, 'Request is too large. Keep attachments under 2.5 MB.') }
      parts.push(Buffer.from(part.value))
    }
  } finally { reader.releaseLock() }
  const raw = Buffer.concat(parts).toString('utf8')
  if (!raw.trim()) return
  const body = JSON.parse(raw)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Request must contain an object')
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
  return value
}
export async function insertOnce(collection, request, userId, body, doc) {
  const key = request.headers.get('idempotency-key')
  if (!key) { await collection.insertOne(doc); return { doc, replayed: false } }
  if (!/^[\w-]{16,80}$/.test(key)) throw new HttpError(400, 'Invalid request key')
  const _id = tokenHash(`${userId}:${key}`), _requestHash = tokenHash(JSON.stringify(canonical(body)))
  try { await collection.insertOne({ ...doc, _id, _requestHash }); return { doc, replayed: false } }
  catch (error) {
    if (error.code !== 11000) throw error
    const saved = await collection.findOne({ _id })
    if (!saved || saved._requestHash !== _requestHash || saved.deletedAt) throw new HttpError(409, 'This submission key was already used. Refresh to start a new request.')
    const { _id: ignoredId, _requestHash: ignoredHash, ...safe } = saved
    return { doc: safe, replayed: true }
  }
}
export function validateUpload(file) {
  const name = text(file?.name, 200)
  const match = typeof file?.dataUrl === 'string' && /^data:(application\/pdf|image\/(?:png|jpeg)|application\/octet-stream);base64,([A-Za-z0-9+/]+={0,2})$/.exec(file.dataUrl)
  if (!name || /[\x00-\x1f\\/]/.test(name) || !match) throw new HttpError(400, 'Choose a PDF, PNG, JPG, STEP, IGES, DXF or DWG drawing')
  const bytes = Buffer.from(match[2], 'base64')
  if (!bytes.length || bytes.length > 2500000 || bytes.toString('base64') !== match[2]) throw new HttpError(400, 'Invalid file or file exceeds 2.5 MB')
  const type = match[1], ext = name.split('.').pop().toLowerCase(), prefix = bytes.subarray(0, 1024).toString('latin1')
  const valid = type === 'application/pdf' ? ext === 'pdf' && prefix.startsWith('%PDF-')
    : type === 'image/png' ? ext === 'png' && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : type === 'image/jpeg' ? ['jpg','jpeg'].includes(ext) && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
    : ['step','stp'].includes(ext) ? prefix.trimStart().startsWith('ISO-10303-21;')
    : ext === 'dwg' ? /^AC10\d{2}/.test(prefix)
    : ext === 'dxf' ? /^(AutoCAD Binary DXF|\s*0\s+SECTION)/.test(prefix)
    : ['igs','iges'].includes(ext) && /^.{72}S\s*\d+/m.test(prefix)
  if (!valid) throw new HttpError(400, 'File content does not match its declared drawing or image type')
  return { name, type, size: bytes.length, dataUrl: file.dataUrl }
}
