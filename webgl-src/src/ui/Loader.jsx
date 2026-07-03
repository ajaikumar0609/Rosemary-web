import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bus } from '../store.js'
import { SCHOOL } from '../content.js'

const CIRC = 2 * Math.PI * 44

export default function Loader() {
  const [show, setShow] = useState(true)
  const [pct, setPct] = useState(0)
  const ready = useRef(false)
  const started = useRef(performance.now())

  useEffect(() => {
    document.documentElement.classList.add('locked')
    let raf
    const tick = () => {
      const el = (performance.now() - started.current) / 1500
      setPct((p) => {
        const cap = ready.current ? 100 : 92
        const target = Math.min(cap, el * 100)
        return p + (target - p) * 0.12
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const off = bus.on('ready', () => {
      const wait = Math.max(0, 1500 - (performance.now() - started.current))
      setTimeout(() => {
        ready.current = true
        setTimeout(() => {
          setShow(false)
          document.documentElement.classList.remove('locked')
        }, 420)
      }, wait)
    })
    return () => { cancelAnimationFrame(raf); off(); document.documentElement.classList.remove('locked') }
  }, [])

  const shown = Math.round(pct)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loader"
          exit={{ y: '-100%', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
        >
          <motion.div
            className="loader-inner"
            exit={{ opacity: 0, y: -40, transition: { duration: 0.4 } }}
          >
            <div className="loader-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" className="ring-bg" />
                <circle
                  cx="50" cy="50" r="44" className="ring-fg"
                  style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - pct / 100) }}
                />
              </svg>
              <span className="loader-r">R</span>
            </div>
            <div className="loader-name">ROSEMARY</div>
            <div className="loader-sub">Matric Hr. Sec. School · Tirunelveli · Since {SCHOOL.since}</div>
            <div className="loader-pct">{shown}%</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
