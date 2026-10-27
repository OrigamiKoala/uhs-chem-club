/**
 * kits/cloud-draw.js — What the cloud kit's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same
 * arguments, so a plate, a ring, a film and a cloud card are one picture in both views. Every figure printed is read from
 * `cloud-read.js`, which asks `orbitals.js` and `cloudplate.js`; a painter decides nothing.
 *
 * SCOURED PLATE: phosphor dots on a recessed plate, hairline rims, nothing blooms; a shell with no dots in it is a position on a
 * scale, never a colour.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { strokeRingWave, turnPoint } from '../../engine/cloudplate.js';
import {
  BOHR_PM, FILMS, pointsOf, projectDots, plateRead, ringRead, filmRead, trackRead, blurRead, viewRead, RING_CIRCUMFERENCE_PM, seatedIn, axisOf
} from './cloud-read.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const RIM = PLATE_COLORS.rim;
const INK = '#0a0908';
const WELL = '#16140f';

function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

function well(ctx, x, y, w, h, o = {}) {
  ctx.fillStyle = o.fill || WELL;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = o.stroke || RIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}

function frameOf(b) {
  const r = b.lay.box;
  return {
    r, sc: b.sc,
    x: d => b.X(r.x0 + d),
    y: d => b.Y(r.y0 + d),
    len: d => d * b.sc,
    size: (k, min = 7) => Math.max(min, k * b.sc)
  };
}

/* ------------------------------------------------------------------
   A CLOUD IN A SQUARE (the plate's picture and a cloud card's face are the same drawing)
   ------------------------------------------------------------------ */

/** The cloud's own x, y and z drawn from the corner, so a lobe's direction can be named from any side. */
function drawAxes(ctx, x0, y0, size, view) {
  const len = size * 0.15;
  const ox = x0 + size * 0.2;
  const oy = y0 + size * 0.8;
  ctx.lineWidth = 1;
  ctx.strokeStyle = STEEL;
  for (const [name, p] of [['x', { x: 1, y: 0, z: 0 }], ['y', { x: 0, y: 1, z: 0 }], ['z', { x: 0, y: 0, z: 1 }]]) {
    const q = turnPoint(p, view);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + q.a * len, oy - q.b * len);
    ctx.stroke();
    say(ctx, name, ox + q.a * (len + 4), oy - q.b * (len + 4), Math.max(7, size * 0.085), { align: 'center', color: DIM });
  }
}

/**
 * Dots in a square of side `size` pixels at (x0, y0), `half` bohr from the middle to an edge. `dots` are `{a, b, c}` projected;
 * a turning cloud shades near dots bigger and brighter than far ones (depth is all a flat picture of a solid has).
 */
export function paintDots(ctx, x0, y0, size, half, dots, { turning = false, view = null, rings = true, circleOne = false, bodies = false, slice = false, sliceEmpty = false } = {}) {
  const k = size / (2 * half);
  const cx = x0 + size / 2;
  const cy = y0 + size / 2;
  ctx.fillStyle = INK;
  ctx.fillRect(x0, y0, size, size);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(size) - 1, Math.round(size) - 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, size, size);
  ctx.clip();
  if (rings) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = STEEL;
    ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + size); ctx.moveTo(x0, cy); ctx.lineTo(x0 + size, cy); ctx.stroke();
    const step = 100 / BOHR_PM;
    for (let r = step; r < half * 1.5; r += step) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (slice) {
    ctx.save();
    const slabHalf = 1.0 * k;
    ctx.fillStyle = sliceEmpty ? 'rgba(74, 222, 128, 0.09)' : 'rgba(229, 155, 36, 0.08)';
    ctx.fillRect(x0, cy - slabHalf, size, slabHalf * 2);
    ctx.strokeStyle = sliceEmpty ? '#4ade80' : '#e59b24';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x0, cy - slabHalf); ctx.lineTo(x0 + size, cy - slabHalf);
    ctx.moveTo(x0, cy + slabHalf); ctx.lineTo(x0 + size, cy + slabHalf);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  const dot = Math.max(1.4, size * 0.014);
  ctx.fillStyle = PHOS;
  // The built table stands every dot up as a bead of its own (`cloud.js` `pilesOf`): the flat picture keeps the frame and the rings.
  for (const p of bodies ? [] : dots) {
    if (turning) {
      const near = Math.max(0, Math.min(1, (p.c / half + 1) / 2));
      ctx.globalAlpha = 0.3 + 0.7 * near;
      const d = dot * (0.75 + 0.6 * near);
      ctx.fillRect(cx + p.a * k - d / 2, cy - p.b * k - d / 2, d, d);
    } else {
      ctx.fillRect(cx + p.a * k - dot / 2, cy - p.b * k - dot / 2, dot, dot);
    }
  }
  ctx.globalAlpha = 1;
  if (circleOne && dots.length === 1) {
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + dots[0].a * k, cy - dots[0].b * k, dot * 3.2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  if (turning && view) drawAxes(ctx, x0, y0, size, view);
  return { k, cx, cy };
}

