/**
 * scope.js — The sampler scope: a salvaged bench instrument, drawn on canvas.
 *
 * This is an INSTRUMENT, not a lesson. It knows how to show a sample of matter at
 * a chosen magnification, how to read one piece out loud, and how to shake a crate
 * down or run a cutter over it. It knows nothing about chemistry: the kinds of
 * piece, what they weigh and what any of it means are handed in by the quest.
 *
 * Why canvas and not the 3D chamber: the whole point of this instrument is the
 * walk down through scales — a solid lump becoming grit becoming separate pieces.
 * That is a 2D reveal, it runs identically on every graphics tier, and it holds up
 * at 375 px. The containment chamber in `src/quest3d/` stays where it belongs.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): the field is a phosphor aperture on a
 * recessed plate. Pieces are dust-coloured — bone, sand, iron, rust — never a
 * rainbow, and nothing blooms. The reserved charge hues do not appear here.
 */

/* Dust palette. Mirrors tokens.css; canvas cannot inherit a custom property. */
export const TINTS = {
  bone: { fill: '#b8afa0', rim: '#6f685d' },
  sand: { fill: '#c39a63', rim: '#7a6039' },
  iron: { fill: '#6b625a', rim: '#3b3631' },
  rust: { fill: '#9c5423', rim: '#5c3116' },
  pale: { fill: '#8f8678', rim: '#544e46' }
};

const FIELD_BG = '#0d0c0a';
const APERTURE_RIM = '#2e2a26';
const PHOSPHOR = '#6f8f3f';
const AMBER = '#d99423';

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Deterministic noise so a sample looks the same every time it is drawn. */
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

/** Satellite angles around a group's centre piece. Two satellites sit bent. */
function satelliteAngles(n) {
  if (n === 1) return [Math.PI / 2];
  if (n === 2) return [Math.PI / 2 - 0.92, Math.PI / 2 + 0.92];
  const out = [];
  for (let i = 0; i < n; i++) out.push(-Math.PI / 2 + (i * 2 * Math.PI) / n);
  return out;
}

/**
 * Expand a sample's declared contents into placed units.
 *
 * A "unit" is one thing that moves as one: a loose piece (one member) or a locked
 * group (several). The sample declares `particles: [{ kinds: [...], n }]`, where a
 * one-entry `kinds` is a loose piece and a longer one is a group whose FIRST entry
 * is the centre.
 */
