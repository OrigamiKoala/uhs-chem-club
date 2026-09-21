/**
 * assay.js — The assay floor: the fourth Learn instrument, drawn on canvas.
 *
 * A hopper of loose salvage is tipped into a chute, falls past a deflector and
 * lands in a row of open bins. The deflector turns a light piece aside further
 * than a heavy one, so by the time the pour is finished the heap has sorted
 * itself along the floor by weight, and every bin carries a tally of what
 * ended up in it.
 *
 * It is an INSTRUMENT, not a lesson. It knows how to tip a hopper, how to sort
 * what comes out of it by weight and how to count what lands. It knows no
 * chemistry: what those weights mean, what the catalogue says a kind ought to
 * weigh and whether an answer is right are the quest's business.
 *
 * IT NEVER INVENTS A READING (PRODUCT.md §8). A hopper is declared with what is
 * actually in it and the floor reports exactly that — the tally under a bin is
 * the number of pieces drawn in it, every time, and `planPour` is pure so the
 * same hopper sorts the same way on every run. A pour that quietly rounded, or
 * drew forty pieces for a bin holding sixty, would be the instrument lying about
 * the very measurement the stage is built on.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): a phosphor aperture on a recessed
 * plate, dust-coloured, nothing blooming. Bins are told apart by the weight
 * stencilled under them and never by colour — the pieces really are all the same
 * material, so drawing them in different colours would be a claim the floor has
 * no business making.
 */

/* Dust palette. Mirrors tokens.css; canvas cannot inherit a custom property. */
const PIECE = { fill: '#b8afa0', rim: '#6f685d' };
const FIELD_BG = '#0d0c0a';
const APERTURE_RIM = '#2e2a26';
const PLATE = '#6b625a';
const PHOSPHOR = '#6f8f3f';
const AMBER = '#d99423';
const HAZE = '#8f8678';

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Deterministic noise, so a hopper pours the same way every time it is drawn. */
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
 * Plan one pour.
 *
 * THE COUNTS ARE THE DECLARATION, NOT A SIMULATION. What is in a hopper is a
 * fact about the salvage; the floor's job is to separate it and count it, and a
 * pour whose totals came out of a random draw would give a different answer on
 * every run and make the whole quest unanswerable. What IS randomised is only
 * which order the pieces come down the chute in, which is cosmetic.
 *
 * Pure, so anything that ever draws this floor plans through here and they
 * cannot disagree about what landed where.
 *
 * @param {{id: string, bins: Array<{mass: number, n: number}>}} hopper
 * @returns {{totals: number[], total: number, order: number[]}}
 */
export function planPour(hopper) {
  const bins = hopper.bins || [];
  const totals = bins.map(b => b.n);
  const total = totals.reduce((n, x) => n + x, 0);

  // The order pieces arrive in: every piece of every bin, shuffled so the pour
  // reads as a stream off one heap rather than as one bin filling at a time.
  const order = [];
  bins.forEach((b, bi) => { for (let i = 0; i < b.n; i++) order.push(bi); });
  const rand = mulberry32(hashId(hopper.id) ^ 0x51a7);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return { totals, total, order };
}

/** Where the chute, the deflector and the bins sit inside a w x h field. */
export function assayGeometry(w, h, binCount) {
  const pad = Math.max(6, Math.min(w, h) * 0.04);
  const aperture = Math.min(w, h) / 2 - pad;
  const cx = w / 2;
  const cy = h / 2;

  const left = cx - aperture * 0.92;
  const right = cx + aperture * 0.92;
  const top = cy - aperture * 0.92;
  const floorY = cy + aperture * 0.80;

  const n = Math.max(1, binCount);
  const gap = (right - left) * 0.05;
  const binW = ((right - left) - gap * (n - 1)) / n;

  // THE WEIGHT STENCIL IS PART OF THE PICTURE, SO THE PICTURE HAS TO INCLUDE IT.
  // The band under the bins carries the one thing that tells the bins apart —
  // the pieces really are all the same material, so the number under a bin IS
  // its identity. It used to be drawn below the clip, and at the sizes this
  // instrument actually renders at (an aperture near 190 px, a baseline 21 px
  // down, a clip 12 px down) all a player ever saw was the top sliver of the
  // digits. The band is measured here and every clip, rim and baseline below
  // reads it, so the label can never fall outside the field again.
  const labelBand = Math.max(14, aperture * 0.16);
  const binH = aperture * 0.86;

  return {
    w, h, cx, cy, aperture, left, right, top, floorY, labelBand,
    labelY: floorY + labelBand * 0.72,
    fieldBottom: floorY + labelBand,
    chute: { x: left + (right - left) * 0.12, y: top, w: (right - left) * 0.24, h: aperture * 0.24 },
    deflect: { x: left + (right - left) * 0.12, y: top + aperture * 0.42 },
    bins: Array.from({ length: n }, (_, i) => ({
      i,
      x: left + i * (binW + gap),
      y: floorY - binH,
      w: binW,
      h: binH
    }))
  };
}

