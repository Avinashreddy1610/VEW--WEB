'use client'
// ============== VEW KINETIC LAYER v6 ==============
// Motion system: KineticGlide (momentum scroll), WebGLStage (particle gear-field),
// Cursor (geometric marker), Grain (film grain), KineticEnhancer (split-text,
// outline->fill, magnetic, velocity marquee), BootPreloader (odometer boot).
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export const kineticState = {
  raw: 0,
  smooth: 0,
  vel: 0,
  frozen: false,
  booted: false,
  reduced: false,
  touch: false,
}
if (typeof window !== 'undefined') {
  try {
    kineticState.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    kineticState.touch = window.matchMedia('(pointer: coarse)').matches
  } catch { /* noop */ }
}

export const MARKETING_BASES = ['home', 'product', 'products', 'capabilities', 'gallery', 'about', 'contact']
export const isMarketingRoute = r => MARKETING_BASES.includes(String(r).split(':')[0])

export function KineticGlide({ children, route }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    kineticState.raw = window.scrollY
    kineticState.smooth = window.scrollY
    kineticState.vel = 0
    el.style.transform = ''
    if (kineticState.reduced) return
    const lerp = kineticState.touch ? 0.16 : 0.11
    let raf = 0
    const freezeCheck = () => {
      const dialogOpen = !!document.querySelector('[role="dialog"], [data-k-freeze]')
      const bodyLocked = document.body.style.overflow === 'hidden'
      kineticState.frozen = dialogOpen || bodyLocked
    }
    freezeCheck()
    const mo = new MutationObserver(freezeCheck)
    mo.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true, subtree: false })
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (kineticState.frozen || document.hidden) return
      const target = window.scrollY
      const prev = kineticState.smooth
      const next = prev + (target - prev) * lerp
      kineticState.raw = target
      kineticState.smooth = Math.abs(target - next) < 0.05 ? target : next
      kineticState.vel = kineticState.smooth - prev
      const t = kineticState.raw - kineticState.smooth
      el.style.transform = t === 0 ? '' : `translate3d(0,${t.toFixed(2)}px,0)`
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); mo.disconnect(); el.style.transform = '' }
  }, [route])
  return <div ref={ref} style={{ willChange: 'transform' }}>{children}</div>
}

