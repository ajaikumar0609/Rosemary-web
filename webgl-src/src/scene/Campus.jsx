import React, { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { state, setHover, setFocus } from '../store.js'
import { flagVert, flagFrag, glowVert, glowFrag } from '../shaders.js'

// =====================================================================
//  Faithful low-poly model of the real Rosemary campus:
//  three-storey U-shaped yellow block with white corridor railings,
//  dark plinth, curved central entrance tower with signboard,
//  flat parapet roofs, big sandy ground, paver paths, flag pedestal.
// =====================================================================

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const backOut = (t) => {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const clamp01 = (v) => Math.min(1, Math.max(0, v))

const GLASS_DAY = new THREE.Color('#5a6a78')
const GLASS_NIGHT = new THREE.Color('#ffd9a0')
const BULB_DAY = new THREE.Color('#9a9a8c')
const BULB_NIGHT = new THREE.Color('#ffd9a0')

function makeSignTexture() {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#f7f0da'; x.fillRect(0, 0, 640, 128)
  x.strokeStyle = '#c43d35'; x.lineWidth = 6; x.strokeRect(10, 10, 620, 108)
  x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillStyle = '#c43d35'
  x.font = '800 52px Manrope, system-ui, sans-serif'
  x.fillText('ROSEMARY', 320, 48)
  x.fillStyle = '#8a3a2e'
  x.font = '700 21px Manrope, system-ui, sans-serif'
  x.fillText('MATRIC. HR. SEC. SCHOOL', 320, 94)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function makeBlobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62)
  g.addColorStop(0, 'rgba(20,16,8,0.38)')
  g.addColorStop(1, 'rgba(20,16,8,0)')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// instanced quads (windows / frames)
function Windows({ spec, color = '#5a6a78', size = [0.17, 0.24], matRef }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    spec.forEach((w, i) => {
      o.position.set(w[0], w[1], w[2])
      o.rotation.set(0, w[3] || 0, 0)
      o.scale.set(w[4] || 1, w[5] || 1, 1)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [spec])
  return (
    <instancedMesh ref={ref} args={[null, null, spec.length]}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={matRef} color={color} toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function Hitbox({ id, pos, size }) {
  return (
    <mesh
      position={pos}
      onPointerOver={(e) => { if (state.p < 0.3) return; e.stopPropagation(); setHover(id) }}
      onPointerOut={() => { if (state.hover === id) setHover(null) }}
      onClick={(e) => { if (state.p < 0.3) return; e.stopPropagation(); setFocus(state.focus === id ? null : id) }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  )
}

function GlowDisc({ r = 1, sx = 1, sz = 1, pos = [0, 0.018, 0], refFn }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={pos} scale={[sx, sz, 1]}>
      <planeGeometry args={[r * 2, r * 2]} />
      <shaderMaterial
        ref={refFn}
        vertexShader={glowVert}
        fragmentShader={glowFrag}
        uniforms={{ uColor: { value: new THREE.Color('#ffd789') }, uIntensity: { value: 0 } }}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false}
      />
    </mesh>
  )
}

// -------- one three-storey wing: length along X, corridors facing +Z --------
function Wing({ L, M, SH, winRef, tower = false, tex, detail }) {
  const colRef = useRef()

  // corridor columns
  const cols = useMemo(() => {
    const n = Math.max(2, Math.round(L / 0.42))
    const xs = []
    for (let i = 0; i <= n; i++) xs.push(-L / 2 + 0.04 + (i * (L - 0.08)) / n)
    return xs
  }, [L])

  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    cols.forEach((x, i) => {
      o.position.set(x, 0.99, 0.445)
      o.updateMatrix()
      colRef.current.setMatrixAt(i, o.matrix)
    })
    colRef.current.instanceMatrix.needsUpdate = true
  }, [cols])

  // outer-face windows: 3 rows
  const outer = useMemo(() => {
    const out = []
    const nc = Math.max(3, Math.floor((L - 0.5) / 0.45))
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < nc; c++) {
        const x = -L / 2 + 0.4 + (c * (L - 0.8)) / (nc - 1)
        out.push([x, 0.36 + r * 0.56, -0.437, Math.PI])
      }
    return out
  }, [L])

  const floors = [0.2, 0.76, 1.32]

  return (
    <>
      {/* body + dark plinth */}
      <mesh position={[0, 0.97, 0]} material={M.yellow} castShadow={SH} receiveShadow={SH}>
        <boxGeometry args={[L, 1.62, 0.86]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={M.plinth}>
        <boxGeometry args={[L + 0.02, 0.2, 0.9]} />
      </mesh>

      {/* white floor bands + parapet + roof slab */}
      {[0.62, 1.18].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={M.white}>
          <boxGeometry args={[L + 0.04, 0.05, 0.92]} />
        </mesh>
      ))}
      <mesh position={[0, 1.78, 0]} material={M.yellow}>
        <boxGeometry args={[L + 0.04, 0.1, 0.92]} />
      </mesh>
      <mesh position={[0, 1.845, 0]} material={M.white} castShadow={SH}>
        <boxGeometry args={[L + 0.08, 0.045, 0.96]} />
      </mesh>

      {/* corridor shadow openings (inner face) */}
      {floors.map((f, i) => (
        <mesh key={i} position={[0, f + 0.3, 0.432]} material={M.corridor}>
          <planeGeometry args={[L - 0.14, 0.34]} />
        </mesh>
      ))}
      {/* white railings */}
      {floors.map((f, i) => (
        <group key={i}>
          <mesh position={[0, f + 0.17, 0.448]} material={M.white}>
            <boxGeometry args={[L - 0.12, 0.035, 0.02]} />
          </mesh>
          <mesh position={[0, f + 0.27, 0.448]} material={M.white}>
            <boxGeometry args={[L - 0.12, 0.028, 0.02]} />
          </mesh>
        </group>
      ))}
      {/* columns */}
      <instancedMesh ref={colRef} args={[null, null, cols.length]} castShadow={SH}>
        <boxGeometry args={[0.05, 1.62, 0.05]} />
        <primitive object={M.white} attach="material" />
      </instancedMesh>

      {/* outer windows: white frames + glass */}
      <Windows spec={outer} color="#fafaf2" size={[0.23, 0.3]} />
      <Windows spec={outer.map(w => [w[0], w[1], w[2] - 0.003, w[3]])} matRef={winRef} />

      {/* roof clutter */}
      {detail && (
        <>
          <mesh position={[L / 2 - 0.5, 1.99, -0.1]} material={M.plinth} castShadow={SH}>
            <boxGeometry args={[0.36, 0.24, 0.3]} />
          </mesh>
          <mesh position={[-L / 2 + 0.45, 2.0, 0.05]} material={M.yellow} castShadow={SH}>
            <boxGeometry args={[0.45, 0.3, 0.5]} />
          </mesh>
        </>
      )}

      {/* curved central entrance tower (main wing only) */}
      {tower && (
        <group position={[0, 0, 0.18]}>
          <mesh position={[0, 1.06, 0]} material={M.yellowDeep} castShadow={SH}>
            <cylinderGeometry args={[0.6, 0.6, 2.12, 24, 1, false, -Math.PI / 2, Math.PI]} />
          </mesh>
          {[0.62, 1.18].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} material={M.white}>
              <cylinderGeometry args={[0.625, 0.625, 0.05, 24, 1, false, -Math.PI / 2, Math.PI]} />
            </mesh>
          ))}
          <mesh position={[0, 2.16, 0]} material={M.white}>
            <cylinderGeometry args={[0.64, 0.64, 0.09, 24, 1, false, -Math.PI / 2, Math.PI]} />
          </mesh>
          {/* pediment + crest */}
          <group position={[0, 2.32, 0]} scale={[1.15, 1, 0.55]}>
            <mesh rotation={[0, Math.PI / 4, 0]} material={M.yellowDeep} castShadow={SH}>
              <coneGeometry args={[0.5, 0.28, 4]} />
            </mesh>
          </group>
          <mesh position={[0, 1.72, 0.605]}>
            <circleGeometry args={[0.13, 20]} />
            <meshBasicMaterial color="#f7f0da" toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.72, 0.61]}>
            <circleGeometry args={[0.09, 20]} />
            <meshBasicMaterial color="#c43d35" toneMapped={false} />
          </mesh>
          {/* signboard */}
          <mesh position={[0, 1.32, 0.56]} material={M.plinth}>
            <boxGeometry args={[1.52, 0.32, 0.1]} />
          </mesh>
          <mesh position={[0, 1.32, 0.615]}>
            <planeGeometry args={[1.44, 0.26]} />
            <meshBasicMaterial map={tex.sign} toneMapped={false} />
          </mesh>
          {/* entrance + red steps + hedges */}
          <mesh position={[0, 0.3, 0.585]} material={M.corridor}>
            <boxGeometry args={[0.55, 0.52, 0.05]} />
          </mesh>
          <mesh position={[0, 0.135, 0.66]} material={M.red}><boxGeometry args={[0.78, 0.05, 0.2]} /></mesh>
          <mesh position={[0, 0.085, 0.74]} material={M.red}><boxGeometry args={[0.92, 0.055, 0.24]} /></mesh>
          <mesh position={[0, 0.03, 0.84]} material={M.red}><boxGeometry args={[1.1, 0.055, 0.3]} /></mesh>
          {[-0.75, 0.75].map((x, i) => (
            <mesh key={i} position={[x, 0.14, 0.62]} material={M.hedge}>
              <boxGeometry args={[0.4, 0.22, 0.22]} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}

// ---------------------------- main component ----------------------------
export default function Campus({ settings }) {
  const root = useRef()
  const rocks = useRef([])
  const flagMat = useRef()
  const parts = useRef({})
  const glowRefs = useRef({})
  const winMats = useRef({})
  const bulbMat = useRef()
  const glowLevel = useRef({})

  const detail = settings.tier !== 'low'
  const SH = settings.shadow > 0

  const tex = useMemo(() => ({ sign: makeSignTexture(), blob: makeBlobTexture() }), [])

  const M = useMemo(() => ({
    yellow: new THREE.MeshStandardMaterial({ color: '#f0e092', roughness: 0.88 }),
    yellowDeep: new THREE.MeshStandardMaterial({ color: '#ecd682', roughness: 0.85 }),
    white: new THREE.MeshStandardMaterial({ color: '#fafaf2', roughness: 0.75 }),
    plinth: new THREE.MeshStandardMaterial({ color: '#3d4654', roughness: 0.8 }),
    corridor: new THREE.MeshStandardMaterial({ color: '#5c5044', roughness: 1 }),
    sand: new THREE.MeshStandardMaterial({ color: '#d8ab6c', roughness: 1 }),
    sandDark: new THREE.MeshStandardMaterial({ color: '#c89a5d', roughness: 1 }),
    paver: new THREE.MeshStandardMaterial({ color: '#c6c8c0', roughness: 0.95 }),
    soil: new THREE.MeshStandardMaterial({ color: '#7a5c3d', roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: '#54452f', roughness: 1, flatShading: true }),
    gold: new THREE.MeshStandardMaterial({ color: '#c9a25e', roughness: 0.3, metalness: 0.8, emissive: '#6b5120', emissiveIntensity: 0.3 }),
    red: new THREE.MeshStandardMaterial({ color: '#b5483f', roughness: 0.8 }),
    hedge: new THREE.MeshStandardMaterial({ color: '#4e8f52', roughness: 1, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: '#3a3f4c', roughness: 0.6 }),
    blue: new THREE.MeshStandardMaterial({ color: '#3a78c9', roughness: 0.55 }),
    yellowToy: new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.55 }),
    redToy: new THREE.MeshStandardMaterial({ color: '#d95448', roughness: 0.55 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#6b4a36', roughness: 1 }),
    crown: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true })
  }), [])

  // ----- trees: rows along wings + courtyard accents (like the photos) -----
  const trees = useMemo(() => {
    const rnd = mulberry32(2024)
    const spots = [
      // along left wing (inner edge)
      [-1.55, -1.0], [-1.55, -0.2], [-1.55, 0.6], [-1.55, 1.4], [-1.55, 2.1],
      // along right wing (inner edge)
      [1.62, -1.3], [1.62, -0.5], [1.62, 0.3], [1.62, 1.1],
      // behind the main block
      [-1.7, -2.35], [-0.6, -2.4], [0.6, -2.4], [1.7, -2.35],
      // near the gate
      [-1.7, 3.4], [1.7, 3.4], [-2.5, 3.0], [2.5, 3.0],
      // courtyard accents
      [0.55, 1.7], [-0.5, 1.3],
      // outer corners
      [-3.4, -1.7], [3.3, -1.6], [-3.3, 1.7], [3.2, 2.0],
      [-3.6, 0.2], [3.6, 0.6], [0.0, -3.1]
    ]
    return spots.slice(0, Math.min(spots.length, settings.trees)).map(([x, z]) => ({
      x: x + (rnd() - 0.5) * 0.24,
      z: z + (rnd() - 0.5) * 0.24,
      s: 0.9 + rnd() * 0.55,
      h: 1.0 + rnd() * 0.55,
      tint: rnd()
    }))
  }, [settings.trees])

  const trunkRef = useRef(); const crownRef = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const col = new THREE.Color()
    trees.forEach((t, i) => {
      o.position.set(t.x, 0.21, t.z); o.scale.set(1, 1, 1); o.rotation.y = 0
      o.updateMatrix(); trunkRef.current.setMatrixAt(i, o.matrix)
      o.position.set(t.x, 0.42 * t.h + 0.3, t.z)
      o.scale.set(t.s, t.h, t.s); o.rotation.y = t.tint * 6
      o.updateMatrix(); crownRef.current.setMatrixAt(i, o.matrix)
      if (t.tint > 0.94) col.set('#d98ac2')
      else col.set('#3c7d4c').lerp(new THREE.Color('#7fb45c'), t.tint)
      crownRef.current.setColorAt(i, col)
    })
    trunkRef.current.instanceMatrix.needsUpdate = true
    crownRef.current.instanceMatrix.needsUpdate = true
    if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true
  }, [trees])

  // ----- lamps along the entrance path -----
  const lampPos = useMemo(() => {
    const out = []
    ;[3.3, 2.4, 1.5].forEach(z => { out.push([-0.55, z]); out.push([0.55, z]) })
    return out
  }, [])
  const poleRef = useRef(); const bulbRef = useRef()
  useLayoutEffect(() => {
    if (!poleRef.current) return
    const o = new THREE.Object3D()
    lampPos.forEach(([x, z], i) => {
      o.position.set(x, 0.21, z); o.updateMatrix(); poleRef.current.setMatrixAt(i, o.matrix)
      o.position.set(x, 0.45, z); o.updateMatrix(); bulbRef.current.setMatrixAt(i, o.matrix)
    })
    poleRef.current.instanceMatrix.needsUpdate = true
    bulbRef.current.instanceMatrix.needsUpdate = true
  }, [lampPos])

  // ----- rise / hover / dusk animation -----
  const RISE = [
    ['platform', 0], ['gate', 0.06], ['main', 0.12], ['library', 0.24],
    ['science', 0.34], ['flags', 0.44], ['playground', 0.52], ['trees', 0.6], ['lamps', 0.7]
  ]

  useFrame((_, dt) => {
    const t = performance.now() / 1000
    const p = state.p
    const rise = THREE.MathUtils.smoothstep(p, 0.16, 0.36)
    const dusk = THREE.MathUtils.smoothstep(p, 0.6, 0.82)

    const rootG = root.current
    rootG.visible = rise > 0.001
    if (!rootG.visible) return

    for (const [id, delay] of RISE) {
      const g = parts.current[id]
      if (!g) continue
      const ti = clamp01((rise - delay) / 0.45)
      const e = ti >= 1 ? 1 : ti <= 0 ? 0 : backOut(ti)
      g.scale.setScalar(Math.max(0.001, e))
      g.position.y = g.userData.baseY + (1 - Math.min(ti * 1.2, 1)) * -0.9
      g.visible = ti > 0
    }

    rootG.position.y = 0.82 + Math.sin(t * 0.5) * 0.05 * rise
    rootG.rotation.y = Math.sin(t * 0.1) * 0.02

    rocks.current.forEach((r, i) => {
      if (r) { r.position.y = r.userData.y + Math.sin(t * 0.7 + i * 2.1) * 0.12; r.rotation.y += dt * 0.1 }
    })

    if (flagMat.current) flagMat.current.uniforms.uTime.value = t

    // windows + lamps glow warm at dusk
    for (const id in winMats.current) {
      const wm = winMats.current[id]
      const lvl = glowLevel.current[id] || 0
      wm.color.copy(GLASS_DAY).lerp(GLASS_NIGHT, dusk * 0.95).multiplyScalar(1 + lvl * 0.55)
    }
    if (bulbMat.current) bulbMat.current.color.copy(BULB_DAY).lerp(BULB_NIGHT, dusk).multiplyScalar(1 + dusk * 0.6)

    // hover glow
    for (const id in glowRefs.current) {
      const target = state.hover === id || state.focus === id ? 1 : 0
      glowLevel.current[id] = THREE.MathUtils.lerp(glowLevel.current[id] || 0, target, 1 - Math.pow(0.001, dt))
      const lvl = glowLevel.current[id]
      const gm = glowRefs.current[id]
      if (gm) gm.uniforms.uIntensity.value = lvl * 0.5
      const bg = parts.current[id]
      if (bg && bg.visible) bg.scale.multiplyScalar(1 + lvl * 0.025)
    }
  })

  const setPart = (id, baseY = 0) => (el) => { if (el) { el.userData.baseY = baseY; parts.current[id] = el } }
  const setWinMat = (id) => (m) => { if (m && !winMats.current[id]) winMats.current[id] = m }

  return (
    <group ref={root} position={[0, 0.82, 0]}>
      {/* ================= floating island: sandy school ground ================= */}
      <group ref={setPart('platform')} userData={{ baseY: 0 }}>
        <mesh position={[0, -0.26, 0]} material={M.soil}>
          <cylinderGeometry args={[4.6, 4.35, 0.5, 36]} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.sand} receiveShadow={SH}>
          <circleGeometry args={[4.6, 36]} />
        </mesh>
        {/* worn dirt patches */}
        {[[0.4, 1.3, 1.5], [-1.1, 0.6, 0.9], [1.5, 2.3, 0.8]].map(([x, z, r], i) => (
          <mesh key={i} position={[x, 0.004 + i * 0.001, z]} rotation={[-Math.PI / 2, 0, 0]} material={M.sandDark}>
            <circleGeometry args={[r, 22]} />
          </mesh>
        ))}
        <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[4.6, 0.025, 8, 60]} />
        </mesh>
        <mesh position={[0, -1.35, 0]} rotation={[Math.PI, 0, 0]} material={M.rock}>
          <coneGeometry args={[4.2, 1.7, 9]} />
        </mesh>

        {/* paver paths (like the photo's grey block paving) */}
        <mesh position={[0, 0.011, 2.45]} material={M.paver} receiveShadow={SH}><boxGeometry args={[0.78, 0.02, 3.1]} /></mesh>
        <mesh position={[0, 0.012, -0.72]} material={M.paver} receiveShadow={SH}><boxGeometry args={[4.0, 0.02, 0.55]} /></mesh>
        <mesh position={[-1.82, 0.013, 0.5]} material={M.paver}><boxGeometry args={[0.5, 0.02, 3.0]} /></mesh>
        <mesh position={[1.86, 0.013, 0.2]} material={M.paver}><boxGeometry args={[0.45, 0.02, 2.4]} /></mesh>
        <mesh position={[0, 0.014, 0.55]} rotation={[-Math.PI / 2, 0, 0]} material={M.paver}><circleGeometry args={[0.6, 22]} /></mesh>

        {/* sports-ground hover zone glow */}
        <GlowDisc r={1.6} sx={1.15} sz={0.85} pos={[0.25, 0.02, 1.25]} refFn={(m) => { if (m) glowRefs.current.sports = m }} />
      </group>

      {/* floating rocks below the island */}
      {[[-3.2, -1.6, 2.2, 0.32], [3.6, -1.9, -1.4, 0.42], [-1.8, -2.3, -2.8, 0.26]].map(([x, y, z, s], i) => (
        <mesh key={i} ref={el => { if (el) { el.userData.y = y; rocks.current[i] = el } }} position={[x, y, z]} scale={s} material={M.rock}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}

      {/* ================= compound gate ================= */}
      <group ref={setPart('gate')} position={[0, 0, 4.05]}>
        {[-0.85, 0.85].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.36, 0]} material={M.yellow} castShadow={SH}><boxGeometry args={[0.2, 0.72, 0.2]} /></mesh>
            <mesh position={[0, 0.74, 0]} material={M.white}><boxGeometry args={[0.26, 0.06, 0.26]} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.92, 0]} material={M.yellow} castShadow={SH}><boxGeometry args={[1.9, 0.28, 0.14]} /></mesh>
        <mesh position={[0, 0.92, 0.075]}>
          <planeGeometry args={[1.55, 0.22]} />
          <meshBasicMaterial map={tex.sign} toneMapped={false} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh key={i} position={[s * 1.55, 0.18, 0]} material={M.yellow}><boxGeometry args={[1.2, 0.36, 0.1]} /></mesh>
        ))}
        {[-1, 1].map((s, i) => (
          <mesh key={i} position={[s * 1.55, 0.4, 0]} material={M.plinth}><boxGeometry args={[1.2, 0.08, 0.04]} /></mesh>
        ))}
      </group>

      {/* ================= main block with entrance tower ================= */}
      <group ref={setPart('main')} position={[0, 0, -1.4]}>
        <Wing L={4.2} M={M} SH={SH} tex={tex} tower detail={detail} winRef={setWinMat('main')} />
        <GlowDisc r={1.2} sx={1.9} sz={0.8} pos={[0, 0.018, 0.6]} refFn={(m) => { if (m) glowRefs.current.main = m }} />
      </group>

      {/* ================= left wing — library ================= */}
      <group ref={setPart('library')} position={[-2.4, 0, 0.45]} rotation={[0, Math.PI / 2, 0]}>
        <Wing L={3.4} M={M} SH={SH} tex={tex} detail={detail} winRef={setWinMat('library')} />
        <GlowDisc r={1.0} sx={1.9} sz={0.7} pos={[0, 0.018, 0.7]} refFn={(m) => { if (m) glowRefs.current.library = m }} />
      </group>

      {/* ================= right wing — science & computer labs ================= */}
      <group ref={setPart('science')} position={[2.4, 0, 0.1]} rotation={[0, -Math.PI / 2, 0]}>
        <Wing L={2.9} M={M} SH={SH} tex={tex} detail={detail} winRef={setWinMat('science')} />
        <GlowDisc r={0.9} sx={1.8} sz={0.7} pos={[0, 0.018, 0.7]} refFn={(m) => { if (m) glowRefs.current.science = m }} />
      </group>

      {/* ================= flag pedestal (two poles + hedge) ================= */}
      <group ref={setPart('flags')} position={[1.05, 0, 0.75]}>
        <mesh position={[0, 0.08, 0]} material={M.white} castShadow={SH}><boxGeometry args={[0.55, 0.16, 0.55]} /></mesh>
        {[[0, 0.36], [0, -0.36], [0.36, 0], [-0.36, 0]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.09, z]} rotation={[0, x ? Math.PI / 2 : 0, 0]} material={M.hedge}>
            <boxGeometry args={[0.72, 0.16, 0.14]} />
          </mesh>
        ))}
        {[-0.13, 0.13].map((x, i) => (
          <mesh key={i} position={[x, 0.72, 0]} material={M.dark}>
            <cylinderGeometry args={[0.012, 0.016, 1.15, 6]} />
          </mesh>
        ))}
        <mesh position={[0.005, 1.21, 0]}>
          <planeGeometry args={[0.3, 0.19, 10, 5]} />
          <shaderMaterial ref={flagMat} vertexShader={flagVert} fragmentShader={flagFrag}
            uniforms={{ uTime: { value: 0 } }} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= kindergarten play corner ================= */}
      <group ref={setPart('playground')} position={[-1.7, 0, 2.7]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={M.sandDark}>
          <circleGeometry args={[0.6, 20]} />
        </mesh>
        <group scale={0.8} position={[-0.15, 0, -0.1]}>
          {[-0.4, 0.4].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.25, -0.12]} rotation={[0.45, 0, 0]} material={M.blue}><cylinderGeometry args={[0.022, 0.022, 0.55, 6]} /></mesh>
              <mesh position={[0, 0.25, 0.12]} rotation={[-0.45, 0, 0]} material={M.blue}><cylinderGeometry args={[0.022, 0.022, 0.55, 6]} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={M.blue}><cylinderGeometry args={[0.022, 0.022, 0.84, 6]} /></mesh>
          {[-0.18, 0.18].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.33, 0]} material={M.dark}><cylinderGeometry args={[0.005, 0.005, 0.3, 4]} /></mesh>
              <mesh position={[0, 0.18, 0]} material={M.yellowToy}><boxGeometry args={[0.16, 0.025, 0.07]} /></mesh>
            </group>
          ))}
        </group>
        {detail && (
          <group position={[0.32, 0, 0.22]} rotation={[0, -0.6, 0]} scale={0.8}>
            <mesh position={[-0.3, 0.21, 0]} material={M.yellowToy}><boxGeometry args={[0.04, 0.42, 0.26]} /></mesh>
            <mesh position={[-0.22, 0.42, 0]} material={M.redToy}><boxGeometry args={[0.2, 0.03, 0.26]} /></mesh>
            <mesh position={[0.12, 0.28, 0]} rotation={[0, 0, -0.62]} material={M.redToy}><boxGeometry args={[0.62, 0.025, 0.24]} /></mesh>
          </group>
        )}
        <GlowDisc r={0.85} refFn={(m) => { if (m) glowRefs.current.playground = m }} />
      </group>

      {/* ================= trees & lamps ================= */}
      <group ref={setPart('trees')}>
        <instancedMesh ref={trunkRef} args={[null, null, trees.length]} castShadow={SH}>
          <cylinderGeometry args={[0.045, 0.06, 0.42, 6]} />
          <primitive object={M.trunk} attach="material" />
        </instancedMesh>
        <instancedMesh ref={crownRef} args={[null, null, trees.length]} castShadow={SH}>
          <icosahedronGeometry args={[0.34, 0]} />
          <primitive object={M.crown} attach="material" />
        </instancedMesh>
      </group>

      <group ref={setPart('lamps')}>
        <instancedMesh ref={poleRef} args={[null, null, lampPos.length]}>
          <cylinderGeometry args={[0.016, 0.02, 0.42, 6]} />
          <primitive object={M.dark} attach="material" />
        </instancedMesh>
        <instancedMesh ref={bulbRef} args={[null, null, lampPos.length]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial ref={bulbMat} color="#9a9a8c" toneMapped={false} />
        </instancedMesh>
      </group>

      {/* soft blob shadows */}
      {[
        [0, -1.4, 4.6, 1.7], [-2.4, 0.45, 1.5, 3.9], [2.4, 0.1, 1.5, 3.4],
        [0, 4.05, 2.2, 0.7], [1.05, 0.75, 0.9, 0.9], [-1.7, 2.7, 1.3, 1.3]
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.blob} transparent depthWrite={false} />
        </mesh>
      ))}

      {/* ================= interaction hitboxes ================= */}
      <Hitbox id="main" pos={[0, 1.0, -1.35]} size={[4.4, 2.4, 1.4]} />
      <Hitbox id="library" pos={[-2.4, 1.0, 0.45]} size={[1.2, 2.4, 3.6]} />
      <Hitbox id="science" pos={[2.4, 1.0, 0.1]} size={[1.2, 2.4, 3.1]} />
      <Hitbox id="sports" pos={[0.3, 0.18, 1.35]} size={[2.9, 0.45, 2.2]} />
      <Hitbox id="playground" pos={[-1.7, 0.3, 2.7]} size={[1.4, 0.8, 1.4]} />
    </group>
  )
}