function disc(ctx, x, y, r, tint) {
  ctx.fillStyle = tint.fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tint.rim;
  ctx.lineWidth = Math.max(0.6, r * 0.22);
  ctx.stroke();
}

/**
 * How the pieces in one bin are stacked, so the picture can be counted.
 *
 * Every piece that landed is drawn. Nothing is summarised, nothing is capped
 * and nothing stands in for a group, because the tally under the bin and the
 * heap inside it are the same measurement and a player is entitled to check one
 * against the other.
 *
 * PURE, AND THE ONLY IMPLEMENTATION. The built rig on Tallow stacks its real
 * pieces through this same function: it asks for the packing in a unit bin and
 * lays its discs out on that grid in metres. A heap that packed one way on a
 * Chromebook and another way on the bench would be two different counts of the
 * same measurement.
 *
 * @param {number} count how many pieces landed
 * @param {number} wide  the bin's width in whatever unit `tall` is in
 * @param {number} tall  the bin's height
 * @returns {{cells: Array<[number, number]>, r: number, step: number, perRow: number}}
 *   `cells` are offsets from the bottom-centre of the bin, in that same unit.
 */
export function packBin(count, wide, tall) {
  if (count <= 0) return { cells: [], r: 0, step: 0, perRow: 1 };
  const inset = wide * 0.06;
  const area = (wide - inset * 2) * (tall - inset * 3);
  let r = Math.sqrt((area * 0.55) / (Math.PI * count));
  r = Math.max(wide * 0.018, Math.min(r, wide / 8));
  const step = r * 2.15;
  const perRow = Math.max(1, Math.floor((wide - inset * 2) / step));
  const cells = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowCount = Math.min(perRow, count - row * perRow);
    const rowW = (rowCount - 1) * step;
    cells.push([-rowW / 2 + col * step, r + row * step * 0.92]);
  }
  return { cells, r, step, perRow };
}

/** `packBin` placed into one drawn bin's rectangle, in canvas pixels. */
function stackPoints(bin, count) {
  const { cells, r } = packBin(count, bin.w, bin.h);
  return {
    r,
    pts: cells.map(([dx, dy]) => [bin.x + bin.w / 2 + dx, bin.y + bin.h - 4 - dy])
  };
}

/**
 * Draw one hopper's floor into any 2D context and return the hit list.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{w:number, h:number, hopper:object, landed:number[]|null,
 *          flight?: Array<{bin:number, t:number}>, probeBin?: number|null,
 *          sweep?: number, tally?: boolean}} o
 * @returns {Array<{key:string, bin:number, x:number, y:number, r:number}>}
 */
