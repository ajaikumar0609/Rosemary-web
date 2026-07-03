import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { state, bus } from '../store.js'
import { particleVert, particleFrag } from '../shaders.js'

const _v = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _mouse = new THREE.Vector3(0, 99, 0)

export default function Particles({ settings }) {
  const mat = useRef()
  const pts = useRef()

  const geo = useMemo(() => {
    const n = settings.particles
    const pos = new Float32Array(n * 3) // unused by shader, defines count
    const seed = new Float32Array(n * 4)
    for (let i = 0; i < n * 4; i++) seed[i] = Math.random()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 30)
    return g
  }, [settings.particles])

  // live degrade: halve particle count if FPS drops
  useEffect(() => bus.on('degrade', (lvl) => {
    if (lvl >= 1 && pts.current) {
      pts.current.geometry.setDrawRange(0, Math.floor(settings.particles / 2))
    }
  }), [settings.particles])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpen: { value: 0 },
    uGold: { value: 0 },
    uWarm: { value: 1 },
    uSize: { value: settings.mobile ? 1.15 : 1.35 },
    uPx: { value: Math.min(window.devicePixelRatio, 2) },
    uMouse: { value: new THREE.Vector3(0, 99, 0) }
  }), [settings.mobile])

  useFrame(({ camera }) => {
    const t = performance.now() / 1000
    const p = state.p
    const u = mat.current.uniforms
    u.uTime.value = state.reducedHalt ? 0 : t
    u.uOpen.value = THREE.MathUtils.smoothstep(p, 0.1, 0.26)
    u.uGold.value =
      THREE.MathUtils.smoothstep(p, 0.55, 0.65) *
      (1 - 0.6 * THREE.MathUtils.smoothstep(p, 0.8, 0.92))
    // sunlit motes by day, cosmic sparks again at night
    u.uWarm.value = 1 - THREE.MathUtils.smoothstep(p, 0.72, 0.9)

    // project the cursor onto a horizontal plane at y=1.6 for repulsion
    _v.set(state.mouse.x, state.mouse.y, 0.5).unproject(camera)
    _dir.copy(_v).sub(camera.position).normalize()
    const ty = (1.6 - camera.position.y) / (_dir.y || 0.0001)
    if (ty > 0 && ty < 40) {
      _mouse.copy(camera.position).addScaledVector(_dir, ty)
      _mouse.clampLength(0, 14)
    } else {
      _mouse.set(0, 99, 0)
    }
    u.uMouse.value.lerp(_mouse, 0.12)
  })

  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={particleVert}
        fragmentShader={particleFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  )
}
