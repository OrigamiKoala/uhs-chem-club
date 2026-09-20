---
name: Avalon
description: Advanced technology, poorly maintained — a forty-year-old working starship rendered as an interface.
colors:
  plate-000: "#0a0908"
  plate-100: "#100f0d"
  plate-200: "#171614"
  plate-300: "#1f1d1a"
  plate-400: "#2a2724"
  plate-500: "#393430"
  plate-600: "#4a443d"
  border-durasteel: "#2e2a26"
  border-bright: "#d99423"
  border-hazard: "#9a7419"
  seam-light: "rgba(214, 196, 168, 0.07)"
  seam-dark: "rgba(0, 0, 0, 0.55)"
  accent-amber: "#d99423"
  accent-gold: "#c39a63"
  accent-rust: "#9c5423"
  accent-green: "#6f8f3f"
  accent-danger: "#a8342a"
  accent-bronze: "#8a7148"
  accent-cyan: "#5c7b7a"
  lamp-amber: "#f0b246"
  lamp-green: "#8fb055"
  lamp-red: "#c9483a"
  text-primary: "#c9c0b1"
  text-secondary: "#8f8678"
  text-muted: "#635c52"
  text-bright: "#e8e0d0"
  team-earth: "#8a7148"
  team-air: "#75818a"
  team-fire: "#9c5423"
  team-water: "#3f7d76"
  charge-red: "#ff1744"
  charge-blue: "#00b0ff"
  charge-red-ink: "#e05a55"
  charge-blue-ink: "#5aa9cf"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "1.55rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
  headline:
    fontFamily: "Chakra Petch, monospace"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.13em"
  title:
    fontFamily: "Chakra Petch, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.15em"
  body:
    fontFamily: "Rajdhani, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Share Tech Mono, JetBrains Mono, monospace"
    fontSize: "0.65rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.3em"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
  full: "9999px"
  chamfer: "10px"
  chamfer-sm: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "28px"
  hud: "64px"
components:
  button-primary:
    backgroundColor: "#c08420"
    textColor: "#14110b"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "11px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#d09424"
    textColor: "#14110b"
  button-primary-disabled:
    backgroundColor: "{colors.plate-400}"
    textColor: "{colors.text-muted}"
  button-secondary:
    backgroundColor: "{colors.plate-300}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "11px 22px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.plate-400}"
    textColor: "{colors.text-bright}"
  nav-button:
    backgroundColor: "{colors.plate-300}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
    height: "38px"
  nav-button-active:
    backgroundColor: "{colors.plate-100}"
    textColor: "{colors.accent-amber}"
  input-field:
    backgroundColor: "{colors.plate-100}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
    height: "44px"
  input-field-focus:
    backgroundColor: "{colors.plate-100}"
    textColor: "{colors.lamp-amber}"
  panel-plate:
    backgroundColor: "rgba(23, 22, 20, 0.95)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "1.6rem 1.75rem"
  status-tag:
    backgroundColor: "{colors.plate-100}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  toast:
    backgroundColor: "{colors.plate-200}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    width: "340px"
---

# Design System: Avalon

## Overview

**Creative North Star: "The Scoured Plate"**

Everything on this ship is forty years old and still works. Avalon's interface is not a
dark-mode website with a space theme laid over it — it is machined hardware that has been
in the dust for four decades, maintained badly, and never once failed to do its job.
Advanced technology, poorly maintained. Sand gets into everything, so the neutrals carry a
brown bias; the light comes from filaments behind dusty glass, not from LEDs; and the
metal is sandblasted rather than polished.

The system's discipline is restraint with one signal. Amber means *live*. It is the only
painted thing on a panel of bare durasteel, which is exactly why the eye finds it without
being shouted at. A screen that is mostly amber has said nothing. The corollary is that
this interface never advertises itself: there are no feature cards, no hero gradients, no
badges claiming a connection is active. Every string on screen is a label, a rule the
player must satisfy, an error, something being taught, or a character speaking.

Depth is structural, not atmospheric. A plate is bolted to a bulkhead, so it catches a
hairline of lamp light on its top edge, drops a shadow along its bottom, and casts a real
shadow onto the surface behind it. What it never does is emit. `box-shadow: 0 0 20px
<colour>` is the single loudest tell of vibe-coded design and is banned outright; the only
exceptions are objects that are literally lamps. The reference points are the used-universe
of a desert-planet space opera, never named in player-facing copy, only felt.

