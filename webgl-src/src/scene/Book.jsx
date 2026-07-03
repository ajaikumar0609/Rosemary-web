import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { state } from '../store.js'
import { glowVert, glowFrag } from '../shaders.js'

const FLIPS = 5

export default function Book({ settings }) {
  const group = useRef()
  const topPivot = useRef()
  const leftStack = useRef()
  const rightStack = useRef()
  const flips = useRef([])
  const glowMat = useRef()
  const light = useRef()

  const mats = useMemo(() => ({
    cover: new THREE.MeshStandardMaterial({ color: '#1e4d3c', roughness: 0.5, metalness: 0.12 }),
    gold: new THREE.MeshStandardMaterial({ color: '#c9a25e', roughness: 0.3, metalness: 0.8, emissive: '#7a5c24', emissiveIntensity: 0.35 }),
    pages: new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.92 }),
    page: new THREE.MeshStandardMaterial({ color: '#f5edd8', roughness: 0.9, side: THREE.DoubleSide })
  }), [])

  // bottom-anchored page stacks (scale Y grows upward)
  const stackGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(2.5, 0.5, 3.46)
    g.translate(0, 0.25, 0)
    return g
  }, [])

  useFrame(() => {
    const t = performance.now() / 1000
    const p = state.p
    const open = THREE.MathUtils.smoothstep(p, 0.1, 0.26)
    const g = group.current
    const sc = 1 + open * 0.5

    // float + settle
    g.position.y = -0.15 + Math.sin(t * 0.9) * 0.07 * (1 - open * 0.65)
    g.position.x = -1.35 * (1 - open) * sc
    g.rotation.x = 0.40 * (1 - open) - 0.02 * open
    g.rotation.z = Math.sin(t * 0.6) * 0.05 * (1 - open)
    g.rotation.y = Math.sin(t * 0.25) * 0.06 * (1 - open * 0.85)
    g.scale.setScalar(sc)

    // cover swings open
    topPivot.current.rotation.z = Math.PI * 0.985 * easeInOut(open)
    topPivot.current.position.y = 0.7 - 0.08 * open

    // page stacks redistribute
    leftStack.current.scale.y = Math.max(easeInOut(open) * 0.92, 0.001)
    rightStack.current.scale.y = 1 - 0.45 * easeInOut(open)

    // fluttering transfer pages
    for (let i = 0; i < FLIPS; i++) {
      const f = flips.current[i]
      if (!f) continue
      const fp = THREE.MathUtils.clamp((open - i * 0.06) * 1.45, 0, 1)
      f.rotation.z = Math.PI * easeInOut(fp)
      f.rotation.x = Math.sin(fp * Math.PI) * 0.12
    }

    if (glowMat.current) {
      glowMat.current.uniforms.uIntensity.value = open * (0.95 + 0.15 * Math.sin(t * 2.1))
    }
    if (light.current) light.current.intensity = open * 2.4
  })

  return (
    <group ref={group}>
      {/* bottom cover */}
      <mesh position={[1.35, 0.05, 0]} material={mats.cover} castShadow={settings.shadow > 0}>
        <boxGeometry args={[2.7, 0.1, 3.7]} />
      </mesh>
      {/* gold fore-edge strips on bottom cover */}
      <mesh position={[2.62, 0.05, 0]} material={mats.gold}>
        <boxGeometry args={[0.06, 0.104, 3.7]} />
      </mesh>

      {/* right page stack (shrinks as pages transfer) */}
      <mesh ref={rightStack} geometry={stackGeo} material={mats.pages} position={[1.35, 0.1, 0]} />
      {/* left page stack (grows) */}
      <mesh ref={leftStack} geometry={stackGeo} material={mats.pages} position={[-1.35, 0.1, 0]} />

      {/* fluttering pages */}
      {Array.from({ length: FLIPS }).map((_, i) => (
        <group key={i} ref={el => (flips.current[i] = el)} position={[0, 0.615 + i * 0.006, 0]}>
          <mesh material={mats.page} rotation={[-Math.PI / 2, 0, 0]} position={[1.25, 0, 0]}>
            <planeGeometry args={[2.5, 3.4]} />
          </mesh>
        </group>
      ))}

      {/* top cover — swings from right to left around the spine */}
      <group ref={topPivot} position={[0, 0.7, 0]}>
        <mesh position={[1.35, -0.05, 0]} material={mats.cover} castShadow={settings.shadow > 0}>
          <boxGeometry args={[2.7, 0.1, 3.7]} />
        </mesh>
        <mesh position={[2.62, -0.05, 0]} material={mats.gold}>
          <boxGeometry args={[0.06, 0.104, 3.7]} />
        </mesh>
        {/* embossed gold crest on the front cover */}
        <group position={[1.35, 0.012, 0]}>
          <mesh material={mats.gold} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.018, 10, 40]} />
          </mesh>
          <mesh material={mats.gold} position={[0, 0.03, 0]}>
            <octahedronGeometry args={[0.1, 0]} />
          </mesh>
          <mesh material={mats.gold} position={[0, 0, 1.5]}>
            <boxGeometry args={[2.2, 0.012, 0.05]} />
          </mesh>
          <mesh material={mats.gold} position={[0, 0, -1.5]}>
            <boxGeometry args={[2.2, 0.012, 0.05]} />
          </mesh>
        </group>
      </group>

      {/* spine */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.cover}>
        <cylinderGeometry args={[0.09, 0.09, 3.7, 10, 1, false]} />
      </mesh>

      {/* warm magical glow rising from the open pages */}
      <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.8, 4.0]} />
        <shaderMaterial
          ref={glowMat}
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={{ uColor: { value: new THREE.Color('#ffe3b0') }, uIntensity: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>

      <pointLight ref={light} position={[0, 1.6, 0]} color="#ffd9a0" intensity={0} distance={8} decay={2} />
    </group>
  )
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
