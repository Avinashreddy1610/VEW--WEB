'use client'
import { useState, useEffect } from 'react'
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
  Package, TrendingUp, Send, Download, RefreshCw, Building2, LogIn
} from 'lucide-react'

const HERO_IMG = 'https://images.unsplash.com/photo-1524514587686-e2909d726e9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_2 = 'https://images.unsplash.com/photo-1563641749712-028dfeab14b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_3 = 'https://images.unsplash.com/photo-1567093322102-6bdd32fba67d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxpbmR1c3RyaWFsJTIwZ2VhcnN8ZW58MHx8fGJsYWNrfDE3ODg0ODg4MTJ8MA&ixlib=rb-4.1.0&q=85'
const IMG_4 = 'https://images.unsplash.com/photo-1565954786194-d22abeaac3ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxnZWFyJTIwbWFudWZhY3R1cmluZ3xlbnwwfHx8YmxhY2t8MTc4ODQ4ODgxMnww&ixlib=rb-4.1.0&q=85'
const IMG_CNC = 'https://images.unsplash.com/photo-1652888510609-ed2d2ad64d6b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwzfHxDTkMlMjBtYWNoaW5lfGVufDB8fHxibGFja3wxNzg4NDg4ODE3fDA&ixlib=rb-4.1.0&q=85'
const IMG_CNC2 = 'https://images.unsplash.com/photo-1548683726-203119be6a39?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxDTkMlMjBtYWNoaW5lfGVufDB8fHxibGFja3wxNzg4NDg4ODE3fDA&ixlib=rb-4.1.0&q=85'

const GEAR_TYPES = ['Spiral Bevel Gear','Spiral Bevel Pinion','Spiral Bevel Gear Set','Straight Bevel Gear','Helical Gear','Spur Gear','Other Custom Gear']

const PRODUCTS = [
  { key: 'spiral-bevel', title: 'Spiral Bevel Gears', img: HERO_IMG, desc: 'Precision spiral bevel gears for high-torque, smooth power transmission at angled shafts.', apps: ['Automotive differentials','Aerospace gearboxes','Marine drives','Heavy machinery'] },
  { key: 'spiral-bevel-pinion', title: 'Spiral Bevel Pinions', img: IMG_2, desc: 'Matched spiral bevel pinions manufactured to Gleason and Klingelnberg standards.', apps: ['Ring & pinion sets','Axle assemblies','Industrial reducers'] },
  { key: 'helical', title: 'Helical Gears', img: IMG_3, desc: 'Ground and cut helical gears delivering high load capacity with quiet operation.', apps: ['Wind turbines','Industrial reducers','Machine tools','Conveyors'] },
  { key: 'spur', title: 'Spur Gears', img: IMG_4, desc: 'Precision spur gears in all module and DP ranges, hardened and ground on request.', apps: ['Pumps & compressors','Automation','Robotics','Timing systems'] },
  { key: 'gear-sets', title: 'Custom Gear Sets', img: IMG_CNC, desc: 'Fully matched gear sets — lapped, tested, and serialized for guaranteed performance.', apps: ['OEM replacements','Custom drivetrains','Prototypes'] },
]

const CAPABILITIES = [
  { icon: Cog, title: 'Gear Cutting', desc: 'Hobbing, shaping, and generating up to 1200 mm OD.' },
  { icon: Wrench, title: 'Gear Grinding', desc: 'AGMA Q12 / DIN 4 quality grinding on profile & form.' },
  { icon: Factory, title: 'CNC Turning & Milling', desc: 'Multi-axis CNC machining of blanks and complex parts.' },
  { icon: Ruler, title: 'Metrology & Inspection', desc: 'CMM inspection, gear analytical checks, full reports.' },
  { icon: ShieldCheck, title: 'Heat Treatment', desc: 'Carburizing, nitriding, induction — coordinated & verified.' },
  { icon: Package, title: 'Prototype to Production', desc: 'From 1-off prototypes to full production batches.' },
]

const STATUSES = ['Submitted','Under Review','Engineering Review','Need More Information','Quote Prepared','Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed','Cancelled']

const STATUS_COLORS = {
  'Submitted': 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-amber-100 text-amber-800',
  'Engineering Review': 'bg-amber-100 text-amber-800',
  'Need More Information': 'bg-orange-100 text-orange-800',
  'Quote Prepared': 'bg-purple-100 text-purple-800',
  'Quote Sent': 'bg-purple-100 text-purple-800',
  'Customer Approved': 'bg-emerald-100 text-emerald-800',
  'Order Confirmed': 'bg-emerald-100 text-emerald-800',
  'In Production': 'bg-indigo-100 text-indigo-800',
  'Quality Inspection': 'bg-indigo-100 text-indigo-800',
  'Ready to Ship': 'bg-teal-100 text-teal-800',
  'Shipped': 'bg-teal-100 text-teal-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
}