/** A film's outline, at `k` pixels per bohr round (cx, cy). */
function strokeFilm(ctx, shape, cx, cy, k) {
  const f = FILMS[shape];
  const pm = v => (v / BOHR_PM) * k;
  ctx.beginPath();
  if (shape === 'disc') ctx.arc(cx, cy, pm(f.r), 0, Math.PI * 2);
  else if (shape === 'lobes') {
    ctx.moveTo(cx + pm(f.d) + pm(f.r), cy); ctx.arc(cx + pm(f.d), cy, pm(f.r), 0, Math.PI * 2);
    ctx.moveTo(cx - pm(f.d) + pm(f.r), cy); ctx.arc(cx - pm(f.d), cy, pm(f.r), 0, Math.PI * 2);
  } else {
    ctx.arc(cx, cy, pm(f.r1), 0, Math.PI * 2);
    ctx.moveTo(cx + pm(f.r0), cy);
    ctx.arc(cx, cy, pm(f.r0), 0, Math.PI * 2);
  }
  ctx.stroke();
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

export const RECTS = Object.freeze({
  cloud: { hw: 9, hh: 9 },
  tile: { hw: 8.5, hh: 5.5 },
  film: { hw: 8.5, hh: 8.5 }
});

function slab(ctx, o, hw, hh, tone = '#2a2620') {
  const x0 = o.x - hw * o.sc;
  const y0 = o.y - hh * o.sc;
  const w = hw * 2 * o.sc;
  const h = hh * 2 * o.sc;
  ctx.fillStyle = tone;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
  return { x0, y0, w, h };
}

/** A cloud card: a small plate with the cloud on it, seen from the view the table shares. */
function paintCloudCard(ctx, p, state, o) {
  const { hw, hh } = RECTS.cloud;
  const box = slab(ctx, o, hw, hh);
  const pic = Math.min(box.w - 6, box.h * 0.8);
  const f = p.props.view ? viewRead(state, p.props.view) : { yaw: 0, pitch: 0, slice: false };
  const dots = cardDots(p, f);
  paintDots(ctx, box.x0 + (box.w - pic) / 2, box.y0 + 3, pic, p.props.extent ?? 12, dots, { turning: true, view: { yaw: f.yaw, pitch: f.pitch }, rings: false });
  say(ctx, p.label, o.x, box.y0 + box.h - box.h * 0.07, Math.max(7, box.h * 0.1), { align: 'center', maxW: box.w - 2, weight: 700 });
}

function cardDots(p, view) {
  const pts = pointsOf(p.props.orbital, p.props.seed ?? 1);
  return projectDots(pts, p.props.fired ?? 500, 'turn', view.slice, { yaw: view.yaw, pitch: view.pitch });
}

function paintTile(ctx, p, state, o) {
  const { hw, hh } = RECTS.tile;
  const box = slab(ctx, o, hw, hh);
  // A coil of string cut to a length: a zigzag across the tile, its length the wavelength.
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const x = box.x0 + 3 + (i / n) * (box.w - 6);
    const y = box.y0 + box.h * 0.28 + (i % 2 ? -1 : 1) * box.h * 0.1;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  say(ctx, p.label, o.x, o.y + box.h * 0.2, box.h * 0.3, { align: 'center', maxW: box.w - 3, weight: 700 });
}

function paintFilm(ctx, p, state, o) {
  const { hw, hh } = RECTS.film;
  const box = slab(ctx, o, hw, hh);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.2;
  const k = (box.w * 0.84) / 2 / 3.6;   // the film's picture is drawn at a fixed scale: 3.6 bohr to its edge
  strokeFilm(ctx, p.props.shape, o.x, o.y - box.h * 0.06, k);
  ctx.lineWidth = 1;
  say(ctx, p.label, o.x, box.y0 + box.h - box.h * 0.08, Math.max(7, box.h * 0.1), { align: 'center', maxW: box.w - 2, weight: 700 });
}

function paintPiece(ctx, p, state, o) {
  switch (p.kind) {
    case 'cloud': paintCloudCard(ctx, p, state, o); return true;
    case 'tile': paintTile(ctx, p, state, o); return true;
    case 'film': paintFilm(ctx, p, state, o); return true;
    default: return false;
  }
}

function faceKey(p, state) {
  if (p.kind === 'cloud') {
    const v = p.props.view ? viewRead(state, p.props.view) : { turn: 0, tilt: 0, slice: false };
    return `${p.label}|${v.turn}|${v.tilt}|${v.slice ? 1 : 0}`;
  }
  return p.label;
}

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

/** A line of the plate's side column. */
function sideLine(ctx, F, x, y, text, color, w) {
  say(ctx, text, F.x(x), F.y(y), F.size(2.5, 7), { color, weight: 700, maxW: F.len(w) });
}

function paintPlate(ctx, f, state, b) {
  const F = frameOf(b);
  const read = plateRead(state, f.id);
  const dialRows = b.lay.dials;
  const picTop = (dialRows.length ? dialRows[dialRows.length - 1].y - F.r.y0 : 6) + 3.6;
  const pic = f.props.pic ?? 34;
  const turning = read.plane === 'turn';
  const isEmptySlice = Boolean(read.slice && read.shown.length <= 0.06 * read.fired);
  const g = paintDots(ctx, F.x(2.5), F.y(picTop), F.len(pic), f.props.extent ?? 5, read.shown, {
    turning, view: read.view, circleOne: f.props.circleOne !== false, bodies: b.bodies,
    slice: read.slice, sliceEmpty: isEmptySlice
  });
  if (turning) {
    say(ctx, 'DRAG IMAGE TO ROTATE', F.x(2.5 + pic / 2), F.y(picTop + pic + 2.4), F.size(2.0, 6), { align: 'center', color: DIM });
  }
  // The counting ring, and the film's outline, over the picture.
  const ring = ringRead(state, f.id);
  if (ring && ring.rpm > 0) {
    ctx.save();
    ctx.beginPath(); ctx.rect(F.x(2.5), F.y(picTop), F.len(pic), F.len(pic)); ctx.clip();
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.4;
    const r = (ring.rpm / BOHR_PM) * g.k;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2); ctx.stroke();
    if (ring.mode === 'band') {
      ctx.globalAlpha = 0.5;
      const rw = (10 / BOHR_PM) * g.k;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, r + rw, 0, Math.PI * 2); ctx.arc(g.cx, g.cy, Math.max(0, r - rw), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  const film = filmRead(state, f.id);
  if (film?.shape) {
    ctx.save();
    ctx.beginPath(); ctx.rect(F.x(2.5), F.y(picTop), F.len(pic), F.len(pic)); ctx.clip();
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.4;
    strokeFilm(ctx, film.shape, g.cx, g.cy, g.k);
    ctx.restore();
  }
  // The side column: what the plate has taken and what is laid on it.
  const sx = 2.5 + pic + 2.5;
  const sw = f.size.w - sx - 1.5;
  let ly = picTop + 3;
  sideLine(ctx, F, sx, ly, `SHOTS ${read.fired}`, read.fired ? PHOS : DIM, sw);
  ly += 3.6;
  if (ring) {
    if (ring.mode === 'band') {
      sideLine(ctx, F, sx, ly, `IN THE SHELL ${ring.count}`, ring.fired ? AMBER : DIM, sw);
      ly += 3.6;
      sideLine(ctx, F, sx, ly, `OF ${ring.total} SHOTS`, DIM, sw);
    } else {
      sideLine(ctx, F, sx, ly, `INSIDE ${ring.count}`, ring.fired ? AMBER : DIM, sw);
      ly += 3.6;
      sideLine(ctx, F, sx, ly, `OF ${ring.total} SHOTS`, DIM, sw);
    }
    ly += 3.6;
  }
  if (film) {
    sideLine(ctx, F, sx, ly, film.shape ? `CAUGHT ${film.caught}` : 'NO FILM ON', film.shape ? AMBER : DIM, sw);
    ly += 3.6;
    if (film.shape) sideLine(ctx, F, sx, ly, `OF ${film.total} SHOTS`, DIM, sw);
    ly += 3.6;
  }
  if (read.slice) {
    sideLine(ctx, F, sx, ly, 'SLICE ON', PHOS, sw);
    ly += 3.6;
    sideLine(ctx, F, sx, ly, `DOTS: ${read.shown.length}`, read.shown.length <= 0.06 * read.fired ? '#4ade80' : DIM, sw);
    ly += 4.5;
  }
}

function paintView(ctx, f, state, b) {
  const F = frameOf(b);
  const v = viewRead(state, f.id);
  const deg = n => `${Math.round(n * 30)}`;
  const slice = Boolean(f.dials?.slice);

  // Fixture local coordinates
  const lcx = slice ? 18 : 14;
  const lcy = f.size.h / 2;
  const R = slice ? 12 : 9.5;

  const cx = F.x(lcx);
  const cy = F.y(lcy);
  const r = F.len(R);

  // 1. Header plaque
  say(ctx, 'JOYSTICK', F.x(2.5), F.y(3.6), F.size(2.5, 7.0), { color: AMBER, weight: 700 });

  // 2. Joystick socket (recessed dish)
  ctx.save();
  // Bezel ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + F.len(1.2), 0, Math.PI * 2);
  ctx.fillStyle = '#22201d';
  ctx.fill();
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = Math.max(1, F.sc * 0.12);
  ctx.stroke();

  // Socket well
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#100e0c';
  ctx.fill();
  ctx.strokeStyle = '#3a342c';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Subtle coordinate grid inside socket
  ctx.strokeStyle = 'rgba(140, 131, 118, 0.18)';
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - r + 3, cy); ctx.lineTo(cx + r - 3, cy);
  ctx.moveTo(cx, cy - r + 3); ctx.lineTo(cx, cy + r - 3);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rim tick marks (cardinal & 30 deg)
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    const isMajor = i % 3 === 0;
    const r1 = r - (isMajor ? F.len(1.5) : F.len(0.9));
    ctx.strokeStyle = isMajor ? STEEL : 'rgba(140, 131, 118, 0.35)';
    ctx.lineWidth = isMajor ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(th) * r1, cy + Math.sin(th) * r1);
    ctx.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r);
    ctx.stroke();
  }

  // 3. Puck / Joystick stick and head
  const fx = (v.turn / 12) * 2 - 1;
  const fy = -(v.tilt / 3);
  const px = F.x(lcx + fx * R * 0.75);
  const py = F.y(lcy + fy * R * 0.75);
  const pr = F.len(3.2);

  // Shaft from center to knob
  ctx.strokeStyle = '#8c8376';
  ctx.lineWidth = Math.max(2.5, F.sc * 0.35);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Knob shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.arc(px + F.len(0.6), py + F.len(0.8), pr, 0, Math.PI * 2);
  ctx.fill();

  // Knob ball outer body
  const grad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
  grad.addColorStop(0, '#f5deb3');
  grad.addColorStop(0.35, '#d4a742');
  grad.addColorStop(0.85, '#8c6b24');
  grad.addColorStop(1, '#3a2e10');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#221a0a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Knob grip ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(px, py, pr * 0.58, 0, Math.PI * 2);
  ctx.stroke();

  // Center indicator pip
  ctx.fillStyle = '#fffae0';
  ctx.beginPath();
  ctx.arc(px - pr * 0.25, py - pr * 0.25, pr * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. Right side readouts & controls
  const rx = slice ? 33 : 25;
  const rw = f.size.w - rx - 2.5;

  well(ctx, F.x(rx), F.y(3.5), F.len(rw), F.len(12.5), { fill: WELL, stroke: RIM });
  say(ctx, `TURN ${deg(v.turn)}°`, F.x(rx + rw / 2), F.y(7.2), F.size(2.3, 6.8), { align: 'center', color: PHOS, weight: 700 });
  say(ctx, `TILT ${v.tilt >= 0 ? '+' : ''}${deg(v.tilt)}°`, F.x(rx + rw / 2), F.y(11.8), F.size(2.3, 6.8), { align: 'center', color: PHOS, weight: 700 });

  if (slice) {
    const sliceActive = Boolean(v.slice);
    well(ctx, F.x(rx), F.y(18), F.len(rw), F.len(8), {
      fill: sliceActive ? '#1a2e1d' : WELL,
      stroke: sliceActive ? '#4ade80' : RIM
    });
    say(ctx, sliceActive ? 'SLICE ON' : 'SLICE OFF', F.x(rx + rw / 2), F.y(22.8), F.size(2.3, 6.8), {
      align: 'center',
      color: sliceActive ? '#4ade80' : DIM,
      weight: 700
    });
  }

  // 5. Instruction line at bottom
  say(ctx, 'DRAG JOYSTICK OR IMAGE', F.x(f.size.w / 2), F.y(f.size.h - 1.8), F.size(2.0, 5.5), { align: 'center', color: DIM });
}

