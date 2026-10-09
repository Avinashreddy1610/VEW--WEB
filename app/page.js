'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth as useClerkAuth, useClerk, SignIn, SignUp } from '@clerk/nextjs'
import { apiFetch as fetch } from '@/lib/client-http.mjs'
import { cleanContact, pageTitles } from '@/lib/site-content.mjs'
import { ListPager, usePagedList } from '@/components/paged-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ManagerManagement, CompanyManagement } from '@/components/management-panels'
import { CompanyOrders, CompanyInvitation } from '@/components/company-orders'
import { createPortal } from 'react-dom'
import Image from 'next/image'
const isStaff = user => ['owner', 'manager'].includes(user?.role)

// Light, minimal Clerk appearance matching the site theme.
const clerkAppearance = {
  variables: { colorPrimary: '#171717', colorText: '#171717', colorTextSecondary: '#525252', borderRadius: '12px' },
  elements: {
    card: 'shadow-none border border-neutral-200 rounded-3xl',
    headerTitle: 'font-display',
    formButtonPrimary: 'bg-neutral-900 hover:bg-neutral-700 rounded-full h-12 text-sm normal-case tracking-normal',
    socialButtonsBlockButton: 'rounded-full h-12 border-neutral-300',
    formFieldInput: 'rounded-xl h-12',
    footerActionLink: 'text-neutral-900 font-semibold',
  },
}
import {
  Cog, Wrench, Factory, Ruler, ShieldCheck, Upload, FileText, Trash2, ArrowRight, ArrowLeft,
  CheckCircle2, Menu, X, Mail, Phone, MapPin, Globe2, ClipboardList, Search,
  Package, TrendingUp, Send, Download, RefreshCw, Building2, LogIn, LogOut, User, UserPlus,
  Circle, Loader2, Pencil, Save, FileDown, Sparkles, Boxes,
  Hammer, Flame, Layers, Wind, Truck, Award
} from 'lucide-react'

// ============== IMAGES ==============
const HERO_IMG = '/hero/hero-workshop.jpg'
const IMG_2 = '/hero/gears-closeup.jpg'
const IMG_3 = '/hero/gear-cutting-sparks.jpg'
const IMG_4 = '/hero/factory-dusk.jpg'
const IMG_CNC = '/workshop/gear-cutting-machine.jpg'
const IMG_CNC2 = '/workshop/lathe-setup.jpg'
const GALLERY = [
  { src: '/workshop/finished-gear-components.jpg', alt: 'Finished gear components at Vijaya Engineering Works', caption: 'Finished gears' },
  { src: '/workshop/workshop-machinery.jpg', alt: 'Machine tools on the Vijaya Engineering Works production floor', caption: 'Workshop machinery' },
  { src: '/workshop/machining-setup.jpg', alt: 'Metalworking machine set up in the workshop', caption: 'Machining setup' },
  { src: '/workshop/industrial-equipment.jpg', alt: 'Industrial equipment inside the Vijaya Engineering Works workshop', caption: 'Workshop equipment' },
  { src: '/workshop/lathe-setup.jpg', alt: 'Lathe and cutting equipment in the workshop', caption: 'Lathe setup' },
  { src: '/workshop/production-floor.jpg', alt: 'Machine tools on the production floor', caption: 'Production floor' },
  { src: '/workshop/vertical-machining-setup.jpg', alt: 'Vertical machining equipment in the workshop', caption: 'Machining equipment' },
  { src: '/workshop/gear-machining.jpg', alt: 'Technician machining a gear component', caption: 'Machining in progress' },
  { src: '/workshop/lathe-workstation.jpg', alt: 'Lathe workstation with a mounted component', caption: 'Lathe workstation' },
  { src: '/workshop/bevel-gear.jpg', alt: 'Finished bevel gear component', caption: 'Bevel gear' },
  { src: '/workshop/vertical-machine.jpg', alt: 'Vertical metalworking machine in the workshop', caption: 'Vertical machine' },
  { src: '/workshop/heavy-machining.jpg', alt: 'Heavy green machining equipment in the workshop', caption: 'Heavy machining' },
  { src: '/workshop/machining-closeup.jpg', alt: 'Close view of a metalworking setup', caption: 'Machining close-up' },
  { src: '/workshop/gear-cutting-machine.jpg', alt: 'Gear mounted on a cutting machine', caption: 'Gear cutting' },
  { src: '/workshop/machining-equipment-angle.jpg', alt: 'Another view of heavy machining equipment', caption: 'Machining equipment' },
]

const COMPANY_URL = 'https://www.vijayaengineeringworks.com'
const COMPANY_MAPS_URL = 'https://www.google.com/maps/place/VIJAYA+ENGINEERING+WORKS/@17.5126854,78.4642879,759m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bcb91f4238e884b:0x2e79917f150aa34d!8m2!3d17.5126854!4d78.4642879!16s%2Fg%2F11pf2lzzm4'

// ============== CONSTANTS ==============
const GEAR_TYPES = ['Spiral Bevel Gear','Spiral Bevel Pinion','Spiral Bevel Gear Set','Straight Bevel Gear','Helical Gear','Spur Gear','Other Custom Gear']

const PRODUCTS = [
  { key: 'spiral-bevel', title: 'Spiral Bevel Gears', img: HERO_IMG, apps: ['Automotive differentials','Aerospace gearboxes','Marine drives','Heavy machinery'] },
  { key: 'spiral-bevel-pinion', title: 'Spiral Bevel Pinions', img: IMG_2, apps: ['Ring & pinion sets','Axle assemblies','Industrial reducers'] },
  { key: 'helical', title: 'Helical Gears', img: IMG_3, apps: ['Wind turbines','Industrial reducers','Machine tools','Conveyors'] },
  { key: 'spur', title: 'Spur Gears', img: IMG_4, apps: ['Pumps & compressors','Automation','Robotics','Timing systems'] },
  { key: 'gear-sets', title: 'Custom Gear Sets', img: IMG_CNC, apps: ['OEM replacements','Custom drivetrains','Prototypes'] },
]

const CAPABILITIES = [
  { icon: Cog, title: 'Gear Cutting', desc: 'Hobbing, shaping, and generating up to 1200 mm OD.' },
  { icon: Wrench, title: 'Gear Grinding', desc: 'AGMA Q12 / DIN 4 quality grinding on profile & form.' },
  { icon: Factory, title: 'CNC Turning & Milling', desc: 'Multi-axis CNC machining of blanks and complex parts.' },
  { icon: Ruler, title: 'Metrology & Inspection', desc: 'CMM inspection, gear analytical checks, full reports.' },
  { icon: ShieldCheck, title: 'Heat Treatment', desc: 'Carburizing, nitriding, induction — coordinated & verified.' },
  { icon: Package, title: 'Prototype to Production', desc: 'From 1-off prototypes to full production batches.' },
]

const PRODUCTION_STAGES = [
  { name: 'Raw Material', icon: Boxes },
  { name: 'Drawing', icon: FileText },
  { name: 'Turning', icon: Cog },
  { name: 'Gear Cutting', icon: Wrench },
  { name: 'Heat Treatment', icon: Flame },
  { name: 'Jig Boring', icon: Ruler },
  { name: 'Lapping', icon: Layers },
  { name: 'Sand Blasting', icon: Wind },
  { name: 'Grinding', icon: Hammer },
  { name: 'Dispatched', icon: Truck },
]

const RFQ_STATUSES = ['Submitted','Under Review','Engineering Review','Need More Information','Quote Prepared','Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed','Cancelled']
const STATUS_COLORS = {
  'Submitted':'bg-blue-100 text-blue-800','Under Review':'bg-amber-100 text-amber-800','Engineering Review':'bg-amber-100 text-amber-800',
  'Need More Information':'bg-amber-100 text-amber-800','Quote Prepared':'bg-purple-100 text-purple-800','Quote Sent':'bg-purple-100 text-purple-800',
  'Customer Approved':'bg-emerald-100 text-emerald-800','Order Confirmed':'bg-emerald-100 text-emerald-800','In Production':'bg-indigo-100 text-indigo-800',
  'Quality Inspection':'bg-indigo-100 text-indigo-800','Ready to Ship':'bg-teal-100 text-teal-800','Shipped':'bg-teal-100 text-teal-800',
  'Completed':'bg-green-100 text-green-800','Cancelled':'bg-red-100 text-red-800',
}

const SPEC_FIELDS = {
  bevel: [
    { key: 'gearOrPinion', label: 'Gear or Pinion', type: 'select', options: ['Gear','Pinion'] },
    { key: 'numberOfTeeth', label: 'Number of Teeth' }, { key: 'matingGearTeeth', label: 'Mating Gear Teeth' },
    { key: 'module', label: 'Module (mm)' }, { key: 'diametralPitch', label: 'Diametral Pitch' },
    { key: 'pressureAngle', label: 'Pressure Angle (°)' }, { key: 'spiralAngle', label: 'Spiral Angle (°)' },
    { key: 'pitchDiameter', label: 'Pitch Diameter' }, { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'faceWidth', label: 'Face Width' }, { key: 'pitchConeAngle', label: 'Pitch Cone Angle (°)' },
    { key: 'shaftAngle', label: 'Shaft Angle (°)' },
    { key: 'handOfSpiral', label: 'Hand of Spiral', type: 'select', options: ['Left','Right'] },
    { key: 'gearRatio', label: 'Gear Ratio' }, { key: 'mountingDistance', label: 'Mounting Distance' },
    { key: 'backlash', label: 'Backlash' }, { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'keyway', label: 'Keyway' },
    { key: 'manufacturerStandard', label: 'Standard', type: 'select', options: ['Gleason','Klingelnberg','Custom'] },
  ],
  helical: [
    { key: 'numberOfTeeth', label: 'Number of Teeth' }, { key: 'module', label: 'Module (mm)' },
    { key: 'diametralPitch', label: 'Diametral Pitch' }, { key: 'normalModule', label: 'Normal Module' },
    { key: 'pressureAngle', label: 'Pressure Angle (°)' }, { key: 'helixAngle', label: 'Helix Angle (°)' },
    { key: 'helixDirection', label: 'Helix Direction', type: 'select', options: ['Left','Right'] },
    { key: 'pitchDiameter', label: 'Pitch Diameter' }, { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'faceWidth', label: 'Face Width' }, { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'gearQuality', label: 'Quality (AGMA/DIN)' }, { key: 'backlash', label: 'Backlash' }, { key: 'keyway', label: 'Keyway' },
  ],
  spur: [
    { key: 'numberOfTeeth', label: 'Number of Teeth' }, { key: 'module', label: 'Module (mm)' },
    { key: 'diametralPitch', label: 'Diametral Pitch' }, { key: 'pressureAngle', label: 'Pressure Angle (°)' },
    { key: 'pitchDiameter', label: 'Pitch Diameter' }, { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'faceWidth', label: 'Face Width' }, { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'gearQuality', label: 'Quality' }, { key: 'backlash', label: 'Backlash' }, { key: 'keyway', label: 'Keyway' },
  ],
  custom: [
    { key: 'description', label: 'Describe the Gear', type: 'textarea' },
    { key: 'numberOfTeeth', label: 'Number of Teeth' }, { key: 'module', label: 'Module' },
    { key: 'majorDimensions', label: 'Major Dimensions' },
  ],
}
function specGroup(t) { if (!t) return 'custom'; if (t.includes('Bevel')) return 'bevel'; if (t.includes('Helical')) return 'helical'; if (t === 'Spur Gear') return 'spur'; return 'custom' }

