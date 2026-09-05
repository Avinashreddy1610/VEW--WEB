'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

async function request(token, url, method = 'GET', body) {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}
export function ManagerManagement({ auth }) {
  const [managers, setManagers] = useState([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    try { const d = await request(auth.token, '/api/admin/managers'); setManagers(d.managers); setError('') } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [auth.token])
  async function add(e) {
    e.preventDefault(); setBusy(true)
    try { await request(auth.token, '/api/admin/managers', 'POST', { email }); setEmail(''); toast.success('Manager access granted. They must sign in again.'); await load() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  async function remove(manager) {
    if (!window.confirm(`Remove manager access for ${manager.email}? Their current sessions will end. Their customer account will remain.`)) return
    setBusy(true)
    try { await request(auth.token, `/api/admin/managers/${manager.id}`, 'DELETE'); toast.success('Manager access removed'); await load() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return <Card><CardContent className="p-6 space-y-5">
    <div><h2 className="text-xl font-semibold">Managers</h2><p className="text-sm text-slate-600">Only you can grant or remove manager access. Managers can manage business records but cannot change your account or other managers.</p></div>
    <p className="text-sm text-slate-600">Ask the manager to create an account and verify their email first, then enter that email below.</p>
    <form onSubmit={add} className="flex flex-wrap gap-3"><Input aria-label="Manager email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Manager's verified email" className="flex-1" /><Button disabled={busy}>Add manager</Button></form>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {managers.map(manager => <div key={manager.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div><p className="font-semibold">{manager.firstName} {manager.lastName}</p><p className="text-sm text-slate-600">{manager.email}</p></div><Button disabled={busy} variant="destructive" onClick={() => remove(manager)}>Remove access</Button></div>)}
    {!error && !managers.length && <p className="text-sm text-slate-500">No managers have been added.</p>}
  </CardContent></Card>
}

const emptyCompany = { name: '', contactName: '', email: '', phone: '', address: '', notes: '' }
export function CompanyManagement({ auth }) {
  const [companies, setCompanies] = useState([])
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const load = async () => {
    try { const d = await request(auth.token, '/api/admin/companies'); setCompanies(d.companies); setError('') } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [auth.token])
  async function save(e) {
    e.preventDefault(); setBusy(true)
    try { await request(auth.token, `/api/admin/companies${editing.id ? '/' + editing.id : ''}`, editing.id ? 'PATCH' : 'POST', editing); setEditing(null); toast.success('Company saved'); await load() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  async function remove(company) {
    if (!window.confirm(`Delete ${company.name} from the company list? Its RFQs and account history will be preserved.`)) return
    setBusy(true)
    try { await request(auth.token, `/api/admin/companies/${company.id}`, 'DELETE'); toast.success('Company removed'); await load() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return <div className="space-y-4">
    <div className="flex justify-between gap-3"><Input aria-label="Search companies" placeholder="Search companies" value={query} onChange={e => setQuery(e.target.value)} /><Button onClick={() => setEditing({ ...emptyCompany })}>Add company</Button></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {companies.filter(c => [c.name,c.email,c.contactName].join(' ').toLowerCase().includes(query.toLowerCase())).map(c => <Card key={c.id}><CardContent className="p-5 flex flex-wrap justify-between gap-4"><div><h3 className="font-semibold">{c.name}</h3><p>{c.contactName}</p><p className="text-sm text-slate-600">{c.email} {c.phone}</p><p className="text-sm text-slate-600 whitespace-pre-wrap">{c.address}</p><p className="text-sm whitespace-pre-wrap">{c.notes}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(c)}>Edit</Button><Button variant="destructive" disabled={busy} onClick={() => remove(c)}>Delete</Button></div></CardContent></Card>)}
    {!companies.length && !error && <p className="text-slate-500">No company records yet. Existing RFQ customer details remain in RFQs.</p>}
    <Dialog open={!!editing} onOpenChange={open => !busy && !open && setEditing(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?.id ? 'Edit company' : 'Add company'}</DialogTitle><DialogDescription>Manage contact information and business notes.</DialogDescription></DialogHeader>
      {editing && <form onSubmit={save} className="space-y-3">{[['name','Company name'],['contactName','Contact name'],['email','Email'],['phone','Phone'],['address','Address'],['notes','Notes']].map(([key,label]) => <label key={key} className="block text-sm">{label}{key === 'notes' ? <Textarea value={editing[key] || ''} onChange={e => setEditing({ ...editing, [key]: e.target.value })} /> : <Input required={key === 'name'} type={key === 'email' ? 'email' : 'text'} value={editing[key] || ''} onChange={e => setEditing({ ...editing, [key]: e.target.value })} />}</label>)}<Button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save company'}</Button></form>}
    </DialogContent></Dialog>
  </div>
}
