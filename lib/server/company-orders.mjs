import { randomUUID } from 'node:crypto'
import { HttpError, text, email, password, hashPassword, newToken, tokenHash, validToken, isStaff, ownerEmail, rateLimit } from './security.mjs'
import { emailSettings } from './auth.mjs'
import { deliverCompanyInvitation } from './business-email.mjs'
import { ORDER_STAGES, STAGE_STATES } from '../order-model.mjs'

const active = { deletedAt: { $exists: false } }
async function bodyOf(request) {
  let body
  try { body = await request.json() } catch { throw new HttpError(400, 'Invalid request') }
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new HttpError(400, 'Invalid request')
  return body
}
const publicCompany = c => Object.fromEntries(['id','name','contactName','email','phone','address'].map(k=>[k,c[k]]))
function publicOrder(order, staff) { const { _id, internalNotes, updatedBy, createdBy, ...safe } = order; return staff ? {...safe,internalNotes} : {...safe,items:safe.items.filter(p=>!p.archived)} }
function orderData(b, existing) {
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 100) throw new HttpError(400,'Add between 1 and 100 products')
  const seen = new Set()
  const items = b.items.map(item => {
    if (!item || typeof item !== 'object') throw new HttpError(400,'Invalid product')
    const id = item.id || randomUUID()
    if (typeof id !== 'string' || id.length > 80 || seen.has(id)) throw new HttpError(400,'Duplicate or invalid product ID')
    if (existing && item.id && !existing.items.some(p=>p.id===id)) throw new HttpError(400,'Unknown product ID; omit ID for new products')
    seen.add(id)
    const name = text(item.name,200), quantity = Number(item.quantity)
    if (!name || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1e9) throw new HttpError(400,'Every product needs a name and a positive whole quantity')
    const dueDate = text(item.dueDate,10)
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0,10)!==dueDate)) throw new HttpError(400,'Invalid delivery date')
    if (item.stages && (!Array.isArray(item.stages) || item.stages.length !== ORDER_STAGES.length || new Set(item.stages.map(s=>s?.name)).size !== ORDER_STAGES.length)) throw new HttpError(400,'Include each production stage once')
    const stages = ORDER_STAGES.map(name => {
      const status = item.stages ? item.stages.find(s=>s.name===name)?.status : 'NOT_STARTED'
      if (!STAGE_STATES.includes(status)) throw new HttpError(400,'Invalid production stage status')
      return {name,status}
    })
    return {id,name,partNumber:text(item.partNumber,100),quantity,dueDate,notes:text(item.notes,2000),archived:item.archived===true,stages}
  })
  if (existing?.items.some(p=>!seen.has(p.id))) throw new HttpError(400,'Archive existing products instead of removing their history')
  if (items.every(p=>p.archived)) throw new HttpError(400,'Keep at least one active product, or archive the whole order')
  return { reference:text(b.reference,200), source:['email','phone','manual'].includes(b.source)?b.source:'email', notes:text(b.notes,4000), internalNotes:text(b.internalNotes,4000), items }
}

