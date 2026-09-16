import { test } from 'node:test'
import assert from 'node:assert/strict'
import { boundedBody, validateUpload } from '../lib/server/request-safety.mjs'
import { password, verifyToken } from '../lib/server/security.mjs'
test('streamed request bodies have limits even without content-length', async () => {
  const request = new Request('http://localhost/api/rfq', { method:'POST', body:JSON.stringify({value:'a'.repeat(100)}) })
  await assert.rejects(boundedBody(request,30), error=>error.status===413)
  await assert.rejects(boundedBody(new Request('http://localhost',{method:'POST',body:'[]'})), error=>error.status===400)
})
test('uploads check signatures, extensions, encoded bytes and filenames', () => {
  assert.equal(validateUpload({name:'drawing.pdf',dataUrl:'data:application/pdf;base64,JVBERi0='}).type,'application/pdf')
  for (const file of [null, {name:'../drawing.pdf',dataUrl:'data:application/pdf;base64,JVBERi0='}, {name:'drawing.exe',dataUrl:'data:application/pdf;base64,JVBERi0='}, {name:'fake.png',dataUrl:'data:image/png;base64,JVBERi0='}]) assert.throws(()=>validateUpload(file),e=>e.status===400)
})
test('new passwords reject common patterns; malformed Unicode token signatures fail safely', () => {
  for (const value of ['password123','admin123','aaaaaaaa']) assert.throws(()=>password(value))
  assert.equal(password('A long unusual phrase 42'),'A long unusual phrase 42')
  assert.equal(verifyToken(`e30.${'é'.repeat(43)}`),null)
})
