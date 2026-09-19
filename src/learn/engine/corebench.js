/**
 * corebench.js — The core bench: the second Learn instrument, drawn on canvas.
 *
 * The sampler scope in `scope.js` stops at the piece that will not divide. This
 * one starts there. It takes a single piece, blows it up until there is room to
 * look inside, and offers three fields to look at it in:
 *
 *   whole — the piece at its own scale. Almost nothing to see, which is the point.
 *   core  — the middle, magnified until the heavy pieces separate.
 *   rings — the light pieces outside, at the fixed distances they keep.
 *
 * This is an INSTRUMENT, not a lesson. It knows how to draw a specimen, fire a
 * beam through one, strip a light piece off one and report what was tapped. It
 * knows no chemistry: what the parts weigh, what they mean and whether an answer
 * is right are all the quest's business. A mark on a heavy piece is a mark — the
 * bench does not know what it signifies, and it never says.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): a phosphor aperture on a recessed plate,
 * dust-coloured, nothing blooming. The reserved charge hues stay in the 3D
 * chamber — a marked piece is told apart by a stencilled mark, not by a colour,
 * which is also the only version of this that survives being colour-blind.
 */

/* Dust palette. Mirrors tokens.css; canvas cannot inherit a custom property. */
export const CORE_TINTS = {
  marked: { fill: '#9c5423', rim: '#5c3116' },   // rust
  blank: { fill: '#6b625a', rim: '#3b3631' },    // iron
  light: { fill: '#b8afa0', rim: '#6f685d' }     // bone
};

const FIELD_BG = '#0d0c0a';
const APERTURE_RIM = '#2e2a26';
const PHOSPHOR = '#6f8f3f';
const AMBER = '#d99423';
const HAZE = '#b8afa0';

/** The distances the light pieces keep, as a fraction of the aperture radius. */
export const RING_RADII = [0.30, 0.50, 0.68, 0.84, 0.95];

export const FIELDS = ['whole', 'core', 'rings'];

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Deterministic noise, so a specimen looks the same every time it is drawn. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pack `n` discs into a rough ball, tightest first. Real cores are a huddle and
 * not a grid, and a grid would read as a crystal — which would be the instrument
 * making a claim the quest never asked it to make.
 */