function buildUnits(sample, kinds) {
  const rand = mulberry32(hashId(sample.id));
  const entries = sample.particles || [];
  const total = entries.reduce((n, e) => n + e.n, 0);

  // A jittered grid across the aperture disc, shuffled so materials interleave
  // instead of arriving in blocks.
  const cells = [];
  const across = Math.max(3, Math.ceil(Math.sqrt(total / 0.72)));
  for (let gy = 0; gy < across; gy++) {
    for (let gx = 0; gx < across; gx++) {
      const x = ((gx + 0.5) / across) * 2 - 1;
      const y = ((gy + 0.5) / across) * 2 - 1;
      if (x * x + y * y > 0.92) continue;
      cells.push([
        x + (rand() - 0.5) * (1.1 / across),
        y + (rand() - 0.5) * (1.1 / across)
      ]);
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const units = [];
  let c = 0;
  entries.forEach((entry, ei) => {
    for (let i = 0; i < entry.n && c < cells.length; i++, c++) {
      const [cx, cy] = cells[c];
      const members = entry.kinds.map(kindId => ({
        kindId,
        size: kinds[kindId]?.size ?? 0.5,
        // Local offsets in piece-radius units; filled in below.
        ox: 0, oy: 0
      }));

      if (entry.geom) {
        // The entry draws its own shape. Chains and bent backbones need this:
        // a star of satellites around one centre would misstate what is joined
        // to what, and this instrument does not lie about the salvage.
        entry.geom.forEach(([ox, oy], mi) => {
          if (!members[mi]) return;
          members[mi].ox = ox;
          members[mi].oy = oy;
        });
      } else {
        const angles = satelliteAngles(Math.max(members.length - 1, 1));
        for (let mi = 1; mi < members.length; mi++) {
          const d = (members[0].size + members[mi].size) * 0.92;
          const a = angles[mi - 1] + (rand() - 0.5) * 0.12;
          members[mi].ox = Math.cos(a) * d;
          members[mi].oy = Math.sin(a) * d;
        }
      }

      units.push({
        // Which member is joined to which. Defaults to every satellite holding
        // the centre, which is what a plain `kinds` list means.
        bonds: entry.bonds
          ? entry.bonds.map(b => b.slice())
          : members.slice(1).map((_, i) => [0, i + 1]),
        x: cx, y: cy,
        // Where settle/cut animations are pulling it, and how far along it is.
        tx: cx, ty: cy,
        spin: (rand() - 0.5) * Math.PI,
        signature: entry.kinds.join('+'),
        entryIndex: ei,
        members
      });
    }
  });
  return units;
}

/** How much structure the scope resolves: 0 solid, 1 mottled, 2 lumps, 3 pieces. */
export function detailFor(power, floorPower) {
  return Math.max(0, Math.min(3, power - (floorPower - 3)));
}

export class SampleScope {
  /**
   * @param {HTMLElement} host element the plates are rendered into
   * @param {{kinds: object, onProbe?: Function, onSelect?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.kinds = opts.kinds || {};
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.samples = [];
    this.plates = [];
    this.power = 1;
    this.selectable = false;
    this.selected = null;
    this.probe = null;          // {sampleId, unitIndex, memberIndex}
    this.sweep = 0;             // 0..1 beam sweep after a read
    this.raf = null;
    this.disposed = false;

    this.onResize = () => this.layoutAll();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- samples & state ---------------- */

  setSamples(samples) {
    this.samples = samples.map(s => ({
      ...s,
      floorPower: s.floorPower ?? 4,
      units: buildUnits(s, this.kinds)
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  setPower(p) {
    this.power = p;
    this.probe = null;
    this.drawAll();
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
    this.plates.forEach(pl => pl.root.classList.toggle('selectable', this.selectable));
  }

  setSelected(id) {
    this.selected = id;
    this.plates.forEach(pl => pl.root.classList.toggle('selected', pl.sample.id === id));
  }

  /** Mark a plate with a status class the stage cares about (e.g. a sorted bin). */
  setPlateTag(id, text) {
    const pl = this.plates.find(p => p.sample.id === id);
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
    grid.className = `scope-grid scope-n${Math.min(this.samples.length, 4)}`;
    this.host.appendChild(grid);

    this.samples.forEach(sample => {
      const root = document.createElement('div');
      root.className = 'scope-plate';
      root.innerHTML = `
        <div class="scope-plate-head">
          <span class="scope-plate-label">${escText(sample.label)}</span>
          <span class="scope-plate-tag"></span>
        </div>
        <div class="scope-aperture"><canvas></canvas></div>
        <div class="scope-plate-note">${escText(sample.note || '')}</div>
      `;
      grid.appendChild(root);

      const canvas = root.querySelector('canvas');
      const plate = {
        sample,
        root,
        canvas,
        ctx: canvas.getContext('2d'),
        tagEl: root.querySelector('.scope-plate-tag'),
        w: 0, h: 0
      };
      this.plates.push(plate);

      canvas.addEventListener('pointerdown', e => this.onPointer(plate, e));
      root.addEventListener('click', () => {
        if (this.selectable && this.onSelect) this.onSelect(sample.id);
      });
    });

    this.layoutAll();
  }

  layoutAll() {
    if (this.disposed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.plates.forEach(pl => {
      const box = pl.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(80, Math.round(box.width));
      const h = Math.max(80, Math.round(box.height));
      pl.w = w; pl.h = h;
      pl.canvas.width = Math.round(w * dpr);
      pl.canvas.height = Math.round(h * dpr);
      pl.canvas.style.width = `${w}px`;
      pl.canvas.style.height = `${h}px`;
      pl.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    this.drawAll();
  }

  /* ---------------- interaction ---------------- */

  onPointer(plate, e) {
    const detail = detailFor(this.power, plate.sample.floorPower);
    if (detail < 3) {
      // Nothing is resolved yet — the tap still counts as choosing this plate.
      if (this.selectable && this.onSelect) this.onSelect(plate.sample.id);
      return;
    }

    const rect = plate.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hit = this.hitTest(plate, px, py);

    if (hit) {
      e.stopPropagation();
      this.probe = { sampleId: plate.sample.id, ...hit };
      this.sweep = 1;
      this.startAnim();
      if (this.onProbe) {
        const unit = plate.sample.units[hit.unitIndex];
        this.onProbe({
          sampleId: plate.sample.id,
          sampleLabel: plate.sample.label,
          kindId: unit.members[hit.memberIndex].kindId,
          neighbours: unit.bonds.filter(b => b.includes(hit.memberIndex)).length,
          groupSize: unit.members.length
        });
      }
    }
    if (this.selectable && this.onSelect) this.onSelect(plate.sample.id);
  }

  hitTest(plate, px, py) {
    const g = this.geometry(plate);
    let best = null;
    let bestD = Infinity;
    plate.sample.units.forEach((unit, ui) => {
      unit.members.forEach((m, mi) => {
        const { x, y, r } = this.memberScreen(g, unit, m);
        const d = Math.hypot(px - x, py - y);
        // A generous touch radius: fingers are not styluses.
        if (d < Math.max(r + 6, 14) && d < bestD) {
          bestD = d;
          best = { unitIndex: ui, memberIndex: mi };
        }
      });
    });
    return best;
  }

  /* ---------------- geometry ---------------- */

  geometry(plate) {
    const cx = plate.w / 2;
    const cy = plate.h / 2;
    const aperture = Math.min(plate.w, plate.h) / 2 - 4;
    // Higher power magnifies: the same pieces, drawn larger, with the edge of the
    // field falling outside the aperture.
    const zoom = (1 + 0.34 * (this.power - 1)) * (plate.sample.magnify || 1);
    const spread = aperture * 0.94 * zoom;
    const pieceR = aperture * 0.085 * zoom;
    return { cx, cy, aperture, spread, pieceR };
  }

  memberScreen(g, unit, m) {
    const r = g.pieceR * m.size * 2;
    const cos = Math.cos(unit.spin);
    const sin = Math.sin(unit.spin);
    const ox = m.ox * cos - m.oy * sin;
    const oy = m.ox * sin + m.oy * cos;
    return {
      x: g.cx + unit.x * g.spread + ox * g.pieceR * 2,
      y: g.cy + unit.y * g.spread + oy * g.pieceR * 2,
      r
    };
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    this.plates.forEach(pl => this.draw(pl));
  }

  draw(plate) {
    const { ctx, w, h, sample } = plate;
    if (!w || !h) return;
    const g = this.geometry(plate);
    const detail = detailFor(this.power, sample.floorPower);

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.aperture, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = FIELD_BG;
    ctx.fillRect(0, 0, w, h);

    if (detail === 0) this.drawSolid(ctx, g, sample, 1);
    else if (detail === 1) this.drawSolid(ctx, g, sample, 7);
    else if (detail === 2) this.drawLumps(ctx, g, sample);
    else this.drawPieces(ctx, plate, g);

    // Raster lines: this is a cathode instrument, not a window.
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;

    if (this.sweep > 0 && this.probe && this.probe.sampleId === sample.id) {
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

  /** Detail 0 and 1: the sample as a solid, then as something merely mottled. */
  drawSolid(ctx, g, sample, blobs) {
    const rand = mulberry32(hashId(sample.id) ^ 0x9e37);
    const tints = sample.units.map(u => this.kinds[u.members[0].kindId]?.tint || 'pale');
    const base = TINTS[tints[0] || 'pale'];
    ctx.fillStyle = base.fill;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.aperture, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let i = 0; i < blobs * 26; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * g.aperture;
      const size = (g.aperture / (blobs + 1)) * (0.5 + rand() * 0.9);
      ctx.globalAlpha = 0.16 + rand() * 0.16;
      ctx.fillStyle = rand() > 0.5 ? base.rim : base.fill;
      ctx.beginPath();
      ctx.arc(g.cx + Math.cos(a) * rr, g.cy + Math.sin(a) * rr, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Detail 2: the units are there but merged — grit, not pieces. */
  drawLumps(ctx, g, sample) {
    sample.units.forEach(unit => {
      const tint = TINTS[this.kinds[unit.members[0].kindId]?.tint || 'pale'];
      const x = g.cx + unit.x * g.spread;
      const y = g.cy + unit.y * g.spread;
      const r = g.pieceR * 1.9;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = tint.fill;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = tint.rim;
      ctx.beginPath();
      ctx.arc(x + r * 0.2, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /** Detail 3: individual pieces, and the sticks that hold groups together. */
  drawPieces(ctx, plate, g) {
    const sample = plate.sample;
    const probed = this.probe && this.probe.sampleId === sample.id ? this.probe : null;

    // Joins first, so a stick reads as being behind the pieces it holds.
    ctx.strokeStyle = '#4a443d';
    ctx.lineCap = 'round';
    sample.units.forEach(unit => {
      if (unit.members.length < 2) return;
      ctx.lineWidth = Math.max(2, g.pieceR * 0.42);
      unit.bonds.forEach(([a, b]) => {
        const pa = this.memberScreen(g, unit, unit.members[a]);
        const pb = this.memberScreen(g, unit, unit.members[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
    });

    sample.units.forEach((unit, ui) => {
      // Big pieces first so small ones are never swallowed.
      const order = unit.members
        .map((m, mi) => mi)
        .sort((a, b) => unit.members[b].size - unit.members[a].size);
      order.forEach(mi => {
        const m = unit.members[mi];
        const { x, y, r } = this.memberScreen(g, unit, m);
        const tint = TINTS[this.kinds[m.kindId]?.tint || 'pale'];

        ctx.fillStyle = tint.fill;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // A machined shoulder, not a specular highlight.
        ctx.strokeStyle = tint.rim;
        ctx.lineWidth = Math.max(1, r * 0.18);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.92, 0.5, 3.1);
        ctx.stroke();

        if (probed && probed.unitIndex === ui && probed.memberIndex === mi) {
          ctx.strokeStyle = AMBER;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    });
  }

  /* ---------------- bench actions ---------------- */

  /**
   * Pour a sample back the way it arrived.
   *
   * Every tool starts from the crate as delivered, and that is a fairness rule,
   * not a convenience. Without it a player who ran the blade over a crate of
   * bound clusters and then shook it down would watch the loose fragments settle
   * into two bands and conclude the crate was mixed — punished for using both
   * instruments instead of one.
   */
  reset(sampleId) {
    const plate = this.plates.find(p => p.sample.id === sampleId);
    if (!plate) return;
    plate.sample.units = buildUnits(plate.sample, this.kinds);
    if (this.probe?.sampleId === sampleId) this.probe = null;
    this.draw(plate);
  }

  /**
   * Shake the crate down. Anything holding more than one material separates into
   * bands; a single material packs into one. Resolves when the motion stops.
   */
  settle(sampleId) {
    this.reset(sampleId);
    const plate = this.plates.find(p => p.sample.id === sampleId);
    if (!plate) return Promise.resolve();
    const sample = plate.sample;

    const sigs = [...new Set(sample.units.map(u => u.signature))];
    // Heaviest material sinks, so the bands come out in a believable order.
    const massOf = sig => sig.split('+').reduce((n, k) => n + (this.kinds[k]?.mass || 0), 0);
    sigs.sort((a, b) => massOf(b) - massOf(a));

    const bands = sigs.length;
    const perBand = new Map(sigs.map(s => [s, 0]));
    const counts = new Map(sigs.map(s => [s, sample.units.filter(u => u.signature === s).length]));

    sample.units.forEach(u => {
      const band = sigs.indexOf(u.signature);
      const i = perBand.get(u.signature);
      perBand.set(u.signature, i + 1);
      const n = counts.get(u.signature);
      const across = Math.max(1, Math.ceil(Math.sqrt(n * 2.4)));
      const row = Math.floor(i / across);
      const col = i % across;
      const rows = Math.ceil(n / across);
      // Bands stack from the bottom up, with a visible gap between them.
      const bandTop = 0.9 - ((bands - band) / bands) * 1.8;
      const bandH = (1.8 / bands) * 0.78;
      u.tx = -0.86 + ((col + 0.5) / across) * 1.72;
      u.ty = bandTop + bandH * ((rows - row - 0.5) / rows);
    });

    return this.runAnim(700);
  }

  /**
   * Run the cutter over a sample. Loose piles scatter, groups come apart into
   * their members, and a lone piece does not move at all.
   * @returns {Promise<'scatter'|'broke'|'none'>} what the blade found
   */
  cut(sampleId) {
    this.reset(sampleId);
    const plate = this.plates.find(p => p.sample.id === sampleId);
    if (!plate) return Promise.resolve('none');
    const sample = plate.sample;

    const hasGroups = sample.units.some(u => u.members.length > 1);
    const loosePile = sample.units.length > 1;

    if (!hasGroups && !loosePile) return Promise.resolve('none');

    if (hasGroups) {
      // Every group becomes its own loose members, placed where they already were.
      const next = [];
      const g = this.geometry(plate);
      sample.units.forEach(unit => {
        unit.members.forEach(m => {
          const cos = Math.cos(unit.spin);
          const sin = Math.sin(unit.spin);
          const ox = (m.ox * cos - m.oy * sin) * (g.pieceR * 2) / g.spread;
          const oy = (m.ox * sin + m.oy * cos) * (g.pieceR * 2) / g.spread;
          next.push({
            x: unit.x + ox, y: unit.y + oy,
            tx: unit.x + ox * 3.2, ty: unit.y + oy * 3.2,
            spin: unit.spin,
            signature: m.kindId,
            entryIndex: unit.entryIndex,
            bonds: [],
            members: [{ kindId: m.kindId, size: m.size, ox: 0, oy: 0 }]
          });
        });
      });
      sample.units = next;
      this.probe = null;
      return this.runAnim(560).then(() => 'broke');
    }

    const rand = mulberry32(hashId(sample.id) ^ 0x5eed);
    sample.units.forEach(u => {
      const a = rand() * Math.PI * 2;
      u.tx = Math.max(-0.92, Math.min(0.92, u.x + Math.cos(a) * 0.3));
      u.ty = Math.max(-0.92, Math.min(0.92, u.y + Math.sin(a) * 0.3));
    });
    return this.runAnim(480).then(() => 'scatter');
  }

  /* ---------------- animation ---------------- */

  /** Ease every unit from where it is to its `tx`/`ty` target, then resolve. */
  runAnim(ms) {
    return new Promise(resolve => {
      const start = performance.now();
      this.samples.forEach(s => s.units.forEach(u => { u.x0 = u.x; u.y0 = u.y; }));

      const step = now => {
        if (this.disposed) return resolve();
        const t = Math.min(1, (now - start) / ms);
        // Ease out: a crate lurches and settles, it does not glide.
        const e = 1 - Math.pow(1 - t, 3);
        this.samples.forEach(s => s.units.forEach(u => {
          u.x = u.x0 + (u.tx - u.x0) * e;
          u.y = u.y0 + (u.ty - u.y0) * e;
        }));
        this.drawAll();
        if (t < 1) { requestAnimationFrame(step); return; }
        this.samples.forEach(s => s.units.forEach(u => { u.x = u.tx; u.y = u.ty; }));
        this.drawAll();
        resolve();
      };
      requestAnimationFrame(step);
    });
  }

  /** The probe beam sweep, which fades on its own. */
  startAnim() {
    if (this.raf) return;
    const tick = () => {
      this.sweep -= 0.055;
      if (this.sweep <= 0) {
        this.sweep = 0;
        this.raf = null;
        this.drawAll();
        return;
      }
      this.drawAll();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    this.host.innerHTML = '';
    this.plates = [];
    this.samples = [];
  }
}
