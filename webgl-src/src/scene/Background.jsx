import React, { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { state } from '../store.js'
import {
  starVert, starFrag, skyVert, skyFrag,
  rayVert, rayFrag, trailVert, trailFrag, ringVert, ringFrag,
  leafVert, leafFrag
} from '../shaders.js'

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- day-cycle palettes: dawn → day → golden hour → twilight → night ----
const PHASES = [0, 0.3, 0.62, 0.85, 1.0]
const PAL = {
  top:  ['#7d96d8', '#3f7ecf', '#5570c0', '#232a5e', '#0d1233'].map(c => new THREE.Color(c)),
  hor:  ['#ffd9b0', '#cfe9f8', '#ffbb74', '#b06a9a', '#3a2f63'].map(c => new THREE.Color(c)),
  sun:  ['#ffdca8', '#fff6da', '#ffc878', '#ff9d72', '#c9a4ff'].map(c => new THREE.Color(c)),
  fog:  ['#e8d3c8', '#d6e6f2', '#f2cfa8', '#5a4a72', '#2c2a4a'].map(c => new THREE.Color(c)),
  sunY: [0.34, 0.62, 0.28, 0.1, 0.05],
  star: [0, 0, 0, 0.55, 1]
}
function phaseLerp(arr, p, out) {
  let i = 0
  while (i < PHASES.length - 2 && p > PHASES[i + 1]) i++
  const s = THREE.MathUtils.clamp((p - PHASES[i]) / (PHASES[i + 1] - PHASES[i]), 0, 1)
  if (out) return out.copy(arr[i]).lerp(arr[i + 1], s)
  return THREE.MathUtils.lerp(arr[i], arr[i + 1], s)
}

const _c = new THREE.Color()

export default function Background({ settings }) {
  const skyMat = useRef()
  const starMat = useRef()
  const rayMat = useRef()
  const goldRayMat = useRef()
  const ringMat = useRef()
  const trailMat = useRef()
  const trailMesh = useRef()
  const leafMat = useRef()
  const leafMesh = useRef()
  const starGroup = useRef()
  const scene = useThree((s) => s.scene)

  // ----- stars (twilight & night only) -----
  const starGeo = useMemo(() => {
    const rnd = mulberry32(42)
    const n = settings.stars
    const pos = new Float32Array(n * 3)
    const aS = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 70 + rnd() * 80
      const theta = rnd() * Math.PI * 2
      const y = rnd() * 0.95 + 0.05
      const ph = Math.sqrt(Math.max(0, 1 - y * y))
      pos[i * 3] = Math.cos(theta) * ph * r
      pos[i * 3 + 1] = y * r * 0.9 + 4
      pos[i * 3 + 2] = Math.sin(theta) * ph * r
      aS[i * 3] = 0.6 + rnd() * 1.8
      aS[i * 3 + 1] = rnd()
      aS[i * 3 + 2] = rnd()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 3))
    return g
  }, [settings.stars])

  // ----- floating leaves -----
  const leafGeo = useMemo(() => {
    const rnd = mulberry32(99)
    const n = settings.leaves
    const aL = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      aL[i * 4] = rnd()                 // phase
      aL[i * 4 + 1] = 1.6 + rnd() * 3.6 // radius
      aL[i * 4 + 2] = rnd()             // height
      aL[i * 4 + 3] = rnd()             // tint
    }
    return { aL, n }
  }, [settings.leaves])

  // ----- light trails (finale) -----
  const trailData = useMemo(() => {
    const rnd = mulberry32(7)
    const n = settings.trails
    const m = []
    const aT = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      m.push({
        x: (rnd() * 2 - 1) * 16,
        y: 1.5 + rnd() * 9,
        z: -14 - rnd() * 14,
        len: 5 + rnd() * 11
      })
      aT[i * 3] = rnd()
      aT[i * 3 + 1] = 0.7 + rnd() * 1.6
      aT[i * 3 + 2] = rnd()
    }
    return { m, aT, n }
  }, [settings.trails])

  useLayoutEffect(() => {
    const mesh = trailMesh.current
    if (!mesh) return
    const o = new THREE.Object3D()
    trailData.m.forEach((t, i) => {
      o.position.set(t.x, t.y, t.z)
      o.scale.set(t.len, 1, 1)
      o.rotation.y = Math.PI / 2
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('aT', new THREE.InstancedBufferAttribute(trailData.aT, 3))
    mesh.frustumCulled = false
  }, [trailData])

  useLayoutEffect(() => {
    if (leafMesh.current) {
      leafMesh.current.geometry.setAttribute('aL', new THREE.InstancedBufferAttribute(leafGeo.aL, 4))
    }
  }, [leafGeo])

  useFrame((_, dt) => {
    const t = performance.now() / 1000
    const p = state.p

    // ---- sky / fog follow the time of day ----
    if (skyMat.current) {
      const u = skyMat.current.uniforms
      u.uTime.value = t
      phaseLerp(PAL.top, p, u.uTop.value)
      phaseLerp(PAL.hor, p, u.uHor.value)
      phaseLerp(PAL.sun, p, u.uSun.value)
      u.uStar.value = phaseLerp(PAL.star, p)
      const sy = phaseLerp(PAL.sunY, p)
      u.uSunDir.value.set(0.55, sy, 0.42).normalize()
    }
    if (scene.fog) phaseLerp(PAL.fog, p, scene.fog.color)

    if (starMat.current) {
      starMat.current.uniforms.uTime.value = t
      starMat.current.uniforms.uOp.value = phaseLerp(PAL.star, p)
    }
    if (starGroup.current) starGroup.current.rotation.y += dt * 0.004

    if (rayMat.current) {
      // soft dawn shaft over the book — fades as the day opens up
      const i = 0.45 * (1 - THREE.MathUtils.smoothstep(p, 0.3, 0.5))
      rayMat.current.uniforms.uIntensity.value = i
      rayMat.current.uniforms.uTime.value = t
      phaseLerp(PAL.sun, p, rayMat.current.uniforms.uColor.value)
    }
    if (goldRayMat.current) {
      const i = 0.7 * THREE.MathUtils.smoothstep(p, 0.56, 0.66) * (1 - THREE.MathUtils.smoothstep(p, 0.78, 0.88))
      goldRayMat.current.uniforms.uIntensity.value = i
      goldRayMat.current.uniforms.uTime.value = t
    }
    if (ringMat.current) {
      ringMat.current.uniforms.uTime.value = t
      ringMat.current.uniforms.uIntensity.value = 0.22 * THREE.MathUtils.smoothstep(p, 0.2, 0.36)
    }
    if (trailMat.current) {
      trailMat.current.uniforms.uTime.value = t
      trailMat.current.uniforms.uOn.value = THREE.MathUtils.smoothstep(p, 0.78, 0.92)
    }
    if (leafMat.current) {
      leafMat.current.uniforms.uTime.value = t
      // leaves dance once the campus is out, settle at night
      leafMat.current.uniforms.uOn.value =
        THREE.MathUtils.smoothstep(p, 0.22, 0.34) * (1 - 0.65 * THREE.MathUtils.smoothstep(p, 0.82, 0.95))
    }
  })

  const add = { blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }

  return (
    <group>
      {/* anime sky dome */}
      <mesh scale={[160, 160, 160]} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 24]} />
        <shaderMaterial
          ref={skyMat}
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={{
            uTime: { value: 0 },
            uStar: { value: 0 },
            uTop: { value: new THREE.Color('#7d96d8') },
            uHor: { value: new THREE.Color('#ffd9b0') },
            uSun: { value: new THREE.Color('#ffdca8') },
            uSunDir: { value: new THREE.Vector3(0.55, 0.34, 0.42).normalize() }
          }}
          defines={{ OCT: settings.nebOct }}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* stars — appear at twilight */}
      <group ref={starGroup}>
        <points geometry={starGeo} frustumCulled={false}>
          <shaderMaterial
            ref={starMat}
            vertexShader={starVert}
            fragmentShader={starFrag}
            uniforms={{ uTime: { value: 0 }, uOp: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio, 2) } }}
            {...add}
          />
        </points>
      </group>

      {/* dawn light shaft onto the book */}
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.35, 2.7, 7.5, 24, 1, true]} />
        <shaderMaterial
          ref={rayMat}
          vertexShader={rayVert}
          fragmentShader={rayFrag}
          uniforms={{ uColor: { value: new THREE.Color('#ffdca8') }, uTime: { value: 0 }, uIntensity: { value: 0.4 } }}
          side={THREE.DoubleSide}
          {...add}
        />
      </mesh>

      {/* golden-hour shaft behind the school */}
      <mesh position={[0, 3.6, -2.0]}>
        <cylinderGeometry args={[0.25, 1.7, 6.5, 20, 1, true]} />
        <shaderMaterial
          ref={goldRayMat}
          vertexShader={rayVert}
          fragmentShader={rayFrag}
          uniforms={{ uColor: { value: new THREE.Color('#ffd28a') }, uTime: { value: 0 }, uIntensity: { value: 0 } }}
          side={THREE.DoubleSide}
          {...add}
        />
      </mesh>

      {/* soft energy waves under the floating island */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        <shaderMaterial
          ref={ringMat}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          uniforms={{ uTime: { value: 0 }, uIntensity: { value: 0 } }}
          side={THREE.DoubleSide}
          {...add}
        />
      </mesh>

      {/* floating leaves around the campus */}
      <instancedMesh ref={leafMesh} args={[null, null, leafGeo.n]} frustumCulled={false} position={[0, 0.82, 0]}>
        <planeGeometry args={[0.055, 0.038]} />
        <shaderMaterial
          ref={leafMat}
          vertexShader={leafVert}
          fragmentShader={leafFrag}
          uniforms={{ uTime: { value: 0 }, uOn: { value: 0 } }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          fog={false}
        />
      </instancedMesh>

      {/* light trails toward the future */}
      <instancedMesh ref={trailMesh} args={[null, null, trailData.n]}>
        <planeGeometry args={[1, 0.06]} />
        <shaderMaterial
          ref={trailMat}
          vertexShader={trailVert}
          fragmentShader={trailFrag}
          uniforms={{ uTime: { value: 0 }, uOn: { value: 0 } }}
          side={THREE.DoubleSide}
          {...add}
        />
      </instancedMesh>
    </group>
  )
}