// ============== AUTH HOOK ==============
// Auth state is owned by Clerk; the local user record (roles, business data)
// is fetched from /api/auth/me once Clerk reports a signed-in session.
function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth()
  const { signOut } = useClerk()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSignedIn) { setUser(null); return null }
    try {
      const r = await fetch('/api/auth/me')
      const d = await r.json()
      setUser(d.user || null)
      return d.user || null
    } catch { setUser(null); return null }
  }, [isSignedIn])

  useEffect(() => {
    if (!clerkLoaded) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [clerkLoaded, isSignedIn, refresh])

  const impersonate = async (userId) => {
    const r = await fetch(`/api/admin/users/${userId}/impersonate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    setUser(d.user)
    return d.user
  }
  const exitImpersonation = async () => {
    const r = await fetch('/api/auth/exit-impersonation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Please sign in again')
    setUser(d.user)
  }
  const logout = async () => {
    await signOut()
    setUser(null)
  }
  return { user, loading, isSignedIn: !!isSignedIn, logout, impersonate, exitImpersonation, refresh }
}

function api() {
  const h = { 'Content-Type': 'application/json' }
  const request = async (u, method, body, requestKey) => {
    try {
      const response = await fetch(u, { method, headers: { ...h, ...(requestKey ? { 'Idempotency-Key': requestKey } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
      const data = await response.json()
      if (!response.ok) { toast.error(data.error || 'Request failed'); return { error: data.error || 'Request failed', success: false } }
      return data
    } catch { toast.error('Unable to reach the server. Please try again.'); return { error: 'Connection failed', success: false } }
  }
  return {
    get: u => request(u, 'GET'), post: (u, body, requestKey) => request(u, 'POST', body, requestKey),
    patch: (u, body) => request(u, 'PATCH', body), delete: u => request(u, 'DELETE'),
    put: (u, body) => request(u, 'PUT', body),
  }
}

// ============== ANIMATION HELPERS ==============
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function FadeIn({ children, className = '', delay = 0 }) {
  return <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
    variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } } }}>{children}</motion.div>
}

// ============== SHARED UI PRIMITIVES ==============

// ============== APP-LEVEL CHROME ==============

// ============== NAV ==============
function Nav({ route, setRoute, mobileOpen, setMobileOpen, user, onLogout }) {
  const links = [
    { key: 'home', label: 'Home' }, { key: 'products', label: 'Products' },
    { key: 'capabilities', label: 'Capabilities' }, { key: 'gallery', label: 'Gallery' },
    { key: 'about', label: 'About' }, { key: 'contact', label: 'Contact' },
  ]
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setRoute('home')} className="flex items-center gap-2">
          <Cog className="h-7 w-7 text-neutral-900" strokeWidth={2.2} />
          <span className="text-left">
            <span className="block font-bold tracking-tight leading-none text-neutral-900">Vijaya Engineering Works</span>
            <span className="block text-[10px] uppercase tracking-widest text-neutral-500 leading-none mt-0.5">Precision Gears</span>
          </span>
        </button>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <button key={l.key} onClick={() => setRoute(l.key)}
              className={`px-4 py-2 text-sm rounded-full ${route === l.key ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-600 hover:text-neutral-900'}`}>{l.label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setRoute(isStaff(user) ? 'admin' : 'portal')} className="hidden sm:inline-flex">
                <User className="h-4 w-4 mr-1" /> {user.firstName || user.fullName || 'Account'}
              </Button>
              <Button aria-label="Sign out" variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setRoute('login')} className="hidden sm:inline-flex"><LogIn className="h-4 w-4 mr-1" /> Sign In</Button>
          )}
          <Button onClick={() => setRoute('rfq')} className="hidden sm:inline-flex rounded-full bg-neutral-900 text-white hover:bg-neutral-700 h-10 px-6 text-sm">Request a Quote</Button>
          <button aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-menu" className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </div>
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-neutral-200 bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map(l => <button key={l.key} onClick={() => { setRoute(l.key); setMobileOpen(false) }} className={`px-3 py-2 text-left rounded-md ${route === l.key ? 'bg-neutral-100 font-medium' : 'text-neutral-600'}`}>{l.label}</button>)}
            {user ? <>
              <button onClick={() => { setRoute(isStaff(user) ? 'admin' : 'portal'); setMobileOpen(false) }} className="px-3 py-2 text-left text-neutral-600">My Account</button>
              <button onClick={onLogout} className="px-3 py-2 text-left text-neutral-600">Sign Out</button>
            </> : <button onClick={() => { setRoute('login'); setMobileOpen(false) }} className="px-3 py-2 text-left text-neutral-600">Sign In</button>}
            <Button onClick={() => { setRoute('rfq'); setMobileOpen(false) }} className="rounded-full bg-neutral-900 text-white mt-2">Request a Quote</Button>
          </div>
        </div>
      )}
    </header>
  )
}

