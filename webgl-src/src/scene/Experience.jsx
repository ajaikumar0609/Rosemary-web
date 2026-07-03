import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { state, bus } from '../store.js'
import Background from './Background.jsx'
import Particles from './Particles.jsx'
import Book from './Book.jsx'
import Campus from './Campus.jsx'
import CameraRig from './CameraRig.jsx'

// emits 'ready' once the first frames have actually rendered
function Ready() {
  const n = useRef(0)
  useFrame(() => {
    if (n.current > 2) return
    n.current++
    if (n.current === 3) { state.ready = true; bus.emit('ready') }
  })
  return null
}

// live FPS governor — degrades quality instead of dropping frames
function Governor() {
  const a = useRef({ t: 0, n: 0, level: 0, warm: 0 })
  const setDpr = useThree((s) => s.setDpr)
  const gl = useThree((s) => s.gl)
  useFrame((_, dt) => {
    const g = a.current
    g.warm += dt
    if (g.warm < 4) return // let things settle first
    g.t += dt; g.n++
    if (g.t >= 2.5) {
      const fps = g.n / g.t
      g.t = 0; g.n = 0
      if (fps < 34 && g.level < 2) {
        g.level++
        state.degraded = g.level
        if (g.level === 1) setDpr(Math.min(gl.getPixelRatio(), 1.25))
        bus.emit('degrade', g.level)
      }
    }
  })
  return null
}

// sunlight follows the time of day (dawn → noon → golden hour → twilight)
const LP = [0, 0.3, 0.62, 0.85, 1]
const KEY_C = ['#ffd2a0', '#fff3d4', '#ffc070', '#9aa4dd', '#7c8cd0'].map(c => new THREE.Color(c))
const KEY_I = [1.6, 2.1, 2.3, 1.15, 0.95]
const SKY_C = ['#aebde8', '#bcd9ff', '#d9b8e8', '#5868a8', '#3c4a88'].map(c => new THREE.Color(c))
const GND_C = ['#8a6c4f', '#c2a276', '#a87b54', '#4a4458', '#383850'].map(c => new THREE.Color(c))

function lerpAt(arr, p, out) {
  let i = 0
  while (i < LP.length - 2 && p > LP[i + 1]) i++
  const s = THREE.MathUtils.clamp((p - LP[i]) / (LP[i + 1] - LP[i]), 0, 1)
  if (out) return out.copy(arr[i]).lerp(arr[i + 1], s)
  return THREE.MathUtils.lerp(arr[i], arr[i + 1], s)
}

function PhaseLights({ settings }) {
  const key = useRef()
  const hemi = useRef()
  useFrame(() => {
    const p = state.p
    if (key.current) {
      lerpAt(KEY_C, p, key.current.color)
      key.current.intensity = lerpAt(KEY_I, p)
      // sun sweeps lower through the day
      const sy = 10 - 5.5 * THREE.MathUtils.smoothstep(p, 0.45, 0.9)
      key.current.position.set(7, sy, 5)
    }
    if (hemi.current) {
      lerpAt(SKY_C, p, hemi.current.color)
      lerpAt(GND_C, p, hemi.current.groundColor)
      hemi.current.intensity = 0.7 - 0.18 * THREE.MathUtils.smoothstep(p, 0.7, 1)
    }
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#aebde8', '#8a6c4f', 0.7]} />
      <directionalLight
        ref={key}
        position={[7, 10, 5]}
        color="#ffd2a0"
        intensity={1.6}
        castShadow={settings.shadow > 0}
        shadow-mapSize={[settings.shadow || 512, settings.shadow || 512]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-camera-near={2}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 5, -7]} color="#9db8e8" intensity={0.4} />
    </>
  )
}

export default function Experience({ settings, postOn }) {
  return (
    <>
      <color attach="background" args={['#05060d']} />
      <fogExp2 attach="fog" args={['#e8d3c8', 0.012]} />
      <PhaseLights settings={settings} />

      <Background settings={settings} />
      <Particles settings={settings} />
      <Book settings={settings} />
      <Campus settings={settings} />
      <CameraRig settings={settings} />
      <Ready />
      <Governor />

      {postOn && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.95} luminanceSmoothing={0.12} radius={0.7} />
          {settings.vignette && <Vignette offset={0.28} darkness={0.78} />}
        </EffectComposer>
      )}
    </>
  )
}
