import React, { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { detectQuality, webglSupported } from './quality.js'
import { state, bus, setFocus } from './store.js'
import Experience from './scene/Experience.jsx'
import Overlay from './ui/Overlay.jsx'
import Loader from './ui/Loader.jsx'
import Fallback from './ui/Fallback.jsx'

export default function App() {
  const settings = useMemo(detectQuality, [])
  const [ok] = useState(webglSupported)
  const [deg, setDeg] = useState(0)

  useEffect(() => bus.on('degrade', setDeg), [])

  useEffect(() => {
    if (!ok) return
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    let focusAnchor = null
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      state.targetP = Math.min(1, Math.max(0, window.scrollY / max))
      // scrolling away cancels a focused building
      if (state.focus) {
        if (focusAnchor === null) focusAnchor = state.targetP
        else if (Math.abs(state.targetP - focusAnchor) > 0.02) { setFocus(null); focusAnchor = null }
      } else focusAnchor = null
    }
    const onMouse = (e) => {
      state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      state.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onKey = (e) => { if (e.key === 'Escape') setFocus(null) }

    // horizontal touch drag → gentle orbit on mobile
    let tx = null
    const ts = (e) => { if (e.touches.length === 1) tx = e.touches[0].clientX }
    const tm = (e) => {
      if (tx !== null && e.touches.length === 1) {
        const dx = e.touches[0].clientX - tx
        tx = e.touches[0].clientX
        state.touchYaw = THREE.MathUtils.clamp(state.touchYaw + dx * 0.0035, -0.6, 0.6)
      }
    }
    const te = () => { tx = null }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', ts, { passive: true })
    window.addEventListener('touchmove', tm, { passive: true })
    window.addEventListener('touchend', te, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', ts)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', te)
    }
  }, [ok])

  if (!ok) return <Fallback />

  return (
    <>
      <div className="webgl-wrap" aria-hidden="true">
        <Canvas
          dpr={settings.dpr}
          gl={{
            antialias: settings.aa,
            powerPreference: 'high-performance',
            alpha: false,
            stencil: false
          }}
          camera={{ fov: 44, near: 0.1, far: 400, position: [0, 1.4, 9.8] }}
          shadows={settings.shadow > 0}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.06
          }}
        >
          <Experience settings={settings} postOn={settings.post && deg < 2} />
        </Canvas>
      </div>
      <Overlay settings={settings} />
      <Loader />
      <div className="scroll-space" style={{ height: settings.mobile ? '560vh' : '640vh' }} />
    </>
  )
}