export function createCompanyOrderHandler({ deliver = deliverCompanyInvitation, checkEmail = emailSettings } = {}) {
  return async function handleCompanyOrders(route, request, db, me) {
    if (!/^(company-invitations\/|companies(?:\/|$)|orders(?:\/|$)|admin\/companies\/[^/]+\/members(?:\/|$))/.test(route)) return null
    const method = request.method
    if (route.startsWith('company-invitations/')) {
      if (method !== 'POST') throw new HttpError(405,'Method not allowed')
      const b = await bodyOf(request)
      if (!validToken(b.token)) throw new HttpError(400,'Invitation is invalid or expired')
      await rateLimit(db, `invite:${text(request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local',200)}`, 40, 15*60000)
      const filter = { tokenHash:tokenHash(b.token), status:'pending', expiresAt:{$gt:new Date()} }
      const member = await db.collection('companyMembers').findOne(filter)
      if (!member) throw new HttpError(400,'Invitation is invalid, expired, revoked or already accepted')
      const company = await db.collection('companies').findOne({id:member.companyId,...active})
      if (!company) throw new HttpError(404,'Company is unavailable')
      let account = await db.collection('users').findOne({email:member.email})
      if (route === 'company-invitations/inspect') return { company:company.name,email:member.email,existingAccount:!!account }
      if (route !== 'company-invitations/accept') throw new HttpError(404,'Not found')
      if (account) {
        if (!me || me.id !== account.id || me.email !== member.email) throw new HttpError(401,'Sign in to the invited account before accepting. Existing passwords are never changed by invitations.')
        if (!account.isActive || !account.emailVerifiedAt || account.role !== 'customer' || account.email === ownerEmail()) throw new HttpError(403,'An active, verified customer account is required')
      } else {
        password(b.password)
        const firstName=text(b.firstName,100), lastName=text(b.lastName,100)
        if (!firstName || !lastName) throw new HttpError(400,'First and last name are required')
        if (member.email === ownerEmail()) throw new HttpError(403,'The owner must use normal registration')
        account={id:randomUUID(),email:member.email,firstName,lastName,passwordHash:await hashPassword(b.password),role:'customer',isActive:true,emailVerifiedAt:new Date().toISOString(),sessionVersion:0,createdAt:new Date().toISOString()}
        try { await db.collection('users').insertOne(account) } catch(e) { if(e.code===11000) throw new HttpError(409,'An account now exists. Sign in and accept the invitation.'); throw e }
      }
      const result = await db.collection('companyMembers').updateOne({_id:member._id,...filter},{$set:{status:'active',userId:account.id,acceptedAt:new Date().toISOString()},$unset:{tokenHash:'',expiresAt:''}})
      if (!result.matchedCount) throw new HttpError(409,'Invitation was already accepted or revoked. Sign in to check your access.')
      return {success:true,message:'Company access enabled. Sign in to view company orders.'}
    }
    if (!me) throw new HttpError(401,'Sign in to continue')
    const staff = isStaff(me) && !me._impersonatedBy
    if (route.startsWith('admin/companies/')) {
      if (!staff) throw new HttpError(403,'Staff access required')
      const parts=route.split('/'), companyId=parts[2], memberId=parts[4]
      const company=await db.collection('companies').findOne({id:companyId,...active})
      if (!company) throw new HttpError(404,'Company not found')
      if (method==='GET' && !memberId) return {members:await db.collection('companyMembers').find({companyId},{projection:{_id:0,tokenHash:0}}).toArray()}
      if (method==='DELETE' && memberId) {
        const r=await db.collection('companyMembers').updateOne({id:memberId,companyId},{$set:{status:'revoked',revokedBy:me.id,revokedAt:new Date().toISOString()},$unset:{tokenHash:'',expiresAt:''}})
        if(!r.matchedCount)throw new HttpError(404,'Contact not found')
        return {success:true}
      }
      if(method!=='POST'||memberId)throw new HttpError(405,'Method not allowed')
      checkEmail()
      const address=email((await bodyOf(request)).email)
      if(address===ownerEmail())throw new HttpError(400,'Owner access is managed separately')
      const account=await db.collection('users').findOne({email:address})
      if(account && (account.role!=='customer'||!account.isActive))throw new HttpError(400,'Invite an active customer or a new contact')
      await rateLimit(db,`company-invite:${me.id}`,30,3600000)
      const _id=tokenHash(JSON.stringify([companyId,address]))
      const old=await db.collection('companyMembers').findOne({_id})
      if(old?.status==='active')throw new HttpError(409,'This contact already has access')
      const now=new Date(), token=newToken()
      const member={id:old?.id||randomUUID(),companyId,email:address,status:'pending',tokenHash:token.hash,expiresAt:new Date(+now+7*86400000),invitedAt:now.toISOString(),invitedBy:me.id,deliveryStatus:'pending'}
      let invitationUpdate
      try {
        invitationUpdate=await db.collection('companyMembers').updateOne({_id,status:{$ne:'active'},$or:[{invitedAt:{$lt:new Date(+now-60000).toISOString()}},{invitedAt:{$exists:false}}]},{$set:member},{upsert:true})
      }catch(e){if(e.code===11000)throw new HttpError(429,'Contact is active or was recently invited. Refresh and wait one minute.');throw e}
      if(!invitationUpdate.matchedCount&&!invitationUpdate.upsertedCount)throw new HttpError(429,'Wait one minute before inviting again')
      let deliveryStatus='accepted'
      try{await deliver(member,company,token.token)}catch{deliveryStatus='failed';console.error('Company invitation email failed',{code:'EMAIL_DELIVERY'})}
      await db.collection('companyMembers').updateOne({_id,tokenHash:token.hash},{$set:{deliveryStatus}})
      return {success:true,deliveryStatus}
    }
    const memberships=staff?[]:await db.collection('companyMembers').find({userId:me.id,status:'active'},{projection:{companyId:1}}).toArray()
    const companies=await db.collection('companies').find({...active,...(staff?{}:{id:{$in:memberships.map(m=>m.companyId)}})}).toArray()
    const ids=companies.map(c=>c.id)
    if(route==='companies'&&method==='GET')return{companies:companies.map(publicCompany)}
    if(route==='orders'&&method==='GET')return{orders:(await db.collection('orders').find({companyId:{$in:ids},...active}).sort({createdAt:-1}).toArray()).map(o=>publicOrder(o,staff))}
    if(!staff)throw new HttpError(403,'Staff access required')
    if(route==='orders'&&method==='POST'){
      const b=await bodyOf(request),company=companies.find(c=>c.id===b.companyId)
      if(!company)throw new HttpError(400,'Select an active company')
      const now=new Date().toISOString(),id=randomUUID()
      const order={...orderData(b),id,orderNumber:`VEW-${new Date().getUTCFullYear()}-${id.slice(0,8).toUpperCase()}`,companyId:company.id,companyName:company.name,version:1,createdAt:now,updatedAt:now,createdBy:me.id,updatedBy:me.id}
      await db.collection('orders').insertOne(order)
      return{success:true,order:publicOrder(order,true)}
    }
    const parts=route.split('/'),id=parts[1]
    if(parts.length!==2||parts[0]!=='orders')throw new HttpError(404,'Not found')
    const order=await db.collection('orders').findOne({id,companyId:{$in:ids},...active})
    if(!order)throw new HttpError(404,'Order not found')
    if(method==='DELETE'){await db.collection('orders').updateOne({id,...active},{$set:{deletedAt:new Date().toISOString(),deletedBy:me.id},$inc:{version:1}});return{success:true}}
    if(method!=='PATCH')throw new HttpError(405,'Method not allowed')
    const b=await bodyOf(request)
    if(b.version!==order.version)throw new HttpError(409,'This order changed. Refresh before editing again.')
    const update={...orderData(b,order),updatedAt:new Date().toISOString(),updatedBy:me.id}
    const saved=await db.collection('orders').findOneAndUpdate({id,version:b.version,...active},{$set:update,$inc:{version:1}},{returnDocument:'after'})
    if(!saved)throw new HttpError(409,'This order changed. Refresh before editing again.')
    return{success:true,order:publicOrder(saved,true)}
  }
}
export const handleCompanyOrders=createCompanyOrderHandler()