export function packCore(n, rand) {
  const out = [];
  let shell = 0;
  while (out.length < n) {
    const count = shell === 0 ? 1 : Math.min(n - out.length, Math.round(shell * 6.2));
    const base = rand() * Math.PI * 2;
    for (let i = 0; i < count && out.length < n; i++) {
      const a = base + (i * Math.PI * 2) / count + (rand() - 0.5) * 0.3;
      const r = shell * 1.78 + (rand() - 0.5) * 0.26;
      out.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    shell++;
  }
  return out;
}

/** How many shots the tester fires at a specimen. Fixed by the instrument. */
export const BEAM_SHOTS = 40;

/**
 * Plan one pass of the tester.
 *
 * The counts are fixed by the instrument, not by the quest: this is a
 * measurement, and a measurement that could be authored to say anything would be
 * worthless. The one shot that comes back is the one that arrives dead on the
 * axis, and its two neighbours only graze what is there — decided by WHICH TRACK
 * HITS THE MIDDLE rather than by a threshold on a spread, because a threshold
 * that happened to fall between two tracks would quietly report a solid piece,
 * and the whole stage is the return count.
 *
 * Pure: the canvas bench and the 3D bench both plan through here, so they can
 * never disagree about what came back.
 *
 * @returns {{tracks: Array, wide: number, back: number, shots: number}}
 */
export function planBeam(specimenId) {
  const rand = mulberry32(hashId(specimenId) ^ 0xb33f);
  const tracks = [];
  let wide = 0;
  let back = 0;

  const centre = Math.round((BEAM_SHOTS - 1) / 2);

  for (let i = 0; i < BEAM_SHOTS; i++) {
    const off = Math.abs(i - centre);
    const kind = off === 0 ? 'back' : off === 1 ? 'wide' : 'through';
    const y = kind === 'back' ? 0
      : kind === 'wide' ? (i < centre ? -0.035 : 0.035)
        : -0.86 + (i / (BEAM_SHOTS - 1)) * 1.72;
    const delay = rand() * 0.35;

    let path;
    if (kind === 'back') {
      path = [[-1.05, y], [-0.02, y], [-0.35, y - 0.16], [-1.05, y - 0.42]];
      back++;
    } else if (kind === 'wide') {
      const bend = (y >= 0 ? 1 : -1) * 0.34;
      path = [[-1.05, y], [0, y], [0.6, y + bend * 0.6], [1.05, y + bend]];
      wide++;
    } else {
      path = [[-1.05, y], [1.05, y]];
    }
    tracks.push({ kind, delay, path });
  }

  return { tracks, wide, back, shots: BEAM_SHOTS };
}

/**
 * Plan a strip: find the outermost ring that still holds a light piece, take one
 * off it, and say which ring it came from. Returns null when there was nothing
 * left to take. Mutates `sp.rings` and pushes onto `sp.pulled`, which is what
 * both benches animate.
 */
export function planStrip(sp) {
  if (!sp) return null;
  let ri = -1;
  for (let i = sp.rings.length - 1; i >= 0; i--) {
    if (sp.rings[i] > 0) { ri = i; break; }
  }
  if (ri < 0) return null;

  sp.rings[ri] -= 1;
  sp.pulled.push({
    a: Math.random() * Math.PI * 2,
    r0: RING_RADII[ri] ?? 0.98,
    t: 0
  });
  return ri;
}

export class CoreBench {
  /**
   * @param {HTMLElement} host element the plates are rendered into
   * @param {{onProbe?: Function, onSelect?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.specimens = [];
    this.plates = [];
    this.field = 'whole';
    this.selectable = false;
    this.selected = null;
    this.probe = null;      // {specimenId, key}
    this.sweep = 0;         // 0..1 beam sweep after a read
    this.raf = null;
    this.disposed = false;

    this.onResize = () => this.layoutAll();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- specimens & state ---------------- */

  /**
   * @param {Array<{
   *   id: string, label: string, note?: string,
   *   core: {marked: number, blank: number},
   *   rings?: number[],
   *   sealed?: boolean        // the outside will not resolve on this one
   * }>} specimens
   */
  setSpecimens(specimens) {
    // A beam still in flight has a caller waiting on it. Let it go before the
    // plates it was drawn on are replaced, or that caller waits forever.
    this.plates.forEach(pl => { if (pl.beamDone) { const d = pl.beamDone; pl.beamDone = null; d(); } });
    this.specimens = specimens.map(s => ({
      ...s,
      rings: (s.rings || []).slice(),
      baseRings: (s.rings || []).slice(),
      pulled: []              // light pieces flying off, mid-strip
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  setField(field) {
    if (!FIELDS.includes(field) || field === this.field) return;
    this.field = field;
    this.probe = null;
    this.drawAll();
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
    this.plates.forEach(pl => pl.root.classList.toggle('selectable', this.selectable));
  }

  setSelected(id) {
    this.selected = id;
    this.plates.forEach(pl => pl.root.classList.toggle('selected', pl.specimen.id === id));
  }

  /** Mark a plate with a status the stage cares about (a filed bin, a reading). */
  setPlateTag(id, text) {
    const pl = this.plates.find(p => p.specimen.id === id);
    if (pl && pl.tagEl) {
      pl.tagEl.textContent = text || '';
      pl.tagEl.classList.toggle('lit', Boolean(text));
    }
  }

  /** Draw a proposed arrangement of the light pieces without touching the real one. */
  setRings(id, rings) {
    const sp = this.specimens.find(s => s.id === id);
    if (!sp) return;
    sp.rings = (rings || []).slice();
    this.drawAll();
  }

  ringsOf(id) {
    const sp = this.specimens.find(s => s.id === id);
    return sp ? sp.rings.slice() : [];
  }

  /* ---------------- DOM ---------------- */

  build() {
    this.host.innerHTML = '';
    this.plates = [];

    const grid = document.createElement('div');
    grid.className = `scope-grid scope-n${Math.min(this.specimens.length, 4)}`;
    this.host.appendChild(grid);

    this.specimens.forEach(specimen => {
      const root = document.createElement('div');
      root.className = 'scope-plate';
      root.innerHTML = `
        <div class="scope-plate-head">
          <span class="scope-plate-label">${escText(specimen.label)}</span>
          <span class="scope-plate-tag"></span>
        </div>
        <div class="scope-aperture"><canvas></canvas></div>
        <div class="scope-plate-note">${escText(specimen.note || '')}</div>
      `;
      grid.appendChild(root);

      const canvas = root.querySelector('canvas');
      const plate = {
        specimen,
        root,
        canvas,
        ctx: canvas.getContext('2d'),
        tagEl: root.querySelector('.scope-plate-tag'),
        hits: [],
        beam: null,
        w: 0, h: 0
      };
      this.plates.push(plate);

      canvas.addEventListener('pointerdown', e => this.onPointer(plate, e));
      root.addEventListener('click', () => {
        if (this.selectable && this.onSelect) this.onSelect(specimen.id);
      });
    });

    this.layoutAll();
  }

  layoutAll() {
    if (this.disposed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.plates.forEach(pl => {
      const box = pl.canvas.parentElement.getBoundingClientRect();
      pl.w = Math.max(1, Math.round(box.width));
      pl.h = Math.max(1, Math.round(box.height));
      pl.canvas.width = Math.round(pl.w * dpr);
      pl.canvas.height = Math.round(pl.h * dpr);
      pl.canvas.style.width = `${pl.w}px`;
      pl.canvas.style.height = `${pl.h}px`;
      pl.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    this.drawAll();
  }

  geometry(plate) {
    const cx = plate.w / 2;
    const cy = plate.h / 2;
    return { cx, cy, aperture: Math.min(plate.w, plate.h) * 0.46 };
  }

  /* ---------------- input ---------------- */

  onPointer(plate, e) {
    const rect = plate.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    let best = null;
    let bestD = Infinity;
    for (const hit of plate.hits) {
      const d = Math.hypot(hit.x - px, hit.y - py);
      if (d < Math.max(hit.r + 7, 13) && d < bestD) { best = hit; bestD = d; }
    }
    if (!best || !this.onProbe) return;

    this.probe = { specimenId: plate.specimen.id, key: best.key };
    this.sweep = 1;
    this.startAnim();
    this.onProbe({
      specimenId: plate.specimen.id,
      specimenLabel: plate.specimen.label,
      part: best.part,
      ring: best.ring ?? null,
      field: this.field
    });
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    this.plates.forEach(pl => this.draw(pl));
  }

  draw(plate) {
    const { ctx, w, h, specimen } = plate;
    if (!w || !h) return;
    const g = this.geometry(plate);
    plate.hits = [];

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.aperture, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = FIELD_BG;
    ctx.fillRect(0, 0, w, h);

    if (this.field === 'whole') this.drawWhole(ctx, plate, g);
    else if (this.field === 'core') this.drawCore(ctx, plate, g);
    else this.drawRings(ctx, plate, g);

    if (plate.beam) this.drawBeam(ctx, plate, g);

    // Raster lines: this is a cathode instrument, not a window.
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;

    if (this.sweep > 0 && this.probe && this.probe.specimenId === specimen.id) {
      const y = g.cy - g.aperture + (1 - this.sweep) * g.aperture * 2;
      ctx.globalAlpha = 0.5 * this.sweep;
      ctx.fillStyle = PHOSPHOR;
      ctx.fillRect(0, y, w, 2);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    ctx.strokeStyle = APERTURE_RIM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.aperture, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * The whole piece, at its own scale. A haze with a speck in the middle of it —
   * and the speck is drawn to scale, which is the entire content of this view.
   */
  drawWhole(ctx, plate, g) {
    const { specimen } = plate;
    const rand = mulberry32(hashId(specimen.id) ^ 0x51ed);
    const edge = g.aperture * 0.86;

    const haze = ctx.createRadialGradient(g.cx, g.cy, edge * 0.05, g.cx, g.cy, edge);
    haze.addColorStop(0, 'rgba(184, 175, 160, 0.22)');
    haze.addColorStop(0.55, 'rgba(184, 175, 160, 0.10)');
    haze.addColorStop(1, 'rgba(184, 175, 160, 0)');
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, edge, 0, Math.PI * 2);
    ctx.fill();

    // Grain in the haze, so it reads as a swarm too fast to resolve rather than
    // as a painted ball.
    ctx.fillStyle = HAZE;
    for (let i = 0; i < 220; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * edge;
      ctx.globalAlpha = 0.05 + (1 - r / edge) * 0.12;
      ctx.fillRect(g.cx + Math.cos(a) * r, g.cy + Math.sin(a) * r, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(184, 175, 160, 0.13)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, edge, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // The core, to scale. It is about one part in ten thousand across; at this
    // aperture that is well under a pixel, so it is drawn at the smallest mark
    // the raster can hold and the caption carries the rest.
    ctx.fillStyle = AMBER;
    ctx.fillRect(g.cx - 1, g.cy - 1, 2, 2);

    plate.hits.push({ key: 'whole', part: 'whole', x: g.cx, y: g.cy, r: g.aperture * 0.7 });
  }

  /** The middle, magnified until the heavy pieces separate. */
  drawCore(ctx, plate, g) {
    const { specimen } = plate;
    const marked = specimen.core?.marked || 0;
    const blank = specimen.core?.blank || 0;
    const total = marked + blank;
    if (!total) return;

    const rand = mulberry32(hashId(specimen.id) ^ 0x7a31);
    const pack = packCore(total, rand);
    const spread = Math.max(1, ...pack.map(([x, y]) => Math.hypot(x, y))) + 1;
    const unit = (g.aperture * 0.74) / spread;
    const r = unit * 0.88;

    // Alternate the two sorts as the pack is walked outward, so neither ends up
    // segregated into its own half of the core.
    const order = [];
    let m = marked;
    let b = blank;
    for (let i = 0; i < total; i++) {
      const takeMarked = b === 0 || (m > 0 && (i % 2 === 0 ? m >= b : m > b));
      if (takeMarked) { order.push('marked'); m--; } else { order.push('blank'); b--; }
    }

    // Far pieces first, so the near ones overlap them the way a huddle looks.
    const idx = pack.map((p, i) => i).sort(
      (a, c) => Math.hypot(...pack[c]) - Math.hypot(...pack[a])
    );

    idx.forEach(i => {
      const [ox, oy] = pack[i];
      const x = g.cx + ox * unit;
      const y = g.cy + oy * unit;
      const sort = order[i];
      this.disc(ctx, x, y, r, CORE_TINTS[sort]);
      if (sort === 'marked') this.stencilMark(ctx, x, y, r);
      plate.hits.push({ key: `core:${i}`, part: sort, x, y, r });
    });
  }

  /** The light pieces, out at the distances they keep. */
  drawRings(ctx, plate, g) {
    const { specimen } = plate;
    const rand = mulberry32(hashId(specimen.id) ^ 0x2c99);

    // The core is one mark at this scale — the point of the previous field.
    this.disc(ctx, g.cx, g.cy, Math.max(4, g.aperture * 0.075), CORE_TINTS.marked);
    this.stencilMark(ctx, g.cx, g.cy, Math.max(4, g.aperture * 0.075));
    plate.hits.push({ key: 'core', part: 'core', x: g.cx, y: g.cy, r: g.aperture * 0.08 });

    if (specimen.sealed) {
      ctx.fillStyle = 'rgba(184, 175, 160, 0.10)';
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.aperture * 0.9, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const dotR = Math.max(2.6, g.aperture * 0.045);

    specimen.rings.forEach((count, ri) => {
      const rad = (RING_RADII[ri] ?? 0.98) * g.aperture;

      ctx.strokeStyle = 'rgba(184, 175, 160, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const base = rand() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        const a = base + (i * Math.PI * 2) / Math.max(count, 1);
        const x = g.cx + Math.cos(a) * rad;
        const y = g.cy + Math.sin(a) * rad;
        this.disc(ctx, x, y, dotR, CORE_TINTS.light);
        plate.hits.push({ key: `ring:${ri}:${i}`, part: 'light', ring: ri, x, y, r: dotR });
      }
    });

    // Anything the beam has knocked loose, on its way out of the field.
    specimen.pulled.forEach(p => {
      const r = (p.r0 + p.t * 1.4) * g.aperture;
      ctx.globalAlpha = Math.max(0, 1 - p.t);
      this.disc(ctx, g.cx + Math.cos(p.a) * r, g.cy + Math.sin(p.a) * r, dotR, CORE_TINTS.light);
      ctx.globalAlpha = 1;
    });
  }

  disc(ctx, x, y, r, tint) {
    ctx.fillStyle = tint.fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = tint.rim;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** A mark, stencilled. Not a colour: the instrument scratches what it finds. */
  stencilMark(ctx, x, y, r) {
    const a = r * 0.52;
    ctx.strokeStyle = 'rgba(16, 15, 13, 0.85)';
    ctx.lineWidth = Math.max(1.2, r * 0.22);
    ctx.beginPath();
    ctx.moveTo(x - a, y);
    ctx.lineTo(x + a, y);
    ctx.moveTo(x, y - a);
    ctx.lineTo(x, y + a);
    ctx.stroke();
  }

  drawBeam(ctx, plate, g) {
    const { tracks, t } = plate.beam;
    tracks.forEach(tr => {
      const head = Math.min(1, Math.max(0, (t - tr.delay) / 0.55));
      if (head <= 0) return;
      ctx.lineWidth = tr.kind === 'back' ? 2.5 : tr.kind === 'wide' ? 2.0 : 1.5;
      ctx.strokeStyle = tr.kind === 'back' ? AMBER : tr.kind === 'wide' ? '#8fa85b' : 'rgba(126, 168, 70, 0.85)';
      ctx.globalAlpha = tr.kind === 'back' ? 1.0 : tr.kind === 'wide' ? 0.9 : 0.75;
      ctx.beginPath();
      const pts = tr.path;
      ctx.moveTo(g.cx + pts[0][0] * g.aperture, g.cy + pts[0][1] * g.aperture);
      const span = head * (pts.length - 1);
      for (let i = 1; i <= Math.ceil(span); i++) {
        const p = pts[Math.min(i, pts.length - 1)];
        const prev = pts[i - 1];
        const f = Math.min(1, span - (i - 1));
        ctx.lineTo(
          g.cx + (prev[0] + (p[0] - prev[0]) * f) * g.aperture,
          g.cy + (prev[1] + (p[1] - prev[1]) * f) * g.aperture
        );
      }
      ctx.stroke();

      if (tr.kind === 'back' && head > 0.25) {
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        ctx.arc(g.cx + pts[1][0] * g.aperture, g.cy + pts[1][1] * g.aperture, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  /* ---------------- tools ---------------- */

  /**
   * Fire a stream through the specimen and report what came back. The counts are
   * fixed by the instrument, not by the quest: this is a measurement, and a
   * measurement that could be authored to say anything would be worthless.
   *
   * @returns {Promise<{shots: number, through: number, wide: number, back: number}>}
   */
  fireBeam(specimenId) {
    const plate = this.plates.find(p => p.specimen.id === specimenId);
    if (!plate) return Promise.resolve({ shots: 0, through: 0, wide: 0, back: 0 });

    const { tracks, wide, back, shots: SHOTS } = planBeam(specimenId);

    plate.beam = { tracks, t: 0 };
    this.startAnim();

    return new Promise(resolve => {
      const done = () => {
        setTimeout(() => {
          plate.beam = null;
          this.drawAll();
          resolve({ shots: SHOTS, through: SHOTS - wide - back, wide, back });
        }, 420);
      };
      plate.beamDone = done;
    });
  }

  /**
   * Pull one light piece off the outermost ring that has one. Returns the ring
   * it came from, or null when there was nothing left to take.
   */
  strip(specimenId) {
    const sp = this.specimens.find(s => s.id === specimenId);
    if (!sp) return Promise.resolve(null);

    const ri = planStrip(sp);
    if (ri === null) return Promise.resolve(null);
    this.drawAll();
    this.startAnim();

    return new Promise(resolve => setTimeout(() => resolve(ri), 520));
  }

  /** Put a specimen back the way it was found. */
  reset(specimenId) {
    const sp = this.specimens.find(s => s.id === specimenId);
    if (!sp) return;
    sp.rings = sp.baseRings.slice();
    sp.pulled = [];
    this.drawAll();
  }

  /* ---------------- animation ---------------- */

  startAnim() {
    if (this.raf || this.disposed) return;
    let last = performance.now();
    const step = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let live = false;

      if (this.sweep > 0) { this.sweep = Math.max(0, this.sweep - dt * 1.6); live = this.sweep > 0; }

      this.plates.forEach(pl => {
        if (!pl.beam) return;
        pl.beam.t += dt * 0.85;
        if (pl.beam.t >= 1.35) {
          const done = pl.beamDone;
          pl.beamDone = null;
          pl.beam.t = 1.35;
          if (done) done();
        } else live = true;
      });

      this.specimens.forEach(sp => {
        if (!sp.pulled.length) return;
        sp.pulled.forEach(p => { p.t += dt * 1.9; });
        sp.pulled = sp.pulled.filter(p => p.t < 1);
        live = true;
      });

      this.drawAll();
      this.raf = live ? requestAnimationFrame(step) : null;
    };
    this.raf = requestAnimationFrame(step);
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    this.host.innerHTML = '';
    this.plates = [];
  }
}