function paintTrack(ctx, f, state, b) {
  const F = frameOf(b);
  const read = trackRead(state, f.id);
  const w = f.size.w;
  const h = f.size.h;
  const cx = F.x(w * 0.62);
  const cy = F.y(h * 0.55);
  const R = F.len(Math.min(w * 0.3, h * 0.34));
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = STEEL;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2.5, R * 0.05), 0, Math.PI * 2); ctx.fill();
  say(ctx, 'NUCLEUS', cx, cy + R * 0.28, F.size(2.2, 6), { align: 'center', color: DIM });
  if (read.nm) strokeRingWave(ctx, cx, cy, R, read.nm, { lineWidth: Math.max(1.2, F.sc * 0.4) });
  say(ctx, read.nm ? `WAVELENGTH ${read.nm} pm` : 'NO WAVE ON THE TRACK', F.x(2), F.y(5.6), F.size(2.6, 7), { color: read.nm ? PHOS : DIM, weight: 700 });
  say(ctx, `TRACK ${RING_CIRCUMFERENCE_PM.toFixed(0)} pm ROUND`, F.x(2), F.y(9.4), F.size(2.4, 7), { color: DIM });
}

function paintBlur(ctx, f, state, b) {
  const F = frameOf(b);
  const r = blurRead(state, f.id);
  const w = f.size.w;
  const rowH = 9;
  const row = (y, name, value, color) => {
    well(ctx, F.x(2), F.y(y), F.len(w - 4), F.len(rowH));
    say(ctx, name, F.x(3.2), F.y(y + rowH * 0.3), F.size(2.2, 6), { color: DIM });
    say(ctx, value, F.x(w - 3.2), F.y(y + rowH * 0.7), F.size(3.2, 8), { align: 'right', color, weight: 700 });
  };
  const top = f.props.rowsAt ?? 14;
  row(top, 'POSITION BLUR', `+/- ${r.dx} pm`, PHOS);
  row(top + rowH + 2, 'SPEED BLUR', `+/- ${r.dv} km/s`, AMBER);
}

function paintTracker(ctx, f, state, b) {
  const F = frameOf(b);
  say(ctx, 'NO PATH TO FOLLOW', F.x(f.size.w / 2), F.y(7.6), F.size(2.4, 7), { align: 'center', color: DIM });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'cloud') paintPlate(ctx, f, state, b);
  else if (f.kind === 'view') paintView(ctx, f, state, b);
  else if (f.kind === 'wavering') paintTrack(ctx, f, state, b);
  else if (f.kind === 'blur') paintBlur(ctx, f, state, b);
  else if (f.kind === 'tracker') paintTracker(ctx, f, state, b);
}

export { paintPiece, paintFixture, faceKey, seatedIn, axisOf };
