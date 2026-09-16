// No imports: session transport must not depend on authentication or database code.
export const sessionName = () => process.env.NODE_ENV === 'production' ? '__Host-vew-session' : 'vew-session'
export const ownerSessionName = () => `${sessionName()}-owner`
export function readCookie(request, name = sessionName()) {
  const values = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(`${name}=`))
  return values.length === 1 ? values[0].slice(name.length + 1) : ''
}
export function setSession(response, token, name = sessionName()) {
  response.headers.append('Set-Cookie', `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? 43200 : 0}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
  return response
}
export function isSameOriginMutation(request) {
  if (['GET','HEAD','OPTIONS'].includes(request.method)) return true
  if (request.headers.get('x-vew-request') !== '1' || request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  // Same-origin only; the request URL is the host serving this browser session.
  return !origin || origin === new URL(request.url).origin
}