const SPEC_FIELDS = {
  bevel: [
    { key: 'gearOrPinion', label: 'Gear or Pinion', type: 'select', options: ['Gear','Pinion'] },
    { key: 'numberOfTeeth', label: 'Number of Teeth' },
    { key: 'matingGearTeeth', label: 'Mating Gear Teeth' },
    { key: 'module', label: 'Module (mm)' },
    { key: 'diametralPitch', label: 'Diametral Pitch' },
    { key: 'pressureAngle', label: 'Pressure Angle (°)' },
    { key: 'spiralAngle', label: 'Spiral Angle (°)' },
    { key: 'pitchDiameter', label: 'Pitch Diameter' },
    { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'faceWidth', label: 'Face Width' },
    { key: 'pitchConeAngle', label: 'Pitch Cone Angle (°)' },
    { key: 'shaftAngle', label: 'Shaft Angle (°)' },
    { key: 'handOfSpiral', label: 'Hand of Spiral', type: 'select', options: ['Left','Right'] },
    { key: 'gearRatio', label: 'Gear Ratio' },
    { key: 'mountingDistance', label: 'Mounting Distance' },
    { key: 'backlash', label: 'Backlash' },
    { key: 'toothDepth', label: 'Tooth Depth' },
    { key: 'wholeDepth', label: 'Whole Depth' },
    { key: 'addendum', label: 'Addendum' },
    { key: 'dedendum', label: 'Dedendum' },
    { key: 'rootDiameter', label: 'Root Diameter' },
    { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'hubDiameter', label: 'Hub Diameter' },
    { key: 'hubLength', label: 'Hub Length' },
    { key: 'keyway', label: 'Keyway' },
    { key: 'spline', label: 'Spline Info' },
    { key: 'manufacturerStandard', label: 'Gear Manufacturer Standard', type: 'select', options: ['Gleason','Klingelnberg','Custom'] },
  ],
  helical: [
    { key: 'numberOfTeeth', label: 'Number of Teeth' },
    { key: 'module', label: 'Module (mm)' },
    { key: 'diametralPitch', label: 'Diametral Pitch' },
    { key: 'normalModule', label: 'Normal Module' },
    { key: 'pressureAngle', label: 'Pressure Angle (°)' },
    { key: 'helixAngle', label: 'Helix Angle (°)' },
    { key: 'helixDirection', label: 'Helix Direction', type: 'select', options: ['Left','Right'] },
    { key: 'pitchDiameter', label: 'Pitch Diameter' },
    { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'rootDiameter', label: 'Root Diameter' },
    { key: 'faceWidth', label: 'Face Width' },
    { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'gearQuality', label: 'Gear Quality (AGMA/DIN)' },
    { key: 'backlash', label: 'Backlash' },
    { key: 'keyway', label: 'Keyway' },
    { key: 'spline', label: 'Spline Info' },
  ],
  spur: [
    { key: 'numberOfTeeth', label: 'Number of Teeth' },
    { key: 'module', label: 'Module (mm)' },
    { key: 'diametralPitch', label: 'Diametral Pitch' },
    { key: 'pressureAngle', label: 'Pressure Angle (°)' },
    { key: 'pitchDiameter', label: 'Pitch Diameter' },
    { key: 'outsideDiameter', label: 'Outside Diameter' },
    { key: 'rootDiameter', label: 'Root Diameter' },
    { key: 'faceWidth', label: 'Face Width' },
    { key: 'boreDiameter', label: 'Bore Diameter' },
    { key: 'gearQuality', label: 'Gear Quality (AGMA/DIN)' },
    { key: 'backlash', label: 'Backlash' },
    { key: 'keyway', label: 'Keyway' },
    { key: 'spline', label: 'Spline Info' },
  ],
  custom: [
    { key: 'description', label: 'Describe the Gear', type: 'textarea' },
    { key: 'numberOfTeeth', label: 'Number of Teeth' },
    { key: 'module', label: 'Module' },
    { key: 'majorDimensions', label: 'Major Dimensions' },
  ],
}

function specGroupForType(gearType) {
  if (!gearType) return 'custom'
  if (gearType.includes('Bevel')) return 'bevel'
  if (gearType.includes('Helical')) return 'helical'
  if (gearType === 'Spur Gear') return 'spur'
  return 'custom'
}

function GearLogo({ className = 'h-8 w-8' }) {
  return <Cog className={className + ' text-amber-500'} strokeWidth={2.2} />
}

