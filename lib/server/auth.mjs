import { HttpError } from './security.mjs'

export function emailSettings() {
  const { APP_URL, RESEND_API_KEY, EMAIL_FROM } = process.env
  let origin
  try {
    const url = new URL(APP_URL)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) throw new Error()
    origin = url.origin
  } catch { throw new HttpError(503, 'Email service is temporarily unavailable', 'EMAIL_CONFIGURATION') }
  if (!RESEND_API_KEY || !EMAIL_FROM || /[\r\n]/.test(EMAIL_FROM)) throw new HttpError(503, 'Email service is temporarily unavailable', 'EMAIL_CONFIGURATION')
  return { origin, key: RESEND_API_KEY, from: EMAIL_FROM }
}
