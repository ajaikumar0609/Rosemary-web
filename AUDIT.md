# Rosemary School Website — Design Direction Audit

*Role: Principal Design Director (Apple / Pentagram / IDEO lens). Scope: every page of the current build, audited as shipped — no redesign performed, only findings and a forward roadmap.*

**Verdict in one paragraph:** The site has crossed the line from "AI first draft" to "designed" — the quiet header, the split editorial hero, the drifting journey timeline and the masonry gallery all carry intent. What separates it from true studio work now is not layout but *truthfulness and finish*: a hero video whose first frame is a torch, one stock photo in a sea of real ones, a "Download PDF" that opens a print dialog, a portal that quietly pretends to have a backend, and a dozen small accessibility and performance debts. Studios sweat exactly these things. Fix the High items below before showing this to a parent.

Ratings: **High** = a parent or principal would notice / trust is at stake · **Medium** = designers notice, quality ceiling · **Low** = polish. "Visual impact" = estimated share of perceived quality gained by fixing it.

---

## Part 1 · Audit findings (28 criteria)

### A. Truth & trust (the studio non-negotiables)

**1. Simulated portal is not labelled as a demo — Criterion: honesty of affordances.**
The application form generates an RMS-2026-#### number and a success animation, but nothing is sent anywhere; data lives in the visitor's browser. A parent will believe they have applied.
**Impact: High.** Improvement: add one visible line — "This online form is a preview; submissions are confirmed by the office by phone" — or wire it to a real endpoint (Formspree/Google Forms/WhatsApp deep link with prefilled text) before launch. Visual impact: 0% · trust impact: enormous.

**2. "Download fee card (PDF)" opens the browser print dialog — Criterion: label = behaviour.**
**Impact: High.** Improvement: either generate a real PDF (a static, designed one-page fee card in `/docs/`) or relabel to "Print / save as PDF". Also add a `@media print` rule so printing isolates the fee table instead of the whole page. Visual impact: 2%, credibility impact large.

**3. One Unsplash stock photo (science lab) among real school photography — Criterion: authenticity of imagery.**
Every other image is the school's own; the stock lab shot reads instantly as filler and violates the project's own "official images only" rule.
**Impact: High.** Improvement: replace with a real lab photo from the school, or a neutral crop of an existing campus photo, or drop the card to two. Visual impact: 4%.

**4. Sample metadata presented as fact — Criterion: content integrity.**
Gallery photographer names, fee amounts, scholarship percentages, transport prices, age cut-offs are plausible fabrications. Fine as placeholders; dangerous if launched.
**Impact: High (pre-launch gate).** Improvement: a `CONTENT-TODO` checklist for the office to confirm every number; mark generated data in HTML comments. Visual impact: 0%.

**5. Hero video's opening frame is a torch/flame — Criterion: first-impression image editing.**
The first thing a visitor sees in the hero frame is a dark flame graphic that has no obvious connection to "curiosity grows into confidence." A studio would cut the reel to open on children or the campus.
**Impact: High.** Improvement: set a campus `poster` (already done) *and* re-trim the video to open on its strongest school frame, or start playback at an offset (`video.currentTime = n` on `loadedmetadata`). Visual impact: 8%.

### B. Layout & composition

**6. Choir photograph appears three times on the homepage — Criterion: image economy.**
Welcome split, bento side image, and brand-film poster. Repetition reads as a thin photo library.
**Impact: Medium.** Improvement: swap the bento side image for the celebrations shot and give the film a video-derived poster frame. Visual impact: 4%.

