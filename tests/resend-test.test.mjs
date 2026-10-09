import test from 'node:test'
import assert from 'node:assert/strict'
import { sendTestEmail } from '../scripts/send-test-email.mjs'

test('email example refuses missing and placeholder keys without sending', async () => {
  const unexpected = () => { throw new Error('Must not create a client') }
  for (const key of [undefined, '', ' ', 're_xxxxxxxxx', ' re_xxxxxxxxx ']) {
    await assert.rejects(sendTestEmail(key, unexpected), /Replace re_xxxxxxxxx/)
  }
})

test('email example refuses to send without a recipient', async () => {
  const unexpected = () => { throw new Error('Must not create a client') }
  delete process.env.OWNER_EMAIL
  await assert.rejects(sendTestEmail('re_test_only', unexpected), /Set OWNER_EMAIL/)
})

test('email example sends the requested payload and awaits provider acceptance', async () => {
  const id = await sendTestEmail('re_test_only', key => {
    assert.equal(key, 're_test_only')
    return { emails: { send: async payload => {
      assert.deepEqual(payload, {
        from: 'onboarding@resend.dev', to: 'owner@example.com', subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      })
      return { data: { id: 'test-email-id' }, error: null }
    } } }
  }, 'owner@example.com')
  assert.equal(id, 'test-email-id')
})

test('email example reports rejection without leaking provider details', async () => {
  for (const response of [{ data: null, error: { message: 'private provider detail' } }, { data: {} }]) {
    await assert.rejects(sendTestEmail('re_test_only', () => ({ emails: { send: async () => response } }), 'owner@example.com'), error => {
      assert.match(error.message, /did not accept/)
      assert.doesNotMatch(error.message, /private provider detail/)
      return true
    })
  }
})
