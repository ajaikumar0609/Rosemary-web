import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { state, bus, sceneFromP, setScene } from '../store.js'
import { BUILDINGS } from '../content.js'

// Cinematic key-framed path through the 3D story (Catmull-Rom, non-uniform keys)
const TS = [0, 0.17, 0.30, 0.42, 0.50, 0.62, 0.72, 0.85, 1.0]
const POS = [
  [0.0, 1.4, 9.8], [1.8, 2.0, 8.2], [4.8, 3.4, 6.6], [3.4, 1.9, 4.6],
  [1.1, 1.5, 3.5], [-3.8, 2.2, 4.4], [-2.4, 4.2, 5.6], [0.0, 3.6, 8.0], [0.0, 5.4, 11.6]
].map(v => new THREE.Vector3(...v))
const LOOK = [
  [0, 0.6, 0], [0, 0.7, 0], [0, 1.1, 0], [0.4, 1.15, 0.2],
  [-1.2, 1.0, -0.4], [0, 1.6, -0.8], [0, 2.2, -1.2], [0, 2.6, -2.0], [0, 3.8, -7.0]
].map(v => new THREE.Vector3(...v))

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t
  return 0.5 * ((2 * p1) + (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

function sample(keys, p, out) {
  let i = 0
  while (i < TS.length - 2 && p > TS[i + 1]) i++
  const s = THREE.MathUtils.clamp((p - TS[i]) / (TS[i + 1] - TS[i]), 0, 1)
  const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(keys.length - 1, i + 2)]
  out.set(cr(a.x, b.x, c.x, d.x, s), cr(a.y, b.y, c.y, d.y, s), cr(a.z, b.z, c.z, d.z, s))
  return out
}

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _fPos = new THREE.Vector3()
const _fLook = new THREE.Vector3()
const _f = new THREE.Vector3()
const _r = new THREE.Vector3()
const _u = new THREE.Vector3()
const _rel = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

export default function CameraRig({ settings }) {
  const blend = useRef({ v: 0 })
  const focusId = useRef(null)
  const mx = useRef(0)
  const my = useRef(0)
  const yaw = useRef(0)

  useEffect(() => bus.on('focus', (id) => {
    if (id) focusId.current = id
    gsap.to(blend.current, {
      v: id ? 1 : 0,
      duration: id ? 1.7 : 1.2,
      ease: id ? 'power3.inOut' : 'power2.out'
    })
  }), [])

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05)
    // damp scroll progress — this is what makes everything feel liquid
    state.p = THREE.MathUtils.damp(state.p, state.targetP, 3.2, d)
    setScene(sceneFromP(state.p))

    const t = performance.now() / 1000
    sample(POS, state.p, _pos)
    sample(LOOK, state.p, _look)

    // focused building override
    const bl = blend.current.v
    if (bl > 0.001 && focusId.current) {
      const cam = BUILDINGS[focusId.current].cam
      _fPos.set(cam.pos[0], cam.pos[1] + 0.12, cam.pos[2])
      _fLook.set(cam.look[0], cam.look[1] + 0.12, cam.look[2])
      // slow orbital drift while inspecting
      _rel.copy(_fPos).sub(_fLook)
      _rel.applyAxisAngle(UP, Math.sin(t * 0.25) * 0.12)
      _fPos.copy(_fLook).add(_rel)
      _pos.lerp(_fPos, bl)
      _look.lerp(_fLook, bl)
    }

    // touch yaw (mobile drag)
    if (Math.abs(state.touchYaw) > 0.0005) {
      _rel.copy(_pos).sub(_look)
      _rel.applyAxisAngle(UP, state.touchYaw)
      _pos.copy(_look).add(_rel)
      state.touchYaw *= Math.pow(0.45, d) // decay
    }

    // mouse parallax
    const pk = settings.reduced ? 0.12 : (settings.mobile ? 0 : 1)
    mx.current = THREE.MathUtils.damp(mx.current, state.mouse.x * pk, 2.4, d)
    my.current = THREE.MathUtils.damp(my.current, state.mouse.y * pk, 2.4, d)
    _f.copy(_look).sub(_pos).normalize()
    _r.crossVectors(_f, UP).normalize()
    _u.crossVectors(_r, _f)
    _pos.addScaledVector(_r, mx.current * 0.5).addScaledVector(_u, my.current * 0.3)
    _look.addScaledVector(_r, mx.current * 0.12)

    camera.position.copy(_pos)
    camera.lookAt(_look)

    // dynamic focal length: opens up toward the horizon finale
    const fovTarget = THREE.MathUtils.lerp(
      44 + 7 * THREE.MathUtils.smoothstep(state.p, 0.82, 1),
      37, bl
    )
    if (Math.abs(camera.fov - fovTarget) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fovTarget, 3, d)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