**Key Characteristics:**
- Warm dark neutrals with a sand/brown bias — never blue-black.
- Zero border radius. Machined plate has **cut corners**, not rounded ones.
- A shared sandblast grain tile on every large surface at 3–4% opacity.
- Amber as a scarce signal; bare durasteel as the default.
- Engraved type — a dark line under the glyph — never a glowing one.
- Four typefaces with four distinct jobs: imperial serif, display, body, telemetry mono.
- Charge red and blue are reserved for chemistry and appear nowhere else as surfaces.

## Colors

A dust palette: every hue is pulled well below full brightness, as if read through a
filthy canopy under one sodium task lamp.

### Primary

- **Spice Amber** (`#d99423`): the primary live signal. A lit nav tab, a focused input's
  text, a stat value, the left edge of a toast, the rule under a link. If it is amber,
  something is live or something is yours.
- **The Filament** (`#f0b246`): the lamp itself, not the light it throws. Reserved for
  marks small enough to read as a bulb — the active stage lamp, a focused field's text,
  a hovered link. Never a fill larger than a few pixels across.

### Secondary

- **Sunlit Sand** (`#c39a63`): horizon light. Milestone borders, soft warnings, the
  second-tier accent when amber would over-signal.
- **Oxidised Iron** (`#9c5423`): hydraulic stain and rust. The Thermal Smelters livery,
  and the tint of a marked grain on the core bench.
- **Guild Bronze** (`#8a7148`): insignia metal. The Mineral Mining livery.

### Tertiary

- **Aged Phosphor** (`#6f8f3f`): an oscilloscope screen that has been on too long.
  Cleared stages, confirmations, live tags. The success colour, and never a bright green.
- **Blast Hazard Red** (`#a8342a`): painted on and chipped off. Faults, miss banners,
  destructive confirmations.
- **Dead Instrument Patina** (`#5c7b7a`): a desaturated teal that reads as corroded metal.
  It exists specifically so that nothing in this system is ever tempted toward cyan.

### Neutral

- **Plate 000 — The Void** (`#0a0908`): outside the canopy; the page ground.
- **Plate 100 — Instrument Well** (`#100f0d`): the deepest recess. Input wells, inset
  tags, an active nav tab pressed into the bulkhead.
- **Plate 200 — Panel Ground** (`#171614`): the default surface of a panel or toast.
- **Plate 300 — Raised Plate** (`#1f1d1a`): a bare durasteel key cap or nav button at rest.
- **Plate 400 — Bezel** (`#2a2724`): a button face on hover; an unlit stage lamp.
- **Plate 500 — Scribe Line** (`#393430`): seams and scribed divisions.
- **Plate 600 — Worn Edge** (`#4a443d`): the edge that catches the task lamp.
- **Durasteel Seam** (`#2e2a26`): the default border. A machined edge, not a highlight.
- **Bone White, Dust-Warmed** (`#c9c0b1`): body text. Never pure white — white is a colour
  this ship has not seen in forty years.
- **Stencil Grey** (`#8f8678`) and **Worn Label** (`#635c52`): secondary and muted text,
  used for kickers, helper lines and part numbers.
- **Fresh Paint** (`#e8e0d0`): the brightest type in the system, reserved for titles and
  the text inside a focused field.

### Guild Liveries

Four working houses, four service liveries, always shown as two-letter mono designators
(MM / AH / TS / ME): **Mineral Mining** bronze (`#8a7148`), **Atmospheric Harvesters**
storm grey (`#75818a`), **Thermal Smelters** rust (`#9c5423`), **Moisture Extraction**
deep teal (`#3f7d76`). Each has a 16%-opacity background variant for badges and rows.

### Named Rules

**The One Lamp Rule.** Amber is a signal, not a surface. If it is lit, something is live.
Audit test: on any screen, the total amber area should read as a handful of indicator
marks, not as a colour scheme. If you can describe the screen as "the amber one", it fails.

**The Reserved Hues Rule.** Charge red (`#ff1744`) and charge blue (`#00b0ff`) belong to
the chemistry and appear **only inside the 3D chamber**. In UI chrome the same signal
appears as printed ink on a hairline rule — `#e05a55` and `#5aa9cf` — on the polarity key
and a concept pill's left border. Never as a glowing block and never as a ramp between the
two, because the label on a panel must always mean the same thing as the cloud in the
chamber.

**The No Web Colour Rule.** Tailwind-default palette hexes (`#fbbf24`, `#10b981`,
`#ff5252`) and electric cyan (`#00e5ff`) are banned on sight. The HUD guild badge derives
its livery from `TEAM_LIVERY` in `main.js`, never from the backend sheet's `accent_hex` —
a stale hex in a spreadsheet once leaked a bright web colour straight into the header.

