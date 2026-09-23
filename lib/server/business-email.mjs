import { emailSettings } from './auth.mjs'
import { HttpError, text, tokenHash } from './security.mjs'

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export function receiptContent(rfq, origin) {
  const name = text(rfq.customer.firstName, 100) || 'there'
  const address = rfq.customer.email
  const paragraphs = [`Hi ${name},`, `Thank you for raising your request with Vijaya Engineering Works. We have received ${rfq.rfqNumber}.`,
    `Our engineering team will review your requirements and reach out to you at ${address} with the next steps.`,
    `Request: ${rfq.rfqNumber}\nProduct: ${rfq.gearType}\nQuantity: ${rfq.general.quantity}`,
    `You can sign in to your customer portal to track progress: ${origin}`, 'Please keep this request number for future correspondence. There is no need to submit the request again.', 'Thank you,\nVijaya Engineering Works | VEW']
  return { subject: `Request ${rfq.rfqNumber} received — Vijaya Engineering Works`, text: paragraphs.join('\n\n'),
    html: `<div style="background:#f8fafc;padding:28px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden"><div style="background:#0f172a;color:#fbbf24;padding:24px;font-size:22px;font-weight:bold">VEW <span style="color:white;font-size:14px">Vijaya Engineering Works</span></div><div style="padding:28px"><h1 style="font-size:24px">Thank you for your request.</h1>${paragraphs.slice(0,4).map(p=>`<p style="line-height:1.7;white-space:pre-line">${escape(p)}</p>`).join('')}<p><a href="${escape(origin)}" style="background:#0f172a;color:white;padding:12px 18px;display:inline-block;border-radius:8px;text-decoration:none">Visit VEW · sign in to track your request</a></p><p style="font-size:13px;color:#475569">Please keep your request number. There is no need to submit it again.</p><p>Thank you,<br/>Vijaya Engineering Works</p></div></div></div>` }
}
export async function sendBusinessEmail(message, idempotencyKey, fetcher = fetch) {
  const settings = emailSettings()
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${settings.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: settings.from, ...message }),
  })
  if (!response.ok) throw new HttpError(503, 'Email could not be sent. Please check the email service settings.', 'EMAIL_DELIVERY')
  const result = await response.json()
  if (!result.id) throw new HttpError(503, 'Email delivery was not confirmed', 'EMAIL_DELIVERY')
  return result.id
}
export async function deliverRfqReceipt(rfq) {
  return sendBusinessEmail({ to: [rfq.customer.email], ...receiptContent(rfq, emailSettings().origin) }, `rfq-receipt/${rfq.id}`)
}
export async function deliverCompanyInvitation(member, company, token) {
  const url = `${emailSettings().origin}/#invite=${encodeURIComponent(token)}`
  return sendBusinessEmail({ to: [member.email], subject: 'Your company portal invitation — Vijaya Engineering Works',
    text: `You have been invited to view orders for ${company.name} in the Vijaya Engineering Works customer portal.\n\nAccept your invitation: ${url}\n\nNew customers can create a password. Existing customers must sign in with their own account; this invitation never changes an existing password.\n\nThis link expires in 7 days. If you were not expecting this invitation, ignore this email.` }, `company-invitation/${member.id}/${tokenHash(token).slice(0,20)}`)
}
