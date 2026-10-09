import {test,before,after} from 'node:test'
import assert from 'node:assert/strict'
import {MongoMemoryServer} from 'mongodb-memory-server'
import {MongoClient} from 'mongodb'
import {createCompanyOrderHandler} from '../lib/server/company-orders.mjs'
import {newToken,tokenHash,verifyPassword} from '../lib/server/security.mjs'
import {productProgress} from '../lib/order-model.mjs'
import {receiptContent,sendBusinessEmail} from '../lib/server/business-email.mjs'

process.env.OWNER_EMAIL = 'owner@example.com'

let server,client,db
const outbox=[]
const staff={id:'staff-business',role:'manager',email:'manager@example.test'}
const one={id:'one',role:'customer',email:'one@example.test'}
const two={id:'two',role:'customer',email:'two@example.test'}
const outsider={id:'outsider',role:'customer',email:'outsider@example.test'}
const handler=createCompanyOrderHandler({checkEmail:()=>{},deliver:async(m,c,t)=>outbox.push({member:m,company:c,token:t})})
const call=(route,method='GET',body,me=staff,fn=handler)=>fn(route,new Request(`http://localhost/api/${route}`,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),db,me)
const payload=()=>({companyId:'a',reference:'PO-42',notes:'Customer note',internalNotes:'Staff secret',items:[{name:'Spur gear',quantity:20,partNumber:'S-01'},{name:'Bevel gear',quantity:40}]})
before(async()=>{
  server=await MongoMemoryServer.create({instance:{ip:'127.0.0.1'}});client=await new MongoClient(server.getUri()).connect();db=client.db('company_order_tests')
  await db.collection('users').createIndex({email:1},{unique:true})
  await db.collection('companies').insertMany([{id:'a',name:'Company A',notes:'Private company note'},{id:'b',name:'Company B'}])
  await db.collection('users').insertMany([one,two,outsider].map(u=>({...u,isActive:true,emailVerifiedAt:new Date().toISOString(),passwordHash:'never-overwrite-this',sessionVersion:0})))
})
after(async()=>{await client?.close();await server?.stop()})

