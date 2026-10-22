/**
 * plates.js — The plate bench: the drawn base the light bench, the cloud plate
 * and the box rack's flat views are all built on.
 *
 * Every Learn instrument that shows its answer as a picture on a plate has the
 * same shape: a row of plates, each a canvas with a label above it and a note
 * under it; a tap on a plate reads something off it; a tool animates it; the
 * quest sets a plate's tag and selects one. That shape was written out by hand
 * for the scope, the core bench, the join bench and the assay floor. This is
 * the version a new instrument can subclass instead.
 *
 * A subclass supplies four things and inherits the rest:
 *   - `prepare(item)`            the state a plate carries beyond its declaration
 *   - `draw(ctx, w, h, item, extra)`  paint one plate, return its hit list
 *   - `press(item, hit)`         what a tap on a hit means (a probe report, or null)
 *   - `apertureClass(item)`      the aspect the plate's frame takes (see learn.css)
 *
 * It owns no chemistry. The picture comes from a pure planner over the plate's
 * declaration, which is the rule the 3D bench is held to as well: the two draw
 * through the SAME `draw`, so a hint naming a position is true on both.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms. Hues never carry the answer on their own.
 */

export const PLATE_COLORS = {
  bg: '#0d0c0a',
  rim: '#2e2a26',
  steel: '#6b625a',
  dust: '#b8afa0',
  dim: '#544e46',
  phosphor: '#6f8f3f',
  amber: '#d99423',
  text: '#dcd6cc'
};

export function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Deterministic noise, so a picture is the same picture every time. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from an id. */
export function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Text in the instrument's mono face, sized to the plate. */
export function plateText(ctx, text, x, y, o = {}) {
  let size = o.size || 12;
  ctx.font = `${o.weight || 500} ${size}px "JetBrains Mono", "Quantico", monospace`;
  // A word that must stand in a given width (`maxW`, pixels) is set smaller until it fits: never cut, never past the edge.
  if (o.maxW && ctx.measureText) {
    const w = ctx.measureText(String(text)).width;
    if (w > o.maxW && w > 0) {
      size = Math.max(6, Math.floor(size * o.maxW / w));
      ctx.font = `${o.weight || 500} ${size}px "JetBrains Mono", "Quantico", monospace`;
    }
  }
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillStyle = o.color || PLATE_COLORS.dust;
  ctx.fillText(text, x, y);
}

/**
 * The stencilled `!` lamp: a small amber-edged square with a bar and a dot, printed on a
 * tray or a piece that holds more than it should. A mark, never a glow.
 */
export function lampMark(ctx, x, y, size) {
  const h = size / 2;
  ctx.fillStyle = PLATE_COLORS.bg;
  ctx.fillRect(x - h, y - h, size, size);
  ctx.strokeStyle = PLATE_COLORS.amber;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x - h) + 0.5, Math.round(y - h) + 0.5, size - 1, size - 1);
  ctx.fillStyle = PLATE_COLORS.amber;
  ctx.fillRect(x - size * 0.07, y - size * 0.32, size * 0.14, size * 0.4);
  ctx.fillRect(x - size * 0.07, y + size * 0.16, size * 0.14, size * 0.14);
}

/** Raster lines and a read sweep: this is a cathode instrument, not a window. */
export function raster(ctx, w, h, sweep = 0, top = 0, bottom = h) {
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;
  if (sweep > 0) {
    const y = top + (1 - sweep) * (bottom - top);
    ctx.globalAlpha = 0.5 * sweep;
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.fillRect(0, y, w, 2);
    ctx.globalAlpha = 1;
  }
}

