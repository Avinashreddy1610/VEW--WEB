'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Cog, Wrench, Factory, Ruler, ShieldCheck, Upload, FileText, Trash2, ArrowRight, ArrowLeft,
  CheckCircle2, Menu, X, Mail, Phone, MapPin, ClipboardList, LayoutDashboard, Search,
  Package, TrendingUp, Send, Download, RefreshCw, Building2, LogIn, LogOut, User, UserPlus,
  Circle, Loader2, Pencil, Save, FileDown, Sparkles, Boxes, ChevronRight,
  Hammer, Flame, Layers, Wind, Truck, Award, Zap
} from 'lucide-react'

// ============== IMAGES ==============
const HERO_IMG = 'https://images.unsplash.com/photo-1524514587686-e2909d726e9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_2 = 'https://images.unsplash.com/photo-1563641749712-028dfeab14b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_3 = 'https://images.unsplash.com/photo-1567093322102-6bdd32fba67d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_4 = 'https://images.unsplash.com/photo-1565954786194-d22abeaac3ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxnZWFyJTIwbWFudWZhY3R1cmluZ3xlbnwwfHx8YmxhY2t8MTc4ODQ4ODgxMnww&ixlib=rb-4.1.0&q=85'
const IMG_CNC = 'https://images.unsplash.com/photo-1652888510609-ed2d2ad64d6b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwzfHxDTkMlMjBtYWNoaW5lfGVufDB8fHxibGFja3wxNzg4NDg4ODE3fDA&ixlib=rb-4.1.0&q=85'
const IMG_CNC2 = 'https://images.unsplash.com/photo-1548683726-203119be6a39?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxDTkMlMjBtYWNoaW5lfGVufDB8fHxibGFja3wxNzg4NDg4ODE3fDA&ixlib=rb-4.1.0&q=85'
const GAL_1 = 'https://images.unsplash.com/photo-1606337321936-02d1b1a4d5ef?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000'
const GAL_2 = 'https://images.unsplash.com/photo-1705490899854-2e4b15a0c811?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000'
const GAL_3 = 'https://images.unsplash.com/photo-1585366958403-bacb4c36a1a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000'
const GAL_4 = 'https://images.unsplash.com/photo-1585366958113-e28e8e580d3a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000'
const GAL_5 = 'https://images.pexels.com/photos/7568421/pexels-photo-7568421.jpeg?auto=compress&cs=tinysrgb&w=1000'
const GALLERY = [GAL_1, GAL_2, GAL_3, GAL_4, GAL_5, IMG_2, IMG_3, IMG_4]

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
  'Need More Information':'bg-orange-100 text-orange-800','Quote Prepared':'bg-purple-100 text-purple-800','Quote Sent':'bg-purple-100 text-purple-800',
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
function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('vew_token') : null
    if (!t) { setLoading(false); return }
    setToken(t)
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { if (d.user) setUser(d.user); else localStorage.removeItem('vew_token') })
      .finally(() => setLoading(false))
  }, [])
  const login = async (identifier, password) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    localStorage.setItem('vew_token', d.token); setToken(d.token); setUser(d.user); return d.user
  }
  const signup = async (data) => {
    const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    localStorage.setItem('vew_token', d.token); setToken(d.token); setUser(d.user); return d.user
  }
  const impersonate = async (userId) => {
    const r = await fetch(`/api/admin/users/${userId}/impersonate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    // Stash original admin token for restore
    localStorage.setItem('vew_admin_token', token)
    localStorage.setItem('vew_token', d.token); setToken(d.token); setUser({ ...d.user, _impersonatedBy: 'admin' }); return d.user
  }
  const exitImpersonation = () => {
    const adminToken = localStorage.getItem('vew_admin_token')
    if (!adminToken) return
    localStorage.setItem('vew_token', adminToken)
    localStorage.removeItem('vew_admin_token')
    setToken(adminToken)
    // Re-fetch admin user
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json()).then(d => setUser(d.user))
  }
  const logout = () => { localStorage.removeItem('vew_token'); localStorage.removeItem('vew_admin_token'); setToken(null); setUser(null) }
  return { user, token, loading, login, signup, logout, impersonate, exitImpersonation }
}

function api(token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return {
    get: (u) => fetch(u, { headers: h }).then(r => r.json()),
    post: (u, body) => fetch(u, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(r => r.json()),
    patch: (u, body) => fetch(u, { method: 'PATCH', headers: h, body: JSON.stringify(body) }).then(r => r.json()),
  }
}

// ============== ANIMATION HELPERS ==============
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function FadeIn({ children, className = '', delay = 0 }) {
  return <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
    variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } } }}>{children}</motion.div>
}

// ============== GEAR LOGO ==============
function GearLogo({ className = 'h-8 w-8', spin = false }) {
  return <motion.div animate={spin ? { rotate: 360 } : {}} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
    <Cog className={className + ' text-amber-500'} strokeWidth={2.2} />
  </motion.div>
}

// ============== NAV ==============
function Nav({ route, setRoute, mobileOpen, setMobileOpen, user, onLogout }) {
  const links = [
    { key: 'home', label: 'Home' }, { key: 'products', label: 'Products' },
    { key: 'capabilities', label: 'Capabilities' }, { key: 'gallery', label: 'Gallery' },
    { key: 'about', label: 'About' }, { key: 'contact', label: 'Contact' },
  ]
  return (
    <motion.header initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setRoute('home')} className="flex items-center gap-2">
          <GearLogo spin />
          <div className="text-white text-left">
            <div className="font-bold tracking-tight leading-none">Vijaya Engineering Works</div>
            <div className="text-[10px] uppercase tracking-widest text-amber-400 leading-none mt-0.5">VEW · Precision Gears</div>
          </div>
        </button>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <button key={l.key} onClick={() => setRoute(l.key)}
              className={`px-3 py-2 text-sm rounded-md transition ${route === l.key ? 'text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>{l.label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setRoute(user.role === 'admin' ? 'admin' : 'portal')} className="text-slate-300 hover:text-white hover:bg-slate-800 hidden sm:inline-flex">
                <User className="h-4 w-4 mr-1" /> {user.firstName || user.fullName || 'Account'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-slate-400 hover:text-white hover:bg-slate-800"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setRoute('login')} className="text-slate-300 hover:text-white hover:bg-slate-800 hidden sm:inline-flex"><LogIn className="h-4 w-4 mr-1" /> Sign In</Button>
          )}
          <Button onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold hidden sm:inline-flex">Request a Quote</Button>
          <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="lg:hidden border-t border-slate-800 bg-slate-900 overflow-hidden">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {links.map(l => <button key={l.key} onClick={() => { setRoute(l.key); setMobileOpen(false) }} className={`px-3 py-2 text-left rounded-md ${route === l.key ? 'text-amber-400 bg-slate-800' : 'text-slate-300'}`}>{l.label}</button>)}
              {user ? <>
                <button onClick={() => { setRoute(user.role === 'admin' ? 'admin' : 'portal'); setMobileOpen(false) }} className="px-3 py-2 text-left text-slate-300">My Account</button>
                <button onClick={onLogout} className="px-3 py-2 text-left text-slate-300">Sign Out</button>
              </> : <button onClick={() => { setRoute('login'); setMobileOpen(false) }} className="px-3 py-2 text-left text-slate-300">Sign In</button>}
              <Button onClick={() => { setRoute('rfq'); setMobileOpen(false) }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold mt-2">Request a Quote</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function Footer({ setRoute, cms }) {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-24">
      <div className="container mx-auto px-4 py-14 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3"><GearLogo /><div className="text-white font-bold">{cms?.companyName || 'Vijaya Engineering Works'}</div></div>
          <p className="text-sm">Custom precision gear manufacturing from your drawings and specifications.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Products</div>
          <ul className="space-y-2 text-sm">{PRODUCTS.map(p => <li key={p.key}><button onClick={() => setRoute('product:' + p.key)} className="hover:text-amber-400">{p.title}</button></li>)}</ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setRoute('about')} className="hover:text-amber-400">About</button></li>
            <li><button onClick={() => setRoute('capabilities')} className="hover:text-amber-400">Capabilities</button></li>
            <li><button onClick={() => setRoute('gallery')} className="hover:text-amber-400">Gallery</button></li>
            <li><button onClick={() => setRoute('contact')} className="hover:text-amber-400">Contact</button></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {cms?.phone || '+91 98765 43210'}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {cms?.email || 'sales@vew.com'}</li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> {cms?.address || '15 Industrial Estate, Bangalore'}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs">© {new Date().getFullYear()} {cms?.companyName || 'Vijaya Engineering Works'}. All rights reserved.</div>
    </footer>
  )
}