test('only staff can invite contacts; tokens are hashed and existing passwords cannot be overwritten',async()=>{
  await assert.rejects(call('admin/companies/a/members','POST',{email:one.email},outsider),{status:403})
  await assert.rejects(call('admin/companies/a/members','POST',{email:one.email},{...staff,_impersonatedBy:'owner'}),{status:403})
  await call('admin/companies/a/members','POST',{email:one.email})
  const invite=outbox.at(-1)
  const record=await db.collection('companyMembers').findOne({email:one.email})
  assert.notEqual(record.tokenHash,invite.token)
  assert.equal(record.tokenHash,tokenHash(invite.token))
  const list=await call('admin/companies/a/members')
  assert.equal(list.members[0].tokenHash,undefined)
  assert.equal((await call('company-invitations/inspect','POST',{token:invite.token},null)).existingAccount,true)
  await assert.rejects(call('company-invitations/accept','POST',{token:invite.token,password:'DifferentPass99'},null),{status:401})
  await assert.rejects(call('company-invitations/accept','POST',{token:invite.token},outsider),{status:401})
  await call('company-invitations/accept','POST',{token:invite.token,password:'DifferentPass99'},one)
  assert.equal((await db.collection('users').findOne({id:one.id})).passwordHash,'never-overwrite-this')
  await assert.rejects(call('company-invitations/accept','POST',{token:invite.token},one),{status:400})
})
test('invited contacts accept after signing in; two contacts share only their company orders',async()=>{
  await call('admin/companies/a/members','POST',{email:two.email})
  await call('company-invitations/accept','POST',{token:outbox.at(-1).token},two)
  await call('admin/companies/b/members','POST',{email:'newcontact@example.test'})
  const token=outbox.at(-1).token
  assert.equal((await call('company-invitations/inspect','POST',{token},null)).existingAccount,false)
  // Nobody signed in with the invited email yet: acceptance is refused.
  await assert.rejects(call('company-invitations/accept','POST',{token},null),{status:401})
  await assert.rejects(call('company-invitations/accept','POST',{token},outsider),{status:401})
  // The invitee signs up via Clerk first (local record linked by email), then accepts.
  const contact={id:'newcontact',role:'customer',email:'newcontact@example.test',firstName:'New',lastName:'Contact',isActive:true,emailVerifiedAt:new Date().toISOString(),passwordHash:'',sessionVersion:0}
  await db.collection('users').insertOne(contact)
  await assert.rejects(call('company-invitations/accept','POST',{token},two),{status:401})
  await call('company-invitations/accept','POST',{token},contact)
  await assert.rejects(call('company-invitations/accept','POST',{token},contact),{status:400})
  const account=await db.collection('users').findOne({email:'newcontact@example.test'})
  assert.ok(account.emailVerifiedAt);assert.equal(account.role,'customer')
  const a=await call('orders','POST',payload())
  const b=await call('orders','POST',{...payload(),companyId:'b'})
  assert.equal((await call('orders','GET',undefined,one)).orders[0].id,a.order.id)
  assert.equal((await call('orders','GET',undefined,two)).orders[0].id,a.order.id)
  assert.deepEqual((await call('orders','GET',undefined,outsider)).orders,[])
  assert.equal((await call('orders','GET',undefined,account)).orders[0].id,b.order.id)
  const view=(await call('orders','GET',undefined,one)).orders[0]
  assert.equal(view.internalNotes,undefined);assert.equal(view.createdBy,undefined)
})
test('products have independent stages, invalid data is rejected, concurrent edits cannot overwrite',async()=>{
  const original=(await call('orders','POST',payload())).order
  const edit=structuredClone(original)
  edit.items[0].stages[0].status='COMPLETED'
  const updated=(await call(`orders/${original.id}`,'PATCH',edit)).order
  assert.equal(updated.items[0].stages[0].status,'COMPLETED')
  assert.equal(updated.items[1].stages[0].status,'NOT_STARTED')
  assert.equal(productProgress(updated.items[0]).percent,10)
  await assert.rejects(call(`orders/${original.id}`,'PATCH',edit),{status:409})
  const invalid=payload();invalid.items[0].quantity=-2
  await assert.rejects(call('orders','POST',invalid),{status:400})
  const invalidStage=structuredClone(updated);invalidStage.items[0].stages[0].status='INVALID'
  await assert.rejects(call(`orders/${original.id}`,'PATCH',invalidStage),{status:400})
  const removed={...updated,items:[updated.items[0]]}
  await assert.rejects(call(`orders/${original.id}`,'PATCH',removed),{status:400})
  updated.items[0].archived=true
  await call(`orders/${original.id}`,'PATCH',updated)
  assert.equal((await call('orders','GET',undefined,one)).orders.find(o=>o.id===original.id).items.length,1)
})
test('revocation and company archive immediately remove order access; expired invites cannot be used',async()=>{
  const member=await db.collection('companyMembers').findOne({companyId:'a',email:one.email})
  await call(`admin/companies/a/members/${member.id}`,'DELETE')
  assert.deepEqual((await call('orders','GET',undefined,one)).orders,[])
  assert.ok((await call('orders','GET',undefined,two)).orders.length)
  const expired=newToken()
  await db.collection('companyMembers').insertOne({_id:'expired',id:'expired',companyId:'a',email:outsider.email,status:'pending',tokenHash:expired.hash,expiresAt:new Date(0)})
  await assert.rejects(call('company-invitations/accept','POST',{token:expired.token},outsider),{status:400})
  await db.collection('companies').updateOne({id:'a'},{$set:{deletedAt:new Date().toISOString()}})
  assert.deepEqual((await call('orders','GET',undefined,two)).orders,[])
})
test('invitation delivery failure is explicit and never activates membership',async()=>{
  const failing=createCompanyOrderHandler({checkEmail:()=>{},deliver:async()=>{throw new Error('private provider error')}})
  const result=await call('admin/companies/b/members','POST',{email:'failed@example.test'},staff,failing)
  assert.equal(result.deliveryStatus,'failed')
  const member=await db.collection('companyMembers').findOne({email:'failed@example.test'})
  assert.equal(member.status,'pending')
  assert.equal(member.deliveryStatus,'failed')
  await assert.rejects(call('admin/companies/b/members','POST',{email:'failed@example.test'}),{status:429})
})
test('receipt template includes contact and reference, escapes HTML and excludes private order details',()=>{
  const content=receiptContent({rfqNumber:'VEW-123',customer:{firstName:'<script>attack</script>',email:'customer@example.test'},gearType:'Spur & gear',general:{quantity:'20'},internalNotes:'PRIVATE',notes:'PRIVATE'},'https://example.test')
  assert.match(content.text,/reach out to you at customer@example.test/)
  assert.match(content.subject,/VEW-123/)
  assert.ok(!content.html.includes('<script>'))
  assert.ok(content.html.includes('&lt;script&gt;'))
  assert.ok(!JSON.stringify(content).includes('PRIVATE'))
})
test('business emails use server credentials and idempotency keys; failed responses are not successful',async()=>{
  process.env.APP_URL='https://example.test';process.env.RESEND_API_KEY='re_test';process.env.EMAIL_FROM='hello@example.test'
  let calls=0
  const id=await sendBusinessEmail({to:['test@example.test'],subject:'test',text:'test'},'receipt/123',async(url,options)=>{
    calls++;assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers['Idempotency-Key'],'receipt/123');assert.equal(JSON.parse(options.body).from,'hello@example.test');return Response.json({id:'mail-id'})
  })
  assert.equal(id,'mail-id');assert.equal(calls,1)
  await assert.rejects(sendBusinessEmail({},'receipt/456',async()=>Response.json({message:'private error'},{status:403})),{code:'EMAIL_DELIVERY'})
  await assert.rejects(sendBusinessEmail({},'receipt/789',async()=>Response.json({})),{code:'EMAIL_DELIVERY'})
})
