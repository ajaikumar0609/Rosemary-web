import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { state, bus, SCENES, setFocus as clearFocus } from '../store.js'
import { SCHOOL, NAV, CAPTIONS, BUILDINGS } from '../content.js'

const SCENE_NAMES = ['Story', 'Campus', 'Academics', 'Achievements', 'Tomorrow']

// ---------- magnetic element ----------
function Magnetic({ href, className = '', children, onClick, strength = 14 }) {
  const ref = useRef()
  const fine = window.matchMedia('(pointer: fine)').matches
  const onMove = (e) => {
    if (!fine) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    ref.current.style.transform = `translate(${(dx / r.width) * strength}px, ${(dy / r.height) * strength}px)`
  }
  const onLeave = () => { ref.current.style.transform = 'translate(0px, 0px)' }
  return (
    <a ref={ref} href={href} onClick={onClick} data-mag className={`mag ${className}`}
      onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </a>
  )
}

// ---------- animated counter ----------
function Counter({ n, suffix, active }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) { setV(0); return }
    let st = null, raf
    const tick = (ts) => {
      if (!st) st = ts
      const k = Math.min(1, (ts - st) / 1400)
      setV(Math.round(n * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, n])
  return <span>{v}{suffix}</span>
}

// ---------- custom cursor ----------
function Cursor() {
  const dot = useRef(); const ring = useRef()
  useEffect(() => {
    const pos = { x: -100, y: -100 }, cur = { x: -100, y: -100 }
    let hovering = false, raf
    const move = (e) => { pos.x = e.clientX; pos.y = e.clientY }
    const over = (e) => { hovering = !!e.target.closest('a, button, [data-mag], .dot') }
    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.18
      cur.y += (pos.y - cur.y) * 0.18
      if (dot.current) dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      if (ring.current) ring.current.style.transform =
        `translate(${cur.x}px, ${cur.y}px) scale(${hovering ? 1.7 : 1})`
      raf = requestAnimationFrame(loop)
    }
    document.addEventListener('mousemove', move, { passive: true })
    document.addEventListener('mouseover', over, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseover', over); cancelAnimationFrame(raf) }
  }, [])
  return <><div ref={dot} className="cursor-dot" /><div ref={ring} className="cursor-ring" /></>
}

