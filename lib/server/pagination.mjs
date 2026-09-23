import { HttpError } from './security.mjs'
export function pageOptions(request) {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') || 1), limit = Number(params.get('limit') || 50)
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, 'Invalid page or page size')
  return { page, limit, skip: (page - 1) * limit }
}
export async function pageQuery(collection, filter, request, sort = { createdAt: -1, id: 1 }, projection = { _id: 0, _requestHash: 0 }) {
  const { page, limit, skip } = pageOptions(request)
  const rows = await collection.find(filter, { projection }).sort(sort).skip(skip).limit(limit + 1).maxTimeMS(8000).toArray()
  return { rows: rows.slice(0, limit), pagination: { page, limit, hasMore: rows.length > limit } }
}
export const literalSearch = value => String(value || '').slice(0,100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