## Typography

**Imperial Font:** Cinzel (serif) — page titles only.
**Display Font:** Chakra Petch (monospace-flavoured sans) — section heads and switchgear legends.
**Body Font:** Rajdhani (condensed sans) — prose, prompts, teaching copy.
**Telemetry Font:** Share Tech Mono (with JetBrains Mono fallback) — labels, kickers, readouts, part numbers.

**Character:** Four faces, four jobs, no overlap. Cinzel is the only thing on the ship
with a Roman serif — it carries the weight of an Empire that stamped its name on the hull.
Chakra Petch is the manufacturer's legend on a switch. Rajdhani is the one face that
reads comfortably in paragraphs, so it carries everything a student must actually
understand. Share Tech Mono is the machine talking: wide-tracked, uppercase, small.

### Hierarchy

- **Display** (Cinzel 700, 1.55rem, `0.2em` tracking, uppercase, line-height 1.2): the
  page title. One per screen, always built through `pageHeader`.
- **Headline** (Chakra Petch 600, 1.05rem, `0.13em` tracking, uppercase): section and card
  headings — `.section-title`, `.holo-title`.
- **Title** (Chakra Petch 600, 1rem, `0.15em` tracking, uppercase): a stage's name, and
  the legend on switchgear at 0.78rem with `0.2em` tracking.
- **Body** (Rajdhani 500, 16px, line-height 1.5): prompts, concept cards, epilogue,
  story transmissions. This is the only role a student reads at length, so it is the only
  role that is not tracked out.
- **Label** (Share Tech Mono 400, 0.6–0.68rem, `0.14em`–`0.3em` tracking, uppercase):
  kickers (`.eyebrow`, `.lit` when live), form labels, helper text, status tags, banner
  titles, stat values, part numbers.

### Named Rules

**The Engraved Type Rule.** Type sits *in* the surface. Titles and legends carry
`text-shadow: 0 1px 0 rgba(0, 0, 0, 0.7)` — a dark line under the glyph, cut into the
plate. Type never glows, and a light-coloured text-shadow appears only on the painted
amber key cap, where it reads as the raised lip of stamped paint.

**The Tracking Ladder Rule.** The smaller the type, the wider the tracking. A 0.65rem
kicker runs at `0.3em`; 16px body runs at normal. Small mono type in this system is a
stencil, and a stencil is spaced.

**The Placeholder Ban.** Forms use explicit labels and helper text. Never use placeholder
text to carry an example or an instruction — it disappears the moment a student starts
typing, which is exactly when they need it.

## Layout

One persistent WebGL canvas sits fixed behind everything; the DOM UI floats over it in
`.app-viewport`, which is `pointer-events: none` so the 3D stage stays draggable except
where a screen explicitly claims the pointer back.

- **Container:** `.screen-container` at `max-width: 1120px`, centred, `1.5rem` padding.
- **The HUD anchor:** `--hud-h` (64px) is the height of the fixed header, and it is the
  one measurement the whole layout derives from. `.app-viewport` pads down by
  `calc(var(--hud-h) + 12px)` and the fixed quest overlay offsets by the same. Nothing may
  slide under the bulkhead.
- **Rhythm:** a 4px base step — 4 / 8 / 16 / 24 / 28px — with panel padding at
  `1.6rem 1.75rem` and section gaps at `1.25rem`–`1.5rem`.
- **Vignette:** the canopy is never quite clean. A fixed radial gradient darkens the frame
  edges to `rgba(6, 5, 4, 0.55)` over the entire viewport, above the 3D stage and below
  the modals.
- **Desktop breakpoints:** 900px collapses the HUD, 760px and 620px hide the legend and
  secondary chrome, shrink the chamfer, and cap the stage card height.
- **Phone is a separate stylesheet, not a media query bolted on.** `mobile.css`,
  `mobile-screens.css` and `mobile-quest.css` link after `holo.css` and are scoped
  entirely to `max-width: 760px`, so desktop can never be damaged by a phone fix. The HUD
  becomes two rows (`--hud-h` 92px, or 52px when the nav strip is hidden). Inputs are 16px
  on phones so iOS does not zoom on focus. Safe-area insets are honoured.
- **Landscape phones get their own sheet.** `mobile-landscape.css` targets
  `(pointer: coarse) and (max-height: 500px) and (orientation: landscape)` — sideways
  phones are often wider than 760px and would otherwise get the desktop layout on a 400px
  tall screen. It collapses the HUD to one 44px row and docks the stage deck right.

### Named Rules

**The 375 Rule.** Every screen, instrument and quest must work at 375px wide. This is the
product's confirmed device floor, not a courtesy tier.

