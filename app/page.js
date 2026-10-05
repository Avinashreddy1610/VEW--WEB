'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, MotionConfig, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import ResponsiveImage from '@/components/responsive-image'
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
function useAuth() {
  const [user, setUser] = useState(null)
  const [sessionKey, setSessionKey] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    // Retire legacy browser-readable credentials. The server owns the session cookie.
    try { localStorage.removeItem('vew_token'); localStorage.removeItem('vew_admin_token') } catch { /* Storage may be disabled; cookie sign-in still works. */ }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10000)
    fetch('/api/auth/me', { signal: ctrl.signal })
      .then(r => r.json()).then(d => { if (d.user) { setUser(d.user); setSessionKey(d.user.id) } else setSessionKey(null) })
      .catch(() => { setSessionKey(null); setUser(null) })
      .finally(() => { clearTimeout(timer); setLoading(false) })
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [])
  const login = async (identifier, password) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) })
    const d = await r.json()
    if (!r.ok) { const error = new Error(d.error); error.code = d.code; throw error }
    setSessionKey(d.user.id); setUser(d.user); return d.user
  }
  const signup = async (data) => {
    const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    return d
  }
  const impersonate = async (userId) => {
    const r = await fetch(`/api/admin/users/${userId}/impersonate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    setSessionKey(d.user.id); setUser(d.user); return d.user
  }
  const exitImpersonation = async () => {
    const r = await fetch('/api/auth/exit-impersonation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Please sign in again')
    setSessionKey(d.user.id); setUser(d.user)
  }
  const logout = async () => {
    const r = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!r.ok) throw new Error('Sign-out failed. Please try again.')
    setSessionKey(null); setUser(null)
  }
  return { user, sessionKey, loading, login, signup, logout, impersonate, exitImpersonation }
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

// ============== GEAR LOGO ==============
function GearLogo({ className = 'h-8 w-8', spin = false }) {
  return <motion.div animate={spin ? { rotate: 360 } : {}} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
    <Cog className={className + ' text-cyan-500'} strokeWidth={2.2} />
  </motion.div>
}

// ============== FUTURISTIC UI PRIMITIVES ==============
function Eyebrow({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <span className="font-tech text-[#22d3ee] text-sm select-none">//</span>
      <span className="font-tech text-[#67e8f9] font-medium text-xs uppercase tracking-[0.32em]">{children}</span>
      <span className="h-px w-20 bg-gradient-to-r from-[#22d3ee]/70 to-transparent" />
    </div>
  )
}

function SectionHead({ eyebrow, title, sub, center = false, no }) {
  return (
    <FadeIn>
      <div className={`relative max-w-4xl mb-16 ${center ? 'mx-auto text-center' : ''}`}>
        {no && (
          <div aria-hidden className={`font-display font-bold text-stroke-faint leading-none text-[6.5rem] md:text-[8.5rem] absolute -top-14 md:-top-20 select-none pointer-events-none ${center ? 'left-1/2 -translate-x-1/2' : '-left-3'}`}>
            {no}
          </div>
        )}
        <div className="relative">
          <Eyebrow className={center ? 'justify-center' : ''}>{eyebrow}</Eyebrow>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-[#eef3f6] leading-[1.02]">{title}</h2>
          {sub && <p className={`text-[#8b98a5] mt-5 text-lg font-light leading-relaxed max-w-2xl ${center ? 'mx-auto' : ''}`}>{sub}</p>}
        </div>
      </div>
    </FadeIn>
  )
}

function Orbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[#22d3ee]/[0.13] blur-[140px]" />
      <motion.div animate={{ x: [0, -60, 0], y: [0, 40, 0] }} transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 -right-48 h-[620px] w-[620px] rounded-full bg-[#67e8f9]/[0.09] blur-[160px]" />
      <motion.div animate={{ x: [0, 30, 0], y: [0, 30, 0] }} transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 left-1/3 h-[460px] w-[460px] rounded-full bg-[#0e7490]/[0.09] blur-[120px]" />
    </div>
  )
}

function GridBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: 'linear-gradient(rgba(103,232,249,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.055) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
        maskImage: 'radial-gradient(ellipse 90% 75% at 50% 25%, black 25%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 75% at 50% 25%, black 25%, transparent 78%)',
      }} />
  )
}

function Noise() {
  return <div aria-hidden className="noise-fx pointer-events-none absolute inset-0 opacity-[0.05]" />
}

