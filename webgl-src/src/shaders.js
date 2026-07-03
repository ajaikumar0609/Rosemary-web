// All custom GLSL lives here — particles, anime sky, god rays,
// light trails, energy rings, floating leaves, the flag.

export const particleVert = /* glsl */ `
uniform float uTime, uOpen, uGold, uWarm, uSize, uPx;
uniform vec3 uMouse;
attribute vec4 aSeed;
varying float vA;
varying vec3 vC;

void main() {
  float s1 = aSeed.x, s2 = aSeed.y, s3 = aSeed.z, s4 = aSeed.w;
  float speed = 0.25 + s1 * 0.9;
  float life = fract(s4 + uTime * 0.05 * speed);

  // spiral fountain rising from the open book
  float ang = s2 * 6.28318 + uTime * (0.12 + s3 * 0.3) + life * (1.5 + s1 * 2.0);
  float h   = life * (1.2 + s3 * 4.4);
  float rad = (0.12 + s1 * 1.1) + pow(life, 0.7) * (1.5 + 2.8 * s2);
  vec3 p = vec3(cos(ang) * rad, h, sin(ang) * rad * 0.85);

  p.x += sin(uTime * 0.7 + s2 * 9.0 + life * 6.0) * 0.18;
  p.y += sin(uTime * 0.5 + s1 * 7.0) * 0.12;
  p.z += cos(uTime * 0.6 + s3 * 8.0) * 0.18;

  // collapsed into faint dust until the book opens
  p *= (0.14 + 0.86 * uOpen);

  // mouse repulsion
  vec3 d = p - uMouse;
  float dist2 = dot(d, d) + 0.6;
  p += normalize(d) * (0.5 / dist2) * uOpen;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = min(uSize * uPx * (0.6 + s3 * 1.7) * (140.0 / -mv.z), 64.0);
  gl_Position = projectionMatrix * mv;

  float fade = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.55, life);
  vA = fade * (0.3 + 0.7 * uOpen);

  vec3 teal   = vec3(0.42, 0.91, 1.0);
  vec3 violet = vec3(0.72, 0.55, 1.0);
  vec3 gold   = vec3(1.0, 0.82, 0.45);
  vec3 c = mix(teal, violet, s2);
  // daytime: soft sunlit motes instead of cosmic neon
  c = mix(c, vec3(1.0, 0.96, 0.86), uWarm * 0.7);
  vC = mix(c, gold, uGold * step(0.3, s1));
}
`

export const particleFrag = /* glsl */ `
varying float vA;
varying vec3 vC;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.05, d), 1.6) * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vC * a, a);
}
`

export const starVert = /* glsl */ `
uniform float uTime, uPx;
attribute vec3 aS; // size, phase, tint
varying float vA;
varying float vT;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 0.55 + 0.45 * sin(uTime * 1.4 + aS.y * 23.0);
  gl_PointSize = min(aS.x * uPx * (260.0 / -mv.z), 5.0);
  gl_Position = projectionMatrix * mv;
  vA = tw;
  vT = aS.z;
}
`

export const starFrag = /* glsl */ `
uniform float uOp;
varying float vA;
varying float vT;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.08, d) * vA * uOp;
  if (a < 0.01) discard;
  vec3 cool = vec3(0.75, 0.83, 1.0);
  vec3 warm = vec3(1.0, 0.9, 0.75);
  gl_FragColor = vec4(mix(cool, warm, vT) * a, a);
}
`

// ---------- anime sky: gradient + sun + procedural clouds ----------
export const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const skyFrag = /* glsl */ `
uniform float uTime, uStar;
uniform vec3 uTop, uHor, uSun, uSunDir;
varying vec3 vDir;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < OCT; i++) { v += a * noise(p); p = p * 2.13 + vec2(11.3, 7.7); a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);

  // vertical gradient — Shinkai-rich, soft at the horizon
  vec3 col = mix(uHor, uTop, pow(smoothstep(-0.06, 0.72, d.y), 0.82));

  // sun disc + warm haze
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSun * (pow(s, 700.0) * 1.6 + pow(s, 90.0) * 0.55 + pow(s, 7.0) * 0.18);

  // clouds — planar projection so they flatten toward the horizon
  if (d.y > 0.015) {
    vec2 cp = d.xz / (d.y + 0.22);
    float n = fbm(cp * 1.45 + vec2(uTime * 0.011, uTime * 0.004));
    float n2 = fbm(cp * 3.4 - vec2(uTime * 0.017, 0.0));
    float mask = smoothstep(0.5, 0.74, n * 0.78 + n2 * 0.3) * smoothstep(0.015, 0.16, d.y);
    vec3 lit = mix(vec3(1.0), uHor * 1.08, 0.35);          // sunlit cloud
    vec3 shade = mix(uHor * 0.85, uTop, 0.45);             // cloud shadow
    vec3 cc = mix(shade, lit, smoothstep(0.45, 0.95, n + s * 0.35));
    cc += uSun * pow(s, 4.0) * 0.25;                       // golden edges near sun
    cc = mix(cc, uTop * 0.75 + vec3(0.04), uStar * 0.75);  // clouds darken at night
    col = mix(col, cc, mask * (0.92 - uStar * 0.35));
  }

  gl_FragColor = vec4(col, 1.0);
}
`