function Footer({ setRoute, cms }) {
  return (
    <footer className="bg-neutral-100 text-neutral-600 border-t border-neutral-200">
      <div className="container mx-auto px-4 py-14 grid md:grid-cols-5 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3"><Cog className="h-6 w-6 text-neutral-900" /><div className="text-neutral-900 font-bold">{cms?.companyName || 'Vijaya Engineering Works'}</div></div>
          <p className="text-sm">Custom precision gear manufacturing from your drawings and specifications.</p>
        </div>
        <div>
          <div className="text-neutral-900 font-semibold mb-3">Products</div>
          <ul className="space-y-2 text-sm">{PRODUCTS.map(p => <li key={p.key}><button onClick={() => setRoute('product:' + p.key)} className="hover:text-neutral-900">{p.title}</button></li>)}</ul>
        </div>
        <div>
          <div className="text-neutral-900 font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setRoute('about')} className="hover:text-neutral-900">About</button></li>
            <li><button onClick={() => setRoute('capabilities')} className="hover:text-neutral-900">Capabilities</button></li>
            <li><button onClick={() => setRoute('gallery')} className="hover:text-neutral-900">Gallery</button></li>
            <li><button onClick={() => setRoute('contact')} className="hover:text-neutral-900">Contact</button></li>
          </ul>
        </div>
        <div>
          <div className="text-neutral-900 font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setRoute('privacy')} className="hover:text-neutral-900">Privacy Policy</button></li>
            <li><button onClick={() => setRoute('terms')} className="hover:text-neutral-900">Terms & Conditions</button></li>
          </ul>
        </div>
        <div>
          <div className="text-neutral-900 font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            {cms?.phone && <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0" /><a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`} className="hover:text-neutral-900">{cms.phone}</a></li>}
            {cms?.email && <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0" /><a href={`mailto:${cms.email}`} className="break-all hover:text-neutral-900">{cms.email}</a></li>}
            {cms?.address && <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" />{cms.address}</li>}
            <li className="flex items-start gap-2"><Globe2 className="h-4 w-4 mt-0.5 shrink-0" /><a href={COMPANY_URL} className="break-all hover:text-neutral-900">vijayaengineeringworks.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs">© {new Date().getFullYear()} {cms?.companyName || 'Vijaya Engineering Works'}. All rights reserved.</div>
    </footer>
  )
}

// ============== HOME (simple, no animation) ==============
function HomePage({ setRoute, cms }) {
  return (
    <div className="bg-white text-neutral-900">
      {/* HERO */}
      <section className="container mx-auto px-4 pt-14 pb-12 md:pt-20 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Vijaya Engineering Works · Precision gear manufacturing</p>
        <h1 className="font-display font-bold tracking-tight leading-[0.95] text-5xl md:text-7xl max-w-4xl">
          Gears cut to perfection.
        </h1>
        <p className="mt-5 text-lg text-neutral-600 max-w-xl">
          Spiral bevel, helical and spur gears — plus complete gear sets — machined from your drawings and inspected to AGMA Q12.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => setRoute('rfq')} className="rounded-full bg-neutral-900 text-white hover:bg-neutral-700 h-12 px-8">
            Request a Quote <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => setRoute('products')} className="rounded-full h-12 px-8">
            Browse Products
          </Button>
        </div>
        <div className="mt-10 rounded-2xl overflow-hidden bg-neutral-100">
          <Image src={HERO_IMG} alt="Vijaya Engineering Works workshop" width={1600} height={900} className="w-full h-auto" priority />
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-neutral-200 pt-8">
          {[['30+', 'Years of precision'], ['Q12', 'AGMA quality grade'], ['1200 mm', 'Max OD capacity'], ['±0.002 mm', 'Tolerance']].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-3xl md:text-4xl font-bold">{v}</div>
              <div className="text-sm text-neutral-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="bg-neutral-100 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Our products</h2>
            <button onClick={() => setRoute('products')} className="text-sm font-medium underline underline-offset-4">View all</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTS.map(p => (
              <button key={p.key} onClick={() => setRoute('product:' + p.key)} className="text-left bg-white rounded-2xl overflow-hidden border border-neutral-200">
                <div className="aspect-[4/3] bg-neutral-200 overflow-hidden">
                  <Image src={p.img} alt={p.title} width={800} height={600} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-xl">{p.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{cms?.productDescriptions?.[p.key] || p.apps.slice(0, 3).join(' · ')}</p>
                  <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium">Explore <ArrowRight className="h-4 w-4" /></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-8">What we do</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
            {CAPABILITIES.map(c => (
              <div key={c.title} className="bg-white p-6">
                <c.icon className="h-7 w-7 mb-4" />
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-sm text-neutral-500 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-neutral-900 text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2">From drawing to dispatch</h2>
          <p className="text-neutral-400 mb-10">Ten tracked stages. Follow your order live from the customer portal.</p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-neutral-700 rounded-2xl overflow-hidden border border-neutral-700">
            {PRODUCTION_STAGES.map((s, i) => (
              <li key={s.name} className="bg-neutral-900 p-5">
                <div className="text-xs text-neutral-500 mb-2">{String(i + 1).padStart(2, '0')}</div>
                <div className="font-medium">{s.name}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Inside the shop</h2>
            <button onClick={() => setRoute('gallery')} className="text-sm font-medium underline underline-offset-4">Open gallery</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY.slice(0, 8).map(g => (
              <button key={g.src} onClick={() => setRoute('gallery')} className="rounded-xl overflow-hidden bg-neutral-100 aspect-[4/3]">
                <Image src={g.src} alt={g.alt} width={600} height={450} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">Send us your gear drawing.</h2>
          <p className="text-neutral-400 mt-4 max-w-xl mx-auto">Upload PDF, STEP, DXF, DWG, JPG or PNG. We&apos;ll review it on the shop floor and reply with a detailed quote.</p>
          <Button size="lg" onClick={() => setRoute('rfq')} className="mt-8 rounded-full bg-white text-neutral-900 hover:bg-neutral-200 h-12 px-8">
            Start your RFQ <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}

// ============== PRODUCTION TRACKER (visual timeline) ==============
function ProductionTracker({ stages, canEdit, onUpdate }) {
  const stagesData = stages || PRODUCTION_STAGES.map((s, i) => ({ id: 's' + i, name: s.name, sequence: i + 1, status: 'NOT_STARTED' }))
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="Production stages; scroll horizontally to see all stages">
      <div className="min-w-[900px]">
        {/* Progress line */}
        <div className="relative flex items-start justify-between">
          <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
            {(() => {
              const completed = stagesData.filter(s => s.status === 'COMPLETED').length
              const pct = (completed / stagesData.length) * 100
              return <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full" />
            })()}
          </div>
          {stagesData.map((s, i) => {
            const stageMeta = PRODUCTION_STAGES.find(x => x.name === s.name) || PRODUCTION_STAGES[i]
            const Icon = stageMeta?.icon || Circle
            const isDone = s.status === 'COMPLETED'
            const isActive = s.status === 'IN_PROGRESS'
            const isHold = s.status === 'HOLD'
            return (
              <div key={s.id} className="relative flex flex-col items-center gap-2 z-10 flex-1">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                      isActive ? 'bg-cyan-400 border-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/40' :
                      isHold ? 'bg-amber-100 border-amber-400 text-amber-700' :
                      'bg-white border-slate-300 text-slate-400'}`}>
                  {isDone ? <CheckCircle2 className="h-6 w-6" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </motion.div>
                <div className="text-center px-1">
                  <div className={`text-xs font-semibold ${isDone || isActive ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</div>
                  {isActive && <div className="text-[10px] text-cyan-600 font-semibold mt-0.5">In Progress</div>}
                  {isDone && s.completedAt && <div className="text-[10px] text-slate-500 mt-0.5">{new Date(s.completedAt).toLocaleDateString()}</div>}
                  {isHold && <div className="text-[10px] text-amber-600 font-semibold mt-0.5">On Hold</div>}
                </div>
                {canEdit && (
                  <Select value={s.status} onValueChange={(v) => onUpdate(s.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="HOLD">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============== PRODUCTS/PRODUCT DETAIL/OTHER PAGES ==============
function ProductsPage({ setRoute, cms }) {
  return (
    <div className="bg-white text-neutral-900 min-h-screen">
      <div className="container mx-auto px-4 py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Products</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">Our products</h1>
        <p className="mt-4 text-lg text-neutral-600 max-w-2xl">Every gear we manufacture is built from your drawings and specifications.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {PRODUCTS.map((p) => (
            <button key={p.key} onClick={() => setRoute('product:' + p.key)} className="text-left bg-white rounded-2xl overflow-hidden border border-neutral-200">
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                <Image src={p.img} alt={p.title} width={800} height={600} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-xl">{p.title}</h3>
                <p className="text-sm text-neutral-500 mt-1">{cms?.productDescriptions?.[p.key] || p.apps.slice(0, 3).join(' · ')}</p>
                <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium">Explore <ArrowRight className="h-4 w-4" /></span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductDetail({ productKey, setRoute, cms }) {
  const p = PRODUCTS.find(x => x.key === productKey)
  if (!p) return <div className="bg-white min-h-screen"><div className="container mx-auto px-4 py-16">Product not found.</div></div>
  return (
    <div className="bg-white text-neutral-900">
      <section className="container mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <button onClick={() => setRoute('products')} className="text-neutral-500 hover:text-neutral-900 text-sm mb-6 flex items-center"><ArrowLeft className="h-4 w-4 mr-1" /> All Products</button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Product</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">{p.title}</h1>
          <p className="text-neutral-600 mb-8 text-lg leading-relaxed">{cms?.productDescriptions?.[p.key]}</p>
          <Button size="lg" onClick={() => setRoute('rfq')} className="rounded-full bg-neutral-900 text-white hover:bg-neutral-700 h-12 px-8">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-neutral-100">
          <Image src={p.img} alt={p.title} width={900} height={675} className="w-full aspect-[4/3] object-cover" loading="lazy" />
        </div>
      </section>
      <section className="border-y border-neutral-200 bg-neutral-100">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[['±0.002 mm', 'Grinding tolerance'], ['AGMA Q12', 'Gear quality grade'], ['1200 mm', 'Max outside diameter'], ['6+', 'Material families']].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-2xl font-bold whitespace-nowrap">{v}</div>
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 grid md:grid-cols-3 gap-5">
        {[
          { title: 'Typical Applications', items: p.apps },
          { title: 'Available Materials', items: ['Alloy Steel (4140, 4340, 8620)','Carbon Steel','Stainless Steel','Bronze','Cast Iron','Custom on request'] },
          { title: 'Manufacturing Options', items: ['Gear cutting & hobbing','Precision grinding','Heat treatment','CMM inspection','Lapping & finishing'] }
        ].map((col, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-display font-bold mb-4 text-lg">{col.title}</h3>
            <ul className="space-y-2.5 text-neutral-600 text-sm">{col.items.map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-neutral-900 mt-0.5 shrink-0" /> {a}</li>)}</ul>
          </div>
        ))}
      </section>
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <h3 className="font-display font-bold text-2xl tracking-tight">Gallery</h3>
          <Button variant="outline" onClick={() => setRoute('gallery')} className="rounded-full">View all <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GALLERY.slice(0, 4).map(photo => (
            <button key={photo.src} onClick={() => setRoute('gallery')} className="rounded-xl overflow-hidden bg-neutral-100 aspect-square cursor-pointer">
              <Image src={photo.src} alt={photo.alt} width={600} height={600} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function CapabilitiesPage() {
  const sections = [
    { title: 'Gear Cutting', desc: 'Hobbing, shaping, and generating for spur, helical, and bevel gears. Up to 1200 mm OD.', img: IMG_CNC },
    { title: 'Gear Grinding', desc: 'Profile and form grinding to AGMA Q12 / DIN 4.', img: IMG_CNC2 },
    { title: 'CNC Turning & Milling', desc: 'Multi-axis CNC machining of gear blanks, shafts, and complex parts.', img: IMG_4 },
    { title: 'Inspection & Metrology', desc: 'CMM inspection, gear analytical testing, full first-article reports.', img: IMG_2 },
    { title: 'Heat Treatment', desc: 'Coordinated carburizing, nitriding, and induction hardening.', img: IMG_3 },
    { title: 'Prototype to Production', desc: 'From one-off prototype gears to full production runs.', img: HERO_IMG },
  ]
  return (
    <div className="bg-white text-neutral-900">
      <section className="container mx-auto px-4 py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Capabilities</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">Manufacturing capabilities</h1>
        <p className="text-neutral-600 max-w-2xl text-lg">A complete in-house manufacturing suite from raw material through inspection.</p>
      </section>
      <section className="container mx-auto px-4 pb-20 space-y-14">
        {sections.map((s, i) => (
          <div key={i} className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
            <div className="rounded-2xl overflow-hidden bg-neutral-100">
              <Image src={s.img} alt={s.title} width={900} height={560} className="w-full aspect-video object-cover" loading="lazy" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-400 mb-3">{String(i + 1).padStart(2, '0')}</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">{s.title}</h2>
              <p className="text-neutral-600 text-lg leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function GalleryPage() {
  const [lightbox, setLightbox] = useState(null)
  useEffect(() => {
    if (lightbox === null) return
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(i => (i + 1) % GALLERY.length)
      if (e.key === 'ArrowLeft') setLightbox(i => (i - 1 + GALLERY.length) % GALLERY.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [lightbox])
  const active = lightbox === null ? null : GALLERY[lightbox]
  return (
    <div className="bg-white text-neutral-900 min-h-screen">
    <div className="container mx-auto px-4 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Gallery</p>
      <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">Inside our workshop</h1>
      <p className="text-neutral-600 mb-10 text-lg max-w-2xl">Photos of our equipment, machining work, and gear components. Click any photo to enlarge it.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY.map((photo, i) => (
          <figure key={photo.src} onClick={() => setLightbox(i)} className="rounded-2xl overflow-hidden bg-white border border-neutral-200 cursor-pointer">
            <div className="aspect-square bg-neutral-100"><Image src={photo.src} alt={photo.alt} width={600} height={600} className="w-full h-full object-cover" loading="lazy" /></div>
            <figcaption className="px-3 py-2.5 text-sm font-medium text-neutral-500">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
      <AnimatePresence>
        {active && createPortal((
          <div onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <button aria-label="Close" onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition">
              <X className="h-6 w-6" />
            </button>
            <button aria-label="Previous photo" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY.length) % GALLERY.length) }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img key={active.src} src={active.src} alt={active.alt} onClick={e => e.stopPropagation()}
              className="max-h-[82vh] max-w-[94vw] rounded-xl shadow-2xl object-contain" />
            <button aria-label="Next photo" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY.length) }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition">
              <ArrowRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-white/10 rounded-full px-4 py-1.5 whitespace-nowrap">
              {active.caption} · {lightbox + 1} of {GALLERY.length}
            </div>
          </div>
        ), document.body)}
      </AnimatePresence>
    </div>
    </div>
  )
}

function AboutPage({ cms }) {
  return (
    <div className="bg-white text-neutral-900">
      <section className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">About us</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-10">{cms?.aboutTitle || 'About Vijaya Engineering Works'}</h1>
        <div className="rounded-2xl overflow-hidden bg-neutral-100 mb-10">
          <Image src={IMG_2} alt="Precision gears manufactured by Vijaya Engineering Works" width={1200} height={514} className="w-full aspect-[21/9] object-cover" loading="lazy" />
        </div>
        <p className="text-neutral-600 text-lg leading-relaxed whitespace-pre-line">{cms?.aboutText}</p>
        <div className="grid grid-cols-3 gap-4 mt-12">
          {[
            { v: '30+', l: 'Years' },
            { v: 'Q12', l: 'AGMA grade' },
            { v: '1200 mm', l: 'Max OD' },
          ].map((s, i) => (
            <div key={i} className="text-center rounded-2xl border border-neutral-200 p-5">
              <div className="font-display text-2xl md:text-3xl font-bold">{s.v}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ContactPage({ cms, setRoute }) {
  const [contact, setContact] = useState({ name: '', email: '', message: '' })
  const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cms?.email || '') ? cms.email : null
  function composeContact(e) {
    e.preventDefault()
    if (!contactEmail) { toast.error('Contact email is temporarily unavailable'); return }
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent('Website enquiry from ' + contact.name)}&body=${encodeURIComponent(contact.message + '\n\nFrom: ' + contact.name + '\nEmail: ' + contact.email)}`
  }
  const infoRows = [
    { icon: Phone, label: 'Phone', body: cms?.phone ? <a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`} className="hover:underline">{cms.phone}</a> : 'Please use a quote request to contact us.' },
    { icon: Mail, label: 'Email', body: contactEmail ? <a href={`mailto:${contactEmail}`} className="break-all hover:underline">{contactEmail}</a> : 'Contact email is being updated.' },
    { icon: MapPin, label: 'Address', body: <>{cms?.address}<div><a href={COMPANY_MAPS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">View our location on Google Maps</a></div></> },
    { icon: Globe2, label: 'Website', body: <a href={COMPANY_URL} className="break-all hover:underline">vijayaengineeringworks.com</a> },
    { icon: Building2, label: 'Hours', body: cms?.hours },
  ]
  return (
    <div className="bg-white text-neutral-900 min-h-screen">
    <div className="container mx-auto px-4 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">Contact</p>
      <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">Contact us</h1>
      <p className="text-neutral-600 mb-10 text-lg max-w-2xl">Tell us about your project — we reply to every enquiry.</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {infoRows.map((r, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border border-neutral-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                <r.icon className="h-5 w-5 text-neutral-900" />
              </div>
              <div className="min-w-0"><div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">{r.label}</div><div className="text-neutral-700">{r.body}</div></div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-neutral-200 p-6 md:p-8 h-fit">
          <form onSubmit={composeContact} className="space-y-4">
            <label className="block text-sm">Name<Input required placeholder="Your name" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} className="mt-1.5" /></label>
            <label className="block text-sm">Email<Input required type="email" placeholder="you@example.com" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} className="mt-1.5" /></label>
            <label className="block text-sm">Message<Textarea required placeholder="How can we help?" rows={4} value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} className="mt-1.5" /></label>
            <Button disabled={!contactEmail} className="w-full rounded-full bg-neutral-900 text-white hover:bg-neutral-700 h-12">Compose email</Button>
            <p className="text-xs text-neutral-500">Opens your email app so you can review and send your message. By sending a message, you agree to our <button type="button" onClick={() => setRoute('privacy')} className="underline underline-offset-2 hover:text-neutral-900">Privacy Policy</button> and <button type="button" onClick={() => setRoute('terms')} className="underline underline-offset-2 hover:text-neutral-900">Terms & Conditions</button>.</p>
          </form>
        </div>
      </div>
    </div>
    </div>
  )
}

// ============== LEGAL (Privacy Policy + Terms & Conditions) ==============
const LEGAL_UPDATED = '8 October 2026'

function LegalShell({ eyebrow, title, cms, children }) {
  return (
    <div className="bg-white text-neutral-900 min-h-screen">
      <div className="container mx-auto px-4 py-14 md:py-20 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">{eyebrow}</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">{title}</h1>
        <p className="text-neutral-500 mb-10 text-sm">Last updated: {LEGAL_UPDATED}</p>
        <div className="space-y-8 text-neutral-700 leading-relaxed">
          {children}
          <section>
            <h2 className="text-neutral-900 font-semibold text-lg mb-2">Questions</h2>
            <p className="text-sm">For questions about these policies, contact us at {cms?.email ? <a href={`mailto:${cms.email}`} className="underline underline-offset-4 hover:text-neutral-900">{cms.email}</a> : 'the email address on our Contact page'}.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-neutral-900 font-semibold text-lg mb-2">{title}</h2>
      <div className="text-sm space-y-2">{children}</div>
    </section>
  )
}

function PrivacyPage({ cms }) {
  const company = cms?.companyName || 'Vijaya Engineering Works'
  return (
    <LegalShell eyebrow="Legal" title="Privacy Policy" cms={cms}>
      <LegalSection title="Who we are">
        <p>{company} ("we", "us") is a precision gear manufacturer based in Hyderabad, Telangana, India. This policy explains what personal data we collect through this website and how we use it.</p>
      </LegalSection>
      <LegalSection title="What we collect">
        <p><span className="font-semibold text-neutral-900">Contact enquiries.</span> If you use the contact form, your name, email address, and message are composed into an email that you send from your own email app — we receive it as an email enquiry.</p>
        <p><span className="font-semibold text-neutral-900">Accounts and quote requests.</span> When you create an account or request a quote, we collect your name, email address, company name, phone number, and any drawings, specifications, or other details you upload so we can prepare and manage your quote.</p>
        <p><span className="font-semibold text-neutral-900">Sign-in data.</span> Authentication is handled by our identity provider, Clerk, which processes your email address and sign-in activity on our behalf.</p>
      </LegalSection>
      <LegalSection title="How we use it">
        <p>We use your data to respond to enquiries, prepare quotations, manage your account and orders, and keep the website secure. We do not sell your personal data and we do not use it for advertising.</p>
      </LegalSection>
      <LegalSection title="Who we share it with">
        <p>We share data only with the service providers needed to run this website — principally Clerk for authentication — and only as required by law. Drawings and specifications you upload are used solely to quote and manufacture your order.</p>
      </LegalSection>
      <LegalSection title="How long we keep it">
        <p>We keep enquiry and quote records for as long as needed for the business relationship, and account data until you ask us to delete it.</p>
      </LegalSection>
      <LegalSection title="Your rights">
        <p>Under India's Digital Personal Data Protection Act, 2023, you may request access to, correction of, or deletion of your personal data. Write to us using the contact details above and we will respond within a reasonable time.</p>
      </LegalSection>
      <LegalSection title="Cookies">
        <p>This website uses a small number of cookies and similar storage, and nothing else:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-semibold text-neutral-900">Authentication cookies</span> (set by Clerk) — keep you signed in. Required for accounts and quote requests.</li>
          <li><span className="font-semibold text-neutral-900">Admin session cookie</span> — used only for staff administration.</li>
          <li><span className="font-semibold text-neutral-900">Your cookie choice</span> — stored in your own browser so we don't ask again.</li>
        </ul>
        <p>We do not run analytics, advertising, or cross-site tracking cookies.</p>
      </LegalSection>
      <LegalSection title="Security">
        <p>We apply reasonable technical and organisational safeguards to protect your data, but no internet transmission or storage system is completely secure.</p>
      </LegalSection>
    </LegalShell>
  )
}

function TermsPage({ cms }) {
  const company = cms?.companyName || 'Vijaya Engineering Works'
  return (
    <LegalShell eyebrow="Legal" title="Terms & Conditions" cms={cms}>
      <LegalSection title="Our services">
        <p>{company} manufactures custom precision gears and related components to order, based on drawings and specifications supplied by the customer.</p>
      </LegalSection>
      <LegalSection title="Quotations">
        <p>All quotations are estimates based on the drawings and information you provide. Prices are valid for 30 days from the date of the quotation unless stated otherwise, and are confirmed before production begins. Any change to drawings or quantities may change the price and lead time.</p>
      </LegalSection>
      <LegalSection title="Drawings and intellectual property">
        <p>By uploading drawings or specifications you confirm you own them or are authorised to share them. We use your drawings only to prepare your quotation and manufacture your order, and we do not disclose them to third parties except as needed to fulfil your order.</p>
      </LegalSection>
      <LegalSection title="Orders and payment">
        <p>An order is confirmed when we accept it in writing. Payment terms are stated on the quotation or invoice. Production begins once any required advance payment is received.</p>
      </LegalSection>
      <LegalSection title="Lead times">
        <p>Delivery dates we give are good-faith estimates based on our current schedule. We will inform you of any expected delay, but dates are not guaranteed unless expressly agreed in writing.</p>
      </LegalSection>
      <LegalSection title="Liability">
        <p>To the maximum extent permitted by law, our liability for any order is limited to the value of that order. We are not liable for indirect, incidental, or consequential losses.</p>
      </LegalSection>
      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of India, and disputes are subject to the courts at Hyderabad, Telangana.</p>
      </LegalSection>
    </LegalShell>
  )
}

// ============== COOKIE CONSENT ==============
function CookieBanner({ setRoute }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try { if (!window.localStorage.getItem('vew-consent')) setShow(true) }
    catch (e) { setShow(false) }
  }, [])
  if (!show) return null
  function choose(v) {
    try { window.localStorage.setItem('vew-consent', v) } catch (e) {}
    setShow(false)
  }
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-neutral-200" role="region" aria-label="Cookie notice">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-neutral-600 max-w-2xl">
          We use cookies to keep you signed in and remember your choices — no advertising trackers. Read our{' '}
          <button onClick={() => setRoute('privacy')} className="underline underline-offset-4 hover:text-neutral-900">Privacy Policy</button>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => choose('declined')} className="rounded-full border border-neutral-300 px-5 h-10 text-sm hover:border-neutral-900">Decline</button>
          <button onClick={() => choose('accepted')} className="rounded-full bg-neutral-900 text-white px-5 h-10 text-sm hover:bg-neutral-700">Accept</button>
        </div>
      </div>
    </div>
  )
}

// ============== LOGIN / SIGNUP ==============
function LoginPage({ setRoute, auth }) {
  const [mode, setMode] = useState('login')
  // After Clerk signs the user in, send them to their workspace.
  useEffect(() => {
    if (auth.user && !auth.loading) setRoute(isStaff(auth.user) ? 'admin' : 'portal')
  }, [auth.user, auth.loading, setRoute])
  return (
    <div className="bg-white text-neutral-900 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-14 md:py-20 flex flex-col items-center">
        <div className="flex items-center gap-2.5 mb-8">
          <Cog className="h-9 w-9 text-neutral-900" />
          <div className="font-display font-bold text-neutral-900 tracking-tight">Vijaya Engineering Works</div>
        </div>
        {mode === 'login'
          ? <SignIn routing="hash" appearance={clerkAppearance} />
          : <SignUp routing="hash" appearance={clerkAppearance} />}
        <div className="mt-6 text-sm text-neutral-600">
          {mode === 'login'
            ? <>New to VEW? <button onClick={() => setMode('signup')} className="text-neutral-900 font-semibold hover:underline">Create an account</button></>
            : <>Already have an account? <button onClick={() => setMode('login')} className="text-neutral-900 font-semibold hover:underline">Sign in</button></>}
        </div>
        <p className="mt-4 text-xs text-neutral-500 text-center max-w-xs">
          By signing in or creating an account, you agree to our{' '}
          <button onClick={() => setRoute('privacy')} className="underline underline-offset-2 hover:text-neutral-900">Privacy Policy</button>{' '}
          and <button onClick={() => setRoute('terms')} className="underline underline-offset-2 hover:text-neutral-900">Terms & Conditions</button>.
        </p>
      </div>
    </div>
  )
}

// ============== IMPERSONATION BANNER ==============
function ImpersonationBanner({ user, onExit }) {
  if (!user?._impersonatedBy) return null
  return (
    <motion.div initial={{ y: -30 }} animate={{ y: 0 }} className="bg-cyan-500 text-slate-900 text-sm py-2 px-4 flex items-center justify-between gap-3 sticky top-16 z-30 border-b border-cyan-600">
      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> <span className="font-semibold">Admin override</span> · Viewing as {user.firstName} {user.lastName} ({user.email})</div>
      <Button size="sm" onClick={onExit} className="bg-slate-900 hover:bg-slate-800 text-white h-7 rounded-full text-xs">Exit override</Button>
    </motion.div>
  )
}

// ============== USER MANAGEMENT (Admin) ==============
function UserManagement({ auth, onImpersonate }) {
  const [query, setQuery] = useState('')
  const userList = usePagedList(`/api/admin/users?q=${encodeURIComponent(query)}`, 'users', auth.user?.id)
  const users = userList.items, load = userList.refresh
  const [editTarget, setEditTarget] = useState(null)

  async function toggle(u) {
    if (u.id === auth.user?.id) { toast.error("You can't disable your own account"); return }
    if (isStaff(u) && auth.user?.role !== 'owner') { toast.error('Only the owner can disable staff accounts'); return }
    const result = await api().patch(`/api/admin/users/${u.id}/toggle`, {}); if (result.error) return
    toast.success(u.isActive ? 'Account disabled' : 'Account re-enabled')
    load()
  }
  async function saveCustomer(e) {
    e.preventDefault()
    const result = await api().patch(`/api/admin/users/${editTarget.id}`, editTarget)
    if (result.error) return
    toast.success('Customer updated'); setEditTarget(null); load()
  }
  async function deleteUser(u) {
    if (u.id === auth.user?.id) { toast.error("You can't delete your own account"); return }
    if (!window.confirm(`Delete the account for ${u.email}? Sign-in will be disabled and the account will be removed from this list. RFQ history is retained.`)) return
    const result = await api().delete(`/api/admin/users/${u.id}`)
    if (!result.error) { toast.success('Account removed'); load() }
  }
  async function impersonate(u) {
    if (isStaff(u)) { toast.error("Can't impersonate another admin"); return }
    try {
      await auth.impersonate(u.id)
      toast.success(`Now viewing as ${u.firstName} ${u.lastName}`)
      onImpersonate && onImpersonate()
    } catch (e) { toast.error(e.message) }
  }

  const userActions = (u, className) => (
    <div className={className}>
      {u.role === 'customer' && (
        <>
          {auth.user?.role === 'owner' && <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => impersonate(u)} title="Sign in as this customer">
            <ShieldCheck className="h-3 w-3 mr-1" />View as customer
          </Button>}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditTarget(u)}>Edit</Button>
          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => deleteUser(u)}>Delete</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => toggle(u)}>
            {u.isActive ? 'Disable' : 'Enable'}
          </Button>
        </>
      )}
      {u.role !== 'customer' && auth.user?.role === 'owner' && u.id !== auth.user?.id && (
        <>
          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => deleteUser(u)}>Delete</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => toggle(u)}>
            {u.isActive ? 'Disable' : 'Enable'}
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-slate-900 text-lg">User Management</div>
          <div className="text-sm text-slate-500">Customer & admin accounts · {users.length} on this page</div>
        </div>
        <div className="relative w-full sm:w-80"><Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name, email, phone, company..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="hidden md:block"><Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">RFQs</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Last Login</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-slate-500">{u.companyName || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-700">{u.email}</div>
                  <div className="text-xs text-slate-500">{u.phone || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={isStaff(u) ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{u.rfqCount}</td>
                <td className="px-4 py-3">
                  <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3 text-right">
                  {userActions(u, "inline-flex gap-1")}
                </td>
              </tr>
            ))}
            {!users.length && !userList.loading && !userList.error && <tr><td colSpan="7" className="p-10 text-center text-slate-500">No users found.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card></div>
      <div className="md:hidden space-y-3">
        {users.map(u => (
          <Card key={u.id}><CardContent className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-slate-500">{u.companyName || '—'}</div>
              </div>
              <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
            </div>
            <div className="text-sm text-slate-700 break-words">{u.email}</div>
            <div className="text-xs text-slate-500">{u.phone || '—'}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <Badge className={isStaff(u) ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}>{u.role}</Badge>
              <span>{u.rfqCount} RFQs</span>
              <span>Last login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</span>
            </div>
            {userActions(u, "flex flex-wrap gap-2 pt-1")}
          </CardContent></Card>
        ))}
        {!users.length && !userList.loading && !userList.error && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">No users found.</div>}
      </div>
      <ListPager list={userList} label="Users" />
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}><DialogContent><DialogHeader><DialogTitle>Edit customer details</DialogTitle></DialogHeader>{editTarget && <form onSubmit={saveCustomer} className="space-y-3">{[['firstName','First name'],['lastName','Last name'],['companyName','Company'],['phone','Phone']].map(([key,label]) => <label key={key} className="block text-sm">{label}<Input value={editTarget[key] || ''} onChange={e => setEditTarget({ ...editTarget, [key]: e.target.value })} /></label>)}<p className="text-sm text-slate-500">Email and staff access cannot be changed here.</p><Button type="submit">Save customer</Button></form>}</DialogContent></Dialog>
    </div>
  )
}

// ============== RFQ WIZARD ==============
function RfqWizard({ setRoute, prefill, auth }) {
  const [step, setStep] = useState(1)
  const [gearType, setGearType] = useState(prefill?.gearType || '')
  const [specs, setSpecs] = useState(prefill?.specifications || {})
  const [general, setGeneral] = useState(prefill?.general || {})
  const [files, setFiles] = useState([])
  const [customer, setCustomer] = useState(prefill?.customer || (auth.user ? { companyName: auth.user.companyName, firstName: auth.user.firstName, lastName: auth.user.lastName, email: auth.user.email, phone: auth.user.phone } : {}))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitInFlight = useRef(false)
  const submission = useRef(null)
  const [submitted, setSubmitted] = useState(null)
  const specFields = SPEC_FIELDS[specGroup(gearType)]

  async function handleFiles(e) {
    const picked = Array.from(e.target.files || [])
    if (files.length + picked.length > 5 || [...files, ...picked].reduce((sum, f) => sum + f.size, 0) > 2_500_000) { toast.error('Select up to five files with a combined size under 2.5 MB'); e.target.value = ''; return }
    try {
      const added = await Promise.all(picked.map(async file => {
        const reader = new FileReader()
        let dataUrl = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('File could not be read')); reader.readAsDataURL(file) })
        if (!['application/pdf','image/png','image/jpeg'].includes(file.type)) dataUrl = dataUrl.replace(/^data:[^;]*;/, 'data:application/octet-stream;')
        return { name: file.name, type: file.type, size: file.size, dataUrl }
      }))
      setFiles(prev => [...prev, ...added])
    } catch (error) { toast.error(error.message) }
    e.target.value = ''
  }
  async function submit() {
    if (submitInFlight.current) return
    submitInFlight.current = true
    const fingerprint = JSON.stringify({ gearType, specs, general, files, customer, notes })
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() }
    setSubmitting(true)
    try {
      let savedFiles = []
      if (files.length) {
        const r = await api().post('/api/upload', { files }, submission.current.key); if (r.error) { toast.error(r.error); return }
        savedFiles = r.files || []
      }
      const r = await api().post('/api/rfq', { gearType, specifications: specs, general, files: savedFiles, customer: { ...customer, email: (customer.email || '').toLowerCase() }, notes }, submission.current.key)
      if (r.success) { setSubmitted(r.rfq); toast.success(`RFQ ${r.rfq.rfqNumber} submitted`) } else toast.error(r.error || 'Failed')
    } catch (e) { toast.error(e.message) } finally { submitInFlight.current = false; setSubmitting(false) }
  }
  const canNext = () => step === 1 ? !!gearType : step === 3 ? Number.isFinite(Number(general.quantity)) && Number(general.quantity) > 0 : step === 5 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || '') && customer.firstName && customer.lastName : true

  if (submitted) return (
    <div className="bg-[#f2f6f8] min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex rounded-full p-5 mb-8 text-white shadow-[0_15px_50px_-12px_rgba(34,211,238,0.55)]" style={{ background: 'linear-gradient(135deg,#a5f3fc,#22d3ee 50%,#0e7490)' }}>
          <CheckCircle2 className="h-14 w-14" />
        </motion.div>
        <div className="font-tech text-[11px] uppercase tracking-[0.4em] text-cyan-600 mb-4">{'// RFQ submitted'}</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">Thank you.</h1>
        <p className="text-slate-500 mb-2">Your RFQ number</p>
        <div className="font-display text-4xl font-bold tracking-wide mb-6"><span className="text-servo">{submitted.rfqNumber}</span></div>
        <p className="text-slate-600 mb-4 max-w-lg mx-auto leading-relaxed">Our engineering team will review your request and reach out to <strong className="text-slate-900">{submitted.customer.email}</strong> with the next steps. Track its progress in your portal.</p>
        <p role="status" className="text-sm text-slate-500 mb-10 max-w-lg mx-auto">{submitted.receiptEmailStatus==='accepted'?'Your confirmation email has been submitted for delivery. Check your inbox and spam folder.':'Your request is safely saved, but the confirmation email could not be sent. There is no need to submit your request again.'}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => setRoute('portal')} className="btn-servo rounded-full h-12 px-8 font-tech uppercase tracking-[0.18em] text-sm">View in Portal</Button>
          <Button variant="outline" onClick={() => setRoute('home')} className="rounded-full h-12 px-8 bg-white">Back to Home</Button>
        </div>
      </div>
    </div>
  )

  const steps = ['Gear Type','Specifications','Quantity','Drawings','Customer','Review']
  const stepTitles = ['What are we cutting?', `${gearType || 'Your'} specifications`, 'Quantity & manufacturing', 'Your drawings', 'Where do we send the quote?', 'Review & submit']
  const stepSubs = [
    'Choose the gear family closest to your part.',
    'Fill in what you know — leave the rest blank.',
    'How many, from what material, and by when.',
    'PDF, STEP, DXF, DWG, JPG or PNG. Up to five files, 2.5 MB combined.',
    'So our engineers can reach you with the quote.',
    'One last look before it hits our shop floor.',
  ]
  return (
    <div className="bg-[#f2f6f8] min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="font-tech text-[11px] uppercase tracking-[0.4em] text-cyan-600 mb-4">{'// Request for quote'}</div>
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-slate-900">Request a Quote</h1>
            <p className="text-slate-500 mt-4 text-lg font-light">Six quick steps. Fill in only what you know.</p>
          </div>
          <div className="mb-12">
            <div className="flex gap-1.5 mb-4" aria-hidden>
              {steps.map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? '' : 'bg-slate-200'}`}
                  style={i + 1 <= step ? { background: 'linear-gradient(90deg,#a5f3fc,#22d3ee 55%,#0e7490)' } : {}} />
              ))}
            </div>
            <div className="flex justify-between gap-1">
              {steps.map((s, i) => (
                <div key={s} className={`font-tech text-[10px] uppercase tracking-[0.12em] text-center flex-1 ${i + 1 === step ? 'text-slate-900 font-bold' : i + 1 < step ? 'text-cyan-600' : 'text-slate-400'} ${i + 1 !== step ? 'hidden sm:block' : ''}`}>{i + 1}. {s}</div>
              ))}
            </div>
          </div>
        </FadeIn>
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="border-0 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.18)] rounded-[1.75rem] overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="font-tech text-[11px] uppercase tracking-[0.3em] text-cyan-600 mb-3">Step {step} of 6</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">{stepTitles[step - 1]}</h2>
              <p className="text-slate-500 font-light mb-8">{stepSubs[step - 1]}</p>
              {step === 1 && <div><Label className="text-slate-900 font-medium">Gear Type</Label>
                <Select value={gearType} onValueChange={setGearType}><SelectTrigger className="w-full mt-1.5 h-12 rounded-xl"><SelectValue placeholder="Choose..." /></SelectTrigger><SelectContent>{GEAR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>}
              {step === 2 && <div>
                <div className="grid md:grid-cols-2 gap-4">{specFields.map(f => (
                  <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}><Label className="text-slate-900 font-medium">{f.label}</Label>
                    {f.type === 'select' ? <Select value={specs[f.key] || ''} onValueChange={v => setSpecs({ ...specs, [f.key]: v })}><SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                    : f.type === 'textarea' ? <Textarea className="mt-1.5 rounded-xl" rows={3} value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />
                    : <Input className="mt-1.5 h-12 rounded-xl" value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />}
                  </div>
                ))}</div>
              </div>}
              {step === 3 && <div>
                <div className="grid md:grid-cols-2 gap-4">{[
                  ['partName','Part Name'],['partNumber','Part Number'],['quantity','Quantity'],['material','Material'],
                  ['heatTreatment','Heat Treatment'],['hardness','Hardness (HRC)'],['drawingNumber','Drawing Number'],['revision','Revision'],
                  ['deliveryDate','Required Delivery Date','date'],['application','Application'],['annualQuantity','Annual Quantity']
                ].map(([k, l, t]) => <div key={k}><Label className="text-slate-900 font-medium">{l}</Label><Input type={t || 'text'} className="mt-1.5 h-12 rounded-xl" value={general[k] || ''} onChange={e => setGeneral({ ...general, [k]: e.target.value })} /></div>)}
                  <div><Label className="text-slate-900 font-medium">Prototype or Production</Label>
                    <Select value={general.protoOrProd || ''} onValueChange={v => setGeneral({ ...general, protoOrProd: v })}><SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Prototype">Prototype</SelectItem><SelectItem value="Production">Production</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent></Select>
                  </div>
                  <div className="md:col-span-2"><Label className="text-slate-900 font-medium">Notes</Label><Textarea className="mt-1.5 rounded-xl" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
                </div>
              </div>}
              {step === 4 && <div>
                <label className="block border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/40 transition bg-slate-50/60">
                  <div className="inline-flex bg-white rounded-2xl p-4 shadow-sm mb-4"><Upload className="h-8 w-8 text-cyan-500" /></div>
                  <div className="font-display font-bold text-xl text-slate-900">Click to upload</div>
                  <div className="text-sm text-slate-500 mt-1">PDF, STEP, STP, DXF, DWG, JPG, PNG</div>
                  <div className="text-xs text-slate-400 mt-1">Up to five files, 2.5 MB combined</div>
                  <input type="file" multiple className="hidden" accept=".pdf,.step,.stp,.dxf,.dwg,.jpg,.jpeg,.png" onChange={handleFiles} />
                </label>
                {files.length > 0 && <div className="mt-4 space-y-2">{files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0"><div className="bg-cyan-100 rounded-xl p-2"><FileText className="h-5 w-5 text-cyan-600" /></div><div className="min-w-0"><div className="font-medium truncate text-slate-900">{f.name}</div><div className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</div></div></div>
                    <Button size="sm" variant="ghost" onClick={() => setFiles(prev => prev.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}</div>}
              </div>}
              {step === 5 && <div>
                <div className="grid md:grid-cols-2 gap-4">{[
                  ['companyName','Company'],['firstName','First Name *'],['lastName','Last Name *'],['email','Email *','email'],
                  ['phone','Phone','tel'],['country','Country'],['address','Address'],['city','City'],['state','State'],['zip','Zip Code']
                ].map(([k, l, t]) => <div key={k}><Label className="text-slate-900 font-medium">{l}</Label><Input type={t || 'text'} className="mt-1.5 h-12 rounded-xl" value={customer[k] || ''} onChange={e => setCustomer({ ...customer, [k]: e.target.value })} /></div>)}</div>
              </div>}
              {step === 6 && <div><div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><div className="font-tech text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-2">Customer</div><div className="font-semibold text-slate-900">{customer.firstName} {customer.lastName} — {customer.companyName}</div><div className="text-slate-600">{customer.email} · {customer.phone}</div></div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><div className="font-tech text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-2">Gear</div><div className="font-semibold text-slate-900">{gearType}</div></div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><div className="font-tech text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-2">Specifications</div><div className="grid grid-cols-2 gap-x-6 gap-y-1">{Object.entries(specs).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{specFields.find(f => f.key === k)?.label || k}:</span> <span className="text-slate-900">{v}</span></div>)}</div></div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><div className="font-tech text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-2">General</div>{Object.entries(general).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> <span className="text-slate-900">{v}</span></div>)}</div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><div className="font-tech text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-2">Drawings ({files.length})</div>{files.length ? <ul className="list-disc list-inside text-slate-900">{files.map((f, i) => <li key={i}>{f.name}</li>)}</ul> : <div className="text-slate-500">None</div>}</div>
              </div></div>}
            </CardContent></Card>
        </motion.div>
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="rounded-full h-12 px-7 bg-white"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          {step < 6
            ? <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-slate-900 hover:bg-slate-800 rounded-full h-12 px-8 font-semibold">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            : <Button onClick={submit} disabled={submitting} className="btn-servo rounded-full h-12 px-8 font-tech uppercase tracking-[0.18em] text-sm">{submitting ? 'Submitting...' : 'Submit RFQ'} <Send className="h-4 w-4 ml-1" /></Button>}
        </div>
      </div>
    </div>
  )
}

