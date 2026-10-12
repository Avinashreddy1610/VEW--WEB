import fs from 'node:fs'
import { parseEnv } from 'node:util'
import { pathToFileURL } from 'node:url'
import { Resend } from 'resend'

// This manual test is not a public API route and never runs during a build.
export async function sendTestEmail(apiKey, createClient = key => new Resend(key), to) {
  const key = apiKey?.trim()
  if (!key || key === 're_xxxxxxxxx') {
    throw new Error('Replace re_xxxxxxxxx with your real RESEND_API_KEY in .env.local. Never paste it into code or chat.')
  }
  const recipient = (to || process.env.OWNER_EMAIL || '').trim()
  if (!recipient) {
    throw new Error('Set OWNER_EMAIL to the address that should receive the test email.')
  }
  const { data, error } = await createClient(key).emails.send({
    from: 'onboarding@resend.dev',
    to: recipient,
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  })
  if (error || !data?.id) {
    throw new Error('Resend did not accept the test email. Check the API key, its sending permissions, and that the recipient is your Resend account email.')
  }
  return data.id
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const local = new URL('../.env.local', import.meta.url)
    const values = fs.existsSync(local) ? parseEnv(fs.readFileSync(local, 'utf8')) : {}
    const key = process.env.RESEND_API_KEY || values.RESEND_API_KEY
    const recipient = (process.env.OWNER_EMAIL || values.OWNER_EMAIL || '').trim()
    await sendTestEmail(key, undefined, recipient)
    console.log(`Resend accepted the test email to ${recipient}. Check your inbox and spam folder.`)
  } catch {
    // Provider/network errors must not print credentials or request headers.
    console.error('Test email failed. Set a real RESEND_API_KEY in .env.local, check its sending permissions, and use your Resend account email as the test recipient. No secrets were displayed.')
    process.exitCode = 1
  }
}
