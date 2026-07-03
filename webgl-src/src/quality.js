// Adaptive quality: detect device class once, then the live performance
// monitor (in Experience.jsx) can degrade further if FPS drops.
const TIERS = {
  high: { dpr: [1, 2],    particles: 6500, stars: 2200, trees: 34, trails: 26, leaves: 110, shadow: 2048, post: true,  vignette: true,  nebOct: 4, aa: true  },
  med:  { dpr: [1, 1.6],  particles: 3200, stars: 1400, trees: 26, trails: 16, leaves: 70,  shadow: 1024, post: true,  vignette: false, nebOct: 3, aa: true  },
  low:  { dpr: [1, 1.25], particles: 1300, stars: 900,  trees: 20, trails: 10, leaves: 36,  shadow: 0,    post: false, vignette: false, nebOct: 2, aa: false }
}

export function detectQuality() {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const ua = navigator.userAgent || ''
  const mobile = coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  const mem = navigator.deviceMemory || (mobile ? 3 : 8)
  const cores = navigator.hardwareConcurrency || 4
  const saveData = !!(navigator.connection && navigator.connection.saveData)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let tier = 'high'
  if (mobile) tier = (mem <= 3 || cores <= 4 || saveData) ? 'low' : 'med'
  else if (mem <= 4 || cores <= 4) tier = 'med'

  return { tier, mobile, reduced, ...TIERS[tier] }
}

export function webglSupported() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch (e) {
    return false
  }
}
