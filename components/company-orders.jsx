'use client'
import { useEffect, useRef, useState } from 'react'
import { apiFetch as fetch } from '@/lib/client-http.mjs'
import { ListPager, usePagedList } from '@/components/paged-list'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ORDER_STAGES, STAGE_STATES, productProgress } from '@/lib/order-model.mjs'

async function request(url,method='GET',body) {
  const r=await fetch(url,{method,headers:{'Content-Type':'application/json',...(body?.requestKey?{'Idempotency-Key':body.requestKey}:{})},...(body?{body:JSON.stringify(body)}:{})})
  const d=await r.json()
  if(!r.ok)throw new Error(d.error||'Request failed')
  return d
}
const selectClass='w-full border border-slate-300 rounded-md bg-white p-2 text-sm'
const freshItem=()=>({name:'',partNumber:'',quantity:1,dueDate:'',notes:'',stages:ORDER_STAGES.map(name=>({name,status:'NOT_STARTED'}))})

export function CompanyContacts({auth,company}) {
  const [address,setAddress]=useState(''),[busy,setBusy]=useState(false)
  const memberList=usePagedList(`/api/admin/companies/${company.id}/members`,'members',auth.user?.id)
  const members=memberList.items,load=memberList.refresh,error=memberList.error
  async function invite(e){e.preventDefault();setBusy(true);try{const d=await request(`/api/admin/companies/${company.id}/members`,'POST',{email:address});setAddress('');if(d.deliveryStatus==='accepted')toast.success('Invitation submitted for delivery');else toast.error('Invitation saved, but email failed. Check Resend, then invite again after one minute.');await load()}catch(e){toast.error(e.message)}finally{setBusy(false)}}
  async function revoke(m){if(!window.confirm(`Remove ${m.email} from ${company.name}? Other company access and their account remain unchanged.`))return;setBusy(true);try{await request(`/api/admin/companies/${company.id}/members/${m.id}`,'DELETE');await load();toast.success('Company access revoked')}catch(e){toast.error(e.message)}finally{setBusy(false)}}
  return <div className="space-y-4"><p className="text-sm text-slate-600">Invite each contact separately. Active contacts can view all bulk orders for this company, but cannot edit them or invite others. Company membership does not expose anyone's personal RFQs.</p>
    <form onSubmit={invite} className="flex flex-wrap gap-2"><Input aria-label="Contact email" type="email" required value={address} onChange={e=>setAddress(e.target.value)} placeholder="Customer email" className="flex-1"/><Button disabled={busy}>Send invitation</Button></form>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {members.map(m=><div key={m.id} className="border-t py-3 flex flex-wrap justify-between gap-2"><div><p className="font-medium break-all">{m.email}</p><p className="text-sm text-slate-600">{m.status==='pending'&&new Date(m.expiresAt)<new Date()?'Expired':m.status}{m.status==='pending'&&` · Email ${m.deliveryStatus||'pending'}`}</p></div>{m.status!=='revoked'&&<Button variant="outline" disabled={busy} onClick={()=>revoke(m)}>Revoke access</Button>}</div>)}
    {!members.length&&!error&&!memberList.loading&&<p className="text-sm text-slate-500">No contacts invited yet.</p>}
    <ListPager list={memberList} label="Contacts" />
  </div>
}