// ============== HOME (Apple-style animations) ==============
function HomePage({ setRoute, cms }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  return (
    <div>
      {/* HERO */}
      <section ref={heroRef} className="relative bg-slate-950 text-white overflow-hidden min-h-[92vh] flex items-center">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900/40" />
        </motion.div>
        <motion.div aria-hidden style={{ y: heroY }} className="pointer-events-none absolute inset-0 flex items-center justify-end pr-4 md:pr-16 overflow-hidden">
          <span className="text-white/[0.035] font-black tracking-tighter select-none leading-none" style={{ fontSize: 'clamp(180px, 32vw, 520px)' }}>VEW</span>
        </motion.div>
        <motion.div style={{ opacity: heroOpacity }} className="relative container mx-auto px-4 max-w-5xl py-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 mb-6 hover:bg-amber-500/15 px-3 py-1.5">
              <Sparkles className="h-3 w-3 mr-1.5" /> {cms?.companyName || 'Vijaya Engineering Works'} · ISO 9001 · AGMA Q12
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.03em] leading-[0.95] mb-6">
            Precision Gears<br />
            Built to Your <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Specifications</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl font-light leading-relaxed">
            Custom spiral bevel gears, pinions, helical gears, spur gears, and precision gear sets — manufactured from your drawings.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45 }} className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-6 text-base rounded-full">
              Request a Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setRoute('capabilities')} className="border-slate-500 text-white hover:bg-white hover:text-slate-900 bg-transparent h-12 px-6 text-base rounded-full">
              View Capabilities
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust bar */}
      <FadeIn>
        <section className="border-y border-slate-200 bg-white py-8">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: '30+', l: 'Years of Precision' }, { v: 'Q12', l: 'AGMA Quality Grade' },
              { v: '1200mm', l: 'Max OD Capacity' }, { v: '±0.002mm', l: 'Tolerance' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{s.v}</div>
                <div className="text-xs md:text-sm text-slate-500 uppercase tracking-wider mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* PRODUCTION PROCESS SHOWCASE */}
      <section className="container mx-auto px-4 py-28">
        <FadeIn>
          <div className="max-w-3xl mb-16 text-center mx-auto">
            <div className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">Our Process</div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">From raw material to dispatch — every stage tracked</h2>
            <p className="text-slate-600 mt-4 text-lg">Once your order is confirmed, watch your gear move through 10 precision manufacturing stages, live.</p>
          </div>
        </FadeIn>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRODUCTION_STAGES.map((s, i) => (
            <motion.div key={s.name} variants={fadeUp} whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:border-amber-500 hover:shadow-xl transition-all cursor-default">
              <div className="w-12 h-12 mx-auto bg-slate-900 rounded-xl flex items-center justify-center mb-3">
                <s.icon className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-xs text-slate-500 mb-1">Stage {i + 1}</div>
              <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* PRODUCTS */}
      <section className="bg-slate-950 text-white py-28 overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mb-14">
              <div className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">Our Products</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Engineered for demanding industries</h2>
            </div>
          </FadeIn>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(p => (
              <motion.div key={p.key} variants={fadeUp} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <Card className="overflow-hidden group cursor-pointer bg-slate-900 border-slate-800 hover:border-amber-500 transition h-full" onClick={() => setRoute('product:' + p.key)}>
                  <div className="aspect-[4/3] overflow-hidden bg-slate-950">
                    <motion.img src={p.img} alt={p.title} className="w-full h-full object-cover opacity-80" whileHover={{ scale: 1.08 }} transition={{ duration: 0.6 }} />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg text-white mb-1">{p.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{cms?.productDescriptions?.[p.key] || 'Precision manufactured to your specifications.'}</p>
                    <div className="mt-3 text-amber-400 text-sm font-semibold flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="container mx-auto px-4 py-28">
        <FadeIn>
          <div className="max-w-3xl mb-14">
            <div className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">Capabilities</div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">End-to-end gear production, in-house</h2>
          </div>
        </FadeIn>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((c, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }} className="bg-white p-7 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all">
              <c.icon className="h-9 w-9 text-amber-500 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{c.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Gallery preview */}
      <section className="bg-slate-100 py-28">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <div className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">Gallery</div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Precision, up close</h2>
              </div>
              <Button variant="outline" onClick={() => setRoute('gallery')} className="rounded-full">View all <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </FadeIn>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GALLERY.slice(0, 8).map((img, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.03 }} className="aspect-square rounded-xl overflow-hidden bg-slate-900">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-28">
        <FadeIn>
          <div className="bg-slate-950 rounded-3xl overflow-hidden grid md:grid-cols-2 items-center">
            <div className="p-10 md:p-16 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">Send us your gear drawing.</h2>
              <p className="text-slate-300 mb-8 text-lg font-light">Upload PDF, STEP, DXF, DWG, JPG, or PNG. We'll review and reply with a detailed quote.</p>
              <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-6 rounded-full">
                Start Your RFQ <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="h-72 md:h-full overflow-hidden">
              <motion.img src={IMG_CNC} alt="" className="w-full h-full object-cover" whileHover={{ scale: 1.05 }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}

// ============== PRODUCTION TRACKER (visual timeline) ==============
function ProductionTracker({ stages, canEdit, onUpdate }) {
  const stagesData = stages || PRODUCTION_STAGES.map((s, i) => ({ id: 's' + i, name: s.name, sequence: i + 1, status: 'NOT_STARTED' }))
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[900px]">
        {/* Progress line */}
        <div className="relative flex items-start justify-between">
          <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
            {(() => {
              const completed = stagesData.filter(s => s.status === 'COMPLETED').length
              const pct = (completed / stagesData.length) * 100
              return <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
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
                      isActive ? 'bg-amber-400 border-amber-400 text-slate-900 shadow-lg shadow-amber-500/40' :
                      isHold ? 'bg-orange-100 border-orange-400 text-orange-700' :
                      'bg-white border-slate-300 text-slate-400'}`}>
                  {isDone ? <CheckCircle2 className="h-6 w-6" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </motion.div>
                <div className="text-center px-1">
                  <div className={`text-xs font-semibold ${isDone || isActive ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</div>
                  {isActive && <div className="text-[10px] text-amber-600 font-semibold mt-0.5">In Progress</div>}
                  {isDone && s.completedAt && <div className="text-[10px] text-slate-500 mt-0.5">{new Date(s.completedAt).toLocaleDateString()}</div>}
                  {isHold && <div className="text-[10px] text-orange-600 font-semibold mt-0.5">On Hold</div>}
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
    <div className="container mx-auto px-4 py-20">
      <FadeIn><h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">Our Products</h1>
      <p className="text-slate-600 mb-12 max-w-2xl text-lg">Every gear we manufacture is built from your drawings and specifications.</p></FadeIn>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(p => (
          <motion.div key={p.key} variants={fadeUp} whileHover={{ y: -8 }}>
            <Card className="overflow-hidden group cursor-pointer border-slate-200 hover:border-amber-500 hover:shadow-xl transition h-full" onClick={() => setRoute('product:' + p.key)}>
              <div className="aspect-[4/3] overflow-hidden bg-slate-900"><motion.img src={p.img} alt={p.title} className="w-full h-full object-cover opacity-90" whileHover={{ scale: 1.08 }} transition={{ duration: 0.6 }} /></div>
              <CardContent className="p-5"><h3 className="font-bold text-lg text-slate-900 mb-1">{p.title}</h3><p className="text-sm text-slate-600">{cms?.productDescriptions?.[p.key]}</p></CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function ProductDetail({ productKey, setRoute, cms }) {
  const p = PRODUCTS.find(x => x.key === productKey)
  if (!p) return <div className="container mx-auto px-4 py-16">Product not found.</div>
  return (
    <div>
      <section className="bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <button onClick={() => setRoute('products')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center"><ArrowLeft className="h-4 w-4 mr-1" /> All Products</button>
            <h1 className="text-5xl md:text-6xl font-bold mb-5 tracking-tight">{p.title}</h1>
            <p className="text-slate-300 mb-8 text-lg font-light">{cms?.productDescriptions?.[p.key]}</p>
            <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-6 rounded-full">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </FadeIn>
          <FadeIn delay={0.2}><motion.img src={p.img} alt={p.title} className="rounded-2xl shadow-2xl" whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} /></FadeIn>
        </div>
      </section>
      <FadeIn>
        <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-10">
          {[
            { title: 'Typical Applications', items: p.apps },
            { title: 'Available Materials', items: ['Alloy Steel (4140, 4340, 8620)','Carbon Steel','Stainless Steel','Bronze','Cast Iron','Custom on request'] },
            { title: 'Manufacturing Options', items: ['Gear cutting & hobbing','Precision grinding','Heat treatment','CMM inspection','Lapping & finishing'] }
          ].map((col, i) => (
            <div key={i}>
              <h3 className="font-bold text-slate-900 mb-4 text-lg">{col.title}</h3>
              <ul className="space-y-2 text-slate-700">{col.items.map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" /> {a}</li>)}</ul>
            </div>
          ))}
        </section>
      </FadeIn>
      <section className="container mx-auto px-4 pb-20">
        <h3 className="font-bold text-slate-900 mb-6 text-2xl">Gallery</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GALLERY.slice(0, 4).map((g, i) => <motion.img key={i} src={g} className="aspect-square object-cover rounded-xl" whileHover={{ scale: 1.03 }} />)}
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
    <div>
      <section className="bg-slate-950 text-white py-20">
        <div className="container mx-auto px-4"><FadeIn>
          <h1 className="text-5xl md:text-6xl font-bold mb-5 tracking-tight">Manufacturing Capabilities</h1>
          <p className="text-slate-300 max-w-2xl text-lg font-light">A complete in-house manufacturing suite from raw material through inspection.</p>
        </FadeIn></div>
      </section>
      <section className="container mx-auto px-4 py-16 space-y-20">
        {sections.map((s, i) => (
          <FadeIn key={i}>
            <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <motion.img src={s.img} alt={s.title} className="rounded-2xl w-full aspect-video object-cover" whileHover={{ scale: 1.02 }} />
              <div><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">{s.title}</h2><p className="text-slate-700 text-lg leading-relaxed">{s.desc}</p></div>
            </div>
          </FadeIn>
        ))}
      </section>
    </div>
  )
}

function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <FadeIn><h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">Gallery</h1>
      <p className="text-slate-600 mb-12 text-lg max-w-2xl">Precision engineered gears and finished components from our production floor.</p></FadeIn>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY.concat([HERO_IMG, IMG_CNC, IMG_CNC2]).map((g, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.03 }} className="aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-lg">
            <img src={g} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function AboutPage({ cms }) {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <FadeIn>
        <h1 className="text-5xl font-bold text-slate-900 mb-8 tracking-tight">{cms?.aboutTitle || 'About Vijaya Engineering Works'}</h1>
        <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">{cms?.aboutText}</p>
      </FadeIn>
    </div>
  )
}

function ContactPage({ cms }) {
  return (
    <div className="container mx-auto px-4 py-20">
      <FadeIn><h1 className="text-5xl font-bold text-slate-900 mb-10 tracking-tight">Contact Us</h1></FadeIn>
      <div className="grid md:grid-cols-2 gap-12">
        <FadeIn><div className="space-y-5 text-slate-700">
          <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Phone</div>{cms?.phone}</div></div>
          <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Email</div>{cms?.email}</div></div>
          <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Address</div>{cms?.address}</div></div>
          <div className="flex items-start gap-3"><Building2 className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Hours</div>{cms?.hours}</div></div>
        </div></FadeIn>
        <FadeIn delay={0.1}><Card><CardContent className="p-6 space-y-3">
          <div><Label>Name</Label><Input placeholder="Your name" /></div>
          <div><Label>Email</Label><Input placeholder="you@example.com" /></div>
          <div><Label>Message</Label><Textarea placeholder="How can we help?" rows={4} /></div>
          <Button className="bg-slate-900 hover:bg-slate-800 w-full">Send Message</Button>
        </CardContent></Card></FadeIn>
      </div>
    </div>
  )
}

// ============== LOGIN / SIGNUP ==============
function LoginPage({ setRoute, auth }) {
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [form, setForm] = useState({ identifier: '', password: '', email: '', phone: '', firstName: '', lastName: '', companyName: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const u = await auth.login(form.identifier, form.password)
        toast.success(`Welcome back, ${u.firstName || 'user'}`)
        setRoute(u.role === 'admin' ? 'admin' : 'portal')
      } else if (mode === 'signup') {
        if (!form.email || !form.phone) { toast.error('Email and phone are both required'); setLoading(false); return }
        const u = await auth.signup(form)
        toast.success(`Account created, ${u.firstName}`)
        setRoute('portal')
      } else {
        const r = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: form.identifier }) })
        await r.json()
        toast.success('If an account exists, reset instructions were sent (mocked email).')
        setMode('login')
      }
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="inline-block">
            <Cog className="h-12 w-12 text-amber-500" strokeWidth={2} />
          </motion.div>
          <div className="mt-3 font-bold text-2xl text-slate-900 tracking-tight">Vijaya Engineering Works</div>
          <div className="text-xs uppercase tracking-widest text-amber-600 mt-1">VEW · Precision Gears</div>
        </div>
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">
          <CardHeader className="bg-slate-950 text-white pb-8">
            <CardTitle className="text-2xl tracking-tight">
              {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Create your VEW account' : 'Reset your password'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === 'login' ? 'Track your RFQs and production progress in real-time.' :
                mode === 'signup' ? 'Get instant quotes and live production tracking.' :
                'Enter your email or phone to receive reset instructions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 -mt-4">
            <form onSubmit={submit} className="space-y-4 bg-white rounded-lg">
              {mode === 'signup' && <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-slate-700">First Name *</Label><Input required className="mt-1" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div><Label className="text-slate-700">Last Name *</Label><Input required className="mt-1" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                </div>
                <div><Label className="text-slate-700">Company Name</Label><Input className="mt-1" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
                <div><Label className="text-slate-700">Email *</Label>
                  <div className="relative mt-1"><Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input required type="email" className="pl-9" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div><Label className="text-slate-700">Phone *</Label>
                  <div className="relative mt-1"><Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input required type="tel" className="pl-9" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">You'll be able to sign in with either email or phone.</div>
                </div>
              </>}
              {(mode === 'login' || mode === 'forgot') && (
                <div><Label className="text-slate-700">Email or Phone</Label>
                  <div className="relative mt-1"><User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input required className="pl-9 h-11" placeholder="you@company.com or +91 98765 43210" value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} />
                  </div>
                </div>
              )}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700">Password{mode === 'signup' && ' *'}</Label>
                    {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-xs text-amber-600 font-medium hover:underline">Forgot password?</button>}
                  </div>
                  <Input required type="password" className="mt-1 h-11" placeholder={mode === 'signup' ? 'At least 6 characters' : ''} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <Button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11 rounded-full font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Instructions'}
              </Button>
            </form>
            <div className="mt-5 pt-5 border-t text-center text-sm text-slate-600 space-y-2">
              {mode === 'login' && <>
                <div>New to VEW? <button onClick={() => setMode('signup')} className="text-amber-600 font-semibold">Create an account</button></div>
                <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2">
                  <b>Admin demo:</b> admin@vew.com / admin123
                </div>
              </>}
              {mode === 'signup' && <div>Already have an account? <button onClick={() => setMode('login')} className="text-amber-600 font-semibold">Sign in</button></div>}
              {mode === 'forgot' && <div><button onClick={() => setMode('login')} className="text-amber-600 font-semibold">← Back to sign in</button></div>}
            </div>
          </CardContent>
        </Card>
        <div className="text-center text-xs text-slate-500 mt-6">Protected by password hashing (scrypt). Your credentials are never stored in plain text.</div>
      </motion.div>
    </div>
  )
}

// ============== IMPERSONATION BANNER ==============
function ImpersonationBanner({ user, onExit }) {
  if (!user?._impersonatedBy) return null
  return (
    <motion.div initial={{ y: -30 }} animate={{ y: 0 }} className="bg-amber-500 text-slate-900 text-sm py-2 px-4 flex items-center justify-between gap-3 sticky top-16 z-30 border-b border-amber-600">
      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> <span className="font-semibold">Admin override</span> · Viewing as {user.firstName} {user.lastName} ({user.email})</div>
      <Button size="sm" onClick={onExit} className="bg-slate-900 hover:bg-slate-800 text-white h-7 rounded-full text-xs">Exit override</Button>
    </motion.div>
  )
}

// ============== USER MANAGEMENT (Admin) ==============
function UserManagement({ auth, onImpersonate }) {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [resetTarget, setResetTarget] = useState(null)
  const [newPw, setNewPw] = useState('')
  const load = async () => { const d = await api(auth.token).get(`/api/admin/users?q=${encodeURIComponent(query)}`); setUsers(d.users || []) }
  useEffect(() => { load() }, [query])

  async function toggle(u) {
    if (u.role === 'admin') { toast.error("Can't disable admin"); return }
    await api(auth.token).patch(`/api/admin/users/${u.id}/toggle`, {})
    toast.success(u.isActive ? 'User disabled' : 'User re-enabled')
    load()
  }
  async function doReset() {
    if (!newPw || newPw.length < 6) { toast.error('At least 6 characters'); return }
    const r = await api(auth.token).post(`/api/admin/users/${resetTarget.id}/reset-password`, { password: newPw })
    if (r.success) { toast.success('Password reset · Email sent (mocked)'); setResetTarget(null); setNewPw('') }
    else toast.error(r.error)
  }
  async function impersonate(u) {
    if (u.role === 'admin') { toast.error("Can't impersonate another admin"); return }
    try {
      await auth.impersonate(u.id)
      toast.success(`Now viewing as ${u.firstName} ${u.lastName}`)
      onImpersonate && onImpersonate()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-slate-900 text-lg">User Management</div>
          <div className="text-sm text-slate-500">All customer & admin accounts · {users.length} total</div>
        </div>
        <div className="relative w-full sm:w-80"><Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name, email, phone, company..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
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
                  <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{u.rfqCount}</td>
                <td className="px-4 py-3">
                  <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {u.role !== 'admin' && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => impersonate(u)} title="Sign in as this user">
                          <ShieldCheck className="h-3 w-3 mr-1" />Override
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => setResetTarget(u)}>
                          <Pencil className="h-3 w-3 mr-1" />Reset
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => toggle(u)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan="7" className="p-10 text-center text-slate-500">No users found.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
      <Dialog open={!!resetTarget} onOpenChange={o => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password for {resetTarget?.firstName} {resetTarget?.lastName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="text-sm text-slate-600">A notification email will be sent (mocked).</div>
            <Label>New Password</Label>
            <Input type="password" placeholder="At least 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPw('') }}>Cancel</Button>
            <Button onClick={doReset} className="bg-slate-900 hover:bg-slate-800">Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [submitted, setSubmitted] = useState(null)
  const specFields = SPEC_FIELDS[specGroup(gearType)]

  async function handleFiles(e) {
    for (const file of Array.from(e.target.files || [])) {
      const reader = new FileReader()
      const dataUrl = await new Promise(res => { reader.onload = () => res(reader.result); reader.readAsDataURL(file) })
      setFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, dataUrl }])
    }
    e.target.value = ''
  }
  async function submit() {
    setSubmitting(true)
    try {
      let savedFiles = []
      if (files.length) {
        const r = await api(auth.token).post('/api/upload', { files })
        savedFiles = r.files || []
      }
      const r = await api(auth.token).post('/api/rfq', { gearType, specifications: specs, general, files: savedFiles, customer: { ...customer, email: (customer.email || '').toLowerCase() }, notes })
      if (r.success) { setSubmitted(r.rfq); toast.success(`RFQ ${r.rfq.rfqNumber} submitted`) } else toast.error(r.error || 'Failed')
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }
  const canNext = () => step === 1 ? !!gearType : step === 5 ? customer.email && customer.firstName && customer.lastName : true

  if (submitted) return (
    <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="inline-flex bg-emerald-100 text-emerald-600 rounded-full p-5 mb-6"><CheckCircle2 className="h-16 w-16" /></motion.div>
      <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Thank you.</h1>
      <p className="text-slate-600 mb-2">Your RFQ number:</p>
      <div className="text-3xl font-bold tracking-wider text-amber-600 mb-6">{submitted.rfqNumber}</div>
      <p className="text-slate-600 mb-8">Our engineering team will review your request shortly. You'll receive an email confirmation and can track live progress in your portal.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={() => setRoute('portal')} className="bg-slate-900 hover:bg-slate-800 rounded-full">View in Portal</Button>
        <Button variant="outline" onClick={() => setRoute('home')} className="rounded-full">Back to Home</Button>
      </div>
    </div>
  )

  const steps = ['Gear Type','Specifications','Quantity','Drawings','Customer','Review']
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <FadeIn>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Request a Quote</h1>
        <p className="text-slate-600 mb-6">6-step form. Fill only what you know.</p>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2 gap-1">
            {steps.map((s, i) => <div key={s} className={`flex-1 text-center ${i + 1 <= step ? 'text-amber-600 font-semibold' : ''}`}>{i + 1}. {s}</div>)}
          </div>
          <Progress value={(step / 6) * 100} className="h-2" />
        </div>
      </FadeIn>
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Card><CardContent className="p-6">
          {step === 1 && <div><h2 className="text-xl font-bold mb-4">Step 1: Select Gear Type</h2><Label>Gear Type</Label>
            <Select value={gearType} onValueChange={setGearType}><SelectTrigger className="w-full mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger><SelectContent>{GEAR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>}
          {step === 2 && <div><h2 className="text-xl font-bold mb-4">Step 2: {gearType} Specifications</h2>
            <div className="grid md:grid-cols-2 gap-4">{specFields.map(f => (
              <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}><Label>{f.label}</Label>
                {f.type === 'select' ? <Select value={specs[f.key] || ''} onValueChange={v => setSpecs({ ...specs, [f.key]: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                : f.type === 'textarea' ? <Textarea className="mt-1" value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />
                : <Input className="mt-1" value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />}
              </div>
            ))}</div>
          </div>}
          {step === 3 && <div><h2 className="text-xl font-bold mb-4">Step 3: General & Manufacturing</h2>
            <div className="grid md:grid-cols-2 gap-4">{[
              ['partName','Part Name'],['partNumber','Part Number'],['quantity','Quantity'],['material','Material'],
              ['heatTreatment','Heat Treatment'],['hardness','Hardness (HRC)'],['drawingNumber','Drawing Number'],['revision','Revision'],
              ['deliveryDate','Required Delivery Date','date'],['application','Application'],['annualQuantity','Annual Quantity']
            ].map(([k, l, t]) => <div key={k}><Label>{l}</Label><Input type={t || 'text'} className="mt-1" value={general[k] || ''} onChange={e => setGeneral({ ...general, [k]: e.target.value })} /></div>)}
              <div><Label>Prototype or Production</Label>
                <Select value={general.protoOrProd || ''} onValueChange={v => setGeneral({ ...general, protoOrProd: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Prototype">Prototype</SelectItem><SelectItem value="Production">Production</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent></Select>
              </div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
          </div>}
          {step === 4 && <div><h2 className="text-xl font-bold mb-4">Step 4: Upload Drawings</h2>
            <label className="block border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition">
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-900">Click to upload</div>
              <div className="text-sm text-slate-500">PDF, STEP, STP, DXF, DWG, JPG, PNG</div>
              <input type="file" multiple className="hidden" accept=".pdf,.step,.stp,.dxf,.dwg,.jpg,.jpeg,.png" onChange={handleFiles} />
            </label>
            {files.length > 0 && <div className="mt-4 space-y-2">{files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <div className="flex items-center gap-3 min-w-0"><FileText className="h-5 w-5 text-amber-500 shrink-0" /><div className="min-w-0"><div className="font-medium truncate">{f.name}</div><div className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</div></div></div>
                <Button size="sm" variant="ghost" onClick={() => setFiles(prev => prev.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}</div>}
          </div>}
          {step === 5 && <div><h2 className="text-xl font-bold mb-4">Step 5: Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">{[
              ['companyName','Company'],['firstName','First Name *'],['lastName','Last Name *'],['email','Email *','email'],
              ['phone','Phone','tel'],['country','Country'],['address','Address'],['city','City'],['state','State'],['zip','Zip Code']
            ].map(([k, l, t]) => <div key={k}><Label>{l}</Label><Input type={t || 'text'} className="mt-1" value={customer[k] || ''} onChange={e => setCustomer({ ...customer, [k]: e.target.value })} /></div>)}</div>
          </div>}
          {step === 6 && <div><h2 className="text-xl font-bold mb-4">Step 6: Review & Submit</h2><div className="space-y-4 text-sm">
            <div className="border rounded-lg p-4"><div className="font-semibold mb-2">Customer</div>{customer.firstName} {customer.lastName} — {customer.companyName}<div className="text-slate-600">{customer.email} · {customer.phone}</div></div>
            <div className="border rounded-lg p-4"><div className="font-semibold mb-2">Gear</div>{gearType}</div>
            <div className="border rounded-lg p-4"><div className="font-semibold mb-2">Specifications</div><div className="grid grid-cols-2 gap-x-6 gap-y-1">{Object.entries(specs).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{specFields.find(f => f.key === k)?.label || k}:</span> {v}</div>)}</div></div>
            <div className="border rounded-lg p-4"><div className="font-semibold mb-2">General</div>{Object.entries(general).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> {v}</div>)}</div>
            <div className="border rounded-lg p-4"><div className="font-semibold mb-2">Drawings ({files.length})</div>{files.length ? <ul className="list-disc list-inside">{files.map((f, i) => <li key={i}>{f.name}</li>)}</ul> : <div className="text-slate-500">None</div>}</div>
          </div></div>}
        </CardContent></Card>
      </motion.div>
      <div className="flex justify-between mt-5">
        <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="rounded-full"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        {step < 6
          ? <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-slate-900 hover:bg-slate-800 rounded-full">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
          : <Button onClick={submit} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full">{submitting ? 'Submitting...' : 'Submit RFQ'} <Send className="h-4 w-4 ml-1" /></Button>}
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
  doc.text('TOTAL:', 150, y); doc.text(`$${(p.total || 0).toFixed(2)}`, 190, y, { align: 'right' })
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
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const load = async () => { setLoading(true); const d = await api(auth.token).get('/api/rfq'); setRfqs(d.rfqs || []); setLoading(false) }
  useEffect(() => { load() }, [])
  useEffect(() => { const i = setInterval(load, 8000); return () => clearInterval(i) }, [])

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div><h1 className="text-4xl font-bold text-slate-900 tracking-tight">Your RFQs & Orders</h1><p className="text-slate-600 text-sm">Signed in as {auth.user.email}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full">New RFQ</Button>
        </div>
      </div>
      {loading && !rfqs.length ? <div>Loading...</div> : rfqs.length === 0 ? (
        <Card><CardContent className="p-16 text-center text-slate-500">No RFQs yet. <button onClick={() => setRoute('rfq')} className="text-amber-600 font-semibold">Submit your first RFQ</button></CardContent></Card>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-3">
          {rfqs.map(r => (
            <motion.div key={r.id} variants={fadeUp}>
              <Card className="cursor-pointer hover:border-amber-500 hover:shadow-md transition" onClick={() => setSelected(r)}>
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
      <RfqDetailDialog rfq={selected} onClose={() => setSelected(null)} onUpdated={load} auth={auth} asCustomer />
    </div>
  )
}

// ============== RFQ DETAIL DIALOG ==============
function RfqDetailDialog({ rfq, onClose, onUpdated, auth, asCustomer, asAdmin, cms }) {
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
    const d = await api(auth.token).get(`/api/rfq/${current.id}`)
    if (d.rfq) setCurrent(d.rfq); onUpdated && onUpdated()
  }
  async function sendMessage() {
    if (!msgText.trim()) return
    await api(auth.token).post(`/api/rfq/${current.id}/messages`, { text: msgText })
    setMsgText(''); refresh()
  }
  function calcTotal(p) {
    return (parseFloat(p.unitPrice) || 0) * (parseFloat(p.quantity) || 0) + (parseFloat(p.tooling) || 0) + (parseFloat(p.engineering) || 0) + (parseFloat(p.shipping) || 0) + (parseFloat(p.tax) || 0)
  }
  async function saveAdmin() {
    const total = calcTotal(pricing)
    await api(auth.token).patch(`/api/rfq/${current.id}`, { status: newStatus, internalNotes, pricing: { ...pricing, total }, leadTime })
    toast.success('RFQ updated · Email notification sent (mocked)')
    refresh()
  }
  async function updateStage(stageId, status) {
    await api(auth.token).patch(`/api/rfq/${current.id}/stage`, { stageId, status })
    toast.success('Stage updated')
    refresh()
  }
  async function downloadFile(f) {
    const d = await api(auth.token).get(`/api/files/${f.id}`)
    const a = document.createElement('a'); a.href = d.dataUrl; a.download = d.name; a.click()
  }

  return (
    <Dialog open={!!current} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>{current.rfqNumber}</span>
            <Badge className={STATUS_COLORS[current.status]}>{current.status}</Badge>
            <span className="text-sm font-normal text-slate-500">· {current.gearType}</span>
          </DialogTitle>
        </DialogHeader>

        {/* PRODUCTION TRACKER */}
        <div className="bg-slate-50 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-900">Production Progress</div>
            {asAdmin && <Badge variant="outline">Admin can update stages below</Badge>}
          </div>
          <ProductionTracker stages={current.productionStages} canEdit={asAdmin} onUpdate={updateStage} />
        </div>

        <Tabs defaultValue="details">
          <TabsList>
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
                  <div className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 text-amber-500 shrink-0" /><span className="truncate">{f.name}</span></div>
                  <Button size="sm" variant="ghost" onClick={() => downloadFile(f)}><Download className="h-4 w-4" /></Button>
                </div>
              ))}{!current.files?.length && <div className="text-slate-500 text-sm">No drawings</div>}</div>
            </CardContent></Card>
            {current.pricing?.total > 0 && (
              <Card className="border-amber-500"><CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-amber-700">Quote</div>
                  <Button size="sm" onClick={() => generateQuotePDF(current, cms)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full">
                    <FileDown className="h-4 w-4 mr-1" /> Download PDF
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div>Unit Price: ${current.pricing.unitPrice}</div><div>Quantity: {current.pricing.quantity}</div>
                  <div>Tooling: ${current.pricing.tooling || 0}</div><div>Engineering: ${current.pricing.engineering || 0}</div>
                  <div>Shipping: ${current.pricing.shipping || 0}</div><div>Tax: ${current.pricing.tax || 0}</div>
                  <div className="col-span-2 font-bold text-lg mt-2">Total: ${current.pricing.total.toFixed(2)}</div>
                  <div>Lead Time: {current.leadTime}</div><div>Terms: {current.pricing.paymentTerms}</div>
                </div>
              </CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="messages">
            <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
              {(current.messages || []).map(m => (
                <div key={m.id} className={`p-3 rounded ${m.from === 'admin' ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-slate-100'}`}>
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
                <Button onClick={saveAdmin} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full">Save & Notify Customer</Button>
                <Button onClick={() => generateQuotePDF(current, cms)} variant="outline" className="rounded-full"><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
        <DialogFooter><Button variant="outline" onClick={onClose} className="rounded-full">Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== ADMIN DASHBOARD ==============
function AdminDashboard({ auth, cms, reloadCms }) {
  const [rfqs, setRfqs] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('rfqs')
  const load = async () => {
    const d = await api(auth.token).get('/api/rfq'); setRfqs(d.rfqs || [])
    const s = await api(auth.token).get('/api/admin/stats'); setStats(s)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const i = setInterval(load, 8000); return () => clearInterval(i) }, [])

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <Button variant="outline" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList><TabsTrigger value="rfqs">RFQs</TabsTrigger><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="cms">Content Editor</TabsTrigger></TabsList>
        <TabsContent value="rfqs">
          {stats && <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              ['This Month', stats.thisMonth, TrendingUp], ['Total RFQs', stats.total, ClipboardList],
              ['Quotes Sent', stats.quotesSent, Send], ['In Production', stats.inProduction, Factory],
              ['Total Value', '$' + (stats.totalValue || 0).toLocaleString(), Award]
            ].map(([l, v, Icon]) => (
              <motion.div key={l} variants={fadeUp}><Card className="hover:border-amber-500 transition"><CardContent className="p-4">
                <div className="flex items-center justify-between mb-1"><div className="text-xs text-slate-500 uppercase">{l}</div><Icon className="h-4 w-4 text-amber-500" /></div>
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
                    <Badge className={stats.stageCounts[s.name] ? 'bg-amber-500 text-white' : 'bg-slate-200'}>{stats.stageCounts[s.name] || 0}</Badge>
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
              <motion.div key={r.id} variants={fadeUp}><Card className="cursor-pointer hover:border-amber-500 transition" onClick={() => setSelected(r)}>
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
    await api(auth.token).patch('/api/cms', form)
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [reorderPrefill, setReorderPrefill] = useState(null)
  const [cms, setCms] = useState(null)

  const loadCms = async () => { const d = await fetch('/api/cms').then(r => r.json()); setCms(d.cms) }
  useEffect(() => { loadCms() }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [route])

  useEffect(() => {
    const h = () => setRoute('portal')
    window.addEventListener('exitAdmin', h)
    return () => window.removeEventListener('exitAdmin', h)
  }, [])

  // Route guards
  const goRoute = (r) => {
    if ((r === 'portal' || r === 'admin') && !auth.user) { setRoute('login'); return }
    if (r === 'admin' && auth.user?.role !== 'admin') { toast.error('Admin access required'); return }
    setRoute(r)
  }

  if (auth.loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>

  let content
  if (route === 'home') content = <HomePage setRoute={goRoute} cms={cms} />
  else if (route === 'products') content = <ProductsPage setRoute={goRoute} cms={cms} />
  else if (route.startsWith('product:')) content = <ProductDetail productKey={route.slice(8)} setRoute={goRoute} cms={cms} />
  else if (route === 'capabilities') content = <CapabilitiesPage />
  else if (route === 'gallery') content = <GalleryPage />
  else if (route === 'about') content = <AboutPage cms={cms} />
  else if (route === 'contact') content = <ContactPage cms={cms} />
  else if (route === 'rfq') content = <RfqWizard setRoute={goRoute} prefill={reorderPrefill} auth={auth} />
  else if (route === 'login') content = <LoginPage setRoute={goRoute} auth={auth} />
  else if (route === 'portal') content = <CustomerPortal auth={auth} setRoute={goRoute} />
  else if (route === 'admin') content = <AdminDashboard auth={auth} cms={cms} reloadCms={loadCms} />
  else content = <HomePage setRoute={goRoute} cms={cms} />

  return (
    <div className="min-h-screen flex flex-col">
      <Nav route={route.split(':')[0]} setRoute={goRoute} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={auth.user} onLogout={() => { auth.logout(); setRoute('home'); toast.success('Signed out') }} />
      <ImpersonationBanner user={auth.user} onExit={() => { auth.exitImpersonation(); setRoute('admin'); toast.success('Exited override — back to admin') }} />
      <main className="flex-1">{content}</main>
      <Footer setRoute={goRoute} cms={cms} />
    </div>
  )
}

export default App