export const rayVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const rayFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uTime, uIntensity;
varying vec2 vUv;
void main() {
  float a = pow(vUv.y, 1.7) * smoothstep(0.0, 0.18, vUv.y);
  float around = 0.55 + 0.45 * sin(vUv.x * 6.28318);
  float streaks = 0.78 + 0.22 * sin(vUv.x * 42.0 + uTime * 0.6);
  a *= around * streaks * uIntensity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`

export const trailVert = /* glsl */ `
uniform float uTime;
attribute vec3 aT; // phase, speed, colorMix
varying vec2 vUv;
varying float vRun;
varying float vMix;
void main() {
  vUv = uv;
  vMix = aT.z;
  float run = fract(uTime * 0.07 * aT.y + aT.x);
  vRun = run;
  vec4 world = instanceMatrix * vec4(position, 1.0);
  world.z -= run * 46.0 - 23.0;
  gl_Position = projectionMatrix * modelViewMatrix * world;
}
`

export const trailFrag = /* glsl */ `
varying vec2 vUv;
varying float vRun;
varying float vMix;
uniform float uOn;
void main() {
  float head = pow(vUv.x, 3.0);
  float window = smoothstep(0.0, 0.1, vRun) * smoothstep(1.0, 0.82, vRun);
  float soft = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
  float a = head * window * soft * uOn;
  if (a < 0.004) discard;
  vec3 teal = vec3(0.45, 0.95, 0.9);
  vec3 gold = vec3(1.0, 0.83, 0.5);
  gl_FragColor = vec4(mix(teal, gold, vMix) * a, a);
}
`

export const ringVert = rayVert

export const ringFrag = /* glsl */ `
uniform float uTime, uIntensity;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float wave = fract(r * 1.4 - uTime * 0.22);
  float band = smoothstep(0.0, 0.1, wave) * smoothstep(0.22, 0.1, wave);
  float a = band * smoothstep(1.0, 0.55, r) * smoothstep(0.1, 0.3, r) * uIntensity;
  if (a < 0.004) discard;
  vec3 c = mix(vec3(1.0, 0.9, 0.65), vec3(0.85, 0.7, 1.0), r);
  gl_FragColor = vec4(c * a, a);
}
`

export const glowVert = rayVert

export const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 2.2) * uIntensity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`

// ---------- floating leaves (Ghibli wind) ----------
export const leafVert = /* glsl */ `
uniform float uTime, uOn;
attribute vec4 aL; // phase, radius, height, tint
varying float vA;
varying float vT;
void main() {
  float ph = aL.x * 6.28318;
  float spd = 0.05 + aL.x * 0.06;
  float ang = ph + uTime * spd;
  float r = aL.y;
  vec3 c = vec3(cos(ang) * r, 0.35 + aL.z * 2.6, sin(ang) * r * 0.92);
  c.y += sin(uTime * 0.6 + ph * 3.0) * 0.28;
  c.x += sin(uTime * 0.9 + ph * 7.0) * 0.15;

  // flutter
  float fl = sin(uTime * 4.0 + ph * 11.0);
  vec3 p = position;
  p.xy *= mat2(cos(fl), -sin(fl), sin(fl), cos(fl));
  p *= uOn;

  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  mv.xyz += p * 1.0; // billboard-ish
  gl_Position = projectionMatrix * mv;
  vA = uOn * (0.55 + 0.45 * sin(ph * 5.0));
  vT = aL.w;
}
`

export const leafFrag = /* glsl */ `
varying float vA;
varying float vT;
void main() {
  if (vA < 0.01) discard;
  vec3 g1 = vec3(0.36, 0.66, 0.4);
  vec3 g2 = vec3(0.78, 0.83, 0.42);
  gl_FragColor = vec4(mix(g1, g2, vT), vA * 0.9);
}
`

export const flagVert = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float w = uv.x; // pinned at the pole edge
  p.z += sin(p.x * 11.0 - uTime * 5.5) * 0.05 * w;
  p.y += sin(p.x * 7.0 - uTime * 4.0) * 0.02 * w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const flagFrag = /* glsl */ `
varying vec2 vUv;
void main() {
  vec3 base = vec3(0.16, 0.5, 0.38);
  vec3 gold = vec3(0.93, 0.78, 0.4);
  float d = length(vUv - vec2(0.5, 0.5));
  vec3 c = mix(gold, base, smoothstep(0.11, 0.15, d));
  float shade = 0.85 + 0.15 * sin(vUv.x * 11.0);
  gl_FragColor = vec4(c * shade, 1.0);
}
`