// ============== PDF GENERATION ==============
async function generateQuotePDF(rfq, cms) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const p = rfq.pricing || {}
  const c = cms || {}
  // Header band
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 38, 'F')
  doc.setTextColor(251, 191, 36)
  doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.text(c.companyName || 'Vijaya Engineering Works', 15, 20)
  doc.setTextColor(203, 213, 225); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('VEW · Precision Gear Manufacturing', 15, 27)
  doc.text(c.address || '', 15, 32)
  doc.setTextColor(251, 191, 36); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 195, 20, { align: 'right' })
  doc.setTextColor(203, 213, 225); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`RFQ #: ${rfq.rfqNumber}`, 195, 27, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 195, 32, { align: 'right' })

  let y = 50
  doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 15, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text(`${rfq.customer?.firstName || ''} ${rfq.customer?.lastName || ''}`, 15, y); y += 5
  doc.text(rfq.customer?.companyName || '', 15, y); y += 5
  doc.text(rfq.customer?.email || '', 15, y); y += 5
  doc.text(rfq.customer?.phone || '', 15, y); y += 10

  doc.setFont('helvetica', 'bold'); doc.text('Part Details:', 15, y); y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Gear Type: ${rfq.gearType}`, 15, y); y += 5
  doc.text(`Part: ${rfq.general?.partName || '—'}`, 15, y); y += 5
  doc.text(`Part #: ${rfq.general?.partNumber || '—'}`, 15, y); y += 5
  doc.text(`Material: ${rfq.general?.material || '—'}`, 15, y); y += 10

  // Pricing table
  doc.setFillColor(15, 23, 42); doc.rect(15, y, 180, 8, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Description', 20, y + 5.5); doc.text('Qty', 130, y + 5.5); doc.text('Unit', 150, y + 5.5); doc.text('Total', 190, y + 5.5, { align: 'right' })
  y += 8
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'normal')
  const rows = [
    [`${rfq.gearType} - ${rfq.general?.partName || 'Custom Part'}`, p.quantity || '—', `$${p.unitPrice || 0}`, `$${((parseFloat(p.unitPrice) || 0) * (parseFloat(p.quantity) || 0)).toFixed(2)}`],
    ['Tooling', '', '', `$${p.tooling || 0}`],
    ['Engineering', '', '', `$${p.engineering || 0}`],
    ['Shipping', '', '', `$${p.shipping || 0}`],
    ['Tax', '', '', `$${p.tax || 0}`],
  ]
  rows.forEach(r => { y += 8; doc.text(String(r[0]), 20, y); doc.text(String(r[1]), 130, y); doc.text(String(r[2]), 150, y); doc.text(String(r[3]), 190, y, { align: 'right' }) })
  y += 4; doc.setDrawColor(15, 23, 42); doc.line(15, y, 195, y); y += 8
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('TOTAL:', 150, y); doc.text(`$${(Number(p.total) || 0).toFixed(2)}`, 190, y, { align: 'right' })
  y += 15

  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Lead Time: ${rfq.leadTime || 'TBD'}`, 15, y); y += 5
  doc.text(`Payment Terms: ${p.paymentTerms || 'Net 30'}`, 15, y); y += 5
  doc.text(`Quote Validity: ${p.validity || '30 days'}`, 15, y); y += 15

  doc.setFontSize(9); doc.setTextColor(100, 116, 139)
  doc.text('Thank you for your business. Please contact us with any questions.', 15, 280)
  doc.text(`${c.email || ''} · ${c.phone || ''}`, 15, 285)

  doc.save(`Quote-${rfq.rfqNumber}.pdf`)
}

// ============== CUSTOMER PORTAL ==============
function CustomerPortal({ auth, setRoute }) {
  const rfqList = usePagedList('/api/rfq', 'rfqs', auth.user?.id, true)
  const rfqs = rfqList.items, load = rfqList.refresh, loading = rfqList.loading, loadError = rfqList.error
  const [selected, setSelected] = useState(null)

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="font-tech text-[11px] uppercase tracking-[0.32em] text-cyan-600 mb-3">{'// Customer portal'}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Your RFQs & Orders</h1>
          <p className="text-slate-500 mt-2">Signed in as {auth.user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button onClick={() => setRoute('rfq')} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-full">New RFQ</Button>
        </div>
      </div>
      <CompanyOrders auth={auth} />
      <h2 className="font-display text-2xl font-bold mb-4 tracking-tight text-slate-900">Your individual RFQs</h2>
      <ListPager list={rfqList} label="Your RFQs" />
      {loadError && <p role="alert" className="mb-4 text-red-700">{loadError}. Use Refresh to try again.</p>}
      {loading && !rfqs.length ? <div role="status">Loading...</div> : rfqs.length === 0 && !loadError ? (
        <Card className="rounded-3xl border-dashed border-2"><CardContent className="p-16 text-center">
          <div className="inline-flex bg-cyan-100 text-cyan-600 rounded-2xl p-4 mb-4"><ClipboardList className="h-8 w-8" /></div>
          <div className="font-display text-2xl font-bold text-slate-900 mb-2">No RFQs yet</div>
          <p className="text-slate-500 mb-6">Tell us what you need cut — it takes about two minutes.</p>
          <Button onClick={() => setRoute('rfq')} className="btn-servo rounded-full h-11 px-7 font-tech uppercase tracking-[0.18em] text-xs">Submit your first RFQ</Button>
        </CardContent></Card>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-3">
          {rfqs.map(r => (
            <motion.div key={r.id} variants={fadeUp}>
              <Card className="cursor-pointer rounded-2xl border-slate-200/80 hover:border-cyan-400 hover:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.18)] transition-all" onClick={() => setSelected(r)}>
                <CardContent className="p-5">
                  <div className="grid md:grid-cols-6 gap-3 items-center mb-3">
                    <div className="md:col-span-2"><div className="font-bold text-slate-900">{r.rfqNumber}</div><div className="text-sm text-slate-600">{r.general?.partName || 'Untitled part'}</div></div>
                    <div className="text-sm"><div className="text-slate-500 text-xs">Gear</div>{r.gearType}</div>
                    <div className="text-sm"><div className="text-slate-500 text-xs">Qty</div>{r.general?.quantity || '—'}</div>
                    <div className="text-sm"><div className="text-slate-500 text-xs">Submitted</div>{new Date(r.createdAt).toLocaleDateString()}</div>
                    <div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
                  </div>
                  {r.productionStages && (
                    <div className="border-t pt-3 mt-2">
                      <div className="text-xs text-slate-500 mb-2">Production Progress</div>
                      <ProductionTracker stages={r.productionStages} canEdit={false} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      <RfqDetailDialog rfq={selected} onClose={() => setSelected(null)} onUpdated={load} auth={auth} />
    </div>
  )
}

// ============== RFQ DETAIL DIALOG ==============
function RfqDetailDialog({ rfq, onClose, onUpdated, auth, asAdmin, cms }) {
  const [current, setCurrent] = useState(rfq)
  const [msgText, setMsgText] = useState('')
  const [newStatus, setNewStatus] = useState(rfq?.status || '')
  const [internalNotes, setInternalNotes] = useState(rfq?.internalNotes || '')
  const [pricing, setPricing] = useState(rfq?.pricing || { unitPrice: '', quantity: '', tooling: '', engineering: '', shipping: '', tax: '', total: 0, paymentTerms: 'Net 30', validity: '30 days' })
  const [leadTime, setLeadTime] = useState(rfq?.leadTime || '')

  useEffect(() => {
    setCurrent(rfq); setNewStatus(rfq?.status || ''); setInternalNotes(rfq?.internalNotes || '')
    setPricing(rfq?.pricing || { unitPrice: '', quantity: rfq?.general?.quantity || '', tooling: '', engineering: '', shipping: '', tax: '', total: 0, paymentTerms: 'Net 30', validity: '30 days' })
    setLeadTime(rfq?.leadTime || '')
  }, [rfq])

  if (!current) return null

  async function refresh() {
    const d = await api().get(`/api/rfq/${current.id}`); if (d.error) return
    if (d.rfq) setCurrent(d.rfq); onUpdated && onUpdated()
  }
  async function sendMessage() {
    if (!msgText.trim()) return
    const result = await api().post(`/api/rfq/${current.id}/messages`, { text: msgText }); if (result.error) return
    setMsgText(''); refresh()
  }
  function calcTotal(p) {
    return (parseFloat(p.unitPrice) || 0) * (parseFloat(p.quantity) || 0) + (parseFloat(p.tooling) || 0) + (parseFloat(p.engineering) || 0) + (parseFloat(p.shipping) || 0) + (parseFloat(p.tax) || 0)
  }
  async function saveAdmin() {
    const total = calcTotal(pricing)
    const result = await api().patch(`/api/rfq/${current.id}`, { status: newStatus, internalNotes, pricing: { ...pricing, total }, leadTime }); if (result.error) return
    toast.success('RFQ updated')
    refresh()
  }
  async function updateStage(stageId, status) {
    const result = await api().patch(`/api/rfq/${current.id}/stage`, { stageId, status }); if (result.error) return
    toast.success('Stage updated')
    refresh()
  }
  async function downloadFile(f) {
    const d = await api().get(`/api/files/${f.id}`)
    if (d.error) return
    const a = document.createElement('a'); a.href = d.dataUrl; a.download = d.name; a.click()
  }

  return (
    <Dialog open={!!current} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>{current.rfqNumber}</span>
            <Badge className={STATUS_COLORS[current.status]}>{current.status}</Badge>
            <span className="text-sm font-normal text-slate-500">· {current.gearType}</span>
          </DialogTitle>
          <DialogDescription>Review request details, drawings, messages and production progress.</DialogDescription>
        </DialogHeader>

        {/* PRODUCTION TRACKER */}
        <div className="bg-slate-50 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="font-semibold text-slate-900">Production Progress</div>
            {asAdmin && <StageManager rfqId={current.id} stages={current.productionStages || []} auth={auth} onChange={refresh} />}
          </div>
          <ProductionTracker stages={current.productionStages} canEdit={asAdmin} onUpdate={updateStage} />
        </div>

        <Tabs defaultValue="details">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages ({current.messages?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {asAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>
          <TabsContent value="details" className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <Card><CardContent className="p-4"><div className="font-semibold mb-2">Customer</div>
                <div>{current.customer?.firstName} {current.customer?.lastName}</div>
                <div className="text-slate-600">{current.customer?.companyName}</div>
                <div className="text-slate-600">{current.customer?.email} · {current.customer?.phone}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4"><div className="font-semibold mb-2">Part Info</div>
                <div><b>Part:</b> {current.general?.partName || '—'}</div>
                <div><b>Part #:</b> {current.general?.partNumber || '—'}</div>
                <div><b>Qty:</b> {current.general?.quantity || '—'}</div>
                <div><b>Material:</b> {current.general?.material || '—'}</div>
              </CardContent></Card>
            </div>
            <Card><CardContent className="p-4 text-sm"><div className="font-semibold mb-2">Specifications</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">{Object.entries(current.specifications || {}).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> {v}</div>)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4"><div className="font-semibold mb-2">Drawings</div>
              <div className="space-y-2">{(current.files || []).map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 text-cyan-500 shrink-0" /><span className="truncate">{f.name}</span></div>
                  <Button size="sm" variant="ghost" onClick={() => downloadFile(f)}><Download className="h-4 w-4" /></Button>
                </div>
              ))}{!current.files?.length && <div className="text-slate-500 text-sm">No drawings</div>}</div>
            </CardContent></Card>
            {current.pricing?.total > 0 && (
              <Card className="border-cyan-500"><CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-cyan-700">Quote</div>
                  <Button size="sm" onClick={() => generateQuotePDF(current, cms)} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-full">
                    <FileDown className="h-4 w-4 mr-1" /> Download PDF
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div>Unit Price: ${current.pricing.unitPrice}</div><div>Quantity: {current.pricing.quantity}</div>
                  <div>Tooling: ${current.pricing.tooling || 0}</div><div>Engineering: ${current.pricing.engineering || 0}</div>
                  <div>Shipping: ${current.pricing.shipping || 0}</div><div>Tax: ${current.pricing.tax || 0}</div>
                  <div className="col-span-2 font-bold text-lg mt-2">Total: ${Number(current.pricing.total).toFixed(2)}</div>
                  <div>Lead Time: {current.leadTime}</div><div>Terms: {current.pricing.paymentTerms}</div>
                </div>
              </CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="messages">
            <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
              {(current.messages || []).map(m => (
                <div key={m.id} className={`p-3 rounded ${m.from === 'admin' ? 'bg-cyan-50 border-l-4 border-cyan-500' : 'bg-slate-100'}`}>
                  <div className="text-xs text-slate-500 mb-1">{m.author} · {new Date(m.at).toLocaleString()}</div>
                  <div>{m.text}</div>
                </div>
              ))}{!current.messages?.length && <div className="text-slate-500 text-sm">No messages.</div>}
            </div>
            <div className="flex gap-2"><Input placeholder="Type a message..." value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} /><Button onClick={sendMessage}><Send className="h-4 w-4" /></Button></div>
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-2">{(current.statusHistory || []).map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <Badge className={STATUS_COLORS[h.status]}>{h.status}</Badge>
                <span className="text-sm text-slate-600">{new Date(h.at).toLocaleString()}</span>
                {h.note && <span className="text-sm text-slate-500">— {h.note}</span>}
              </div>
            ))}</div>
          </TabsContent>
          {asAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <div><Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{RFQ_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Lead Time</Label><Input value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 6-8 weeks" /></div>
              <div><Label>Internal Notes</Label><Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} /></div>
              <Card><CardContent className="p-4">
                <div className="font-semibold mb-3">Quote Pricing</div>
                <div className="grid grid-cols-2 gap-3">{[['unitPrice','Unit Price ($)'],['quantity','Quantity'],['tooling','Tooling ($)'],['engineering','Engineering ($)'],['shipping','Shipping ($)'],['tax','Tax ($)'],['paymentTerms','Payment Terms'],['validity','Quote Validity']].map(([k, l]) => <div key={k}><Label>{l}</Label><Input value={pricing[k] || ''} onChange={e => setPricing({ ...pricing, [k]: e.target.value })} /></div>)}</div>
                <div className="mt-3 text-right font-bold text-lg">Total: ${calcTotal(pricing).toFixed(2)}</div>
              </CardContent></Card>
              <div className="flex gap-2">
                <Button onClick={saveAdmin} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-full">Save changes</Button>
                <Button onClick={() => generateQuotePDF(current, cms)} variant="outline" className="rounded-full"><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
        <DialogFooter>{asAdmin && <Button variant="destructive" onClick={async () => {
          if (!window.confirm(`Delete ${current.rfqNumber}? It will be removed from active lists; its history will be retained.`)) return
          const result = await api().delete(`/api/rfq/${current.id}`)
          if (!result.error) { toast.success('RFQ removed'); onClose(); onUpdated?.() }
        }}>Delete RFQ</Button>}<Button variant="outline" onClick={onClose} className="rounded-full">Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== STAGE MANAGER (admin) ==============
function StageManager({ rfqId, stages, auth, onChange }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(stages)
  const [newName, setNewName] = useState('')
  useEffect(() => { setList(stages) }, [stages])

  async function addStage() {
    if (!newName.trim()) return
    const r = await api().post(`/api/rfq/${rfqId}/stages`, { name: newName.trim() })
    if (r.success) { toast.success(`Added "${newName}"`); setNewName(''); onChange() }
    else toast.error(r.error)
  }
  async function renameStage(sid, name) {
    const r = await api().patch(`/api/rfq/${rfqId}/stages/${sid}`, { name })
    if (r.success) { toast.success('Renamed'); onChange() }
  }
  async function deleteStage(sid) {
    if (!confirm('Delete this stage?')) return
    const r = await api().delete(`/api/rfq/${rfqId}/stages/${sid}`)
    if (r.success) { toast.success('Stage removed'); onChange() }
  }
  async function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const order = [...list]
    ;[order[i], order[j]] = [order[j], order[i]]
    setList(order.map((s, k) => ({ ...s, sequence: k + 1 })))
    const r = await api().put(`/api/rfq/${rfqId}/stages/reorder`, { order: order.map(s => s.id) })
    if (r.error) setList(stages)
    if (r.success) onChange()
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="rounded-full"><Pencil className="h-3 w-3 mr-1" /> Manage stages</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Production Stages</DialogTitle>
            <DialogDescription>Add, rename, reorder, or remove stages for this specific RFQ.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {list.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-900 disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="text-slate-400 hover:text-slate-900 disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="text-xs text-slate-500 w-6">{s.sequence}.</div>
                <Input defaultValue={s.name} onBlur={e => e.target.value !== s.name && renameStage(s.id, e.target.value)} className="flex-1 h-8" />
                <Badge className={s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : s.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}>{s.status.replace('_', ' ')}</Badge>
                <Button size="sm" variant="ghost" onClick={() => deleteStage(s.id)} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t">
            <Input placeholder="New stage name (e.g. Deburring)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStage()} />
            <Button onClick={addStage} className="bg-slate-900 hover:bg-slate-800 rounded-full"><UserPlus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============== ADMIN DASHBOARD ==============
function AdminDashboard({ auth, cms, reloadCms }) {
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const rfqList = usePagedList(`/api/rfq?q=${encodeURIComponent(query)}&filter=${filter}`, 'rfqs', auth.user?.id, true)
  const rfqs = rfqList.items
  const [tab, setTab] = useState('rfqs')
  const loadStats = async () => {
    const s = await api().get('/api/admin/stats'); if (!s.error) setStats(s)
  }
  const load = () => Promise.all([rfqList.refresh(), loadStats()])
  useEffect(() => { loadStats(); const i = setInterval(() => { if (document.visibilityState === 'visible') loadStats() }, 30000); return () => clearInterval(i) }, [])

  const filtered = rfqs.filter(r => {
    if (query && !JSON.stringify(r).toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'new') return r.status === 'Submitted'
    if (filter === 'review') return ['Under Review','Engineering Review','Need More Information'].includes(r.status)
    if (filter === 'quotes') return ['Quote Prepared','Quote Sent'].includes(r.status)
    if (filter === 'production') return ['Customer Approved','Order Confirmed','In Production','Quality Inspection'].includes(r.status)
    if (filter === 'completed') return r.status === 'Completed'
    return true
  })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="font-tech text-[11px] uppercase tracking-[0.32em] text-cyan-600 mb-3">{'// Admin console'}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        </div>
        <Button variant="outline" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="rfqs">RFQs</TabsTrigger><TabsTrigger value="orders">Bulk Orders</TabsTrigger><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="companies">Companies</TabsTrigger><TabsTrigger value="cms">Content Editor</TabsTrigger>{auth.user?.role === 'owner' && <TabsTrigger value="managers">Managers</TabsTrigger>}</TabsList>
        <TabsContent value="rfqs">
          <ListPager list={rfqList} label="RFQs" />
          {stats && <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              ['This Month', stats.thisMonth, TrendingUp], ['Total RFQs', stats.total, ClipboardList],
              ['Quotes Sent', stats.quotesSent, Send], ['In Production', stats.inProduction, Factory],
              ['Total Value', '$' + (stats.totalValue || 0).toLocaleString(), Award]
            ].map(([l, v, Icon]) => (
              <motion.div key={l} variants={fadeUp}><Card className="rounded-2xl hover:border-cyan-400 hover:shadow-[0_14px_35px_-16px_rgba(0,0,0,0.2)] transition-all"><CardContent className="p-5">
                <div className="flex items-center justify-between mb-1"><div className="text-xs text-slate-500 uppercase">{l}</div><Icon className="h-4 w-4 text-cyan-500" /></div>
                <div className="text-2xl font-bold text-slate-900">{v}</div>
              </CardContent></Card></motion.div>
            ))}
          </motion.div>}
          {stats?.stageCounts && Object.values(stats.stageCounts).some(v => v > 0) && (
            <Card className="mb-6"><CardContent className="p-4">
              <div className="font-semibold mb-3">Active Production Stages</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {PRODUCTION_STAGES.map(s => (
                  <div key={s.name} className="p-2 bg-slate-50 rounded flex items-center justify-between">
                    <span className="text-xs text-slate-700">{s.name}</span>
                    <Badge className={stats.stageCounts[s.name] ? 'bg-cyan-500 text-white' : 'bg-slate-200'}>{stats.stageCounts[s.name] || 0}</Badge>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]"><Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" /><Input className="pl-9" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} /></div>
            <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All RFQs</SelectItem><SelectItem value="new">New</SelectItem>
              <SelectItem value="review">Under Review</SelectItem><SelectItem value="quotes">Quotes</SelectItem>
              <SelectItem value="production">Production</SelectItem><SelectItem value="completed">Completed</SelectItem>
            </SelectContent></Select>
          </div>
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-3">
            {filtered.map(r => (
              <motion.div key={r.id} variants={fadeUp}><Card className="cursor-pointer rounded-2xl hover:border-cyan-400 hover:shadow-[0_14px_35px_-16px_rgba(0,0,0,0.18)] transition-all" onClick={() => setSelected(r)}>
                <CardContent className="p-4 grid md:grid-cols-7 gap-2 items-center">
                  <div className="md:col-span-2"><div className="font-bold text-slate-900">{r.rfqNumber}</div><div className="text-xs text-slate-600">{r.customer?.companyName} — {r.customer?.firstName} {r.customer?.lastName}</div></div>
                  <div className="text-sm">{r.gearType}</div>
                  <div className="text-sm">{r.general?.partName || '—'}</div>
                  <div className="text-sm">Qty: {r.general?.quantity || '—'}</div>
                  <div className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                  <div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
                </CardContent>
              </Card></motion.div>
            ))}
            {!filtered.length && <Card><CardContent className="p-12 text-center text-slate-500">No RFQs match.</CardContent></Card>}
          </motion.div>
        </TabsContent>
        <TabsContent value="orders"><CompanyOrders auth={auth} staff /></TabsContent>
        <TabsContent value="companies"><CompanyManagement auth={auth} /></TabsContent>
        {auth.user?.role === 'owner' && <TabsContent value="managers"><ManagerManagement auth={auth} /></TabsContent>}
        <TabsContent value="cms"><CmsEditor auth={auth} cms={cms} reloadCms={reloadCms} /></TabsContent>
        <TabsContent value="users"><UserManagement auth={auth} onImpersonate={() => window.dispatchEvent(new CustomEvent('exitAdmin'))} /></TabsContent>
      </Tabs>

      <RfqDetailDialog rfq={selected} onClose={() => setSelected(null)} onUpdated={load} auth={auth} asAdmin cms={cms} />
    </div>
  )
}

// ============== CMS EDITOR ==============
function CmsEditor({ auth, cms, reloadCms }) {
  const [form, setForm] = useState(cms || {})
  useEffect(() => { setForm(cms || {}) }, [cms])
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    const result = await api().patch('/api/cms', form)
    setSaving(false)
    if (result.error) return
    toast.success('Content updated')
    reloadCms()
    setSaving(false)
  }
  if (!form) return null
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-5 space-y-3">
        <div className="font-semibold text-slate-900 flex items-center gap-2"><Pencil className="h-4 w-4" /> Company Info</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Company Name</Label><Input value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={form.tagline || ''} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Business Hours</Label><Input value={form.hours || ''} onChange={e => setForm({ ...form, hours: e.target.value })} /></div>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-5 space-y-3">
        <div className="font-semibold text-slate-900">About Page</div>
        <div><Label>About Title</Label><Input value={form.aboutTitle || ''} onChange={e => setForm({ ...form, aboutTitle: e.target.value })} /></div>
        <div><Label>About Text</Label><Textarea value={form.aboutText || ''} onChange={e => setForm({ ...form, aboutText: e.target.value })} rows={6} /></div>
      </CardContent></Card>
      <Card><CardContent className="p-5 space-y-3">
        <div className="font-semibold text-slate-900">Product Descriptions</div>
        {PRODUCTS.map(p => (
          <div key={p.key}>
            <Label>{p.title}</Label>
            <Textarea rows={2} value={form.productDescriptions?.[p.key] || ''} onChange={e => setForm({ ...form, productDescriptions: { ...(form.productDescriptions || {}), [p.key]: e.target.value } })} />
          </div>
        ))}
      </CardContent></Card>
      <Button onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-800 rounded-full"><Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}</Button>
    </div>
  )
}

// ============== APP ==============
function App() {
  const auth = useAuth()
  const [route, setRoute] = useState('home')
  const [authAction, setAuthAction] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cms, setCms] = useState(null)
  const [cmsError, setCmsError] = useState('')
  const [signoutOpen, setSignoutOpen] = useState(false)

  const loadCms = async () => { const d = await api().get('/api/cms'); if (d.cms) { setCms(cleanContact(d.cms)); setCmsError('') } else setCmsError(d.error || 'Unable to load business information') }
  useEffect(() => { loadCms() }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
    const inviteToken = params.get('invite')
    if (inviteToken) window.history.replaceState({}, '', window.location.pathname)
    if (inviteToken) { setAuthAction({ type: 'invite', token: inviteToken }); setRoute('invite') }
  }, [])

  const clearAuthAction = () => {
    setAuthAction(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileOpen(false)
    const title = route.startsWith('product:') ? PRODUCTS.find(p => p.key === route.slice(8))?.title : pageTitles[route]
    document.title = `${title || 'Page not found'} | Vijaya Engineering Works`
  }, [route])
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  useEffect(() => {
    const h = () => setRoute('portal')
    window.addEventListener('exitAdmin', h)
    return () => window.removeEventListener('exitAdmin', h)
  }, [])

  async function confirmSignout() {
    const name = auth.user?.firstName || 'user'
    try { await auth.logout() } catch (error) { toast.error(error.message); return }
    setSignoutOpen(false)
    setRoute('home')
    toast.success(`You've been signed out, ${name}. See you soon!`, { duration: 4000 })
  }

  // Route guards
  const goRoute = (r) => {
    if (['portal','admin','rfq'].includes(r) && !auth.user) { setRoute('login'); return }
    if (r === 'admin' && !isStaff(auth.user)) { toast.error('Admin access required'); return }
    setRoute(r)
  }

  // Public pages render immediately — never block them on the session check.
  // Only account routes (login, portal, admin, rfq, invite) wait for auth.
  const isPublicRoute = route === 'home' || route === 'products' || route.startsWith('product:') || route === 'capabilities' || route === 'gallery' || route === 'about' || route === 'contact' || route === 'privacy' || route === 'terms'
  if (auth.loading && !isPublicRoute) return <div role="status" className="min-h-screen flex items-center justify-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" />Loading your account…</div>

  let content
  if (route === 'admin' && !isStaff(auth.user)) content = <LoginPage setRoute={goRoute} auth={auth} />
  else if (route === 'invite' && authAction?.type === 'invite') content = <CompanyInvitation token={authAction.token} auth={auth} onDone={() => { clearAuthAction(); setRoute('portal') }} onSignIn={() => { clearAuthAction(); setRoute('login') }} />
  else if (route === 'home') content = <HomePage setRoute={goRoute} cms={cms} />
  else if (route === 'products') content = <ProductsPage setRoute={goRoute} cms={cms} />
  else if (route.startsWith('product:')) content = <ProductDetail productKey={route.slice(8)} setRoute={goRoute} cms={cms} />
  else if (route === 'capabilities') content = <CapabilitiesPage />
  else if (route === 'gallery') content = <GalleryPage />
  else if (route === 'about') content = <AboutPage cms={cms} />
  else if (route === 'contact') content = <ContactPage cms={cms} setRoute={goRoute} />
  else if (route === 'privacy') content = <PrivacyPage cms={cms} />
  else if (route === 'terms') content = <TermsPage cms={cms} />
  else if (route === 'rfq') content = <RfqWizard setRoute={goRoute} auth={auth} />
  else if (route === 'login') content = <LoginPage setRoute={goRoute} auth={auth} />
  else if (route === 'portal') content = <CustomerPortal auth={auth} setRoute={goRoute} />
  else if (route === 'admin') content = <AdminDashboard auth={auth} cms={cms} reloadCms={loadCms} />
  else content = <HomePage setRoute={goRoute} cms={cms} />

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <Nav route={route.split(':')[0]} setRoute={goRoute} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={auth.user} onLogout={() => setSignoutOpen(true)} />
      <ImpersonationBanner user={auth.user} onExit={async () => { try { await auth.exitImpersonation(); setRoute('admin'); toast.success('Exited override — back to admin') } catch (error) { toast.error(error.message) } }} />
      <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>{content}</main>
      {cmsError && <div role="alert" className="mx-auto max-w-xl px-4 py-4 text-sm text-red-700">Some business details could not be loaded. <button className="underline" onClick={loadCms}>Try again</button></div>}
      <Footer setRoute={goRoute} cms={cms} />
      <CookieBanner setRoute={goRoute} />
      <Dialog open={signoutOpen} onOpenChange={setSignoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2"><div className="inline-flex bg-slate-100 rounded-full p-3"><LogOut className="h-8 w-8 text-slate-700" /></div></div>
            <DialogTitle className="text-center">Sign out of your account?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              You'll need to sign in again to view your RFQs and production tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" onClick={() => setSignoutOpen(false)} className="flex-1 rounded-full">Stay signed in</Button>
            <Button onClick={confirmSignout} className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-full">Sign Out</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App