export function CompanyInvitation({token,auth,onDone,onSignIn}) {
  const [details,setDetails]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const [form,setForm]=useState({firstName:'',lastName:'',password:'',confirm:''})
  useEffect(()=>{let cancelled=false;request('/api/company-invitations/inspect','POST',{token}).then(d=>{if(!cancelled)setDetails(d)}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[token])
  const alreadySignedIn=auth.user?.email===details?.email
  async function accept(e){e.preventDefault();setBusy(true);setError('');try{
    if(!details.existingAccount&&form.password!==form.confirm){setError('Passwords must match');return}
    if(details.existingAccount&&!alreadySignedIn){await auth.login(details.email,form.password)}
    await request('/api/company-invitations/accept','POST',{token,...form})
    if(!details.existingAccount)await auth.login(details.email,form.password)
    toast.success('Company access enabled');onDone()
  }catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div className="max-w-lg mx-auto px-4 py-16"><Card><CardContent className="p-6 space-y-4"><h1 className="text-2xl font-bold">Your company invitation</h1>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {!details&&!error&&<p>Checking invitation…</p>}
    {details&&<form onSubmit={accept} className="space-y-4"><p>Join <strong>{details.company}</strong> as <strong className="break-all">{details.email}</strong>.</p><p className="text-sm text-slate-600">You will be able to view this company's orders. {details.existingAccount?'Use your existing account; its password will not be changed.':'This email invitation verifies your address. Set your own password below.'}</p>
      {!details.existingAccount&&['firstName','lastName'].map((k,i)=><label key={k} className="block text-sm">{i?'Last name':'First name'}<Input required autoComplete={k==='firstName'?'given-name':'family-name'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
      {(!details.existingAccount||!alreadySignedIn)&&<label className="block text-sm">{details.existingAccount?'Existing password':'Create password'}<Input required type="password" autoComplete={details.existingAccount?'current-password':'new-password'} minLength={details.existingAccount?1:8} maxLength={128} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>}
      {!details.existingAccount&&<label className="block text-sm">Confirm password<Input required type="password" autoComplete="new-password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></label>}
      <Button disabled={busy} type="submit">{busy?'Accepting…':'Accept company invitation'}</Button>
    </form>}
    <Button variant="link" onClick={onSignIn}>Go to sign in / password recovery</Button><p className="text-xs text-slate-500">If you need to recover or verify an existing account, do that first, then reopen this invitation email.</p>
  </CardContent></Card></div>
}

export function CompanyOrders({auth,staff=false}) {
  const [companyId,setCompanyId]=useState(''),[query,setQuery]=useState('')
  const [editing,setEditing]=useState(null),[busy,setBusy]=useState(false)
  const submission=useRef(null),saving=useRef(false)
  const companyList=usePagedList('/api/companies','companies',auth.user?.id)
  const orderList=usePagedList(`/api/orders?companyId=${encodeURIComponent(companyId)}&q=${encodeURIComponent(query)}`,'orders',auth.user?.id,true)
  const companies=companyList.items,orders=orderList.items,error=orderList.error,loading=orderList.loading
  const load=()=>Promise.all([companyList.refresh(),orderList.refresh()])
  const changeItem=(i,data)=>setEditing(prev=>({...prev,items:prev.items.map((p,n)=>n===i?{...p,...data}:p)}))
  async function save(e){
    e.preventDefault();if(saving.current)return;saving.current=true;setBusy(true)
    const fingerprint=JSON.stringify(editing)
    if(submission.current?.fingerprint!==fingerprint)submission.current={fingerprint,key:crypto.randomUUID()}
    try{await request(`/api/orders${editing.id?'/'+editing.id:''}`,editing.id?'PATCH':'POST',{...editing,requestKey:submission.current.key});setEditing(null);submission.current=null;toast.success('Order saved');await load()}catch(e){toast.error(e.message)}finally{saving.current=false;setBusy(false)}
  }
  async function archive(order){if(!window.confirm(`Archive ${order.orderNumber}? It will disappear from the customer portal; its records are retained.`))return;setBusy(true);try{await request(`/api/orders/${order.id}`,'DELETE');await load();toast.success('Order archived')}catch(e){toast.error(e.message)}finally{setBusy(false)}}
  const filtered=orders.filter(o=>(!companyId||o.companyId===companyId)&&[o.orderNumber,o.companyName,o.reference,...o.items.map(p=>p.name)].join(' ').toLowerCase().includes(query.toLowerCase()))
  return <section className="space-y-4 my-6" aria-label="Company orders"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-bold">Company bulk orders</h2><p className="text-sm text-slate-600">{staff?'Enter orders received by email, phone or directly. Track each product independently.':'Shared with your company contacts. Each product has its own production progress.'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={load}>Refresh orders</Button>{staff&&<Button disabled={!companies.length} onClick={()=>setEditing({companyId:companyId||companies[0]?.id,reference:'',source:'email',notes:'',internalNotes:'',items:[freshItem()]})}>Add bulk order</Button>}</div></div>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <ListPager list={companyList} label="Company choices" />
    <div className="grid sm:grid-cols-2 gap-3"><select aria-label="Filter by company" className={selectClass} value={companyId} onChange={e=>setCompanyId(e.target.value)}><option value="">All companies</option>{companyId&&!companies.some(c=>c.id===companyId)&&<option value={companyId}>Selected company (another page)</option>}{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><Input aria-label="Search bulk orders" placeholder="Search order, PO or product" value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <ListPager list={orderList} label="Orders" />
    {companyId&&companies.filter(c=>c.id===companyId).map(c=><Card key={c.id}><CardContent className="p-4"><h3 className="font-bold">{c.name}</h3><p className="text-sm whitespace-pre-wrap">{c.address}</p><p className="text-sm">{c.contactName} · {c.email} · {c.phone}</p></CardContent></Card>)}
    {loading?<p>Loading orders…</p>:!filtered.length&&<p className="text-sm text-slate-500">{staff?'No orders here yet. Add a company in the Companies tab, then create its order.':'No company orders are available. Ask VEW to invite your email to your company profile.'}</p>}
    {filtered.map(order=><Card key={order.id}><CardContent className="p-5"><details><summary className="cursor-pointer font-semibold">{order.orderNumber} · {order.companyName}{order.reference&&` · PO ${order.reference}`}<span className="block text-sm font-normal text-slate-600 mt-1">{order.items.filter(p=>!p.archived).length} products · Updated {new Date(order.updatedAt).toLocaleString()}</span></summary>
      <p className="my-3 whitespace-pre-wrap text-sm">{order.notes}</p>{staff&&<p className="text-sm text-slate-500 whitespace-pre-wrap">Internal notes: {order.internalNotes||'—'}</p>}
      {order.items.filter(p=>staff||!p.archived).map(p=>{const progress=productProgress(p);return <div key={p.id} className="border rounded-lg p-4 my-3 space-y-2"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold">{p.name}{p.archived?' (archived)':''}</h4><span className="text-sm">{progress.status} · {progress.percent}%</span></div><p className="text-sm text-slate-600">Part: {p.partNumber||'—'} · Quantity: {p.quantity} · Target delivery: {p.dueDate||'Not set'}</p><progress aria-label={`${p.name} progress`} value={progress.percent} max={100} className="w-full accent-amber-500"/><p className="text-sm whitespace-pre-wrap">{p.notes}</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{p.stages.map(s=><div key={s.name} className="text-xs rounded bg-slate-50 p-2">{s.name}: <strong>{s.status.replaceAll('_',' ').toLowerCase()}</strong></div>)}</div></div>})}
      {staff&&<div className="flex gap-2 mt-4"><Button disabled={busy} onClick={()=>setEditing(structuredClone(order))}>Edit products & progress</Button><Button disabled={busy} variant="outline" onClick={()=>archive(order)}>Archive order</Button></div>}
    </details></CardContent></Card>)}
    <Dialog open={!!editing} onOpenChange={open=>!busy&&!open&&setEditing(null)}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?.id?'Edit bulk order':'New bulk order'}</DialogTitle><DialogDescription>Customer-visible notes and per-product progress appear in the company portal. Internal notes remain private.</DialogDescription></DialogHeader>
      {editing&&<form onSubmit={save} className="space-y-4"><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Company<select required disabled={!!editing.id} className={selectClass} value={editing.companyId} onChange={e=>setEditing({...editing,companyId:e.target.value})}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm">Customer PO / reference<Input maxLength={200} value={editing.reference} onChange={e=>setEditing({...editing,reference:e.target.value})}/></label><label className="text-sm">Received through<select className={selectClass} value={editing.source} onChange={e=>setEditing({...editing,source:e.target.value})}>{['email','phone','manual'].map(s=><option key={s}>{s}</option>)}</select></label></div>
      <label className="block text-sm">Customer-visible order notes<Textarea maxLength={4000} value={editing.notes} onChange={e=>setEditing({...editing,notes:e.target.value})}/></label><label className="block text-sm">Internal notes (staff only)<Textarea maxLength={4000} value={editing.internalNotes} onChange={e=>setEditing({...editing,internalNotes:e.target.value})}/></label>
      {editing.items.map((p,i)=><fieldset key={p.id||i} className="border p-4 rounded-lg space-y-3"><legend className="font-semibold">Product {i+1}{p.archived?' · archived':''}</legend><div className="grid sm:grid-cols-2 gap-3">{[['name','Product name','text'],['partNumber','Part number','text'],['quantity','Quantity','number'],['dueDate','Target delivery','date']].map(([key,label,type])=><label key={key} className="text-sm">{label}<Input type={type} required={['name','quantity'].includes(key)} min={type==='number'?1:undefined} step={type==='number'?1:undefined} value={p[key]} onChange={e=>changeItem(i,{[key]:e.target.value})}/></label>)}</div><label className="block text-sm">Product notes (customer-visible)<Textarea maxLength={2000} value={p.notes} onChange={e=>changeItem(i,{notes:e.target.value})}/></label>
        <details><summary className="cursor-pointer text-sm font-semibold">Production stages</summary><div className="grid sm:grid-cols-2 gap-3 mt-3">{p.stages.map((s,si)=><label key={s.name} className="text-sm">{s.name}<select className={selectClass} value={s.status} onChange={e=>changeItem(i,{stages:p.stages.map((stage,n)=>n===si?{...stage,status:e.target.value}:stage)})}>{STAGE_STATES.map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label>)}</div></details>
        {p.id?<Button type="button" variant="outline" onClick={()=>changeItem(i,{archived:!p.archived})}>{p.archived?'Restore product':'Archive product'}</Button>:<Button type="button" variant="outline" disabled={editing.items.length===1} onClick={()=>setEditing({...editing,items:editing.items.filter((_,n)=>n!==i)})}>Remove product</Button>}
      </fieldset>)}
      <div className="flex gap-3"><Button type="button" variant="outline" disabled={editing.items.length>=100||busy} onClick={()=>setEditing({...editing,items:[...editing.items,freshItem()]})}>Add another product</Button><Button disabled={busy} type="submit">{busy?'Saving…':'Save order'}</Button></div>
      </form>}
    </DialogContent></Dialog>
  </section>
}