**The 44 Rule.** Every interactive control has `min-height: 44px` (38px for the compact
HUD nav). A student is playing this on a phone with dusty fingers.

## Elevation & Depth

This system has no radius and no glow, so **depth is carried entirely by machined relief
and cast shadow**. Every raised surface states three things at once: a hairline of lamp
light along the top edge (`inset 0 1px 0` in `seam-light`), a shadow line along the bottom
(`inset 0 -1px 0` in `seam-dark`), and a real cast shadow beneath it. The seam pair says
*this is a separate piece of metal*; the cast shadow says *it is bolted a few millimetres
off the bulkhead*. Both are structural. Neither is atmosphere.

The distinction that matters: **a cast shadow is light being blocked; a glow is light
being emitted.** This system casts freely and emits almost never.

### Shadow Vocabulary

- **Seam pair** (`inset 0 1px 0 var(--seam-light), inset 0 -1px 0 var(--seam-dark)`):
  the default treatment on every raised surface — panels, secondary buttons, nav buttons,
  the HUD, dropdowns.
- **Panel cast** (`0 14px 34px rgba(0, 0, 0, 0.6)`): a major plate standing off the
  bulkhead.
- **Overlay cast** (`0 10px 28px rgba(0, 0, 0, 0.8)` / `0 8px 22px rgba(0, 0, 0, 0.8)`):
  dropdowns and toasts, which float higher and therefore darker.
- **HUD cast** (`0 6px 20px rgba(0, 0, 0, 0.7)` plus `inset 0 -2px 0 rgba(0,0,0,0.5)`):
  the overhead bulkhead the whole ship hangs off.
- **Key cap relief** (`inset 0 1px 0 rgba(255, 226, 168, 0.35), inset 0 -2px 0 rgba(0,0,0,0.3),
  0 2px 0 #1a1610, 0 4px 10px rgba(0, 0, 0, 0.55)`): the painted primary button. The
  `0 2px 0` is a physical bottom lip, not a shadow — it is the side of the key.
- **Recessed well** (`inset 0 2px 6px rgba(0, 0, 0, 0.75)`): inputs and pressed states.
  Depth going *into* the plate rather than out of it.
- **Indicator halo** (`0 0 4px` at 30–45% alpha): the only outward glow in the system,
  and only on things that are literally lamps.

### Named Rules

**The Nothing Blooms Rule.** `box-shadow: 0 0 20px <colour>` is banned. The sole
exceptions are objects that are physically lamps: `.gfx-dot`, `.stage-dot.active`
(`0 0 6px` of filament amber), `.stage-dot.completed`. If you cannot justify a glow as a
bulb behind glass, it is not allowed.

**The Press Rule.** A pressed control moves. Both button variants take
`transform: translateY(2px)` on `:active` and swap their cast shadow for an inset one — the
key travels into the panel. Transitions are 0.08s for the press and 0.12–0.15s for colour;
fast enough to feel mechanical rather than animated.

## Shapes

**Zero radius, everywhere.** `--radius-sm`, `--radius-md` and `--radius-lg` are all `0px`.
They exist only so that a stray `border-radius: var(--radius-md)` in new code renders
correctly square instead of announcing itself. The only round thing in the system is
`--radius-full` on genuinely circular objects.

Machined plate has **cut corners**, and the system runs two grades of cut. Both are a
`clip-path: polygon(...)` relieving the corner, plus a matching hairline drawn as a 45°
`linear-gradient` background inside each relieved corner so the cut reads as a machined
bevel rather than a missing corner.

- **Panels are cut on both diagonal corners** — top-left and bottom-right. `.plate` and
  `.glass-panel` at `--chamfer` (10px); `.scope-plate`, the Learn instrument, at
  `--chamfer-sm` (6px). A plate is a piece of stock cut square at both ends.
- **Cards are cut on one corner** — top-left only. `.holo-card` at `--chamfer-sm` (6px);
  `.stage-prompt-card` at `--chamfer` (10px). A card is a sheet tucked under the plate,
  so only its leading corner is clipped.

The grade is chosen by *what the container is*, not by how big it is: `.stage-prompt-card`
takes the 10px cut at one corner, and `.scope-plate` takes the 6px cut at two. Phone
breakpoints shrink the chamfer rather than dropping it.

Every large surface is sandblasted: a shared `--grain` SVG turbulence tile applied through
`::before` at 3.5% opacity with `mix-blend-mode: overlay`. Because a pseudo-element is not
matched by `> *`, direct children carry `position: relative` to sit above the grain. The
painted key cap uses the same tile at 10% with `mix-blend-mode: multiply` — worn paint
rather than blasted metal.