/** The frame round a screen. */
export function aperture(ctx, w, h) {
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

/** A hit against a list of `{key, x, y, r}` discs or `{key, x0, y0, x1, y1}` boxes. */
export function hitTest(hits, px, py) {
  let best = null;
  for (const hit of hits || []) {
    if (hit.r !== undefined) {
      const d = Math.hypot(px - hit.x, py - hit.y);
      if (d <= hit.r && (!best || d < best.d)) best = { hit, d };
    } else if (px >= hit.x0 && px <= hit.x1 && py >= hit.y0 && py <= hit.y1) {
      const d = Math.hypot(px - (hit.x0 + hit.x1) / 2, py - (hit.y0 + hit.y1) / 2);
      if (!best || d < best.d) best = { hit, d };
    }
  }
  return best ? best.hit : null;
}

export class PlateBench {
  /**
   * @param {HTMLElement} host element the plates are rendered into
   * @param {{onProbe?: Function, onSelect?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.plates = [];
    this.items = [];
    this.selectable = false;
    this.selected = null;
    this.probe = null;      // { plateId, ... } the plate last read
    this.sweep = 0;
    this.raf = null;
    this.disposed = false;
    this.animating = new Set();

    this.onResize = () => this.layoutAll();
    window.addEventListener('resize', this.onResize);
    globalThis.__LQ_TEST__?.bench?.(this);
  }

  /* ---------------- the subclass's part ---------------- */

  /** State a plate carries beyond its declaration. */
  prepare(item) { return { ...item }; }

  /** CSS class for the plate's aperture; the aspect it is drawn at. */
  apertureClass() { return 'light-aperture'; }

  /** Paint one plate and return its hit list. */
  draw() { return []; }

  /** A tap that landed on `hit` (or null, on empty plate). Return a probe report or nothing. */
  press() { return null; }

  /** Per-frame hook. Return true while something is still moving. */
  tick() { return false; }

  /* ---------------- contents ---------------- */

  setPlates(items) {
    this.items = (items || []).map(it => this.prepare(it));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  itemFor(id) { return this.items.find(it => it.id === id) || null; }

  setSelectable(on) {
    this.selectable = Boolean(on);
    this.plates.forEach(pl => pl.root.classList.toggle('selectable', this.selectable));
  }

  setSelected(id) {
    this.selected = id;
    this.plates.forEach(pl => pl.root.classList.toggle('selected', pl.item.id === id));
  }

  setPlateTag(id, text) {
    const pl = this.plates.find(p => p.item.id === id);
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
    grid.className = `scope-grid ${this.gridClass()} scope-n${Math.min(this.items.length, 4)}`;
    this.host.appendChild(grid);

    this.items.forEach(item => {
      const root = document.createElement('div');
      root.className = 'scope-plate';
      root.innerHTML = `
        <div class="scope-plate-head">
          <span class="scope-plate-label">${escText(item.label)}</span>
          <span class="scope-plate-tag"></span>
        </div>
        <div class="scope-aperture ${this.apertureClass(item)}"><canvas></canvas></div>
        <div class="scope-plate-note">${escText(item.note || '')}</div>
      `;
      grid.appendChild(root);

      const canvas = root.querySelector('canvas');
      const plate = {
        item, root, canvas,
        ctx: canvas.getContext('2d'),
        tagEl: root.querySelector('.scope-plate-tag'),
        hits: [],
        w: 0, h: 0
      };
      this.plates.push(plate);

      // A press on a hit is not also a press on the plate (see JoinBench).
      root.addEventListener('pointerdown', () => { plate.taken = false; }, true);
      canvas.addEventListener('pointerdown', e => this.onPointer(plate, e));
      root.addEventListener('click', () => {
        if (plate.taken) { plate.taken = false; return; }
        if (this.selectable && this.onSelect) this.onSelect(item.id);
      });
    });

    this.layoutAll();
  }

  /** Extra class on the grid; a subclass narrows its columns with it. */
  gridClass() { return ''; }

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
    this.pressAt(plate.item, e.clientX - rect.left, e.clientY - rect.top, plate.hits, plate);
  }

  /**
   * One tap on a plate's picture, in the picture's own pixels. Shared with the
   * built bench, which resolves a ray onto its screen and calls this.
   */
  pressAt(item, px, py, hits, plate = null) {
    const hit = hitTest(hits, px, py);
    const report = this.press(item, hit, px, py);
    if (!report || !this.onProbe) return false;
    if (plate) plate.taken = true;
    this.probe = { plateId: item.id, ...report.mark };
    this.sweep = 1;
    this.startAnim();
    this.onProbe({ plateId: item.id, plateLabel: item.label, ...report.read });
    return true;
  }

  /* ---------------- drawing ---------------- */

  drawAll() { this.plates.forEach(pl => this.drawPlate(pl)); }

  drawPlate(plate) {
    const { ctx, w, h, item } = plate;
    if (!w || !h) return;
    const sweep = this.probe && this.probe.plateId === item.id ? this.sweep : 0;
    plate.hits = this.draw(ctx, w, h, item, { sweep, probe: this.probe, bench: this }) || [];
  }

  /* ---------------- the clock ---------------- */

  startAnim() {
    if (this.raf || this.disposed) return;
    let last = performance.now();
    const step = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let live = false;
      if (this.sweep > 0) { this.sweep = Math.max(0, this.sweep - dt * 1.6); live = this.sweep > 0; }
      if (this.tick(dt, now)) live = true;
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
    if (this.host) this.host.innerHTML = '';
    this.plates = [];
  }
}