export function Cursor() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || kineticState.reduced || kineticState.touch) return
    let x = -100, y = -100, tx = -100, ty = -100, s = 1, ts = 1, raf = 0
    const onMove = e => {
      tx = e.clientX; ty = e.clientY
      const hot = e.target && e.target.closest ? e.target.closest('a,button,[data-magnetic],.k-ch') : null
      ts = hot ? 2.4 : 1
      el.classList.toggle('k-cursor-hot', !!hot)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    const loop = () => {
      raf = requestAnimationFrame(loop)
      x += (tx - x) * 0.32; y += (ty - y) * 0.32; s += (ts - s) * 0.22
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(3)})`
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove) }
  }, [])
  if (kineticState.reduced || kineticState.touch) return null
  return <div ref={ref} id="k-cursor" aria-hidden="true" />
}

export function Grain() {
  if (kineticState.reduced) return null
  return <div className="k-grain" aria-hidden="true" />
}

function mat4Perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far)
  out.fill(0)
  out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf
  return out
}
function mat4LookAt(out, eye, at, up) {
  let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2]
  let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx
  l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2])
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2])
  out[15] = 1
  return out
}
function mat4Mul(out, a, b) {
  const t = new Float32Array(16)
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    t[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
  }
  out.set(t); return out
}

const STAGE_VS = `#version 300 es
in vec3 aPos; in float aSize; in float aSeed; in float aSpeed; in float aBright;
uniform float uTime; uniform vec3 uMouse; uniform float uPush; uniform float uScroll; uniform mat4 uVP;
out float vA; out float vB;
void main(){
  vec3 p = aPos;
  float ang = uTime * aSpeed * (1.0 + uScroll * 1.8) + aSeed * 6.2831;
  float c = cos(ang), s = sin(ang);
  p = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
  p.x += sin(uTime * 0.32 + aSeed * 12.0) * 0.22;
  p.y += cos(uTime * 0.27 + aSeed * 9.0) * 0.22;
  p.z += sin(uTime * 0.21 + aSeed * 7.0) * 0.16;
  vec3 d = p - uMouse;
  float dist = length(d);
  float f = exp(-dist * dist * 0.5) * uPush;
  p += (d / max(dist, 0.001)) * f * 1.5;
  vec4 mv = uVP * vec4(p, 1.0);
  gl_Position = mv;
  float tw = 0.7 + 0.3 * sin(uTime * 2.1 + aSeed * 43.0);
  gl_PointSize = aSize * tw * (250.0 / max(1.0, -mv.z));
  vA = clamp(1.15 - (-mv.z) / 26.0, 0.08, 1.0);
  vB = aBright;
}`
const STAGE_FS = `#version 300 es
precision mediump float;
in float vA; in float vB;
out vec4 o;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 2.4);
  vec3 deep = vec3(0.04, 0.30, 0.48);
  vec3 cyan = vec3(0.30, 0.90, 1.00);
  vec3 col = mix(deep, cyan, glow) + vec3(0.85, 0.98, 1.0) * pow(core, 7.0) * 0.85;
  float a = glow * vA * (0.35 + 0.65 * vB);
  o = vec4(col * a, 1.0);
}`

export function WebGLStage() {
  const mountRef = useRef(null)
  useEffect(() => {
    const mount = mountRef.current
    if (!mount || kineticState.reduced) return
    const canvas = document.createElement('canvas')
    canvas.className = 'k-webgl-canvas'
    mount.appendChild(canvas)
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, powerPreference: 'high-performance' })
    if (!gl) { mount.removeChild(canvas); return }
    const compile = (type, src) => {
      const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null }
      return sh
    }
    const vs = compile(gl.VERTEX_SHADER, STAGE_VS), fs = compile(gl.FRAGMENT_SHADER, STAGE_FS)
    if (!vs || !fs) { mount.removeChild(canvas); return }
    const prog = gl.createProgram()
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { mount.removeChild(canvas); return }
    gl.useProgram(prog)
    const touch = kineticState.touch
    const RING_N = touch ? 5200 : 13500
    const DUST_N = touch ? 900 : 2600
    const rings = [
      { r: 3.4, teeth: 22, speed: 0.055, w: 0.55 },
      { r: 5.3, teeth: 30, speed: -0.038, w: 0.7 },
      { r: 7.5, teeth: 38, speed: 0.026, w: 0.85 },
    ]
    const total = RING_N * rings.length + DUST_N
    const pos = new Float32Array(total * 3), size = new Float32Array(total)
    const seed = new Float32Array(total), speed = new Float32Array(total), bright = new Float32Array(total)
    const tilt = -0.46, ct = Math.cos(tilt), st = Math.sin(tilt)
    let i = 0
    const pushPt = (x, y, z, sz, sp, br) => {
      const yy = y * ct - z * st, zz = y * st + z * ct
      pos[i * 3] = x; pos[i * 3 + 1] = yy; pos[i * 3 + 2] = zz
      size[i] = sz; seed[i] = Math.random(); speed[i] = sp; bright[i] = br; i++
    }
    rings.forEach(rg => {
      for (let k = 0; k < RING_N; k++) {
        const a = Math.random() * Math.PI * 2
        const tooth = 0.5 + 0.5 * Math.sin(a * rg.teeth)
        const rr = rg.r + (Math.random() - 0.5) * rg.w + tooth * 0.34
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr
        const y = (Math.random() + Math.random() + Math.random() - 1.5) * 0.30
        pushPt(x, y, z, 5.5 + Math.random() * 9 + tooth * 5, rg.speed, 0.45 + Math.random() * 0.55)
      }
    })
    for (let k = 0; k < DUST_N; k++) {
      pushPt((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 14,
        3 + Math.random() * 6, 0.006 + Math.random() * 0.008, 0.2 + Math.random() * 0.4)
    }
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao)
    const bindAttr = (data, loc, n) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0)
    }
    bindAttr(pos, gl.getAttribLocation(prog, 'aPos'), 3)
    bindAttr(size, gl.getAttribLocation(prog, 'aSize'), 1)
    bindAttr(seed, gl.getAttribLocation(prog, 'aSeed'), 1)
    bindAttr(speed, gl.getAttribLocation(prog, 'aSpeed'), 1)
    bindAttr(bright, gl.getAttribLocation(prog, 'aBright'), 1)
    const uTime = gl.getUniformLocation(prog, 'uTime'), uMouse = gl.getUniformLocation(prog, 'uMouse')
    const uPush = gl.getUniformLocation(prog, 'uPush'), uScroll = gl.getUniformLocation(prog, 'uScroll')
    const uVP = gl.getUniformLocation(prog, 'uVP')
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST)
    const proj = new Float32Array(16), view = new Float32Array(16), vp = new Float32Array(16)
    let W = 0, H = 0
    const resize = () => {
      const w = mount.clientWidth || 1, h = mount.clientHeight || 1
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      W = Math.floor(w * dpr); H = Math.floor(h * dpr)
      canvas.width = W; canvas.height = H
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      gl.viewport(0, 0, W, H)
      mat4Perspective(proj, 55 * Math.PI / 180, w / h, 0.1, 80)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(mount)
    let mx = 0, my = 0, pmx = 0, pmy = 0, push = 0
    let gx = 0, gy = 0.35, visible = true, raf = 0
    const section = mount.parentElement
    const onMove = e => {
      const r = mount.getBoundingClientRect()
      mx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1
      my = -(((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(mount)
    const t0 = performance.now()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      const t = (performance.now() - t0) / 1000
      const sp = Math.hypot(mx - pmx, my - pmy); pmx = mx; pmy = my
      push = Math.min(push + Math.min(sp * 2.4, 1.2), 2.2) * 0.94
      gx += (mx * 1.5 - gx) * 0.07
      gy += (my * 0.9 + 0.35 - gy) * 0.07
      let sc = 0
      if (section) {
        const r = section.getBoundingClientRect()
        sc = Math.min(1, Math.max(0, -r.top / Math.max(1, window.innerHeight * 0.9)))
      }
      const cz = 13.5 - sc * 5.2
      const halfH = Math.tan(55 * Math.PI / 360) * cz
      const halfW = halfH * (W / Math.max(1, H))
      mat4LookAt(view, [gx, gy, cz], [0, 0, 0], [0, 1, 0])
      mat4Mul(vp, proj, view)
      gl.uniformMatrix4fv(uVP, false, vp)
      gl.uniform1f(uTime, t)
      gl.uniform3f(uMouse, mx * halfW * 0.85 + gx * 0.4, my * halfH * 0.85 + gy * 0.4, 0)
      gl.uniform1f(uPush, push)
      gl.uniform1f(uScroll, sc)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.POINTS, 0, total)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      window.removeEventListener('mousemove', onMove)
      try {
        const ext = gl.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      } catch { /* noop */ }
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [])
  return <div ref={mountRef} className="k-webgl" aria-hidden="true" />
}

function splitWords(h) {
  let wi = 0
  const walk = node => {
    const kids = Array.from(node.childNodes)
    kids.forEach(kid => {
      if (kid.nodeType === 3) {
        const frag = document.createDocumentFragment()
        kid.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return }
          const w = document.createElement('span'); w.className = 'k-w'
          const inner = document.createElement('span'); inner.className = 'k-wi'
          inner.style.transitionDelay = (wi * 32) + 'ms'
          inner.textContent = part
          w.appendChild(inner); frag.appendChild(w); wi++
        })
        node.replaceChild(frag, kid)
      } else if (kid.nodeType === 1 && kid.tagName !== 'BR') {
        walk(kid)
      }
    })
  }
  walk(h)
}

function splitChars(h) {
  let ci = 0
  const walk = node => {
    const kids = Array.from(node.childNodes)
    kids.forEach(kid => {
      if (kid.nodeType === 3) {
        const frag = document.createDocumentFragment()
        Array.from(kid.textContent).forEach(ch => {
          if (ch === ' ' || ch === '\n' || ch === '\t') { frag.appendChild(document.createTextNode(' ')); return }
          const c = document.createElement('span'); c.className = 'k-ch'
          c.style.setProperty('--i', ci++)
          const m = document.createElement('span'); m.className = 'k-chm'
          const x = document.createElement('span'); x.className = 'k-chx'
          const a = document.createElement('span'); a.className = 'k-ca'; a.textContent = ch
          const b = document.createElement('span'); b.className = 'k-cb'; b.textContent = ch
          b.setAttribute('aria-hidden', 'true')
          x.appendChild(a); x.appendChild(b); m.appendChild(x); c.appendChild(m)
          frag.appendChild(c)
        })
        node.replaceChild(frag, kid)
      } else if (kid.nodeType === 1 && kid.tagName !== 'BR') {
        walk(kid)
      }
    })
  }
  walk(h)
}

function magnetize(el) {
  if (el.dataset.kMag) return
  el.dataset.kMag = '1'
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, hovering = false
  const LIM = 14, K = 0.32
  const tick = () => {
    raf = 0
    x += (tx - x) * 0.18; y += (ty - y) * 0.18
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`
    if (hovering || Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(tick)
    else el.style.transform = ''
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(tick) }
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect()
    tx = Math.max(-LIM, Math.min(LIM, (e.clientX - (r.left + r.width / 2)) * K))
    ty = Math.max(-LIM, Math.min(LIM, (e.clientY - (r.top + r.height / 2)) * K))
    hovering = true; start()
  })
  el.addEventListener('mouseleave', () => { tx = 0; ty = 0; hovering = false; start() })
}