### Named Rules

**The Cut Corner Rule.** If a container has a border and a fill, it gets the chamfer
treatment — clip-path plus a matching corner hairline. Decide the grade first: a **panel**
is relieved at top-left *and* bottom-right; a **card** is relieved at top-left only. Never
relieve bottom-right alone, and never relieve a corner without drawing its hairline — a
clipped corner with no bevel line reads as a rendering bug.

**The Grain-Under-Content Rule.** Grain goes on `::before`, content goes on
`position: relative`. Forget the second half and the noise renders over the text.

## Components

### Buttons

Switchgear, not web buttons. The primary reads first because it is the only painted thing
on a panel of bare metal — not because it is bigger or brighter.

- **Shape:** square (`0` radius), `min-height: 44px`, Chakra Petch 0.78rem uppercase at
  `0.2em` tracking.
- **Primary — the painted key cap:** a matte amber plate
  (`linear-gradient(180deg, #c08420, #a06c19)`) with an engraved dark legend (`#14110b`),
  a `#6d4a12` border, the key-cap relief shadow stack, and the grain tile at 10%
  multiply for worn paint. Padding `11px 24px`.
- **Hover:** the paint lightens one step (`#d09424 → #ac761c`). Nothing else moves.
- **Active:** `translateY(2px)` and the relief inverts to an inset press.
- **Disabled:** paint stripped back to bare `plate-400` with muted text and the seam
  highlight only — a key with its legend worn off.
- **Secondary — bare durasteel:** `plate-300` face, durasteel border, engraved
  `text-primary` legend, seam pair plus a `0 2px 0` lip. Hover raises to `plate-400` and
  brightens the text; active presses the same 2px.
- **Compact quest chrome (`.quest-btn-sm`)** is the same language at reduced scale for
  the stage deck.
- **Labels are 1–2 words and contain no arrow glyphs.** "Next Stage", not "Continue →".

### Inputs

- **Style:** a recessed well. `plate-100` fill, durasteel border with a pure-black top
  edge (light does not reach the inside of a cut), `inset 0 2px 6px rgba(0,0,0,0.75)`,
  Share Tech Mono at 0.95rem, padding `11px 14px`, `min-height: 44px`.
- **Focus:** the border goes amber and **the text itself turns filament amber**
  (`#f0b246`). There is no ring and no halo — the well lights up from inside, which is
  what a real instrument does.
- **Validation:** helper text carries the state, not the field. `.form-help.good` is aged
  phosphor, `.warn` is sunlit sand, `.bad` is lamp red.
- **Choice options (`.choice-option`)** are toggles with a lit left edge when selected.

### Navigation

The HUD is the overhead bulkhead the whole ship hangs off: a `plate-300 → plate-100`
vertical gradient, a pure black bottom border, the seam pair, and a lit strip beneath it —
the only glowing element in the header.

- **Nav buttons:** `plate-300`, durasteel border, Chakra Petch 0.7rem at `0.18em`,
  `min-height: 38px`.
- **Hover:** face raises to `plate-400`, legend brightens.
- **Active:** the button is pressed *into* the bulkhead — `plate-100` fill, an inset
  shadow, amber legend, and a 2px amber bar down its left edge.
- **Nav labels match page titles exactly:** BRIDGE, STAR MAP, LEARN, STANDINGS, INVENTORY,
  CREW. A label that does not match its destination's title is a bug.
- **On phones** the nav becomes a horizontally scrolling strip on the HUD's second row.

### Panels and Cards

- **`.plate` / `.glass-panel`** share one treatment: `rgba(23,22,20,0.95)` fill, durasteel
  border, the **two-corner** chamfer with hairlines, the seam pair, the panel cast shadow,
  the grain tile, `1.6rem 1.75rem` padding.
- **`.holo-card`** is the card grade: `rgba(26,24,22,0.93)` fill, the **one-corner** cut at
  6px, the seam pair, a lighter `0 10px 26px` cast, `1.35rem 1.4rem` padding.
- **`.stage-prompt-card`** is the quest's floating card — one-corner cut at 10px, capped at
  `440px` wide and `62vh` tall with contained overscroll, and the heaviest cast in the
  system (`0 16px 42px rgba(0,0,0,0.8)`) because it floats over the 3D chamber.
- **`.panel-banner`** is where environment art goes, and it must read as a **viewport, not
  a hero image**: 128px tall (160px `.tall`), `filter: saturate(0.5) contrast(1.05)
  brightness(0.62) sepia(0.18)`, with a 3px scanline and a bottom-weighted fade laid over
  it. It accepts a looping video as readily as a still.

