# Rosemary 3D Experience — Source

This is the React Three Fiber source for the 3D homepage (`../index.html`).

**Stack:** React 18 · Three.js · @react-three/fiber · @react-three/postprocessing · Framer Motion · GSAP · Vite

## Rebuild after editing

```bash
cd webgl-src
npm install
npm run build        # → dist/index.html (single self-contained file)
cp dist/index.html ../index.html
```

`npm run dev` starts a live dev server at http://localhost:5173.

## Where things live

| File | What it does |
|---|---|
| `src/content.js` | **Edit school text/links here** — captions, building info, contact |
| `src/quality.js` | Device tiers (particle counts, shadows, DPR caps) |
| `src/scene/Book.jsx` | The magical opening book |
| `src/scene/Campus.jsx` | The whole 3D campus (buildings, trees, hitboxes) |
| `src/scene/CameraRig.jsx` | Scroll-driven cinematic camera path |
| `src/scene/Particles.jsx` | GPU particle system |
| `src/scene/Background.jsx` | Nebula, stars, god rays, light trails |
| `src/ui/Overlay.jsx` | Glass nav, captions, panels, cursor |
| `src/styles.css` | All UI styling |

The build inlines everything into one HTML file, so the finished page
works by double-clicking it — no server needed. The classic site is
preserved at `../index-classic.html`.