function Nav({ route, setRoute, mobileOpen, setMobileOpen }) {
  const links = [
    { key: 'home', label: 'Home' },
    { key: 'products', label: 'Products' },
    { key: 'capabilities', label: 'Capabilities' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
    { key: 'portal', label: 'Customer Portal' },
    { key: 'admin', label: 'Admin' },
  ]
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setRoute('home')} className="flex items-center gap-2">
          <GearLogo />
          <div className="text-white text-left">
            <div className="font-bold tracking-tight leading-none">PrecisionGear</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mt-0.5">Industries</div>
          </div>
        </button>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <button key={l.key} onClick={() => setRoute(l.key)}
              className={`px-3 py-2 text-sm rounded-md transition ${route === l.key ? 'text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold hidden sm:inline-flex">
            Request a Quote
          </Button>
          <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map(l => (
              <button key={l.key} onClick={() => { setRoute(l.key); setMobileOpen(false) }}
                className={`px-3 py-2 text-left rounded-md ${route === l.key ? 'text-amber-400 bg-slate-800' : 'text-slate-300'}`}>
                {l.label}
              </button>
            ))}
            <Button onClick={() => { setRoute('rfq'); setMobileOpen(false) }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold mt-2">Request a Quote</Button>
          </div>
        </div>
      )}
    </header>
  )
}

function Footer({ setRoute }) {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-24">
      <div className="container mx-auto px-4 py-14 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GearLogo />
            <div className="text-white font-bold">PrecisionGear Industries</div>
          </div>
          <p className="text-sm">Custom precision gear manufacturing from your drawings and specifications.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Products</div>
          <ul className="space-y-2 text-sm">
            {PRODUCTS.map(p => <li key={p.key}><button onClick={() => setRoute('product:' + p.key)} className="hover:text-amber-400">{p.title}</button></li>)}
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setRoute('about')} className="hover:text-amber-400">About Us</button></li>
            <li><button onClick={() => setRoute('capabilities')} className="hover:text-amber-400">Capabilities</button></li>
            <li><button onClick={() => setRoute('contact')} className="hover:text-amber-400">Contact</button></li>
            <li><button onClick={() => setRoute('rfq')} className="hover:text-amber-400">Request a Quote</button></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 013-8842</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> sales@precisiongear.co</li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> 1420 Foundry Way,<br/>Cleveland, OH 44115</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs">
        © {new Date().getFullYear()} PrecisionGear Industries. All rights reserved.
      </div>
    </footer>
  )
}

function HomePage({ setRoute }) {
  return (
    <div>
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Industrial gears" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-900/40" />
        </div>
        <div className="relative container mx-auto px-4 py-24 lg:py-32 max-w-4xl">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-5 hover:bg-amber-500/20">ISO 9001 · AGMA Q12 Capable</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5">
            Precision Gears Built to Your <span className="text-amber-400">Specifications</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
            Custom spiral bevel gears, pinions, helical gears, spur gears, and precision gear sets manufactured from your drawings and specifications.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              Request a Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setRoute('capabilities')} className="border-slate-400 text-white hover:bg-white hover:text-slate-900 bg-transparent">
              View Capabilities
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-10">
          <div className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-2">Our Products</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Engineered gear solutions for demanding industries</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map(p => (
            <Card key={p.key} className="overflow-hidden group cursor-pointer border-slate-200 hover:border-amber-500 hover:shadow-lg transition" onClick={() => setRoute('product:' + p.key)}>
              <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" />
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{p.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{p.desc}</p>
                <div className="mt-3 text-amber-600 text-sm font-semibold flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <div className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-2">Manufacturing Capabilities</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">End-to-end gear production, in-house</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-slate-200">
                <c.icon className="h-8 w-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{c.title}</h3>
                <p className="text-sm text-slate-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="bg-slate-900 rounded-2xl overflow-hidden grid md:grid-cols-2 items-center">
          <div className="p-10 md:p-14 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Send Us Your Gear Drawing</h2>
            <p className="text-slate-300 mb-6">Upload your PDF, STEP, STP, DXF, DWG, JPG, or PNG. We'll review your drawing and reply with a detailed quote.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['PDF','STEP','STP','DXF','DWG','JPG','PNG'].map(t => (
                <Badge key={t} className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-800">{t}</Badge>
              ))}
            </div>
            <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              Start Your RFQ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="h-72 md:h-full">
            <img src={IMG_CNC} alt="CNC machining" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  )
}

function ProductsPage({ setRoute }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-3">Our Products</h1>
      <p className="text-slate-600 mb-10 max-w-2xl">Every gear we manufacture is built from your drawings and specifications.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(p => (
          <Card key={p.key} className="overflow-hidden group cursor-pointer border-slate-200 hover:border-amber-500 hover:shadow-lg transition" onClick={() => setRoute('product:' + p.key)}>
            <div className="aspect-[4/3] overflow-hidden bg-slate-900">
              <img src={p.img} alt={p.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" />
            </div>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-1">{p.title}</h3>
              <p className="text-sm text-slate-600">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ProductDetail({ productKey, setRoute }) {
  const p = PRODUCTS.find(x => x.key === productKey)
  if (!p) return <div className="container mx-auto px-4 py-16">Product not found.</div>
  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <button onClick={() => setRoute('products')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center"><ArrowLeft className="h-4 w-4 mr-1" /> All Products</button>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{p.title}</h1>
            <p className="text-slate-300 mb-6">{p.desc}</p>
            <Button size="lg" onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <img src={p.img} alt={p.title} className="rounded-lg shadow-2xl" />
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Typical Applications</h3>
          <ul className="space-y-2 text-slate-700">
            {p.apps.map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" /> {a}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Available Materials</h3>
          <ul className="space-y-2 text-slate-700">
            {['Alloy Steel (4140, 4340, 8620)','Carbon Steel','Stainless Steel','Bronze','Cast Iron','Custom on request'].map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" /> {a}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Manufacturing Options</h3>
          <ul className="space-y-2 text-slate-700">
            {['Gear cutting & hobbing','Precision grinding','Heat treatment coordination','CMM inspection','Lapping & finishing'].map(a => <li key={a} className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" /> {a}</li>)}
          </ul>
        </div>
      </section>
    </div>
  )
}

function CapabilitiesPage() {
  const sections = [
    { title: 'Gear Cutting', desc: 'Hobbing, shaping, and generating for spur, helical, and bevel gears. Range up to 1200 mm OD.', img: IMG_CNC },
    { title: 'Gear Grinding', desc: 'Profile and form grinding to AGMA Q12 / DIN 4. Ideal for hardened gears requiring exceptional accuracy.', img: IMG_CNC2 },
    { title: 'CNC Turning & Milling', desc: 'Multi-axis CNC machining of gear blanks, shafts, and complex components.', img: IMG_4 },
    { title: 'Inspection & Metrology', desc: 'CMM inspection, gear analytical testing, roll testing, and full first-article inspection reports.', img: IMG_2 },
    { title: 'Heat Treatment', desc: 'Coordinated carburizing, nitriding, and induction hardening — verified for hardness and case depth.', img: IMG_3 },
    { title: 'Prototype to Production', desc: 'From one-off prototype gears to full production runs. Fast turnaround with dedicated project engineering.', img: HERO_IMG },
  ]
  return (
    <div>
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Manufacturing Capabilities</h1>
          <p className="text-slate-300 max-w-2xl">A complete in-house manufacturing suite from raw material through inspection.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 space-y-14">
        {sections.map((s, i) => (
          <div key={i} className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
            <img src={s.img} alt={s.title} className="rounded-lg w-full aspect-video object-cover" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{s.title}</h2>
              <p className="text-slate-700">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">About PrecisionGear Industries</h1>
      <p className="text-lg text-slate-700 mb-4">For over three decades, PrecisionGear Industries has been a trusted partner to OEMs and MRO customers across aerospace, energy, automotive, and heavy industry.</p>
      <p className="text-slate-700 mb-4">Every gear we produce is built from your drawing and specifications — no catalog parts, no compromises. Our team of gear engineers, machinists, and metrologists deliver components that meet or exceed the tightest AGMA and DIN standards.</p>
      <p className="text-slate-700">From a single prototype pinion to full production ring-and-pinion sets, we combine artisan craftsmanship with modern CNC and grinding technology.</p>
    </div>
  )
}

function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4 text-slate-700">
          <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Phone</div>+1 (555) 013-8842</div></div>
          <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Email</div>sales@precisiongear.co</div></div>
          <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Address</div>1420 Foundry Way, Cleveland, OH 44115</div></div>
          <div className="flex items-start gap-3"><Building2 className="h-5 w-5 text-amber-500 mt-1" /><div><div className="font-semibold text-slate-900">Hours</div>Mon–Fri, 7:00 AM – 5:00 PM ET</div></div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div><Label>Name</Label><Input placeholder="Your name" /></div>
            <div><Label>Email</Label><Input placeholder="you@example.com" /></div>
            <div><Label>Message</Label><Textarea placeholder="How can we help?" rows={4} /></div>
            <Button className="bg-slate-900 hover:bg-slate-800 w-full">Send Message</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RfqWizard({ setRoute, prefill }) {
  const [step, setStep] = useState(1)
  const [gearType, setGearType] = useState(prefill?.gearType || '')
  const [specs, setSpecs] = useState(prefill?.specifications || {})
  const [general, setGeneral] = useState(prefill?.general || {})
  const [files, setFiles] = useState([])
  const [customer, setCustomer] = useState(prefill?.customer || {})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const specFields = SPEC_FIELDS[specGroupForType(gearType)]

  async function handleFiles(e) {
    const selected = Array.from(e.target.files || [])
    for (const file of selected) {
      const reader = new FileReader()
      const dataUrl = await new Promise(res => { reader.onload = () => res(reader.result); reader.readAsDataURL(file) })
      setFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, dataUrl }])
    }
    e.target.value = ''
  }
  function removeFile(i) { setFiles(prev => prev.filter((_, x) => x !== i)) }

  async function submit() {
    setSubmitting(true)
    try {
      let savedFiles = []
      if (files.length) {
        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) })
        const data = await res.json()
        savedFiles = data.files || []
      }
      const payload = {
        gearType, specifications: specs, general, files: savedFiles,
        customer: { ...customer, email: (customer.email || '').toLowerCase() },
        notes,
      }
      const res = await fetch('/api/rfq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        setSubmitted(data.rfq)
        toast.success(`RFQ ${data.rfq.rfqNumber} submitted`)
      } else {
        toast.error('Submission failed')
      }
    } catch (e) {
      toast.error('Submission failed: ' + e.message)
    } finally { setSubmitting(false) }
  }

  const canNext = () => {
    if (step === 1) return !!gearType
    if (step === 5) return customer.email && customer.firstName && customer.lastName && customer.companyName
    return true
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="inline-flex bg-emerald-100 text-emerald-600 rounded-full p-4 mb-5"><CheckCircle2 className="h-14 w-14" /></div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Thank you. Your RFQ has been received.</h1>
        <p className="text-slate-600 mb-2">Your RFQ number:</p>
        <div className="text-3xl font-bold tracking-wider text-amber-600 mb-6">{submitted.rfqNumber}</div>
        <p className="text-slate-600 mb-8">Our engineering team will review your request and respond shortly. You can track its status in the Customer Portal using your email.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => setRoute('portal:' + submitted.customer.email)} className="bg-slate-900 hover:bg-slate-800">Go to Customer Portal</Button>
          <Button variant="outline" onClick={() => setRoute('home')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  const steps = ['Gear Type', 'Specifications', 'Quantity', 'Drawings', 'Customer', 'Review']

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a Quote</h1>
      <p className="text-slate-600 mb-6">Complete this 6-step form. Fill only what you know — we'll follow up on anything missing.</p>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2 gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 text-center ${i + 1 <= step ? 'text-amber-600 font-semibold' : ''}`}>{i + 1}. {s}</div>
          ))}
        </div>
        <Progress value={(step / 6) * 100} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 1: Select Gear Type</h2>
              <Label>Gear Type</Label>
              <Select value={gearType} onValueChange={setGearType}>
                <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Choose a gear type..." /></SelectTrigger>
                <SelectContent>{GEAR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 2: {gearType} Specifications</h2>
              <p className="text-sm text-slate-600 mb-4">Fill in what's on your drawing. Leave blank if not applicable.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {specFields.map(f => (
                  <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <Label>{f.label}</Label>
                    {f.type === 'select' ? (
                      <Select value={specs[f.key] || ''} onValueChange={v => setSpecs({ ...specs, [f.key]: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : f.type === 'textarea' ? (
                      <Textarea className="mt-1" value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />
                    ) : (
                      <Input className="mt-1" value={specs[f.key] || ''} onChange={e => setSpecs({ ...specs, [f.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 3: General & Manufacturing Requirements</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['partName','Part Name'],['partNumber','Part Number'],['quantity','Quantity'],
                  ['material','Material'],['heatTreatment','Heat Treatment'],['hardness','Hardness (HRC)'],
                  ['drawingNumber','Drawing Number'],['revision','Revision'],['deliveryDate','Required Delivery Date','date'],
                  ['application','Application'],['annualQuantity','Annual Quantity'],
                ].map(([k, l, t]) => (
                  <div key={k}>
                    <Label>{l}</Label>
                    <Input type={t || 'text'} className="mt-1" value={general[k] || ''} onChange={e => setGeneral({ ...general, [k]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <Label>Prototype or Production</Label>
                  <Select value={general.protoOrProd || ''} onValueChange={v => setGeneral({ ...general, protoOrProd: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prototype">Prototype</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Additional Notes</Label>
                  <Textarea className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 4: Upload Your Drawings</h2>
              <p className="text-sm text-slate-600 mb-4">Accepted: PDF, STEP, STP, DXF, DWG, JPG, PNG. Multiple files supported.</p>
              <label className="block border-2 border-dashed border-slate-300 rounded-lg p-10 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <div className="font-semibold text-slate-900">Click to upload files</div>
                <div className="text-sm text-slate-500">or drag and drop</div>
                <input type="file" multiple className="hidden" accept=".pdf,.step,.stp,.dxf,.dwg,.jpg,.jpeg,.png" onChange={handleFiles} />
              </label>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{f.name}</div>
                          <div className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFile(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 5: Your Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['companyName','Company Name *'],['firstName','First Name *'],['lastName','Last Name *'],
                  ['email','Email *','email'],['phone','Phone','tel'],['country','Country'],
                  ['address','Address'],['city','City'],['state','State'],['zip','Zip Code'],
                ].map(([k, l, t]) => (
                  <div key={k}>
                    <Label>{l}</Label>
                    <Input type={t || 'text'} className="mt-1" value={customer[k] || ''} onChange={e => setCustomer({ ...customer, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 6 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Step 6: Review & Submit</h2>
              <div className="space-y-4 text-sm">
                <ReviewBlock title="Customer">
                  <div>{customer.firstName} {customer.lastName} — {customer.companyName}</div>
                  <div className="text-slate-600">{customer.email} · {customer.phone}</div>
                  <div className="text-slate-600">{customer.address}, {customer.city}, {customer.state} {customer.zip} {customer.country}</div>
                </ReviewBlock>
                <ReviewBlock title="Gear Type"><div className="font-medium">{gearType}</div></ReviewBlock>
                <ReviewBlock title="Specifications">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {Object.entries(specs).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k}><span className="text-slate-500">{specFields.find(f => f.key === k)?.label || k}:</span> <span className="font-medium">{v}</span></div>
                    ))}
                  </div>
                </ReviewBlock>
                <ReviewBlock title="General / Manufacturing">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {Object.entries(general).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> <span className="font-medium">{v}</span></div>)}
                  </div>
                  {notes && <div className="mt-2"><span className="text-slate-500">Notes:</span> {notes}</div>}
                </ReviewBlock>
                <ReviewBlock title={`Uploaded Drawings (${files.length})`}>
                  {files.length === 0 ? <div className="text-slate-500">No files uploaded</div> :
                    <ul className="list-disc list-inside">{files.map((f, i) => <li key={i}>{f.name}</li>)}</ul>}
                </ReviewBlock>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-5">
        <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        {step < 6 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-slate-900 hover:bg-slate-800">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
            {submitting ? 'Submitting...' : 'Submit RFQ'} <Send className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewBlock({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="font-semibold text-slate-900 mb-2">{title}</div>
      {children}
    </div>
  )
}

function CustomerPortal({ initialEmail, setRoute }) {
  const [email, setEmail] = useState(initialEmail || '')
  const [inputEmail, setInputEmail] = useState(initialEmail || '')
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  async function load(e) {
    if (!e) return
    setLoading(true)
    const res = await fetch(`/api/rfq?email=${encodeURIComponent(e.toLowerCase())}`)
    const data = await res.json()
    setRfqs(data.rfqs || [])
    setLoading(false)
  }

  useEffect(() => { if (email) load(email) }, [email])

  if (!email) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" /> Customer Portal</CardTitle><CardDescription>Enter the email you used on your RFQ.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="you@company.com" value={inputEmail} onChange={e => setInputEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && setEmail(inputEmail)} />
            <Button onClick={() => setEmail(inputEmail)} className="w-full bg-slate-900 hover:bg-slate-800">Access My RFQs</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your RFQs & Orders</h1>
          <p className="text-slate-600 text-sm">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(email)}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button variant="outline" onClick={() => setEmail('')}>Change Email</Button>
          <Button onClick={() => setRoute('rfq')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">New RFQ</Button>
        </div>
      </div>
      {loading ? <div>Loading...</div> : rfqs.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-slate-500">No RFQs found for this email. <button onClick={() => setRoute('rfq')} className="text-amber-600 font-semibold">Submit your first RFQ</button></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rfqs.map(r => (
            <Card key={r.id} className="cursor-pointer hover:border-amber-500 transition" onClick={() => setSelected(r)}>
              <CardContent className="p-5 grid md:grid-cols-6 gap-3 items-center">
                <div className="md:col-span-2">
                  <div className="font-bold text-slate-900">{r.rfqNumber}</div>
                  <div className="text-sm text-slate-600">{r.general?.partName || 'Untitled part'}</div>
                </div>
                <div className="text-sm"><div className="text-slate-500 text-xs">Gear</div><div>{r.gearType}</div></div>
                <div className="text-sm"><div className="text-slate-500 text-xs">Qty</div><div>{r.general?.quantity || '—'}</div></div>
                <div className="text-sm"><div className="text-slate-500 text-xs">Submitted</div><div>{new Date(r.createdAt).toLocaleDateString()}</div></div>
                <div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <RfqDetailDialog rfq={selected} onClose={() => setSelected(null)} onUpdated={() => load(email)} asCustomer />
    </div>
  )
}

function RfqDetailDialog({ rfq, onClose, onUpdated, asCustomer, asAdmin }) {
  const [current, setCurrent] = useState(rfq)
  const [msgText, setMsgText] = useState('')
  const [newStatus, setNewStatus] = useState(rfq?.status || '')
  const [internalNotes, setInternalNotes] = useState(rfq?.internalNotes || '')
  const [pricing, setPricing] = useState(rfq?.pricing || { unitPrice: '', quantity: '', tooling: '', engineering: '', shipping: '', tax: '', total: 0, paymentTerms: 'Net 30', validity: '30 days' })
  const [leadTime, setLeadTime] = useState(rfq?.leadTime || '')

  useEffect(() => {
    setCurrent(rfq); setNewStatus(rfq?.status || '')
    setInternalNotes(rfq?.internalNotes || '')
    setPricing(rfq?.pricing || { unitPrice: '', quantity: rfq?.general?.quantity || '', tooling: '', engineering: '', shipping: '', tax: '', total: 0, paymentTerms: 'Net 30', validity: '30 days' })
    setLeadTime(rfq?.leadTime || '')
  }, [rfq])

  if (!current) return null

  async function refresh() {
    const res = await fetch(`/api/rfq/${current.id}`)
    const data = await res.json()
    if (data.rfq) setCurrent(data.rfq)
    onUpdated && onUpdated()
  }

  async function sendMessage() {
    if (!msgText.trim()) return
    await fetch(`/api/rfq/${current.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: asAdmin ? 'admin' : 'customer', author: asAdmin ? 'PrecisionGear Team' : (current.customer?.firstName || 'Customer'), text: msgText }) })
    setMsgText('')
    refresh()
  }

  function calcTotal(p) {
    const unit = parseFloat(p.unitPrice) || 0
    const qty = parseFloat(p.quantity) || 0
    const tooling = parseFloat(p.tooling) || 0
    const eng = parseFloat(p.engineering) || 0
    const ship = parseFloat(p.shipping) || 0
    const tax = parseFloat(p.tax) || 0
    return unit * qty + tooling + eng + ship + tax
  }

  async function saveAdmin() {
    const total = calcTotal(pricing)
    await fetch(`/api/rfq/${current.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, internalNotes, pricing: { ...pricing, total }, leadTime }) })
    toast.success('RFQ updated')
    refresh()
  }

  async function downloadFile(f) {
    const res = await fetch(`/api/files/${f.id}`)
    const data = await res.json()
    const a = document.createElement('a')
    a.href = data.dataUrl; a.download = data.name; a.click()
  }

  return (
    <Dialog open={!!current} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>{current.rfqNumber}</span>
            <Badge className={STATUS_COLORS[current.status]}>{current.status}</Badge>
            <span className="text-sm font-normal text-slate-500">· {current.gearType}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages ({current.messages?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
            {asAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Card><CardContent className="p-4">
                <div className="font-semibold mb-2">Customer</div>
                <div>{current.customer?.firstName} {current.customer?.lastName}</div>
                <div className="text-slate-600">{current.customer?.companyName}</div>
                <div className="text-slate-600">{current.customer?.email} · {current.customer?.phone}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="font-semibold mb-2">Part Info</div>
                <div><b>Part:</b> {current.general?.partName || '—'}</div>
                <div><b>Part #:</b> {current.general?.partNumber || '—'}</div>
                <div><b>Qty:</b> {current.general?.quantity || '—'}</div>
                <div><b>Material:</b> {current.general?.material || '—'}</div>
                <div><b>Delivery:</b> {current.general?.deliveryDate || '—'}</div>
              </CardContent></Card>
            </div>
            <Card><CardContent className="p-4 text-sm">
              <div className="font-semibold mb-2">Gear Specifications</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {Object.entries(current.specifications || {}).filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> {v}</div>)}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="font-semibold mb-2">Drawings ({current.files?.length || 0})</div>
              <div className="space-y-2">
                {(current.files || []).map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                    <div className="flex items-center gap-2 min-w-0"><FileText className="h-4 w-4 text-amber-500 shrink-0" /><span className="truncate">{f.name}</span></div>
                    <Button size="sm" variant="ghost" onClick={() => downloadFile(f)}><Download className="h-4 w-4" /></Button>
                  </div>
                ))}
                {!current.files?.length && <div className="text-slate-500 text-sm">No drawings uploaded</div>}
              </div>
            </CardContent></Card>
            {current.pricing?.total > 0 && (
              <Card className="border-amber-500"><CardContent className="p-4">
                <div className="font-semibold mb-2 text-amber-700">Quote</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div>Unit Price: ${current.pricing.unitPrice}</div>
                  <div>Quantity: {current.pricing.quantity}</div>
                  <div>Tooling: ${current.pricing.tooling || 0}</div>
                  <div>Engineering: ${current.pricing.engineering || 0}</div>
                  <div>Shipping: ${current.pricing.shipping || 0}</div>
                  <div>Tax: ${current.pricing.tax || 0}</div>
                  <div className="col-span-2 font-bold text-lg mt-2">Total: ${current.pricing.total.toFixed(2)}</div>
                  <div>Lead Time: {current.leadTime}</div>
                  <div>Terms: {current.pricing.paymentTerms}</div>
                </div>
              </CardContent></Card>
            )}
            {asCustomer && current.status === 'Completed' && (
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold" onClick={() => {
                onClose()
                window.dispatchEvent(new CustomEvent('reorder', { detail: current }))
              }}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reorder This Gear
              </Button>
            )}
          </TabsContent>
          <TabsContent value="messages">
            <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
              {(current.messages || []).map(m => (
                <div key={m.id} className={`p-3 rounded ${m.from === 'admin' ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-slate-100'}`}>
                  <div className="text-xs text-slate-500 mb-1">{m.author} · {new Date(m.at).toLocaleString()}</div>
                  <div>{m.text}</div>
                </div>
              ))}
              {!current.messages?.length && <div className="text-slate-500 text-sm">No messages yet.</div>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type a message..." value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-2">
              {(current.statusHistory || []).map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                  <Badge className={STATUS_COLORS[h.status]}>{h.status}</Badge>
                  <span className="text-sm text-slate-600">{new Date(h.at).toLocaleString()}</span>
                  {h.note && <span className="text-sm text-slate-500">— {h.note}</span>}
                </div>
              ))}
            </div>
          </TabsContent>
          {asAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead Time</Label>
                <Input value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 6-8 weeks" />
              </div>
              <div>
                <Label>Internal Engineering Notes</Label>
                <Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} />
              </div>
              <Card><CardContent className="p-4">
                <div className="font-semibold mb-3">Quote Pricing</div>
                <div className="grid grid-cols-2 gap-3">
                  {[['unitPrice','Unit Price ($)'],['quantity','Quantity'],['tooling','Tooling ($)'],['engineering','Engineering ($)'],['shipping','Shipping ($)'],['tax','Tax ($)'],['paymentTerms','Payment Terms'],['validity','Quote Validity']].map(([k, l]) => (
                    <div key={k}><Label>{l}</Label><Input value={pricing[k] || ''} onChange={e => setPricing({ ...pricing, [k]: e.target.value })} /></div>
                  ))}
                </div>
                <div className="mt-3 text-right font-bold text-lg">Total: ${calcTotal(pricing).toFixed(2)}</div>
              </CardContent></Card>
              <Button onClick={saveAdmin} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">Save Changes</Button>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [rfqs, setRfqs] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    const r = await fetch('/api/rfq'); const d = await r.json(); setRfqs(d.rfqs || [])
    const s = await fetch('/api/admin/stats'); setStats(await s.json())
  }
  useEffect(() => { if (authed) load() }, [authed])

  if (!authed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> Admin Access</CardTitle><CardDescription>Enter the admin password (demo: <b>admin123</b>).</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && (pw === 'admin123' ? setAuthed(true) : toast.error('Wrong password'))} />
            <Button onClick={() => pw === 'admin123' ? setAuthed(true) : toast.error('Wrong password')} className="w-full bg-slate-900 hover:bg-slate-800">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filtered = rfqs.filter(r => {
    if (query && !JSON.stringify(r).toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'new') return r.status === 'Submitted'
    if (filter === 'review') return ['Under Review','Engineering Review','Need More Information'].includes(r.status)
    if (filter === 'quotes') return ['Quote Prepared','Quote Sent'].includes(r.status)
    if (filter === 'orders') return ['Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped'].includes(r.status)
    if (filter === 'completed') return r.status === 'Completed'
    return true
  })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ['RFQs This Month', stats.thisMonth, TrendingUp],
            ['Total RFQs', stats.total, ClipboardList],
            ['Quotes Sent', stats.quotesSent, Send],
            ['Active Orders', stats.activeOrders, Package],
            ['Order Value', '$' + (stats.totalValue || 0).toLocaleString(), TrendingUp],
          ].map(([l, v, Icon]) => (
            <Card key={l}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-1"><div className="text-xs text-slate-500 uppercase">{l}</div><Icon className="h-4 w-4 text-amber-500" /></div>
              <div className="text-2xl font-bold text-slate-900">{v}</div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input className="pl-9" placeholder="Search RFQ#, part, customer, drawing..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RFQs</SelectItem>
            <SelectItem value="new">New Submissions</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="quotes">Quotes</SelectItem>
            <SelectItem value="orders">Active Orders</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map(r => (
          <Card key={r.id} className="cursor-pointer hover:border-amber-500 transition" onClick={() => setSelected(r)}>
            <CardContent className="p-4 grid md:grid-cols-7 gap-2 items-center">
              <div className="md:col-span-2">
                <div className="font-bold text-slate-900">{r.rfqNumber}</div>
                <div className="text-xs text-slate-600">{r.customer?.companyName} — {r.customer?.firstName} {r.customer?.lastName}</div>
              </div>
              <div className="text-sm">{r.gearType}</div>
              <div className="text-sm">{r.general?.partName || '—'}</div>
              <div className="text-sm">Qty: {r.general?.quantity || '—'}</div>
              <div className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
              <div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card><CardContent className="p-12 text-center text-slate-500">No RFQs match your filter.</CardContent></Card>}
      </div>

      <RfqDetailDialog rfq={selected} onClose={() => setSelected(null)} onUpdated={load} asAdmin />
    </div>
  )
}

function App() {
  const [route, setRoute] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [reorderPrefill, setReorderPrefill] = useState(null)

  useEffect(() => {
    const h = (e) => {
      const r = e.detail
      setReorderPrefill({ gearType: r.gearType, specifications: r.specifications, general: r.general, customer: r.customer })
      setRoute('rfq')
      toast.success('Previous specifications loaded. Review and submit as a new RFQ.')
    }
    window.addEventListener('reorder', h)
    return () => window.removeEventListener('reorder', h)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [route])

  let content
  if (route === 'home') content = <HomePage setRoute={setRoute} />
  else if (route === 'products') content = <ProductsPage setRoute={setRoute} />
  else if (route.startsWith('product:')) content = <ProductDetail productKey={route.slice(8)} setRoute={setRoute} />
  else if (route === 'capabilities') content = <CapabilitiesPage />
  else if (route === 'about') content = <AboutPage />
  else if (route === 'contact') content = <ContactPage />
  else if (route === 'rfq') content = <RfqWizard setRoute={setRoute} prefill={reorderPrefill} />
  else if (route === 'portal') content = <CustomerPortal setRoute={setRoute} />
  else if (route.startsWith('portal:')) content = <CustomerPortal initialEmail={route.slice(7)} setRoute={setRoute} />
  else if (route === 'admin') content = <AdminDashboard />
  else content = <HomePage setRoute={setRoute} />

  return (
    <div className="min-h-screen flex flex-col">
      <Nav route={route.split(':')[0]} setRoute={(r) => { setRoute(r); if (r !== 'rfq') setReorderPrefill(null) }} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1">{content}</main>
      <Footer setRoute={setRoute} />
    </div>
  )
}

export default App