### Status Tags

Stamped markings. Share Tech Mono 0.62rem at `0.18em` uppercase, `3px 8px` padding,
`plate-100` fill, durasteel border, muted text. Four states recolour the text and border
only, never the fill: `.live` phosphor, `.warn` amber, `.danger` blast red, `.locked`
muted at 70% opacity.

### Banners and Toasts

- **Toasts** dock bottom-right: `plate-200`, a 3px coloured left edge that carries the
  type (`success` phosphor / `error` blast red / `warning` sand / `info` plate-600), mono
  0.8rem, max 340px, sliding 14px in over 0.22s.
- **`.stage-error-banner`** is the quest's fault display: a 12% tint of its state colour, a
  matching border, a 3px left edge, and four parts — `.banner-mark`, `.banner-title`,
  `.banner-body`, `.banner-meta`. The leading mark is a **stencilled `!!` or `//`, never an
  emoji.** The `.soft` variant is amber for a survivable miss; `.stage-success-banner` is
  phosphor.

### Signature: Stage Lamps

An 8×10px bulb — deliberately taller than wide, like a panel indicator, not a dot.
`plate-400` when unreached, aged phosphor with a 4px halo when cleared, filament amber with
a 6px halo when active, 40% opacity when locked. This is one of the three places in the
entire system permitted to glow. On phones the same lamp becomes a 40px-tall touch strip
drawn by `::before` while keeping its 8px visual width.

### Signature: The Gardens Map

Twenty pylons in a `repeat(20, minmax(0, 1fr))` grid on a `plate-200` panel with a 2px
amber left edge. Each node is a 28px well holding a 4px filament that goes from dead
(`#2a2520`) to lit as its stage clears; milestone pylons take a sunlit-sand border. It is
a progress bar that reads as a power grid coming back online — which is literally what the
campaign is about.

### Signature: The Bench Instruments

The Learn track's two instruments — the **sampler scope** and the **core bench** — are the
most distinctive surfaces in the product. Each exists twice: as a canvas instrument
(`scope.js`, `corebench.js`) at T3 and below, and as a **built object on a bench the player
has walked to** (`scope3d.js`, `corebench3d.js`) at T4. Canvas cannot inherit a CSS custom
property, so each 2D file mirrors the dust palette as literal constants; those constants
are part of this system and must stay in step with the tokens, and `TINT_HEX` in
`bench3d.js` mirrors them again for the built versions.

- **The aperture:** a `#0d0c0a` field inside a `#2e2a26` rim on a chamfered `.scope-plate`,
  square at `aspect-ratio: 1/1` (16:10 when a single plate stands alone).
- **The canvas palette:** `bone #b8afa0`, `sand #c39a63`, `iron #6b625a`, `rust #9c5423`,
  `pale #8f8678` — each with its own darker rim colour. Phosphor `#6f8f3f` and amber
  `#d99423` are the instrument's own indicators.
- **Plate states:** `selectable` borders bronze on hover; `selected` borders bright amber,
  raises the fill to `plate-300` and turns its label amber.
- **The power dial** is a **milled cap you turn**, never a slider and never a
  minus/readout/plus row. On the drawn instrument it is `engine/dial.js` — a knurled cap
  with an engraved index, detents cut round its collar and a 270° sweep, turned by drag, by
  arrow keys once focused, or by the wheel. On the built instrument it is
  `buildPowerDial()` in `bench3d.js` — the same cap as real geometry on a raked plinth
  bolted to the plate, turned by reaching over and dragging it or by rolling the wheel over
  it. **Both call `angleFor` / `valueForAngle` from `dial.js`**, which is the single
  implementation of where a detent is, so the knob on the bench and the knob on the panel
  can never disagree about which power a given angle means.

**The Flat Picture Rule.** A built instrument is real geometry — a plate, a well with the
bulk matter actually in it, a milled cap you reach over and turn — but **what the
instrument RESOLVES is drawn in two dimensions**, on a raked screen standing behind each
well (`buildStation` in `bench3d.js`), by the same `drawScopeField` / `drawCoreField` that
paint the canvas instrument. Three reasons, and each one was a bug before it was a rule:
a microscope's output is a flat image, so pieces rising out of a hole as the dial comes up
read as the sample inflating; a core is a huddle, so staged as spheres half its grains hide
behind the other half and a player asked to COUNT is refused over a grain they were never
shown; and at ring scale a piece staged in the world is a speck indistinguishable from the
dust of the planet behind it. Drawn flat, every piece is in the picture, in the same place,
at the same size, on every tier — which is also what keeps a hint that names a position
honest on both benches. The screen is raked rather than laid in the well because the player
is looking down at a bench: flat, the picture foreshortens to about a third of its height.