// ---------- main overlay ----------
export default function Overlay({ settings }) {
  const [scene, setScene] = useState(0)
  const [hover, setHover] = useState(null)
  const [focus, setFocus] = useState(null)
  const [menu, setMenu] = useState(false)
  const progressRef = useRef()
  const hintRef = useRef()
  const hoverCard = useRef()

  useEffect(() => {
    const offs = [
      bus.on('scene', setScene),
      bus.on('hover', setHover),
      bus.on('focus', setFocus)
    ]
    return () => offs.forEach((o) => o())
  }, [])

  // progress bar + scroll hint, driven directly (no re-renders)
  useEffect(() => {
    let raf
    const loop = () => {
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${state.p})`
      if (hintRef.current) hintRef.current.style.opacity = state.p > 0.03 ? 0 : 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // hover card follows the cursor
  useEffect(() => {
    if (!hover || settings.mobile) return
    const move = (e) => {
      const el = hoverCard.current
      if (!el) return
      const x = Math.min(e.clientX + 20, window.innerWidth - 270)
      const y = Math.min(e.clientY + 20, window.innerHeight - 110)
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    document.addEventListener('mousemove', move, { passive: true })
    return () => document.removeEventListener('mousemove', move)
  }, [hover, settings.mobile])

  const scrollToScene = (i) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const target = (SCENES[i] + (i ? 0.02 : 0)) * max
    const proxy = { v: window.scrollY }
    gsap.to(proxy, {
      v: target, duration: 1.8, ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, proxy.v)
    })
  }

  const cap = CAPTIONS[scene]
  const showCursor = !settings.mobile && !settings.reduced && window.matchMedia('(pointer: fine)').matches

  useEffect(() => {
    if (showCursor) document.documentElement.classList.add('has-cursor')
    return () => document.documentElement.classList.remove('has-cursor')
  }, [showCursor])

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } }
  }
  const line = {
    hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -18, filter: 'blur(8px)', transition: { duration: 0.35 } }
  }

  return (
    <div className="overlay">
      {/* progress */}
      <div className="progress"><div ref={progressRef} className="progress-fill" /></div>

      {/* nav */}
      <header className="nav glass">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); scrollToScene(0) }}>
          <img src="images/logo.png" alt="" onError={(e) => (e.target.style.display = 'none')} />
          <span>
            <strong>Rosemary</strong>
            <em>Matric Hr. Sec. School</em>
          </span>
        </a>
        <nav className="nav-links">
          {NAV.map((n) => <Magnetic key={n.href} href={n.href} className="nav-link">{n.label}</Magnetic>)}
          <Magnetic href="admissions.html" className="nav-cta">Admissions</Magnetic>
        </nav>
        <button className="burger" aria-label="Menu" onClick={() => setMenu(true)}>
          <i /><i />
        </button>
      </header>

      {/* mobile menu */}
      <AnimatePresence>
        {menu && (
          <motion.div className="sheet glass" initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <button className="sheet-close" aria-label="Close" onClick={() => setMenu(false)}>×</button>
            {NAV.map((n, i) => (
              <motion.a key={n.href} href={n.href} initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.08 + i * 0.05 } }}>{n.label}</motion.a>
            ))}
            <div className="sheet-foot">{SCHOOL.phone}<br />{SCHOOL.email}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* scene captions */}
      <div className={`caption-zone ${focus ? 'dimmed' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div key={scene} className="caption" variants={stagger} initial="hidden" animate="show" exit="exit">
            <motion.p className="overline" variants={line}>{cap.overline}</motion.p>
            <motion.h1 variants={line}>
              {cap.title.map((t, i) => (
                <span key={i} className="title-line">
                  {i === cap.italic ? <em>{t}</em> : t}
                </span>
              ))}
            </motion.h1>
            <motion.p className="body" variants={line}>{cap.body}</motion.p>

            {cap.chips && (
              <motion.div className="chips" variants={line}>
                {cap.chips.map((c) => <span key={c} className="chip glass">{c}</span>)}
              </motion.div>
            )}

            {cap.stats && (
              <motion.div className="stats" variants={line}>
                {cap.stats.map((s) => (
                  <div key={s.label} className="stat glass">
                    <span className="stat-n"><Counter n={s.n} suffix={s.suffix} active={scene === 3} /></span>
                    <span className="stat-l">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {cap.cta && (
              <motion.div variants={line}>
                <div className="cta-row">
                  <Magnetic href="admissions.html" className="btn btn-gold" strength={20}>Apply for Admission</Magnetic>
                  <Magnetic href="contact.html" className="btn btn-glass" strength={20}>Contact Us</Magnetic>
                </div>
                <p className="cta-contact">{SCHOOL.address}<br />{SCHOOL.phone} · {SCHOOL.email}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* scene dots */}
      <div className="dots">
        {SCENE_NAMES.map((n, i) => (
          <button key={n} className={`dot ${scene === i ? 'active' : ''}`} onClick={() => scrollToScene(i)}>
            <span className="dot-label glass">{n}</span>
            <i />
          </button>
        ))}
      </div>

      {/* hover tooltip */}
      {hover && !focus && !settings.mobile && (
        <div ref={hoverCard} className="hover-card glass">
          <strong>{BUILDINGS[hover].name}</strong>
          <span>{BUILDINGS[hover].line}</span>
          <em>Click to explore →</em>
        </div>
      )}

      {/* focused building panel */}
      <AnimatePresence>
        {focus && (
          <motion.aside className="focus-panel glass"
            initial={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <button className="panel-close" onClick={() => clearFocus(null)}>×</button>
            <p className="overline">Rosemary Campus</p>
            <h3>{BUILDINGS[focus].name}</h3>
            <p className="panel-line">{BUILDINGS[focus].line}</p>
            <p className="panel-blurb">{BUILDINGS[focus].blurb}</p>
            <Magnetic href={BUILDINGS[focus].link} className="btn btn-gold btn-sm">Open page →</Magnetic>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* scroll hint */}
      <div ref={hintRef} className="hint">
        <div className="mouse"><i /></div>
        <span>Scroll to explore</span>
      </div>

      {/* classic site escape hatch */}
      <a className="classic-link" href="index-classic.html">Classic site</a>

      {showCursor && <Cursor />}
    </div>
  )
}