/* ================= ROBOT / SERVO MOTION KIT ================= */
function gearPath(teeth, rOut, rRoot) {
  const pts = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const segs = [
      [rRoot, a], [rRoot, a + step * 0.30],
      [rOut, a + step * 0.36], [rOut, a + step * 0.60],
      [rRoot, a + step * 0.66], [rRoot, a + step],
    ]
    for (const [r, ang] of segs) pts.push(`${(r * Math.cos(ang)).toFixed(1)},${(r * Math.sin(ang)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

function Gear({ teeth = 14, size = 120, seconds = 14, reverse = false, className = '', stroke = '#22d3ee' }) {
  const d = useMemo(() => gearPath(teeth, 96, 76), [teeth])
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} className={className} aria-hidden>
      <circle r="97" fill="none" stroke={stroke} strokeWidth="1" opacity="0.25" strokeDasharray="4 7" />
      <g className="gear-rotor" style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        <path d={d} fill="rgba(34,211,238,0.07)" stroke={stroke} strokeWidth={5} strokeLinejoin="round" />
        {[0, 60, 120].map(a => (
          <line key={a} x1="0" y1="-26" x2="0" y2="-64" stroke={stroke} strokeWidth={5} strokeLinecap="round" opacity="0.5" transform={`rotate(${a})`} />
        ))}
        <circle r="24" fill="#06090d" stroke={stroke} strokeWidth={5} />
        <circle r="7" fill={stroke} opacity="0.9" />
      </g>
    </svg>
  )
}

function GearTrain({ className = '' }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-4 rounded-full border border-dashed border-cyan-400/20 animate-vew-spin-slow" />
      <Gear teeth={20} size={230} seconds={26} className="absolute left-[2%] top-[4%]" />
      <Gear teeth={13} size={152} seconds={16.9} reverse className="absolute right-[6%] top-[26%]" />
      <Gear teeth={16} size={186} seconds={20.8} className="absolute left-[32%] bottom-[0%]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="block h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_18px_4px_rgba(34,211,238,0.7)] animate-vew-blink" />
      </div>
    </div>
  )
}

function Typewriter({ lines = [], className = '', speed = 30, hold = 2400 }) {
  const [out, setOut] = useState('')
  useEffect(() => {
    let li = 0, ci = 0, timer = null, cancelled = false
    const tick = () => {
      if (cancelled) return
      const line = lines[li] || ''
      if (ci <= line.length) {
        setOut(lines.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci))
        ci++
        timer = setTimeout(tick, speed)
      } else {
        li++; ci = 0
        if (li >= lines.length) {
          timer = setTimeout(() => { if (!cancelled) { li = 0; ci = 0; setOut(''); tick() } }, hold)
        } else {
          timer = setTimeout(tick, speed * 5)
        }
      }
    }
    tick()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [lines.join('|')])
  return <pre className={className}>{out}<span className="terminal-caret">▊</span></pre>
}

function Scanline({ className = '' }) {
  return <div aria-hidden className={`scanline ${className}`} />
}

function Counter({ to, decimals = 0, prefix = '', suffix = '', duration = 1.8 }) {
  const ref = useRef(null)
  const started = useRef(false)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const tick = now => {
          const p = Math.min(1, (now - t0) / (duration * 1000))
          setVal(to * (1 - Math.pow(1 - p, 3)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{val.toFixed(decimals)}{suffix}</span>
}

function GlowCard({ children, className = '' }) {
  return (
    <div className={`group relative rounded-2xl border border-white/10 bg-[#0a1016]/90 backdrop-blur-sm p-7 overflow-hidden transition-all duration-300 hover:border-[#22d3ee]/60 hover:shadow-[0_0_60px_-12px_rgba(34,211,238,0.45)] hover:-translate-y-1 ${className}`}>
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/70 to-transparent opacity-60" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#22d3ee]/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </div>
  )
}

function SpotCard({ children, className = '', onClick }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onMouseMove={onMove} onClick={onClick} className={`spot-card ${className}`}>
      {children}
    </div>
  )
}

// ============== APP-LEVEL CHROME ==============
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div style={{ scaleX: scrollYProgress }} className="fixed top-0 left-0 right-0 h-[3px] z-[120] origin-left bg-gradient-to-r from-[#a5f3fc] via-[#22d3ee] to-[#0e7490]" />
}