**The Aimed, Not Skewed Rule.** Deployed on a walkable world the quest frame is a page over
the glass, so the instrument has to sit in the part of the view the frame is not covering.
It gets there by **aiming the camera higher**, never by skewing the projection: a
`setViewOffset` on the world camera would re-frame the whole planet to make room for a card
standing in front of it. `fitDeployedAim` / `aimForChrome` in `bench3d.js` measure how far
down the glass the chrome reaches over the middle of the view and pitch up until the tops
of the screens clear it; `verify:bench` drives the same function and fails the build if a
screen still runs under the frame or a well ends up off the bottom.

**The Stencil, Not Colour Rule.** On the core bench a marked grain is told apart by a
**stencilled cross**, never by its colour alone. It is the only version of the instrument
that survives a colour-blind player, and it is non-negotiable.

**The Reserved Hues Rule applies here too.** Charge red and blue stay in the 3D chamber.
An instrument that borrowed them would break the promise that those two colours mean one
specific thing.

### Signature: The Chemistry Card

`.chem-card` — one to three sentences of **real chemistry**, drawn after a stage is solved
and never before it. Bare `plate-000` with an amber left edge, a top-left chamfer, an amber
stencil badge and a mono gold title. It is the one surface in the campaign where the
withheld vocabulary is allowed, and that permission is the reason it exists: the player has
just done the thing, so naming it is a payoff rather than a lecture.

It is deliberately NOT the `.concept-card` next to it. A concept card teaches the
**controls** and appears before a stage (`conceptTiming: 'intro'`, bronze edge, pills). A
chemistry card teaches the **chemistry** and appears after it. `verify:quest` holds the
chem card to three sentences and holds the intro card to the withheld-vocabulary list.

The Learn track's equivalent is `.lq-reward` — same rule, same three-sentence ceiling,
enforced by `verify:learn`.

### Signature: The Practice Overlay

The optional problem set a Learn world ends on (`learn/practice.js`). A **2D card on every
tier**, including T4: these are the player's own revision, not a transmission from anyone,
and no instrument in the fiction asks multiple-choice questions.

- Options are `.choice-option` buttons stacked full width. A latched answer is marked by a
  **left edge in `--accent-green` or `--accent-danger` over a 14%-opacity wash** — ink on a
  hairline rule, never a coloured fill and never a glow.
- The verdict block (`.lq-practice-verdict`) leads with a stencilled `//` or `!!`, exactly
  as a banner does, and always carries the explanation. A question that is only marked
  wrong teaches nothing.
- Three keys, always: **Close** (leave), **Skip** (this question), **Next / Finish**. The
  set is optional at every point and nothing is gated behind it.
- The **Problems** key (`practiceKey()` in `screens/learn-world.js`) appears beside a
  finished world's Enter key on the star map, on the Learn road, in the world brief and in
  the walk HUD. It is a `btn-secondary`, because reopening revision is not the primary act
  on any of those screens.

### Signature: The Chamber Console

At T4 the Charge Gardens' stage deck is not a card over the render — it is a **control desk
across the bottom of the glass** (`quest3d/console.js`). One surface, not three: a raked
fascia with the deck on the left and the stage rail and relay strip on the right, cut away
at both outer corners, with toggle banks, indicator lamps, rotaries and a hand rail built
in WebGL strictly around the aperture.

Two numbers are the design, and `npm run verify:console` asserts both at fourteen
viewports:

- **It never covers more than 25% of the height of the view.** Three quarters of the glass
  is always the chamber, because the molecule is the thing the stage is asking about.
- **Its top edge stays below −0.33 NDC** — it is low, not central.

The fit is solved by **measuring the projected corners**, not by trigonometry: the fascia is
raked, so its near edge projects larger, and the flat estimate put a "quarter height" desk
at 29% of a 16:9 screen with its lip off the bottom of the glass. Below 900 px of glass the
console is not raised at all and the quest keeps the 2D stage deck, which is the interface
`mobile-quest.css` was written for. A desk nobody can read is worse than an honest card.

## Do's and Don'ts

### Do:

- **Do** read `src/styles/tokens.css` before styling anything. It is the contract, and it
  is commented with the reasoning behind every group.
- **Do** build every screen header from `pageHeader` in `ui/layout.js`. Hand-rolled banner
  markup is how a system drifts.
