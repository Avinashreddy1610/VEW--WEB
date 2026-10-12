# VEW--WEB Project — Claude Instructions

This is a Next.js web application project. Below are the installed design skills and guidance to follow.

## Installed Skills

All skills are located in `.agents/skills/` and are available for Claude to read and use.

### From emilkowalski/skills — Design Engineering

| Skill | Purpose |
|---|---|
| `emil-design-eng` | Emil Kowalski's UI polish philosophy: animations, component design, invisible details |
| `animate` | Build animations from scratch with correct curves, easing, and duration |
| `review-animations` | Critique and fix existing animations |
| `improve-animations` | Audit a codebase for animation improvements |
| `find-animation-opportunities` | Identify where motion could enhance UX |
| `animation-performance` | Optimize animation performance |
| `animation-vocabulary` | Shared language for describing motion |
| `apple-design` | Apply Apple's design philosophy |
| `ask-sonner` | Toast notification best practices |
| `break-ui` | Stress-test UI edge cases |
| `mobile-native` | Native mobile design patterns |
| `pick-ui-library` | Choose the right UI component library |
| `prototype` | Rapid prototyping guidance |
| `write-swift` | SwiftUI code generation |
| `animate-expo` | React Native / Expo animations |

### From Leonxlnx/taste-skill — Anti-Slop Frontend

| Skill | Purpose |
|---|---|
| `design-taste-frontend` | Anti-slop skill for landing pages, portfolios, redesigns — no AI clichés |
| `high-end-visual-design` | Premium visual design principles |
| `minimalist-ui` | Minimal, clean UI patterns |
| `industrial-brutalist-ui` | Brutalist / industrial aesthetic |
| `redesign-existing-projects` | Audit-first redesign methodology |
| `stitch-design-taste` | Multi-image reference boards |
| `imagegen-frontend-web` | Image generation for web reference boards |
| `imagegen-frontend-mobile` | Image generation for mobile reference boards |
| `image-to-code` | Convert design images to code |
| `brandkit` | Brand kit generation |
| `gpt-taste` | Design taste for GPT image generation |
| `full-output-enforcement` | Enforce complete code output (no truncation) |
| `design-taste-frontend-v1` | Previous version for reference |

### From pbakaus/impeccable — Design Language System

Impeccable provides a comprehensive design audit system with 24 commands.
Use `/impeccable <command>` syntax:

| Command | What it does |
|---|---|
| `/impeccable init` | One-time setup: write PRODUCT.md with product context |
| `/impeccable craft` | Full shape-then-build flow |
| `/impeccable polish` | Final pass, design system alignment, shipping readiness |
| `/impeccable audit` | Technical quality checks (a11y, performance, responsive) |
| `/impeccable critique` | UX design review: hierarchy, clarity, emotional resonance |
| `/impeccable animate` | Add purposeful motion |
| `/impeccable bolder` | Amplify boring designs |
| `/impeccable quieter` | Tone down overly bold designs |
| `/impeccable layout` | Fix layout, spacing, visual rhythm |
| `/impeccable typeset` | Fix font choices, hierarchy, sizing |
| `/impeccable colorize` | Introduce strategic color |
| `/impeccable shape` | Plan UX/UI before writing code |
| `/impeccable harden` | Error handling, i18n, edge cases |
| `/impeccable distill` | Strip to essence |
| `/impeccable delight` | Add moments of joy |
| `/impeccable onboard` | First-run flows, empty states |
| `/impeccable clarify` | Improve unclear UX copy |
| `/impeccable adapt` | Adapt for different devices |
| `/impeccable optimize` | Performance improvements |

## Core Design Principles (Active in All Work)

### Anti-Defaults (MANDATORY)
- **NO**: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism, Inter font as default, bounce/elastic easings
- **DO**: Read the brief → infer vibe → pick the right aesthetic deliberately

### Animation Rules
- UI animations stay under 300ms
- Use `ease-out` for entering elements, `ease-in-out` for on-screen movement
- Never use `ease-in` for UI (feels sluggish)
- Never animate from `scale(0)` — use `scale(0.95)` + opacity
- Don't animate keyboard-triggered actions (used 100+ times/day)

### Typography
- Avoid Inter as default — prefer Geist, Satoshi, Cabinet Grotesk
- No Fraunces or Instrument Serif as AI defaults
- Display headlines: `text-4xl md:text-6xl tracking-tighter leading-none`

### Layout
- Use `min-h-[100dvh]` not `h-screen` for hero sections (mobile Safari fix)
- Use CSS Grid over complex flexbox math
- Max page width: `max-w-[1400px] mx-auto`
- Max 1 eyebrow label per 3 sections

## Project Stack

- **Framework**: Next.js (React Server Components by default)
- **Styling**: Tailwind CSS
- **Animation**: Motion (formerly Framer Motion) — import from `motion/react`
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) preferred