**7. The CTA band component repeats near-identically on five pages — Criterion: rhythm variation (the brief's own rule).**
Same navy band, same two buttons, same centered layout. It is the last surviving "template smell."
**Impact: Medium.** Improvement: three variants — full-bleed photo CTA (home), split CTA with phone number (admissions), quiet single-line CTA (gallery/faculty). Visual impact: 5%.

**8. Bento hover reveals ("more" links) hide primary navigation behind hover — Criterion: discoverability.**
On touch devices those links never appear.
**Impact: Medium.** Improvement: keep the reveal on desktop, force `opacity:1` under `(hover:none)`. Visual impact: 1%, usability real.

**9. Journey timeline's even-item drift is *almost* too subtle — Criterion: intentionality must be legible.**
At 4vw the offset can read as accidental misalignment on mid-size screens.
**Impact: Low.** Improvement: either commit (8vw + a small margin note like "Step 02 · at the campus") or remove. Asymmetry must look chosen. Visual impact: 2%.

**10. Gallery is 12 images across 4 columns — sparse columns at 1360px — Criterion: density suits the format.**
Masonry earns its keep at 25+ items; at 12 it looks like a grid with hiccups.
**Impact: Medium.** Improvement: gather 20–30 more photos from the school's archive, or drop to `columns: 3` until the library grows. Visual impact: 6%.

**11. Eligibility table borrows the `.fees` component including its price typography — Criterion: semantic styling.**
"3+ years" set in the money style is a small dissonance.
**Impact: Low.** Improvement: a lighter `.spec` table variant. Visual impact: 1%.

### C. Typography & voice

**12. H2 scale is a single size site-wide — Criterion: typographic hierarchy between sections.**
Every section title carries equal weight, so no section is allowed to matter more.
**Impact: Medium.** Improvement: 3 display sizes (hero 4.3rem / lead sections ~3.2rem / support sections ~2.2rem) applied by content importance, not template position. Visual impact: 5%.

**13. Voice drifts between registers — Criterion: one editorial voice.**
"Honest fees, no surprises" (studio) sits near "We keep admissions warm and personal" (brochure) and "Students benefit from EduCamp smart classrooms…" (prospectus paste).
**Impact: Medium.** Improvement: one copy pass in the warmer register; kill every sentence that starts with "We offer/We provide." Visual impact: 4%.

**14. Uppercase micro-labels at .64–.68rem — Criterion: legibility floor.**
Stat labels and bento tags sit at ~10px; below comfortable reading for many adults (the actual audience is parents 30–55).
**Impact: Medium (accessibility-adjacent).** Improvement: raise floor to .72rem/11.5px and loosen tracking slightly. Visual impact: 2%.

### D. Interaction & motion

**15. Lightbox lacks a focus trap and focus restoration — Criterion: modal accessibility.**
Tab escapes into the page behind the dialog; Esc works but focus is lost on close.
**Impact: High (a11y).** Improvement: trap Tab within `.lb`, return focus to the opening tile on close, `aria-hidden` the page behind. Visual impact: 0%.

**16. Portal step changes are silent to screen readers — Criterion: dynamic content announcements.**
**Impact: Medium.** Improvement: `aria-live="polite"` region announcing "Step 3 of 5 — Documents"; move focus to the pane heading on step change. Visual impact: 0%.

**17. Custom cursor adds ceremony but no meaning — Criterion: motion must inform.**
The ring enlarges on *everything* clickable, so it differentiates nothing; it also slightly lags on 60Hz machines.
**Impact: Low.** Improvement: reserve the "big" state for gallery/3D tiles only, or retire it. Trendy-effect risk the brief warned about. Visual impact: −1% to +1%.

**18. Guided tour runs at constant velocity — Criterion: cinematic pacing.**
Real camera work slows into points of interest. Constant px/s feels mechanical after chapter two.
**Impact: Medium.** Improvement: ease the speed toward each rail stop (slow within ±10% of a chapter fraction), pause 2s at each stop with the chapter label pulsing. Visual impact: 6% (on that page).

**19. Night mode is a CSS filter, not lighting — Criterion: does the feature deliver its name?**
`brightness/hue-rotate` dims the canvas; sky and windows don't change. Acceptable v1; label honestly.
**Impact: Low.** Improvement: rename tooltip to "Dusk filter", or pass a real uniform into the Three.js scene later. Visual impact: 2%.

**20. FAB duplicates header CTAs on admissions — Criterion: one primary action per viewport.**
On admissions.html the floating dock, the header pill, the hero button and in-page CTAs can all say "apply."
**Impact: Low.** Improvement: suppress FAB on admissions (`data-no-fab`) — the page *is* the funnel. Visual impact: 2%.

### E. Engineering quality that shows

**21. Images lack `width`/`height` attributes — Criterion: layout stability (CLS).**
Masonry tiles and split images reflow as CDN images arrive.
**Impact: High (perf/feel).** Improvement: add intrinsic dimensions or `aspect-ratio` per image; keep `loading="lazy"`. Visual impact: 5% (perceived smoothness).

**22. campus.html is a 1.3 MB HTML document — Criterion: cost of entry.**
On a school-gate 4G connection that's 5–10s before the intro can honestly say "preparing the campus."
**Impact: Medium.** Improvement: honest progress (bytes loaded), `<link rel=preload>` for the GLB/textures if separable, and a static poster fallback for `saveData`/slow connections. Visual impact: 3%.

**23. No social/meta layer — Criterion: how the design travels.**
No `og:title/og:image`, no favicon sizes, no theme-color. A WhatsApp share of this site — its primary referral channel in Tirunelveli — shows a bare URL.
**Impact: High (for its audience).** Improvement: og/twitter tags with a designed 1200×630 card, `theme-color` navy, proper favicons. Visual impact: 0% on-site, large off-site.

**24. No 404 page — Criterion: designed edge states.**
**Impact: Low.** Improvement: one-liner page in the brand voice ("This corridor doesn't exist — the office can walk you back.") with nav home. Visual impact: 1%.

**25. Track-application requires the same browser — Criterion: feature honesty (copy already discloses; keep it).**
**Impact: Low** as labelled. Improvement: when a real backend arrives, look up by phone + application number. Visual impact: 0%.

**26. Form clear/reset is missing — Criterion: user control over saved data.**
Autosave persists a half-filled form forever; a shared family computer shows the previous child's data.
**Impact: Medium (privacy-adjacent).** Improvement: "Start over" text button in the portal head that clears `rmsPortal`. Visual impact: 0%.

**27. Landline numbers fail phone validation — Criterion: validate for the real audience.**
Many Tirunelveli parents will type `0462 2530837`. The regex accepts only mobiles.
**Impact: Medium.** Improvement: accept `0`-prefixed 10–11 digit landlines, or soften to length check + hint. Visual impact: 0%.

**28. Heading `head-offset` collides with centered eyebrows on narrow screens — Criterion: responsive typography choreography.**
At ~700px the offset heading can look accidentally indented under its flush-left eyebrow.
**Impact: Low.** Improvement: zero the offset below 760px (partially handled; verify on about/admissions). Visual impact: 1%.

---

## Part 2 · 88 further enhancements

*Grouped; no trendy effects for their own sake — each earns its place.*

### Brand & storytelling (1–9)
1. Commission/select one signature photograph per page (a "cover") and let every page hero use it consistently.
2. A real 20-second hero cut: children arriving → choir → classroom → ground, exported at 720p ≤2.5 MB.
3. Motto lockup: set "Bless us to be a Blessing" in Fraunces italic as a repeatable SVG ornament (footer, success screen, campus intro).
4. A short "1992 → today" timeline on About with 4 archive photos.
5. Principal's message as 30-second audio with a transcript — warmer than a photo quote.
6. Alumni strip: three one-line testimonials with name, batch year, current role.
7. House/club crests as tiny custom icons to replace generic SVG glyphs in bento tiles.
8. Annual results module: last three years of X/XII pass data as a small honest chart.
9. Tamil language toggle for key admissions content — the single highest-empathy feature for this audience.

### Homepage (10–17)
10. Rotate hero stat set on each visit (years/students vs books/clubs) to reward return visits.
11. Let the seal's circular text double as a scroll-to-top button after 50% scroll.
12. "This week at Rosemary" one-line news ticker under the trust strip (manually edited).
13. Bento lead card: crossfade between two campus photos every 6s (respect reduced-motion).
14. Add one horizontal-scroll "moments" filmstrip of 6 small photos between film and academics sections.
15. Brand film: show duration (0:47) on the play cover.
16. Anchor the campus band's preview image with a live "5 chapters · ~2 min" label.
17. Swap the trust strip's four checkmarks for four distinct micro-icons (board, trust, language, co-ed).

### Admissions & portal (18–31)
18. Sticky in-page sub-nav (Journey · Fees · Apply · FAQ) appearing after the hero.
19. Fee table: per-term toggle (annual ⇄ term) instead of the small print.
20. Fee card PDF: designed A5 downloadable with crest, valid-from date and office signature line.
21. Portal: inline "call me instead" link on every step (tel:) — never trap a parent in a form.
22. Step 1: auto-format phone as the parent types (space after 5 digits).
23. DOB field: auto-suggest eligible class from date of birth.
24. Documents step: per-document checklist chips (birth cert ✓, Aadhaar ✗) that map to uploads.
25. Review step: "Edit" link per row jumping to the owning step.
26. Success: "Add visit to calendar" (.ics) when a slot was chosen.
27. Success: WhatsApp deep-link "Send my application number to the office" prefilled message.
28. Track: show the booked visit date in the status timeline.
29. FAQ: search-as-you-type filter above the accordion.
30. Scholarships: its own small section with 3 named schemes instead of one paragraph.
31. Print stylesheet: `@media print` exposing only fee table + contact block.

### Gallery (32–39)
32. Expand library to 30+ photos; then enable a "Year" filter (2023/2024/2025).
33. Preload adjacent lightbox images for instant next/prev.
34. Pinch-zoom and double-tap-zoom inside the lightbox on touch.
35. "Download" button per photo (school-sanctioned, watermarked variant).
36. Shuffle order per visit within categories to keep the wall alive.
37. Lightbox: show "12 / 24" progress as a thin dot row on mobile instead of text.
38. Hover meta: stagger the title and metadata by 60ms for a more composed reveal.
39. A single 2×-size "editor's pick" tile per category that spans two columns.

### Campus Experience (40–49)
40. Ease guided-tour speed near chapters; 2s dwell at each stop.
41. Chapter-complete micro-toast ("Chapter 2 of 5 · Library") when a stop is crossed.
42. Hotspot pulse: gentle 2s ring on interactive buildings for first-time visitors.
43. Real mini-map: top-down SVG of the five buildings with a moving dot (scroll-fraction mapped).
44. Ambient audio bed (school bell, birdsong) behind a sound toggle, off by default.
45. True night mode: pass a time-of-day uniform into the scene (lights in windows).
46. "Skip to chapter" long-press on rail stops shows chapter thumbnails.
47. Data-saver / low-power detection → offer the photo gallery instead of 3D.
48. Exit summary card: "You visited 5 places · book the real tour" with CTA.
49. Remember tour completion in localStorage; returning visitors land in Free Explore.

### Motion & micro-interactions (50–58)
50. Underline morph: add 40ms overshoot so the ink lands with weight.
51. Buttons: 2px translate-down on :active alongside the scale for a mechanical press.
52. Counters: roll digits (odometer) instead of integer stepping.
53. Section transitions: 4px background-tint crossfade between ivory and soft sections while scrolling.
54. Journey numbers: draw the circle stroke on `.in` (SVG dashoffset) before filling.
55. Bento hover: bias the rotation direction by the card's grid position (left cards rotate +, right −).
56. Dropzone: file icon "drops" with a small bounce on add.
57. Success confetti: use crest-shaped particles (tiny SVG), 12 not 18.
58. Reduce all transition delays on `[data-stagger]` groups >6 children (cap total under 600ms).

### Accessibility (59–68)
59. Focus-trap + focus-restore in lightbox (finding 15 — implement).
60. `aria-live` step announcements in portal (finding 16 — implement).
61. Visible focus ring style matching the crimson underline system (currently browser default).
62. Skip-to-content link before the header.
63. `prefers-contrast: more` variant deepening muted text.
64. All stat numbers: add `aria-label` with full sentence ("30 plus years of excellence").
65. FAQ accordions: proper `aria-expanded` mirroring (native details is fine; add summary focus style).
66. Gallery filter buttons: `aria-pressed` states.
67. Journey: expose as an ordered list (`<ol>`) for screen readers.
68. Hero video: `aria-hidden="true"` plus a text alternative near it.

### Performance (69–76)
69. `width`/`height` on every `<img>` (finding 21 — implement first).
70. Self-host both fonts as woff2 subsets (Latin) — removes 2 render-blocking origins.
71. `fetchpriority="high"` on the hero poster; `preconnect` to the photo CDN.
72. Responsive `srcset` for CDN images (they accept size params).
73. Inline critical CSS for the header/hero; defer the rest.
74. Lazy-init the lightbox and portal JS via `IntersectionObserver` on their sections.
75. Compress logovideo.mp4/schoolanimation.mp4 to ≤2 MB each (CRF 28, 720p).
76. Cache-bust assets with a version query and far-future cache headers.

### Content, SEO & operations (77–88)
77. `og:` / `twitter:` meta + designed share card (finding 23).
78. JSON-LD `School` schema: address, phone, geo, opening hours.
79. Descriptive, unique `<title>`/meta description per page (audit them once).
80. sitemap.xml + robots.txt.
81. Designed 404 (finding 24).
82. A tiny `/admin-notes.html` (unlinked) documenting which figures are sample data — for the office.
83. Google Business Profile link + embedded map pin on contact page verified against the real plus code.
84. Photo consent note in the footer of gallery ("published with parental consent").
85. Term-dates page or PDF (June/Sept/Jan) linked from fees.
86. Staff page: real designations audited; add M.Sc./B.Ed. style consistency.
87. Uptime-friendly hosting note: current build is fully static — deployable to Netlify/GitHub Pages free tier.
88. Quarterly content review checklist (fees, dates, photos) committed as `MAINTENANCE.md`.

---

*Recommended order of attack: findings 1, 2, 3, 5, 15, 21, 23 first (one focused day), then enhancements 9, 18–21, 40, 59–62, 69–72. Everything else is compounding polish.*