export function KineticEnhancer({ route }) {
  useEffect(() => {
    if (!isMarketingRoute(route) || kineticState.reduced) return
    const root = document.getElementById('main-content')
    if (!root) return
    const cleanups = []
    const rafHandles = { loop: 0 }
    root.querySelectorAll('h1,h2').forEach(h => {
      if (h.dataset.kSplit || h.classList.contains('k-chars') || h.closest('[data-no-split]')) return
      if (h.closest('section') && h.closest('section').querySelector('.k-webgl') && h.tagName === 'H1') return
      h.dataset.kSplit = '1'
      splitWords(h)
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { h.classList.add('k-in'); io.disconnect() }
      }, { threshold: 0.15 })
      io.observe(h); cleanups.push(() => io.disconnect())
    })
    const fireChars = () => {
      root.querySelectorAll('h1.k-chars').forEach(h => {
        if (!h.dataset.kChars) { h.dataset.kChars = '1'; splitChars(h) }
        requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('k-live')))
      })
    }
    if (kineticState.booted) fireChars()
    else {
      const onBoot = () => { kineticState.booted = true; fireChars() }
      window.addEventListener('vew:booted', onBoot, { once: true })
      cleanups.push(() => window.removeEventListener('vew:booted', onBoot))
    }
    if (!kineticState.touch) root.querySelectorAll('[data-magnetic],.btn-servo').forEach(magnetize)
    const strokes = Array.from(root.querySelectorAll('.text-stroke,.text-stroke-cyan,.text-stroke-faint'))
    const marquees = Array.from(root.querySelectorAll('.animate-vew-marquee'))
    const parallax = Array.from(root.querySelectorAll('[data-parallax]'))
    const loop = () => {
      rafHandles.loop = requestAnimationFrame(loop)
      if (kineticState.frozen || document.hidden) return
      const vh = window.innerHeight
      for (const el of strokes) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -50 || r.top > vh + 50) continue
        const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.62)))
        el.style.setProperty('--kfill', p.toFixed(3))
      }
      const v = Math.min(3.2, Math.abs(kineticState.vel) / 16)
      for (const el of marquees) el.style.animationDuration = (26 / (1 + v)).toFixed(2) + 's'
      const vc = vh / 2
      for (const el of parallax) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -100 || r.top > vh + 100) continue
        const sp = parseFloat(el.dataset.parallax) || 0.1
        const off = (r.top + r.height / 2 - vc) * sp
        el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`
      }
    }
    rafHandles.loop = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafHandles.loop); cleanups.forEach(fn => fn()) }
  }, [route])
  return null
}

const BOOT_LINES = [
  '> SERVO LINK ............ OK',
  '> PARTICLE FIELD ........ OK',
  '> OPTICS ................ OK',
  '> CALIBRATING ........... ',
]
export function BootPreloader({ onDone }) {
  const [n, setN] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0, endT = 0
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      setN(100)
      endT = setTimeout(onDone, 200)
    }
    const tick = t => {
      const p = Math.min(1, (t - t0) / 2100)
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else endT = setTimeout(finish, 380)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(endT) }
  }, [onDone])
  const skip = () => {
    if (doneRef.current) return
    doneRef.current = true
    setN(100); onDone()
  }
  const shown = BOOT_LINES.slice(0, 1 + Math.floor(n / 30)).join('\n')
  return (
    <motion.div exit={{ y: '-100%' }} transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
      onClick={skip} className="fixed inset-0 z-[200] bg-[#020406] cursor-pointer select-none" role="status" aria-label="Loading">
      <div className="k-frame" aria-hidden="true"><i className="k-fT" /><i className="k-fB" /><i className="k-fL" /><i className="k-fR" /></div>
      <div className="absolute top-9 left-9 md:top-11 md:left-11 font-tech text-[10px] uppercase tracking-[0.42em] text-[#22d3ee]">VEW.SYS // initializing</div>
      <div className="absolute top-9 right-9 md:top-11 md:right-11 font-tech text-[10px] uppercase tracking-[0.32em] text-white/30 text-right">Precision<br />Gearworks</div>
      <pre className="absolute top-24 left-9 md:top-28 md:left-11 font-tech text-[10px] uppercase tracking-[0.18em] text-[#8b98a5] whitespace-pre-wrap leading-relaxed">{shown}<span className="terminal-caret">▊</span></pre>
      <div className="absolute bottom-9 right-9 md:bottom-12 md:right-11 text-right">
        <div className="font-tech text-[10px] uppercase tracking-[0.32em] text-white/35 mb-2">Loading experience</div>
        <div className="font-tech text-[10px] uppercase tracking-[0.32em] text-[#67e8f9]">Click to skip</div>
      </div>
      <div aria-hidden="true" className="absolute bottom-0 left-6 md:left-10 font-display font-bold leading-[0.8] tracking-tighter text-[#eef3f6] tabular-nums select-none"
        style={{ fontSize: 'clamp(6rem, 22vw, 19rem)', transform: `skewX(${(-7 * (1 - n / 100)).toFixed(2)}deg)`, opacity: 0.96 }}>
        {String(n).padStart(3, '0')}
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#a5f3fc] via-[#22d3ee] to-[#0e7490]" style={{ width: n + '%' }} />
    </motion.div>
  )
}