function CapRow({ c, i }) {
  const [open, setOpen] = useState(false)
  const Icon = c.icon
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center gap-5 md:gap-8 py-6 text-left group">
        <span className="font-tech text-sm text-[#22d3ee] w-10 shrink-0">{String(i + 1).padStart(2, '0')}</span>
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border border-[#22d3ee]/30 hidden sm:flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-[#67e8f9]" />
        </span>
        <span className="font-display text-2xl md:text-4xl font-bold text-[#eef3f6] group-hover:text-[#67e8f9] transition-colors flex-1 tracking-tight">{c.title}</span>
        <span className={`font-display text-3xl text-[#22d3ee] leading-none transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="pb-7 pl-[4.5rem] md:pl-[7rem] pr-4 text-[#8b98a5] text-lg font-light leading-relaxed max-w-2xl">{c.desc}</p>
        </div>
      </div>
    </div>
  )
}

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
      <div className="container mx-auto px-4 py-14 grid md:grid-cols-4 gap-8">
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
          <div className="text-neutral-900 font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            {cms?.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /><a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`} className="hover:text-neutral-900">{cms.phone}</a></li>}
            {cms?.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /><a href={`mailto:${cms.email}`} className="break-all hover:text-neutral-900">{cms.email}</a></li>}
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
    <div className="bg-[#06090d] min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <FadeIn>
          <Eyebrow>Products</Eyebrow>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-[#eef3f6] mb-4 tracking-tight">Our <span className="text-servo">Products</span></h1>
          <p className="text-[#8b98a5] mb-12 max-w-2xl text-lg font-light">Every gear we manufacture is built from your drawings and specifications.</p>
        </FadeIn>
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p, pi) => (
            <motion.div key={p.key} variants={fadeUp} whileHover={{ y: -8 }}>
              <SpotCard onClick={() => setRoute('product:' + p.key)}
                className="overflow-hidden group cursor-pointer rounded-2xl bg-[#0a1016]/90 border border-white/10 hover:border-[#22d3ee]/60 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.35)] h-full">
                <div className="aspect-[4/3] overflow-hidden bg-black relative">
                  <ResponsiveImage src={p.img} alt={p.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" whileHover={{ scale: 1.08 }} transition={{ duration: 0.6 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1016]/70 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 font-tech text-[10px] tracking-[0.2em] text-white/80 bg-black/45 backdrop-blur px-2.5 py-1 rounded-full border border-white/15">{String(pi + 1).padStart(2, '0')}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-xl text-[#eef3f6] mb-2 group-hover:text-[#67e8f9] transition-colors">{p.title}</h3>
                  <p className="text-sm text-[#8b98a5] leading-relaxed">{cms?.productDescriptions?.[p.key]}</p>
                  <div className="mt-4 text-[#22d3ee] font-tech text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 group-hover:gap-3 transition-all">Learn more <ArrowRight className="h-4 w-4" /></div>
                </div>
              </SpotCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function ProductDetail({ productKey, setRoute, cms }) {
  const p = PRODUCTS.find(x => x.key === productKey)
  if (!p) return <div className="bg-[#06090d] min-h-screen"><div className="container mx-auto px-4 py-16 text-white">Product not found.</div></div>
  return (
    <div className="bg-[#06090d]">
      <section className="relative text-white overflow-hidden">
        <Orbs />
        <div className="relative container mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <button onClick={() => setRoute('products')} className="text-[#8b98a5] hover:text-[#67e8f9] text-sm mb-6 flex items-center transition-colors"><ArrowLeft className="h-4 w-4 mr-1" /> All Products</button>
            <Eyebrow>Product</Eyebrow>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-5 tracking-tight text-[#eef3f6]">{p.title}</h1>
            <p className="text-[#8b98a5] mb-8 text-lg font-light leading-relaxed">{cms?.productDescriptions?.[p.key]}</p>
            <Button size="lg" onClick={() => setRoute('rfq')} className="btn-servo font-tech uppercase tracking-[0.18em] text-sm h-12 px-8 rounded-full">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_-20px_rgba(34,211,238,0.45)]">
              <ResponsiveImage src={p.img} alt={p.title} className="w-full aspect-[4/3] object-cover" whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090d]/50 to-transparent" />
            </div>
          </FadeIn>
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#080d13]">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[['±0.002 mm', 'Grinding tolerance'], ['AGMA Q12', 'Gear quality grade'], ['1200 mm', 'Max outside diameter'], ['6+', 'Material families']].map(([v, l]) => (
            <div key={l} className="flex items-center gap-3">
              <div className="font-display text-2xl font-bold text-servo whitespace-nowrap">{v}</div>
              <div className="font-tech text-[10px] uppercase tracking-[0.18em] text-[#8b98a5] leading-relaxed">{l}</div>
            </div>
          ))}
        </div>
      </section>
      <FadeIn>
        <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
          {[
            { title: 'Typical Applications', items: p.apps },
            { title: 'Available Materials', items: ['Alloy Steel (4140, 4340, 8620)','Carbon Steel','Stainless Steel','Bronze','Cast Iron','Custom on request'] },
            { title: 'Manufacturing Options', items: ['Gear cutting & hobbing','Precision grinding','Heat treatment','CMM inspection','Lapping & finishing'] }
          ].map((col, i) => (
            <GlowCard key={i}>
              <h3 className="font-display font-bold text-[#eef3f6] mb-4 text-lg">{col.title}</h3>
              <ul className="space-y-2.5 text-[#8b98a5] text-sm">{col.items.map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-[#22d3ee] mt-0.5 shrink-0" /> {a}</li>)}</ul>
            </GlowCard>
          ))}
        </section>
      </FadeIn>
      <section className="container mx-auto px-4 pb-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <h3 className="font-display font-bold text-[#eef3f6] text-2xl tracking-tight">Gallery</h3>
          <Button variant="outline" onClick={() => setRoute('gallery')} className="rounded-full border-white/25 text-white bg-white/5 hover:bg-white hover:text-black font-tech uppercase tracking-[0.18em] text-xs">View all <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GALLERY.slice(0, 4).map(photo => (
            <button key={photo.src} onClick={() => setRoute('gallery')} className="rounded-xl overflow-hidden border border-white/10 bg-black hover:border-[#22d3ee]/60 transition-colors cursor-pointer">
              <ResponsiveImage src={photo.src} alt={photo.alt} className="aspect-square w-full h-full object-contain" whileHover={{ scale: 1.03 }} />
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
    <div className="bg-[#06090d]">
      <section className="relative text-white py-24 overflow-hidden">
        <Orbs />
        <GridBg />
        <div className="relative container mx-auto px-4"><FadeIn>
          <Eyebrow>Capabilities</Eyebrow>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5 tracking-tight text-[#eef3f6]">Manufacturing <span className="text-servo">Capabilities</span></h1>
          <p className="text-[#8b98a5] max-w-2xl text-lg font-light">A complete in-house manufacturing suite from raw material through inspection.</p>
        </FadeIn></div>
      </section>
      <section className="container mx-auto px-4 pb-24 space-y-16">
        {sections.map((s, i) => (
          <FadeIn key={i}>
            <div className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <ResponsiveImage src={s.img} alt={s.title} className="w-full aspect-video object-cover" whileHover={{ scale: 1.04 }} transition={{ duration: 0.6 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090d]/70 via-transparent to-transparent" />
                <div className="absolute inset-0 rounded-2xl border border-[#22d3ee]/0 group-hover:border-[#22d3ee]/50 transition-colors duration-500" />
              </div>
              <div>
                <div className="font-display text-7xl md:text-8xl font-bold text-stroke-faint leading-none mb-5 select-none" aria-hidden>{String(i + 1).padStart(2, '0')}</div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-[#eef3f6] mb-4 tracking-tight">{s.title}</h2>
                <p className="text-[#8b98a5] text-lg leading-relaxed font-light">{s.desc}</p>
              </div>
            </div>
          </FadeIn>
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
    <div className="bg-[#06090d] min-h-screen">
    <div className="container mx-auto px-4 py-20">
      <FadeIn>
        <Eyebrow>Gallery</Eyebrow>
        <h1 className="font-display text-5xl font-bold text-[#eef3f6] mb-4 tracking-tight">Inside our <span className="text-servo">workshop</span></h1>
        <p className="text-[#8b98a5] mb-12 text-lg max-w-2xl font-light">Photos of our equipment, machining work, and gear components. Click any photo to enlarge it.</p>
      </FadeIn>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY.map((photo, i) => (
          <motion.figure key={photo.src} variants={fadeUp} whileHover={{ y: -3 }} onClick={() => setLightbox(i)} className="rounded-2xl overflow-hidden bg-[#0a1016]/90 border border-white/10 backdrop-blur-sm cursor-pointer hover:border-[#22d3ee]/60 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.4)] transition-all">
            <div className="aspect-square bg-black"><ResponsiveImage src={photo.src} alt={photo.alt} className="w-full h-full object-contain" /></div>
            <figcaption className="px-3 py-2.5 text-sm font-medium text-[#8b98a5]">{photo.caption}</figcaption>
          </motion.figure>
        ))}
      </motion.div>
      <AnimatePresence>
        {active && createPortal((
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <button aria-label="Close" onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition">
              <X className="h-6 w-6" />
            </button>
            <button aria-label="Previous photo" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY.length) % GALLERY.length) }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <motion.img key={active.src} src={active.src} alt={active.alt} onClick={e => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}
              className="max-h-[82vh] max-w-[94vw] rounded-xl shadow-2xl object-contain" />
            <button aria-label="Next photo" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY.length) }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition">
              <ArrowRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-white/10 rounded-full px-4 py-1.5 whitespace-nowrap">
              {active.caption} · {lightbox + 1} of {GALLERY.length}
            </div>
          </motion.div>
        ), document.body)}
      </AnimatePresence>
    </div>
    </div>
  )
}

function AboutPage({ cms }) {
  return (
    <div className="bg-[#06090d]">
      <section className="relative py-24 overflow-hidden">
        <Orbs />
        <div className="relative container mx-auto px-4 max-w-4xl">
          <FadeIn>
            <Eyebrow>About us</Eyebrow>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-[#eef3f6] mb-10 tracking-tight">{cms?.aboutTitle || 'About Vijaya Engineering Works'}</h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-10">
              <ResponsiveImage src={IMG_2} alt="Precision gears manufactured by Vijaya Engineering Works" className="w-full aspect-[21/9] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090d]/80 via-transparent to-transparent" />
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-[#cfd8de] text-lg leading-relaxed whitespace-pre-line font-light">{cms?.aboutText}</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-3 gap-4 mt-12">
              {[
                { v: <Counter to={30} suffix="+" />, l: 'Years' },
                { v: 'Q12', l: 'AGMA grade' },
                { v: <Counter to={1200} suffix=" mm" />, l: 'Max OD' },
              ].map((s, i) => (
                <GlowCard key={i} className="text-center p-5">
                  <div className="font-display text-2xl md:text-3xl font-bold text-servo">{s.v}</div>
                  <div className="font-tech text-[11px] uppercase tracking-[0.18em] text-[#8b98a5] mt-1">{s.l}</div>
                </GlowCard>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

function ContactPage({ cms }) {
  const [contact, setContact] = useState({ name: '', email: '', message: '' })
  const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cms?.email || '') ? cms.email : null
  function composeContact(e) {
    e.preventDefault()
    if (!contactEmail) { toast.error('Contact email is temporarily unavailable'); return }
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent('Website enquiry from ' + contact.name)}&body=${encodeURIComponent(contact.message + '\n\nFrom: ' + contact.name + '\nEmail: ' + contact.email)}`
  }
  const infoRows = [
    { icon: Phone, label: 'Phone', body: cms?.phone ? <a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`} className="text-white hover:text-[#67e8f9] transition-colors">{cms.phone}</a> : 'Please use a quote request to contact us.' },
    { icon: Mail, label: 'Email', body: contactEmail ? <a href={`mailto:${contactEmail}`} className="break-all text-white hover:text-[#67e8f9] transition-colors">{contactEmail}</a> : 'Contact email is being updated.' },
    { icon: MapPin, label: 'Address', body: <>{cms?.address}<div><a href={COMPANY_MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">View our location on Google Maps</a></div></> },
    { icon: Globe2, label: 'Website', body: <a href={COMPANY_URL} className="break-all text-white hover:text-[#67e8f9] transition-colors">vijayaengineeringworks.com</a> },
    { icon: Building2, label: 'Hours', body: cms?.hours },
  ]
  return (
    <div className="bg-[#06090d] min-h-screen">
    <div className="container mx-auto px-4 py-20">
      <FadeIn>
        <Eyebrow>Contact</Eyebrow>
        <h1 className="font-display text-5xl font-bold text-[#eef3f6] mb-4 tracking-tight">Contact <span className="text-servo">Us</span></h1>
        <p className="text-[#8b98a5] mb-10 text-lg font-light max-w-2xl">Tell us about your project — we reply to every enquiry.</p>
      </FadeIn>
      <div className="grid md:grid-cols-2 gap-8">
        <FadeIn><div className="space-y-3">
          {infoRows.map((r, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0a1016]/90 backdrop-blur-sm p-5 hover:border-[#22d3ee]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22d3ee]/25 to-[#22d3ee]/5 border border-[#22d3ee]/40 flex items-center justify-center shrink-0">
                <r.icon className="h-5 w-5 text-[#67e8f9]" />
              </div>
              <div className="min-w-0"><div className="font-tech text-[11px] uppercase tracking-[0.18em] text-[#8b98a5] mb-1">{r.label}</div><div className="text-[#cfd8de]">{r.body}</div></div>
            </div>
          ))}
        </div></FadeIn>
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-white/10 bg-[#0a1016]/90 backdrop-blur-sm p-6 md:p-8">
            <form onSubmit={composeContact} className="space-y-4">
              <label className="block text-sm text-[#cfd8de]">Name<Input required placeholder="Your name" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} className="mt-1.5" /></label>
              <label className="block text-sm text-[#cfd8de]">Email<Input required type="email" placeholder="you@example.com" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} className="mt-1.5" /></label>
              <label className="block text-sm text-[#cfd8de]">Message<Textarea required placeholder="How can we help?" rows={4} value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} className="mt-1.5" /></label>
              <Button disabled={!contactEmail} className="btn-servo font-tech uppercase tracking-[0.18em] text-sm w-full rounded-full h-12">Compose email</Button>
              <p className="text-xs text-[#8b98a5]">Opens your email app so you can review and send your message.</p>
            </form>
          </div>
        </FadeIn>
      </div>
    </div>
    </div>
  )
}

// ============== LOGIN / SIGNUP ==============
function LoginPage({ setRoute, auth, authAction, clearAuthAction }) {
  const [mode, setMode] = useState(authAction?.type || 'login')
  const [form, setForm] = useState({ identifier: '', password: '', confirmPassword: '', email: '', phone: '', firstName: '', lastName: '', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [welcome, setWelcome] = useState(null) // { name, isNew }
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (authAction) setMode(authAction.type)
  }, [authAction])

  async function confirmEmail() {
    setLoading(true); setActionError(''); setActionMessage('')
    try {
      const r = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: authAction?.token }) })
      const d = await r.json()
      if (!r.ok) { setActionError(d.error || 'Email verification failed'); return }
      setActionMessage(d.message)
    } catch (e) { setActionError(e.message) } finally { setLoading(false) }
  }

  async function resendVerification() {
    const email = (form.email || form.identifier).trim()
    if (!email || !email.includes('@')) { toast.error('Enter your email address'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await r.json(); if (!r.ok) { toast.error(d.error || 'Unable to resend verification'); return }
      setMode('verification-sent'); setActionMessage(d.message)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        try {
          const u = await auth.login(form.identifier, form.password)
          setWelcome({ name: u.firstName || 'there', isNew: false, role: u.role })
        } catch (error) {
          if (error.code === 'EMAIL_NOT_VERIFIED') { setForm({ ...form, email: form.identifier.includes('@') ? form.identifier : '' }); setMode('unverified'); return }
          toast.error(error.message)
          return
        }
      } else if (mode === 'signup') {
        if (!form.email || !form.phone) { toast.error('Email and phone are both required'); setLoading(false); return }
        const d = await auth.signup(form)
        setActionMessage(d.message); setMode('verification-sent')
      } else if (mode === 'forgot') {
        const r = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: form.identifier }) })
        const d = await r.json(); if (!r.ok) { toast.error(d.error || 'Unable to request password reset'); return }
        setActionMessage(d.message); setMode('reset-sent')
      } else if (mode === 'reset') {
        if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
        const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: authAction?.token, password: form.password }) })
        const d = await r.json(); if (!r.ok) { toast.error(d.error || 'Unable to reset password'); return }
        await auth.logout(); toast.success(d.message); clearAuthAction?.(); setForm({ ...form, password: '', confirmPassword: '' }); setMode('login')
      }
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  function continueAfterWelcome() {
    setRoute(isStaff(welcome) ? 'admin' : 'portal')
  }

  const titles = {
    login: 'Sign in to your account', signup: 'Create your VEW account', forgot: 'Reset your password',
    reset: 'Choose a new password', verify: 'Verify your email', unverified: 'Verify your email first',
    'verification-sent': 'Check your email', 'reset-sent': 'Check your email',
  }
  const descriptions = {
    login: 'Track your RFQs and production progress in real-time.', signup: 'Get instant quotes and live production tracking.',
    forgot: 'Enter your email to receive reset instructions.', reset: 'Enter a secure new password for your account.',
    verify: 'Confirm below to verify your email address.', unverified: 'We sent a verification link to your email address.',
    'verification-sent': 'Open the verification link before signing in.', 'reset-sent': 'Open the password-reset link sent to your email.',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1.05fr_1fr] bg-[#06090d]">
      {/* ============ BRAND PANEL ============ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16 text-white">
        <div className="absolute inset-0">
          <ResponsiveImage src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06090d]/85 via-[#06090d]/92 to-[#06090d]" />
        </div>
        <div className="absolute inset-0"><Orbs /></div>
        <div className="relative flex items-center gap-3">
          <GearLogo className="h-10 w-10" spin />
          <div>
            <div className="font-display font-bold text-lg tracking-tight">Vijaya Engineering Works</div>
            <div className="font-tech text-[10px] uppercase tracking-[0.3em] text-[#67e8f9]">VEW · Precision Gears</div>
          </div>
        </div>
        <div className="relative">
          <div className="font-tech text-[11px] uppercase tracking-[0.42em] text-[#22d3ee] mb-6">{'// Customer portal'}</div>
          <h2 className="font-display text-5xl xl:text-6xl font-bold tracking-tight leading-[1.02] mb-6">
            Every gear.<br />
            <span className="text-servo">Every stage.</span><br />
            <span className="text-stroke">Live.</span>
          </h2>
          <p className="text-[#8b98a5] text-lg font-light max-w-md leading-relaxed">
            Submit RFQs, approve quotes, and watch your gears move through ten production stages — in real time.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-md border-t border-white/10 pt-8">
            {[['30+', 'Years cutting'], ['Q12', 'AGMA grade'], ['±0.002', 'mm tolerance']].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-3xl font-bold text-[#eef3f6]">{v}</div>
                <div className="font-tech text-[10px] uppercase tracking-[0.22em] text-[#8b98a5] mt-1.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative font-tech text-[10px] uppercase tracking-[0.32em] text-[#8b98a5]">ISO 9001 · AGMA Q12 · 1200 mm max OD</div>
      </div>

      {/* ============ FORM PANEL ============ */}
      <div className="relative bg-white flex items-center justify-center px-6 py-12 sm:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,211,238,0.07),transparent)]" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <GearLogo className="h-9 w-9" spin />
            <div className="font-display font-bold text-slate-900 tracking-tight">Vijaya Engineering Works</div>
          </div>
          <div className="font-tech text-[11px] uppercase tracking-[0.32em] text-cyan-600 mb-4">
            {'// '}{mode === 'signup' ? 'Create account' : mode === 'login' ? 'Welcome back' : 'Account access'}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 mb-3">{titles[mode] || titles.login}</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">{descriptions[mode] || descriptions.login}</p>

          {['login','signup','forgot','reset'].includes(mode) && <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-slate-900 font-medium">First Name *</Label><Input required className="mt-1.5 h-12 rounded-xl" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><Label className="text-slate-900 font-medium">Last Name *</Label><Input required className="mt-1.5 h-12 rounded-xl" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
              </div>
              <div><Label className="text-slate-900 font-medium">Company Name</Label><Input className="mt-1.5 h-12 rounded-xl" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
              <div><Label className="text-slate-900 font-medium">Email *</Label>
                <div className="relative mt-1.5"><Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-4" />
                  <Input required type="email" className="pl-10 h-12 rounded-xl" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div><Label className="text-slate-900 font-medium">Phone *</Label>
                <div className="relative mt-1.5"><Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-4" />
                  <Input required type="tel" className="pl-10 h-12 rounded-xl" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="text-xs text-slate-500 mt-1.5">You&apos;ll be able to sign in with either email or phone.</div>
              </div>
            </>}
            {(mode === 'login' || mode === 'forgot') && (
              <div><Label className="text-slate-900 font-medium">{mode === 'forgot' ? 'Email address' : 'Email or Phone'}</Label>
                <div className="relative mt-1.5"><User className="h-4 w-4 text-slate-400 absolute left-3.5 top-4" />
                  <Input aria-label={mode === 'forgot' ? 'Email address' : 'Email or phone'} autoComplete="username" required type={mode === 'forgot' ? 'email' : 'text'} className="pl-10 h-12 rounded-xl" placeholder={mode === 'forgot' ? 'you@company.com' : 'Email address or phone number'} value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} />
                </div>
              </div>
            )}
            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-900 font-medium">Password{mode === 'signup' && ' *'}</Label>
                  {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-xs text-cyan-600 font-semibold hover:underline">Forgot password?</button>}
                </div>
                <Input aria-label="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? undefined : 8} maxLength={128} type="password" className="mt-1.5 h-12 rounded-xl" placeholder={mode === 'signup' || mode === 'reset' ? 'At least 8 characters' : ''} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            {mode === 'reset' && <div><Label className="text-slate-900 font-medium">Confirm new password</Label><Input aria-label="Confirm new password" autoComplete="new-password" required minLength={8} type="password" className="mt-1.5 h-12 rounded-xl" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></div>}
            <div className="pt-2">
              <Button disabled={loading} type="submit" className="btn-servo w-full h-12 rounded-full font-tech uppercase tracking-[0.18em] text-sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Update Password' : 'Send Reset Instructions'}
              </Button>
            </div>
          </form>}
          {mode === 'verify' && <div className="text-center py-6 space-y-4">
            {loading && <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />}
            {!loading && !actionMessage && !actionError && <Button onClick={confirmEmail} className="btn-servo rounded-full">Verify email address</Button>}
            {actionMessage && <><CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" /><p className="text-sm text-slate-700">{actionMessage}</p><Button onClick={() => { clearAuthAction?.(); setMode('login') }} className="rounded-full bg-slate-900">Continue to sign in</Button></>}
            {actionError && <><p className="text-sm text-red-600">{actionError}</p><Button variant="outline" onClick={() => { clearAuthAction?.(); setMode('login') }} className="rounded-full">Return to sign in</Button></>}
          </div>}
          {['verification-sent','reset-sent'].includes(mode) && <div className="text-center py-6 space-y-4"><div className="inline-flex bg-cyan-100 text-cyan-600 rounded-full p-4"><Mail className="h-8 w-8" /></div><p className="text-sm text-slate-700">{actionMessage}</p><Button variant="outline" onClick={() => setMode('login')} className="rounded-full">Back to sign in</Button></div>}
          {mode === 'unverified' && <div className="text-center py-6 space-y-4"><div className="inline-flex bg-cyan-100 text-cyan-600 rounded-full p-4"><Mail className="h-8 w-8" /></div><p className="text-sm text-slate-700">Your account must be verified before you can sign in.</p><Input aria-label="Email to verify" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Your email address" className="h-12 rounded-xl" /><Button disabled={loading} onClick={resendVerification} className="btn-servo rounded-full">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend verification email'}</Button></div>}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600 space-y-2.5">
            {mode === 'login' && <div>New to VEW? <button onClick={() => setMode('signup')} className="text-cyan-600 font-semibold hover:underline">Create an account</button></div>}
            {mode === 'login' && <div><button onClick={() => setMode('unverified')} className="text-slate-500 hover:text-cyan-600 font-medium">Resend verification email</button></div>}
            {['unverified','reset'].includes(mode) && <div><button onClick={() => { clearAuthAction?.(); setMode('login') }} className="text-cyan-600 font-semibold hover:underline">Back to sign in</button></div>}
            {mode === 'signup' && <div>Already have an account? <button onClick={() => setMode('login')} className="text-cyan-600 font-semibold hover:underline">Sign in</button></div>}
            {mode === 'forgot' && <div><button onClick={() => setMode('login')} className="text-cyan-600 font-semibold hover:underline">← Back to sign in</button></div>}
          </div>
          <div className="text-center text-xs text-slate-400 mt-8">Protected by password hashing (scrypt). Your credentials are never stored in plain text.</div>
        </motion.div>
      </div>

      {/* Welcome modal */}
      <Dialog open={!!welcome} onOpenChange={o => !o && setWelcome(null)}>
        <DialogContent className="max-w-sm text-center rounded-3xl">
          <DialogHeader>
            <div className="mx-auto mb-3">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex rounded-full p-4 text-white shadow-[0_10px_40px_-10px_rgba(34,211,238,0.6)]" style={{ background: 'linear-gradient(135deg,#a5f3fc,#22d3ee 50%,#0e7490)' }}>
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
            </div>
            <div className="font-tech text-[10px] uppercase tracking-[0.3em] text-cyan-600 mb-2">{'// Signed in'}</div>
            <DialogTitle className="text-center font-display text-3xl tracking-tight">
              {welcome?.isNew ? `Welcome, ${welcome?.name}!` : `Welcome back, ${welcome?.name}!`}
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {welcome?.isNew
                ? "Your account is ready. Submit RFQs and track every stage of production live."
                : isStaff(welcome) ? 'Signed in as administrator.' : "You're signed in. Continue to your portal to see all your RFQs and orders."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={continueAfterWelcome} className="btn-servo w-full rounded-full h-12 mt-2 font-tech uppercase tracking-[0.18em] text-sm">
            {isStaff(welcome) ? 'Go to Admin Dashboard' : 'Continue to My Portal'} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogContent>
      </Dialog>
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
  const [resetTarget, setResetTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [newPw, setNewPw] = useState('')

  async function toggle(u) {
    if (isStaff(u)) { toast.error("Can't disable admin"); return }
    const result = await api().patch(`/api/admin/users/${u.id}/toggle`, {}); if (result.error) return
    toast.success(u.isActive ? 'User disabled' : 'User re-enabled')
    load()
  }
  async function doReset() {
    if (!newPw || newPw.length < 8) { toast.error('At least 8 characters'); return }
    const r = await api().post(`/api/admin/users/${resetTarget.id}/reset-password`, { password: newPw })
    if (r.success) { toast.success('Password reset'); setResetTarget(null); setNewPw('') }
    else toast.error(r.error)
  }
  async function saveCustomer(e) {
    e.preventDefault()
    const result = await api().patch(`/api/admin/users/${editTarget.id}`, editTarget)
    if (result.error) return
    toast.success('Customer updated'); setEditTarget(null); load()
  }
  async function deleteCustomer(u) {
    if (!window.confirm(`Delete the customer account for ${u.email}? Sign-in will be disabled and RFQ history retained.`)) return
    const result = await api().delete(`/api/admin/users/${u.id}`)
    if (!result.error) { toast.success('Customer account removed'); load() }
  }
  async function impersonate(u) {
    if (isStaff(u)) { toast.error("Can't impersonate another admin"); return }
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
          <div className="text-sm text-slate-500">Customer & admin accounts · {users.length} on this page</div>
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
                  <Badge className={isStaff(u) ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{u.rfqCount}</td>
                <td className="px-4 py-3">
                  <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {u.role === 'customer' && (
                      <>
                        {auth.user?.role === 'owner' && <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => impersonate(u)} title="Sign in as this customer">
                          <ShieldCheck className="h-3 w-3 mr-1" />View as customer
                        </Button>}
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => setResetTarget(u)}>
                          <Pencil className="h-3 w-3 mr-1" />Reset
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditTarget(u)}>Edit</Button>
                        <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => deleteCustomer(u)}>Delete</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => toggle(u)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && !userList.loading && !userList.error && <tr><td colSpan="7" className="p-10 text-center text-slate-500">No users found.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
      <ListPager list={userList} label="Users" />
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}><DialogContent><DialogHeader><DialogTitle>Edit customer details</DialogTitle></DialogHeader>{editTarget && <form onSubmit={saveCustomer} className="space-y-3">{[['firstName','First name'],['lastName','Last name'],['companyName','Company'],['phone','Phone']].map(([key,label]) => <label key={key} className="block text-sm">{label}<Input value={editTarget[key] || ''} onChange={e => setEditTarget({ ...editTarget, [key]: e.target.value })} /></label>)}<p className="text-sm text-slate-500">Email and staff access cannot be changed here.</p><Button type="submit">Save customer</Button></form>}</DialogContent></Dialog>
      <Dialog open={!!resetTarget} onOpenChange={o => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password for {resetTarget?.firstName} {resetTarget?.lastName}</DialogTitle><DialogDescription>Set a temporary customer password and share it securely.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="text-sm text-slate-600">Set a temporary password and share it securely with the customer.</div>
            <Label>New Password</Label>
            <Input type="password" placeholder="At least 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
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
    const verifyToken = params.get('verify')
    const resetToken = params.get('reset')
    const inviteToken = params.get('invite')
    if (verifyToken || resetToken || inviteToken) window.history.replaceState({}, '', window.location.pathname)
    if (verifyToken) { setAuthAction({ type: 'verify', token: verifyToken }); setRoute('login') }
    else if (resetToken) { setAuthAction({ type: 'reset', token: resetToken }); setRoute('login') }
    else if (inviteToken) { setAuthAction({ type: 'invite', token: inviteToken }); setRoute('invite') }
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
  const isPublicRoute = route === 'home' || route === 'products' || route.startsWith('product:') || route === 'capabilities' || route === 'gallery' || route === 'about' || route === 'contact'
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
  else if (route === 'contact') content = <ContactPage cms={cms} />
  else if (route === 'rfq') content = <RfqWizard setRoute={goRoute} auth={auth} />
  else if (route === 'login') content = <LoginPage setRoute={goRoute} auth={auth} authAction={authAction} clearAuthAction={clearAuthAction} />
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