export function drawAssayField(ctx, o) {
  const { w, h, hopper } = o;
  const bins = hopper.bins || [];
  const g = assayGeometry(w, h, bins.length);
  const hits = [];
  const landed = o.landed || bins.map(() => 0);
  const poured = landed.some(n => n > 0);

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(g.left - 4, g.top - 4, (g.right - g.left) + 8, (g.fieldBottom - g.top) + 6);
  ctx.clip();

  ctx.fillStyle = FIELD_BG;
  ctx.fillRect(0, 0, w, h);

  /* ---- the chute, with whatever has not gone down it yet ---- */
  const declared = bins.reduce((n, b) => n + b.n, 0);
  const remaining = bins.reduce((n, b, i) => n + (b.n - landed[i]), 0);
  // A hopper too full to tip: the gate is dogged shut across the chute mouth.
  // The floor says so rather than pretending the chute is open, because the
  // whole point of such a sample is that it CANNOT be counted by tipping it.
  const gated = Boolean(hopper.bulk);
  ctx.strokeStyle = 'rgba(184, 175, 160, 0.30)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.chute.x, g.chute.y);
  ctx.lineTo(g.chute.x, g.chute.y + g.chute.h);
  ctx.moveTo(g.chute.x + g.chute.w, g.chute.y);
  ctx.lineTo(g.chute.x + g.chute.w, g.chute.y + g.chute.h);
  ctx.stroke();

  if (remaining > 0) {
    ctx.fillStyle = HAZE;
    const heapH = Math.min(g.chute.h - 3, 4 + (remaining / Math.max(1, declared)) * g.chute.h);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(g.chute.x + 1.5, g.chute.y + g.chute.h - heapH, g.chute.w - 3, heapH);
    ctx.globalAlpha = 1;
  }

  if (gated) {
    ctx.fillStyle = PLATE;
    ctx.fillRect(g.chute.x - 3, g.chute.y + g.chute.h - 3, g.chute.w + 6, 5);
    ctx.fillStyle = 'rgba(184, 175, 160, 0.45)';
    ctx.font = `${Math.max(7, Math.round(g.aperture * 0.09))}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('GATE SHUT', g.chute.x + g.chute.w + 8, g.chute.y + g.chute.h + 2);
  }

  /* ---- the deflector: one plate the stream falls across ---- */
  ctx.strokeStyle = PLATE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.deflect.x - 4, g.deflect.y);
  ctx.lineTo(g.deflect.x + (g.right - g.left) * 0.16, g.deflect.y + 6);
  ctx.stroke();

  /* ---- the bins ---- */
  bins.forEach((b, i) => {
    const box = g.bins[i];
    ctx.strokeStyle = 'rgba(184, 175, 160, 0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.lineTo(box.x + box.w, box.y + box.h);
    ctx.lineTo(box.x + box.w, box.y);
    ctx.stroke();

    const { pts, r } = stackPoints(box, landed[i] || 0);
    pts.forEach(([x, y]) => disc(ctx, x, y, r, PIECE));

    // Weight stencil under the bin. This is the bin's identity: the pieces
    // themselves are the same material and are drawn the same.
    ctx.fillStyle = poured ? AMBER : 'rgba(184, 175, 160, 0.45)';
    ctx.font = `${Math.max(9, Math.round(g.labelBand * 0.62))}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${b.mass}`, box.x + box.w / 2, g.labelY);
    ctx.textBaseline = 'alphabetic';

    if (o.tally && poured) {
      ctx.fillStyle = PHOSPHOR;
      ctx.fillText(`${landed[i]}`, box.x + box.w / 2, box.y - 4);
    }

    hits.push({ key: `bin:${i}`, bin: i, x: box.x + box.w / 2, y: box.y + box.h / 2, r: Math.min(box.w, box.h) / 2 });

    if (o.probeBin === i) {
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x - 3, box.y - 3, box.w + 6, box.h + 6);
    }
  });

  /* ---- pieces in flight ---- */
  for (const f of o.flight || []) {
    const box = g.bins[f.bin];
    if (!box) continue;
    const x0 = g.chute.x + g.chute.w / 2;
    const y0 = g.chute.y + g.chute.h;
    const x1 = box.x + box.w / 2;
    const y1 = box.y + box.h * 0.5;
    const t = Math.max(0, Math.min(1, f.t));
    // Falls, meets the plate, then runs out along its own track.
    const bend = Math.min(1, t / 0.45);
    const x = x0 + (x1 - x0) * (t * t);
    const y = y0 + (g.deflect.y - y0) * bend + (y1 - g.deflect.y) * Math.max(0, (t - 0.45) / 0.55);
    disc(ctx, x, y, Math.max(1.6, g.aperture * 0.022), PIECE);
  }

  /* Raster lines: this is a cathode instrument, not a window. */
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;

  if (o.sweep > 0) {
    const y = g.top + (1 - o.sweep) * (g.floorY - g.top);
    ctx.globalAlpha = 0.5 * o.sweep;
    ctx.fillStyle = PHOSPHOR;
    ctx.fillRect(0, y, w, 2);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  ctx.strokeStyle = APERTURE_RIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(g.left - 4, g.top - 4, (g.right - g.left) + 8, (g.fieldBottom - g.top) + 6);

  return hits;
}

/** Which bin a press at (px, py) landed in, or null. */
export function hitTestAssay(hits, px, py) {
  for (const hit of hits || []) {
    if (Math.abs(hit.x - px) <= hit.r * 1.1 && Math.abs(hit.y - py) <= hit.r * 1.6) return hit;
  }
  return null;
}

export class AssayFloor {
  /**
   * @param {HTMLElement} host element the plates are rendered into
   * @param {{onProbe?: Function, onSelect?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.hoppers = [];
    this.plates = [];
    this.selectable = false;
    this.selected = null;
    this.probe = null;      // {hopperId, bin}
    this.sweep = 0;
    this.raf = null;
    this.disposed = false;

    this.onResize = () => this.layoutAll();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- contents ---------------- */

  /**
   * @param {Array<{
   *   id: string, label: string, note?: string,
   *   bins: Array<{mass: number, n: number}>
   * }>} hoppers
   */
  setHoppers(hoppers) {
    this.plates.forEach(pl => { if (pl.pourDone) { const d = pl.pourDone; pl.pourDone = null; d(); } });
    this.hoppers = (hoppers || []).map(hp => ({
      ...hp,
      bins: (hp.bins || []).map(b => ({ ...b })),
      landed: (hp.bins || []).map(() => 0),
      tally: false,
      flight: []
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  /** True once this hopper has been tipped. */
  poured(id) {
    const hp = this.hoppers.find(h => h.id === id);
    return Boolean(hp && hp.landed.some(n => n > 0));
  }

  /** What landed in each bin, as the floor counted it. */
  totalsOf(id) {
    const hp = this.hoppers.find(h => h.id === id);
    return hp ? hp.landed.slice() : [];
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
    this.plates.forEach(pl => pl.root.classList.toggle('selectable', this.selectable));
  }

  setSelected(id) {
    this.selected = id;
    this.plates.forEach(pl => pl.root.classList.toggle('selected', pl.hopper.id === id));
  }

  setPlateTag(id, text) {
    const pl = this.plates.find(p => p.hopper.id === id);
    if (pl && pl.tagEl) {
      pl.tagEl.textContent = text || '';
      pl.tagEl.classList.toggle('lit', Boolean(text));
    }
  }

  /* ---------------- DOM ---------------- */

  build() {
    this.host.innerHTML = '';
    this.plates = [];

    const grid = document.createElement('div');
    grid.className = `scope-grid scope-n${Math.min(this.hoppers.length, 4)}`;
    this.host.appendChild(grid);

    this.hoppers.forEach(hopper => {
      const root = document.createElement('div');
      root.className = 'scope-plate';
      root.innerHTML = `
        <div class="scope-plate-head">
          <span class="scope-plate-label">${escText(hopper.label)}</span>
          <span class="scope-plate-tag"></span>
        </div>
        <div class="scope-aperture assay-aperture"><canvas></canvas></div>
        <div class="scope-plate-note">${escText(hopper.note || '')}</div>
      `;
      grid.appendChild(root);

      const canvas = root.querySelector('canvas');
      const plate = {
        hopper,
        root,
        canvas,
        ctx: canvas.getContext('2d'),
        tagEl: root.querySelector('.scope-plate-tag'),
        hits: [],
        w: 0, h: 0
      };
      this.plates.push(plate);

      // Cleared at the START of every press (capture runs outside-in, so this
      // fires before the canvas handler below), then set by a probe that hits.
      root.addEventListener('pointerdown', () => { plate.pieceTaken = false; }, true);
      canvas.addEventListener('pointerdown', e => this.onPointer(plate, e));
      root.addEventListener('click', () => {
        /* A PRESS ON WHAT IS IN THE APERTURE IS NOT A PRESS ON THE PLATE.
           `pointerdown` on the canvas runs first and reports what was hit; the
           same press then bubbles here as a `click` on the plate and selects the
           plate, wiping any finer selection the probe just made. A press that
           resolved to something inside the picture is spent. */
        if (plate.pieceTaken) { plate.pieceTaken = false; return; }
        if (this.selectable && this.onSelect) this.onSelect(hopper.id);
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

  /* ---------------- input ---------------- */

  onPointer(plate, e) {
    const rect = plate.canvas.getBoundingClientRect();
    const hit = hitTestAssay(plate.hits, e.clientX - rect.left, e.clientY - rect.top);
    if (!hit || !this.onProbe) return;

    // Claim the click this press is about to become.
    plate.pieceTaken = true;

    this.probe = { hopperId: plate.hopper.id, bin: hit.bin };
    this.sweep = 1;
    this.startAnim();
    this.onProbe({
      hopperId: plate.hopper.id,
      hopperLabel: plate.hopper.label,
      bin: hit.bin,
      mass: plate.hopper.bins[hit.bin]?.mass ?? null,
      count: plate.hopper.landed[hit.bin] || 0,
      poured: this.poured(plate.hopper.id)
    });
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    this.plates.forEach(pl => this.draw(pl));
  }

  draw(plate) {
    const { ctx, w, h, hopper } = plate;
    if (!w || !h) return;
    plate.hits = drawAssayField(ctx, {
      w, h, hopper,
      landed: hopper.landed,
      flight: hopper.flight,
      tally: hopper.tally,
      probeBin: this.probe && this.probe.hopperId === hopper.id ? this.probe.bin : null,
      sweep: this.probe && this.probe.hopperId === hopper.id ? this.sweep : 0
    });
  }

  /* ---------------- tools ---------------- */

  /**
   * Tip a hopper over the deflector and count what lands.
   *
   * @returns {Promise<{totals: number[], total: number}>}
   */
  pour(id) {
    const hp = this.hoppers.find(h => h.id === id);
    if (!hp) return Promise.resolve({ totals: [], total: 0 });
    // A bulk hopper never goes down the chute. Tipping it and reporting a tally
    // would be the floor claiming a count nobody made, which is the one thing
    // this instrument is not allowed to do.
    if (hp.bulk) return Promise.resolve({ refused: true, totals: hp.bins.map(() => 0), total: 0 });
    if (this.poured(id)) {
      return Promise.resolve({ totals: hp.landed.slice(), total: hp.landed.reduce((n, x) => n + x, 0) });
    }

    const { order, totals, total } = planPour(hp);
    hp.landed = hp.bins.map(() => 0);
    hp.flight = [];
    hp.queue = order.slice();
    hp.tally = true;
    this.startAnim();

    return new Promise(resolve => {
      hp.pourDone = () => setTimeout(() => {
        hp.landed = totals.slice();
        hp.flight = [];
        this.drawAll();
        resolve({ totals: totals.slice(), total });
      }, 240);
    });
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

      this.hoppers.forEach(hp => {
        if (!hp.queue && !hp.flight.length) return;

        // Release pieces down the chute. The whole pour takes about a second
        // and a half however big the hopper is, so a big heap simply streams
        // faster — nobody should wait on an animation to get a count.
        if (hp.queue && hp.queue.length) {
          const rate = Math.max(6, Math.ceil(hp.queue.length / 1.2));
          const send = Math.min(hp.queue.length, Math.ceil(rate * dt));
          for (let i = 0; i < send; i++) hp.flight.push({ bin: hp.queue.shift(), t: 0 });
          live = true;
        }

        hp.flight.forEach(f => { f.t += dt * 2.6; });
        const arrived = hp.flight.filter(f => f.t >= 1);
        arrived.forEach(f => { hp.landed[f.bin] = (hp.landed[f.bin] || 0) + 1; });
        hp.flight = hp.flight.filter(f => f.t < 1);

        if (hp.flight.length) live = true;
        else if (hp.queue && !hp.queue.length) {
          hp.queue = null;
          const done = hp.pourDone;
          hp.pourDone = null;
          if (done) done();
        }
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