- **Do** give every raised surface the seam pair — `inset 0 1px 0 var(--seam-light),
  inset 0 -1px 0 var(--seam-dark)`. It is two lines of CSS and it is most of the look.
- **Do** pick the chamfer grade by what the container is — two corners for a panel,
  top-left only for a card — and always draw the matching corner hairline.
- **Do** keep the grain on `::before` and put `position: relative` on direct children.
- **Do** add a phone hook (`m-grid-1`, `m-head`, `m-cta-stack`, `m-subpanel`…) when you add
  a grid or table to a screen, and verify it at 375px.
- **Do** label state with a coloured left edge or a recoloured border, not a coloured fill.
- **Do** keep every interactive control at `min-height: 44px`.
- **Do** write copy that is a label, a rule, an error, teaching, or a character speaking.
  Delete anything else.
- **Do** cap a teaching card at three sentences. Both the campaign's `.chem-card` and the
  Learn track's `.lq-reward` land after the work, in bits, and a card that runs to a
  paragraph is the end-of-quest lecture moved earlier.
- **Do** make an instrument's control a thing you turn, press or slide in the world when
  the bench is built — and keep a keyboard path to the same value. A control that answers
  only to a drag is invisible to a keyboard and unusable on a trackpad.
- **Do** put the move stick bottom-LEFT and the look stick bottom-RIGHT on a phone. That
  is where every twin-stick scheme a player has already used puts them, and a walk that
  steers backwards from muscle memory reads as broken input rather than as a choice.
- **Do** inset a part into the part it is carried by rather than ending it flush. Two faces
  in the same plane cannot be ordered by a depth buffer, and the surface flickers — a shelf
  as wide as the posts holding it, a box whose underside is exactly the lid below it, an
  I-beam web the same length as its flanges. A few millimetres of overlap is the fix.

### Don't:

- **Don't** add `box-shadow: 0 0 Npx <colour>` as a glow. The exceptions are `.gfx-dot`
  and the active/completed stage lamps, and there are no others.
- **Don't** introduce a border radius. `--radius-sm` is `0` and that is a decision, not an
  oversight.
- **Don't** use charge red (`#ff1744`) or charge blue (`#00b0ff`) outside the 3D chamber.
  In chrome they appear only as `--charge-red-ink` / `--charge-blue-ink` on a hairline.
- **Don't** reach for blue-black neutrals, electric cyan (`#00e5ff`), glassmorphism, candy
  gradients with white specular highlights, or Tailwind-default palette hexes (`#fbbf24`,
  `#10b981`, `#ff5252`).
- **Don't** put an emoji in player-facing markup. A banner's leading mark is a stencilled
  `!!` or `//`.
- **Don't** put an arrow glyph in a button label, or write a label longer than two words.
- **Don't** use placeholder text to carry an instruction or an example — use an explicit
  label and helper text.
- **Don't** build an auto-fit grid of feature cards advertising what the product does. The
  interface does not describe itself.
- **Don't** add a "COMMS LIVE" or "LIVE COMMS" badge, or any other claim that a connection
  is active. Comms channels are labelled diegetically (`COMMS`) and claim nothing.
- **Don't** let an instrument invent a reading. The comms board shows the real standings or
  says `NO GUILD TELEMETRY ON THIS CHANNEL`; it never falls back to a plausible season.
  Avalon is pre-launch and a screen that makes data up is lying to a student.
  `verify:holo` enforces it.
- **Don't** name a chemical idea before the player has done it. A term enters on the card
  that follows the stage which earned it, never in the prompt that introduces it, and
  never more than about one new idea per stage — a player who has not met a molecule
  cannot be handed "nucleophilic aromatic substitution" and the stage is broken, not hard.
  `verify:quest` and `verify:learn` fail the build over it.
- **Don't** keep saying "light piece" after the player has been told it is an electron,
  either. **Withholding is a schedule, not a policy**: once a reward card has named the
  thing, the plain word is the word the game uses — in prompts, hints, widget labels,
  readouts and refusal messages alike. A quest publishes that schedule as `VOCABULARY` in
  its module (see `unit01/q2-core.js`), `verify:learn` refuses a word used one stage early
  AND a word the schedule promises that no card delivers, and the campaign's Charge
  Gardens keeps the older arrangement — withheld throughout play, taught on the chemistry
  card — because it has no schedule of its own.
- **Don't** read a guild's colour from the backend `accent_hex`. `TEAM_LIVERY` in
  `main.js` is the only source.
- **Don't** fix a phone bug in `main.css` or `holo.css`. Phone rules live in the
  `max-width: 760px` sheets so desktop cannot be collateral damage.
