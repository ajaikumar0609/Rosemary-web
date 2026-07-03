// Tiny shared mutable state + event bus. The 3D loop mutates `state` every
// frame without re-rendering React; UI components subscribe via `bus`.
export const state = {
  targetP: 0,      // raw scroll progress 0..1
  p: 0,            // damped progress (drives camera + world)
  scene: 0,        // current story scene index 0..4
  hover: null,     // hovered building id
  focus: null,     // focused (clicked) building id
  mouse: { x: 0, y: 0 },
  touchYaw: 0,
  ready: false,
  degraded: 0      // live perf degradation level 0..2
}

const listeners = new Map()
export const bus = {
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set())
    listeners.get(evt).add(fn)
    return () => bus.off(evt, fn)
  },
  off(evt, fn) { listeners.get(evt)?.delete(fn) },
  emit(evt, data) { listeners.get(evt)?.forEach(fn => fn(data)) }
}

// Story scene boundaries on the 0..1 scroll timeline
export const SCENES = [0, 0.17, 0.38, 0.58, 0.78, 1.001]

export function sceneFromP(p) {
  for (let i = SCENES.length - 2; i >= 0; i--) if (p >= SCENES[i]) return i
  return 0
}

export function setScene(i) {
  if (state.scene !== i) { state.scene = i; bus.emit('scene', i) }
}

export function setHover(id) {
  if (state.hover !== id) { state.hover = id; bus.emit('hover', id) }
}

export function setFocus(id) {
  if (state.focus !== id) { state.focus = id; bus.emit('focus', id) }
}
