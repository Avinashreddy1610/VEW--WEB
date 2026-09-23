// Shared timeouts; no automatic retries for writes with an uncertain outcome.
let cmsCache
let cmsPending
export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers)
  headers.delete('Authorization')
  const method = (options.method || 'GET').toUpperCase()
  if (!['GET','HEAD'].includes(method)) headers.set('X-VEW-Request', '1')
  const publicCms = url === '/api/cms' && method === 'GET'
  if (url === '/api/cms' && method !== 'GET') cmsCache = undefined
  if (publicCms && cmsCache?.expires > Date.now()) return cmsCache.response.clone()
  if (publicCms && cmsPending) return (await cmsPending).clone()
  const perform = async () => {
  try {
    const response = await globalThis.fetch(url, { ...options, headers, credentials: 'same-origin', signal: options.signal || AbortSignal.timeout(30000) })
    if (publicCms && response.ok) cmsCache = { response: response.clone(), expires: Date.now() + 30000 }
    return response
  } catch (error) {
    throw new Error(error.name === 'TimeoutError' ? 'The server took too long. Your changes may have been saved; refresh before retrying.' : 'Unable to reach the server. Check your connection and try again.')
  }
  }
  if (!publicCms) return perform()
  cmsPending = perform()
  try { return (await cmsPending).clone() } finally { cmsPending = undefined }
}
