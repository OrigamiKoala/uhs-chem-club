/**
 * galaxy-map.js — the star map's chart: every world, placed, and the lanes between them.
 *
 * PURE half (layout, hit-testing, drawing over any 2D context) is importable in
 * Node, so `tools/verify-galaxy.mjs` can lay the chart out and DRAW it against a
 * recording context. The DOM half (`mountGalaxyMap`) is one canvas, a detail
 * plate and the keys; it holds no state the session does not.
 *
 * WHAT IT SHOWS
 *   The rim to the core. The Avalon's home sector, Erebus, sits on the outer rim
 *   and the road spirals inward world by world to Cinder Halo, the reactor at
 *   the galaxy's core. Jump lanes join each world to the next on the road;
 *   dust is tinted by the act that world belongs to. A world lit amber is open,
 *   one with a tick is finished, a dim one is sealed or still being charted.
 *
 * WHAT IT NEVER DOES
 *   Invent progress. A node's state, quest count and ring of moons (one per
 *   quest, lit if finished) come straight from the caller; the chart only draws
 *   what it is handed. It pays no XP and writes nothing.
 *
 * LOOK: a survey plate. Obsidian ground, hairline graticule, sand-gold and
 * blue-white stars, amber only for what is live. No bloom, no neon: where light
 * is drawn it is a point, a ring or a thin cross.
 */

import { mulberry32, hashString } from '../learn/drills.js';

export const GALAXY_W = 1000;
export const GALAXY_H = 700;
export const CORE = { x: 500, y: 350 };

const COLORS = {
  void: '#080708',
  well: '#0f0e11',
  line: 'rgba(214,196,168,0.16)',
  lineStrong: 'rgba(214,196,168,0.34)',
  text: '#dcd6cc',
  textDim: '#a49c90',
  textMuted: '#8c8376',
  amber: '#e59b24',
  gold: '#cca56e',
  bronze: '#967c50',
  green: '#78a142',
  starCool: '#cfd9f2',
  starWarm: '#e8cf9c'
};

/** Dust tint per act (muted: nothing in a survey chart glows). */
const ACT_TINT = {
  prologue: [150, 124, 80],
  act1: [165, 150, 110],
  act2: [120, 150, 170],
  act3: [160, 110, 100],
  act4: [190, 110, 60]
};

/**
 * How each world looks from orbit. `kind` picks a surface painter below; the
 * colours are the planets' own (salt white, ice blue, black basalt, a pale cloud
 * deck...), not interface colours.
 */
export const WORLD_LOOK = {
  erebus:  { kind: 'desert',  base: '#b48a52', dark: '#4a3420', star: 'warm' },
  unit01:  { kind: 'salt',    base: '#d4cdbd', dark: '#6b6658', star: 'warm' },
  unit02:  { kind: 'ice',     base: '#a7bfcc', dark: '#3d5766', star: 'cool' },
  unit03:  { kind: 'basalt',  base: '#35333a', dark: '#0c0b0e', star: 'warm', vein: '#c27a2c' },
  unit04:  { kind: 'gas',     base: '#b7c2cc', dark: '#4b5d70', star: 'cool' },
  unit05:  { kind: 'vent',    base: '#6a3626', dark: '#1d0f0a', star: 'warm', vein: '#d9822b' },
  unit06:  { kind: 'tidal',   base: '#7a9a9d', dark: '#2a4244', star: 'cool' },
  unit07:  { kind: 'lake',    base: '#d8cdb4', dark: '#6a5636', star: 'warm', vein: '#c4893a' },
  unit08:  { kind: 'pans',    base: '#cdbfa0', dark: '#59574c', star: 'warm', vein: '#7d96a3' },
  unit09:  { kind: 'marsh',   base: '#66845c', dark: '#1f3427', star: 'cool', vein: '#4f8f8a' },
  unit10:  { kind: 'copper',  base: '#a8694c', dark: '#43241a', star: 'warm', vein: '#5c9a86' },
  unit11:  { kind: 'storm',   base: '#7f8baa', dark: '#2c3347', star: 'cool', vein: '#d7b660' },
  unit12:  { kind: 'canyon',  base: '#84503d', dark: '#2c1810', star: 'warm' },
  unit13:  { kind: 'fen',     base: '#4a6c40', dark: '#16261a', star: 'cool' },
  unit14:  { kind: 'crater',  base: '#4a2a1e', dark: '#120806', star: 'warm', vein: '#e0701e' }
};

const FALLBACK_LOOK = { kind: 'salt', base: '#9a9486', dark: '#3c3a34', star: 'warm' };

export function lookFor(id) {
  return WORLD_LOOK[id] || FALLBACK_LOOK;
}

/* ------------------------------------------------------------------
   LAYOUT
   ------------------------------------------------------------------ */

/**
 * Place the worlds across multiple scattered star systems (no central core or track).
 * Stars and planets are placed at deterministic random positions without animation.
 *
 * @param {Array<{id:string, act?:string}>} list  road order, Erebus first
 * @returns {Array<{id:string, index:number, x:number, y:number, act:string, system:object, orbitR:number, orbitSpeed:number, orbitPhase:number}>}
 */
const SYSTEM_COUNTS = [3, 2, 3, 2, 3, 2]; // 6 star systems, 15 worlds total
const STAR_KINDS = ['warm', 'cool', 'amber', 'cool', 'warm', 'white'];

export function buildStarSystems(count = SYSTEM_COUNTS.length, rng = Math.random) {
  // Scatter star systems randomly across [160..840] x [140..560] with minimum separation
  // so orbital rings stay inside the chart and worlds remain >= 60 units apart, avoiding any grid.
  const minX = 160;
  const maxX = GALAXY_W - 160;
  const minY = 140;
  const maxY = GALAXY_H - 140;
  const minSep = 235;
  let placed = [];
  for (let restart = 0; restart < 20; restart++) {
    placed = [];
    let allOk = true;
    for (let i = 0; i < count; i++) {
      let best = null;
      let bestMinDist = -1;
      let found = false;
      for (let attempt = 0; attempt < 250; attempt++) {
        const x = minX + rng() * (maxX - minX);
        const y = minY + rng() * (maxY - minY);
        let dMin = Infinity;
        for (const p of placed) {
          const d = Math.hypot(x - p.baseX, y - p.baseY);
          if (d < dMin) dMin = d;
        }
        if (dMin >= minSep) {
          best = { baseX: x, baseY: y };
          found = true;
          break;
        }
        if (dMin > bestMinDist) {
          bestMinDist = dMin;
          best = { baseX: x, baseY: y };
        }
      }
      if (!found) allOk = false;
      placed.push(best);
    }
    if (allOk) break;
  }
  const systems = [];
  for (let i = 0; i < count; i++) {
    const cell = placed[i];
    systems.push({
      id: `sys-${i}`,
      index: i,
      baseX: cell.baseX,
      baseY: cell.baseY,
      starKind: STAR_KINDS[i % STAR_KINDS.length],
      starScale: 0.95 + rng() * 0.4,
      tilt: 0.72 + rng() * 0.16,
      planeRot: (rng() - 0.5) * 0.65
    });
  }
  return systems;
}

export function starPos(sys, _time = 0) {
  return { x: sys.baseX, y: sys.baseY };
}

export function planetPos(node, _time = 0) {
  if (!node.system) return { x: node.x, y: node.y };
  const s = starPos(node.system, 0);
  const ang = node.orbitPhase;
  const lx = Math.cos(ang) * node.orbitR;
  const ly = Math.sin(ang) * node.orbitR * node.system.tilt;
  const c = Math.cos(node.system.planeRot);
  const sn = Math.sin(node.system.planeRot);
  return {
    x: s.x + lx * c - ly * sn,
    y: s.y + lx * sn + ly * c
  };
}

export function layoutSystems(list, seed = null) {
  const rng = seed == null ? Math.random : mulberry32(hashString(String(seed)));
  let bestOut = null;
  let bestMin = -1;
  for (let attempt = 0; attempt < 15; attempt++) {
    const starSystems = buildStarSystems(SYSTEM_COUNTS.length, rng);
    // Spread worlds across the 6 star systems at random angles around each host star.
    const slots = [];
    SYSTEM_COUNTS.forEach((cnt, sysIdx) => {
      const radii = cnt === 2 ? [40, 70] : [34, 60, 86];
      const baseAng = rng() * Math.PI * 2;
      for (let slot = 0; slot < cnt; slot++) {
        slots.push({
          sysIdx,
          orbitR: radii[slot],
          orbitSpeed: 0,
          orbitPhase: baseAng + (slot * Math.PI * 2) / cnt + (rng() - 0.5) * 0.35
        });
      }
    });
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const sl = slots[i % slots.length];
      const system = starSystems[sl.sysIdx];
      const node = {
        id: list[i].id,
        index: i,
        act: list[i].act || 'act1',
        system,
        orbitR: sl.orbitR,
        orbitSpeed: sl.orbitSpeed,
        orbitPhase: sl.orbitPhase,
        x: 0,
        y: 0
      };
      const p = planetPos(node, 0);
      node.x = p.x;
      node.y = p.y;
      out.push(node);
    }
    let minD = Infinity;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        minD = Math.min(minD, Math.hypot(out[i].x - out[j].x, out[i].y - out[j].y));
      }
    }
    if (minD > bestMin) { bestMin = minD; bestOut = out; }
    if (minD >= 62) return out;
  }
  return bestOut;
}

/**
 * Which side of its planet each label goes. Outward from the core by default;
 * flipped when a neighbour sits on that side close enough to collide with it,
 * and set beneath the planet (0) when both sides would.
 *
 * @returns {Record<string, 1|-1|0>}
 */
export function labelSides(systems) {
  const out = {};
  const edgeClash = (s, side) =>
    (side === 1 && s.x > GALAXY_W - 185) ||
    (side === -1 && s.x < 185);
  const clash = (s, side) => edgeClash(s, side) || systems.some(o =>
    o !== s && Math.abs(o.y - s.y) < 38 && (o.x - s.x) * side > 0 && (o.x - s.x) * side < 185);
  for (const s of systems) {
    const outward = s.x >= CORE.x ? 1 : -1;
    if (!clash(s, outward)) out[s.id] = outward;
    else if (!clash(s, -outward)) out[s.id] = -outward;
    else out[s.id] = 0;
  }
  return out;
}

/** Lanes: each system to the next on the road, bowed away from the core. */
export function layoutLanes(systems) {
  const lanes = [];
  for (let i = 0; i + 1 < systems.length; i++) {
    const a = systems[i];
    const b = systems[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Push the control point outward from the core so the lane arcs along the spiral.
    const dx = mx - CORE.x;
    const dy = my - CORE.y;
    const len = Math.hypot(dx, dy) || 1;
    const bow = Math.min(34, Math.hypot(b.x - a.x, b.y - a.y) * 0.18);
    lanes.push({
      from: a.id, to: b.id, index: i,
      ax: a.x, ay: a.y, bx: b.x, by: b.y,
      cx: mx + (dx / len) * bow, cy: my + (dy / len) * bow,
      length: Math.hypot(b.x - a.x, b.y - a.y)
    });
  }
  return lanes;
}

/** Distance in light-years, for the lane labels (a fiction: 1 world unit = 0.4 ly). */
export function laneLightYears(lane) {
  return Math.round(lane.length * 0.4 * 10) / 10;
}

/* ------------------------------------------------------------------
   VIEW
   ------------------------------------------------------------------ */

export function fitScale(w, h) {
  return Math.min(w / GALAXY_W, h / GALAXY_H);
}

export function clampView(view, w, h) {
  const kMin = fitScale(w, h) * 0.9;
  const kMax = fitScale(w, h) * 9;
  const k = Math.max(kMin, Math.min(kMax, view.k));
  // Keep the chart centre of attention on the chart: never pan past its edge.
  const halfW = w / (2 * k);
  const halfH = h / (2 * k);
  const cx = Math.max(Math.min(view.cx, GALAXY_W - Math.min(halfW, GALAXY_W / 2) + 40), Math.min(halfW, GALAXY_W / 2) - 40);
  const cy = Math.max(Math.min(view.cy, GALAXY_H - Math.min(halfH, GALAXY_H / 2) + 40), Math.min(halfH, GALAXY_H / 2) - 40);
  return { k, cx, cy };
}

export function worldToScreen(view, w, h, x, y) {
  return { x: (x - view.cx) * view.k + w / 2, y: (y - view.cy) * view.k + h / 2 };
}

export function screenToWorld(view, w, h, sx, sy) {
  return { x: (sx - w / 2) / view.k + view.cx, y: (sy - h / 2) / view.k + view.cy };
}

/** Pixel radius of a world's planet at this zoom: never a speck, never a wall. */
export function planetPx(view, w, h) {
  const rel = view.k / fitScale(w, h);
  return Math.max(5, Math.min(90, 7.5 * Math.pow(rel, 0.85) + 1.5));
}

/** The system under a screen point (planet circle or its label), else null. */
export function hitSystem(systems, view, w, h, sx, sy, slop = 24, time = 0) {
  let best = null;
  let bestD = Infinity;
  let bestLabel = null;
  let bestLabelD = Infinity;
  const pr = planetPx(view, w, h);
  const reach = Math.max(slop, pr * 1.8);
  const showName = w >= 480 || view.k / fitScale(w, h) >= 1.5;
  for (const s of systems) {
    const pos = planetPos(s, time);
    const p = worldToScreen(view, w, h, pos.x, pos.y);
    const d = Math.hypot(p.x - sx, p.y - sy);
    if (d <= reach && d < bestD) { best = s; bestD = d; }
    if (s.name || s.code) {
      const side = s.labelSide === undefined ? 1 : s.labelSide;
      const lx = side === 0 ? p.x : p.x + side * (pr + 12);
      const dy = side === 0 ? pr + 16 : 0;
      const nameW = showName && s.name ? s.name.length * 8.2 : 0;
      const codeW = s.code ? s.code.length * 6.5 : 0;
      const lw = Math.max(44, nameW, codeW);
      const pad = 6;
      const x0 = (side === 0 ? lx - lw / 2 : side > 0 ? lx : lx - lw) - pad;
      const x1 = (side === 0 ? lx + lw / 2 : side > 0 ? lx + lw : lx) + pad;
      const y0 = p.y + dy - 14 - pad;
      const y1 = p.y + dy + (showName ? 16 : 2) + (pr >= 11 && showName ? 12 : 0) + pad;
      if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1 && d < bestLabelD) {
        bestLabel = s;
        bestLabelD = d;
      }
    }
  }
  return best || bestLabel;
}

/* ------------------------------------------------------------------
   BACKGROUND (computed once, seeded: the same sky on every machine)
   ------------------------------------------------------------------ */

let backdropCache = null;

export function buildBackdrop() {
  if (backdropCache) return backdropCache;
  const rng = mulberry32(hashString('avalon-galaxy-sky-v2'));
  const stars = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = [130, 90, 50][layer];
    for (let i = 0; i < count; i++) {
      stars.push({
        layer,
        x: -300 + rng() * (GALAXY_W + 600),
        y: -300 + rng() * (GALAXY_H + 600),
        r: [0.55, 0.8, 1.15][layer] * (0.7 + rng() * 0.7),
        a: 0.25 + rng() * 0.6,
        warm: rng() < 0.45,
        phase: rng() * Math.PI * 2
      });
    }
  }
  // Scattered nebula dust clouds across the sector (no spiral track).
  const dust = [];
  const acts = ['act1', 'act2', 'act3', 'act4'];
  const clouds = Array.from({ length: 8 }, () => ({
    cx: 80 + rng() * (GALAXY_W - 160),
    cy: 70 + rng() * (GALAXY_H - 140),
    rx: 70 + rng() * 110,
    ry: 55 + rng() * 90,
    act: acts[Math.floor(rng() * acts.length)]
  }));
  for (let i = 0; i < 650; i++) {
    const cl = clouds[i % clouds.length];
    const ang = rng() * Math.PI * 2;
    const rad = Math.pow(rng(), 0.75);
    dust.push({
      x: cl.cx + Math.cos(ang) * rad * cl.rx,
      y: cl.cy + Math.sin(ang) * rad * cl.ry,
      a: 0.05 + rng() * 0.16,
      s: 0.6 + rng() * 1.3,
      act: cl.act
    });
  }
  // Evenly scattered faint background field stars.
  const disc = [];
  for (let i = 0; i < 320; i++) {
    disc.push({
      x: -80 + rng() * (GALAXY_W + 160),
      y: -80 + rng() * (GALAXY_H + 160),
      a: 0.08 + rng() * 0.3,
      r: 0.5 + rng() * 0.7
    });
  }
  backdropCache = { stars, dust, disc };
  return backdropCache;
}

/* ------------------------------------------------------------------
   DRAWING
   ------------------------------------------------------------------ */

function rgba(c, a) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function fontFor(px, weight = '') {
  return `${weight ? weight + ' ' : ''}${px}px Quantico, "JetBrains Mono", monospace`;
}

function drawBackdrop(ctx, view, w, h, time, animate) {
  const bd = buildBackdrop();
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, w, h);

  // Faint disc stars (move with the chart).
  for (const d of bd.disc) {
    const p = worldToScreen(view, w, h, d.x, d.y);
    if (p.x < -4 || p.y < -4 || p.x > w + 4 || p.y > h + 4) continue;
    ctx.fillStyle = `rgba(207,217,242,${d.a})`;
    ctx.fillRect(p.x, p.y, d.r * 1.4, d.r * 1.4);
  }

  // Dust on the arm.
  for (const d of bd.dust) {
    const p = worldToScreen(view, w, h, d.x, d.y);
    if (p.x < -4 || p.y < -4 || p.x > w + 4 || p.y > h + 4) continue;
    ctx.fillStyle = rgba(ACT_TINT[d.act] || ACT_TINT.act1, d.a);
    const s = d.s * Math.max(0.8, Math.min(2.4, view.k / Math.max(0.2, fitScale(w, h))));
    ctx.fillRect(p.x, p.y, s, s);
  }

  // Parallax stars: far layers move less than the chart does.
  for (const s of bd.stars) {
    const par = [0.18, 0.34, 0.55][s.layer];
    const x = (s.x - view.cx) * view.k * par + w / 2;
    const y = (s.y - view.cy) * view.k * par + h / 2;
    if (x < -2 || y < -2 || x > w + 2 || y > h + 2) continue;
    const tw = animate ? 0.8 + 0.2 * Math.sin(time * 0.0008 + s.phase) : 1;
    ctx.fillStyle = (s.warm ? 'rgba(232,207,156,' : 'rgba(207,217,242,') + (s.a * tw).toFixed(3) + ')';
    ctx.fillRect(x, y, s.r * 1.3, s.r * 1.3);
  }
}

function drawGraticule(ctx, view, w, h) {
  const c = worldToScreen(view, w, h, CORE.x, CORE.y);
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.line;
  // Range rings, every 80 world units of radius (32 light-years), elliptical like the arm.
  for (let r = 80; r <= 400; r += 80) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r * 1.42 * view.k, r * 0.95 * view.k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Bearing spokes every 30 degrees.
  ctx.strokeStyle = 'rgba(214,196,168,0.08)';
  for (let a = 0; a < 360; a += 30) {
    const rad = a * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(c.x + Math.cos(rad) * 60 * view.k, c.y + Math.sin(rad) * 40 * view.k);
    ctx.lineTo(c.x + Math.cos(rad) * 450 * 1.42 * view.k, c.y + Math.sin(rad) * 450 * 0.95 * view.k);
    ctx.stroke();
  }
  // Range labels along one spoke.
  if (view.k / fitScale(w, h) >= 0.9) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = fontFor(9);
    ctx.textAlign = 'left';
    for (let r = 80; r <= 320; r += 80) {
      ctx.fillText(`${Math.round(r * 0.4)} ly`, c.x + 4, c.y + r * 0.95 * view.k - 3);
    }
  }
  ctx.restore();
}

/** The reactor at the core: a dark mass ringed by an ember line, not a bloom. */
function drawCore(ctx, view, w, h, time, animate) {
  const c = worldToScreen(view, w, h, CORE.x, CORE.y);
  const k = view.k;
  ctx.save();
  const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 62 * k);
  g.addColorStop(0, 'rgba(8,7,8,1)');
  g.addColorStop(0.55, 'rgba(8,7,8,0.9)');
  g.addColorStop(1, 'rgba(8,7,8,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 62 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(224,112,30,0.55)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 34 * 1.42 * k, 34 * 0.95 * k, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(224,112,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 46 * 1.42 * k, 46 * 0.95 * k, 0, 0, Math.PI * 2);
  ctx.stroke();
  // A single bright point, pulsing slowly where the fiction says the reactor is.
  const pulse = animate ? 0.65 + 0.35 * Math.sin(time * 0.0015) : 0.8;
  ctx.fillStyle = `rgba(224,112,30,${pulse.toFixed(3)})`;
  ctx.fillRect(c.x - 1.5, c.y - 1.5, 3, 3);
  ctx.restore();
}

function drawLanes(ctx, view, w, h, lanes, nodeById, time, animate) {
  for (const l of lanes) {
    const a = nodeById[l.from];
    const b = nodeById[l.to];
    if (!a || !b) continue;
    const reachable = a.state !== 'charted' && b.state !== 'charted' && a.state !== 'locked' && b.state !== 'locked';
    const flown = a.state === 'complete' && (b.state === 'complete' || b.state === 'open');
    const p0 = worldToScreen(view, w, h, l.ax, l.ay);
    const p1 = worldToScreen(view, w, h, l.cx, l.cy);
    const p2 = worldToScreen(view, w, h, l.bx, l.by);
    ctx.save();
    ctx.lineWidth = flown ? 1.4 : 1;
    ctx.strokeStyle = flown ? 'rgba(229,155,36,0.7)' : reachable ? 'rgba(204,165,110,0.38)' : 'rgba(214,196,168,0.2)';
    ctx.setLineDash(flown ? [] : reachable ? [6, 4] : [2, 5]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // A chevron at the lane's middle, pointing inward (the way the road goes).
    const mx = 0.25 * p0.x + 0.5 * p1.x + 0.25 * p2.x;
    const my = 0.25 * p0.y + 0.5 * p1.y + 0.25 * p2.y;
    const tx = p2.x - p0.x;
    const ty = p2.y - p0.y;
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl;
    const uy = ty / tl;
    ctx.fillStyle = flown ? 'rgba(229,155,36,0.85)' : 'rgba(214,196,168,0.4)';
    ctx.beginPath();
    ctx.moveTo(mx + ux * 5, my + uy * 5);
    ctx.lineTo(mx - ux * 3 - uy * 3.5, my - uy * 3 + ux * 3.5);
    ctx.lineTo(mx - ux * 3 + uy * 3.5, my - uy * 3 - ux * 3.5);
    ctx.closePath();
    ctx.fill();

    // A traveller on a lane the player has flown.
    if (flown && animate) {
      const f = ((time * 0.00012) + l.index * 0.17) % 1;
      const x = (1 - f) * (1 - f) * p0.x + 2 * (1 - f) * f * p1.x + f * f * p2.x;
      const y = (1 - f) * (1 - f) * p0.y + 2 * (1 - f) * f * p1.y + f * f * p2.y;
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
    }
    ctx.restore();
  }
}

/* --- planets ------------------------------------------------------ */

function clipDisc(ctx, x, y, r, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  fn();
  ctx.restore();
}

function band(ctx, x, y, r, off, thick, color, alpha) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x - r, y + off * r - (thick * r) / 2, r * 2, thick * r);
  ctx.globalAlpha = 1;
}

/** Draw surface patches wrapped around a rotating sphere (longitude `lon` + `spin`). */
function patches(ctx, x, y, r, seed, count, color, alpha, size, spin = 0) {
  const rng = mulberry32(hashString(seed));
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const baseLon = rng() * Math.PI * 2;
    const lat = (rng() - 0.5) * 1.45;
    const rxBase = r * size * (0.6 + rng() * 0.75);
    const ryBase = r * size * (0.38 + rng() * 0.45);
    const tilt = rng() * Math.PI;
    const lon = baseLon + spin;
    const facing = Math.cos(lon);
    if (facing <= -0.15) continue;
    const px = x + Math.sin(lon) * Math.cos(lat) * r * 0.9;
    const py = y + Math.sin(lat) * r * 0.85;
    const foreshorten = Math.max(0.18, facing);
    ctx.beginPath();
    ctx.ellipse(px, py, rxBase * foreshorten, ryBase, tilt, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** One planet. Lit from the upper left; the terminator is a gradient, not a glow. */
export function drawPlanet(ctx, x, y, r, id, spin = 0) {
  const look = lookFor(id);
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, look.base);
  g.addColorStop(1, look.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  if (r >= 6) {
    clipDisc(ctx, x, y, r, () => {
      switch (look.kind) {
        case 'salt':
          patches(ctx, x, y, r, id + 'a', 8, '#f2eee2', 0.42, 0.34, spin);
          patches(ctx, x, y, r, id + 'b', 6, '#8e8878', 0.3, 0.28, spin);
          break;
        case 'ice':
          band(ctx, x, y, r, -0.78, 0.3, '#eef6fa', 0.55);
          band(ctx, x, y, r, 0.8, 0.26, '#eef6fa', 0.45);
          patches(ctx, x, y, r, id + 'ice', 6, '#dff0f8', 0.4, 0.24, spin);
          ctx.strokeStyle = COLORS.green;
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = Math.max(1, r * 0.07);
          ctx.beginPath();
          ctx.arc(x, y - r * 0.55, r * 0.7, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        case 'basalt': {
          ctx.strokeStyle = look.vein;
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = Math.max(0.8, r * 0.055);
          const rng = mulberry32(hashString(id));
          for (let i = 0; i < 6; i++) {
            const lon = rng() * Math.PI * 2 + spin;
            const lat = (rng() - 0.5) * 1.3;
            const dLon = (rng() - 0.5) * 0.9;
            const dLat = (rng() - 0.5) * 0.7;
            if (Math.cos(lon) <= -0.1) continue;
            const sx = x + Math.sin(lon) * Math.cos(lat) * r * 0.88;
            const sy = y + Math.sin(lat) * r * 0.85;
            const ex = x + Math.sin(lon + dLon) * Math.cos(lat + dLat) * r * 0.88;
            const ey = y + Math.sin(lat + dLat) * r * 0.85;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo((sx + ex) * 0.5 + (rng() - 0.5) * r * 0.25, (sy + ey) * 0.5 + (rng() - 0.5) * r * 0.25);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          break;
        }
        case 'gas': {
          const tones = ['#dfe6ec', '#8fa3b3', '#c9d3db', '#6f859a', '#d8dfe5'];
          tones.forEach((c, i) => band(ctx, x, y, r, -0.8 + i * 0.4, 0.3, c, 0.55));
          patches(ctx, x, y, r, id + 'storm', 5, '#f0f5fa', 0.48, 0.22, spin * 1.15);
          patches(ctx, x, y, r, id + 'eddy', 4, '#5a6e82', 0.42, 0.18, spin);
          break;
        }
        case 'vent':
          patches(ctx, x, y, r, id, 9, look.vein, 0.6, 0.15, spin);
          patches(ctx, x, y, r, id + 'c', 6, '#2a1511', 0.45, 0.3, spin);
          break;
        case 'tidal':
          band(ctx, x, y, r, 0.1, 0.5, '#bfd8da', 0.35);
          band(ctx, x, y, r, -0.5, 0.18, '#ffffff', 0.25);
          patches(ctx, x, y, r, id + 'tide', 7, '#e2f2f3', 0.42, 0.24, spin);
          patches(ctx, x, y, r, id + 'reef', 4, '#325254', 0.35, 0.2, spin);
          break;
        case 'lake':
          patches(ctx, x, y, r, id, 6, look.vein, 0.55, 0.32, spin);
          patches(ctx, x, y, r, id + 'd', 5, '#7a5a34', 0.35, 0.3, spin);
          break;
        case 'pans':
          patches(ctx, x, y, r, id, 7, look.vein, 0.52, 0.3, spin);
          patches(ctx, x, y, r, id + 'e', 7, '#f0e6cc', 0.35, 0.26, spin);
          break;
        case 'marsh':
          patches(ctx, x, y, r, id, 8, look.vein, 0.52, 0.3, spin);
          patches(ctx, x, y, r, id + 'f', 6, '#2c4a35', 0.42, 0.3, spin);
          break;
        case 'copper':
          patches(ctx, x, y, r, id, 8, look.vein, 0.58, 0.26, spin);
          patches(ctx, x, y, r, id + 'cu', 5, '#6b3826', 0.35, 0.22, spin);
          break;
        case 'storm':
          band(ctx, x, y, r, -0.2, 0.34, '#aab4cc', 0.5);
          patches(ctx, x, y, r, id, 6, look.vein, 0.72, 0.14, spin * 1.2);
          patches(ctx, x, y, r, id + 'st', 5, '#d5ddf0', 0.35, 0.24, spin);
          break;
        case 'canyon':
          for (let i = 0; i < 4; i++) band(ctx, x, y, r, -0.6 + i * 0.4, 0.07, '#2c1810', 0.55);
          patches(ctx, x, y, r, id, 7, '#b4735a', 0.38, 0.3, spin);
          break;
        case 'fen':
          patches(ctx, x, y, r, id, 9, '#7a9a55', 0.45, 0.28, spin);
          patches(ctx, x, y, r, id + 'g', 5, '#1f3a2c', 0.42, 0.3, spin);
          break;
        case 'crater':
          patches(ctx, x, y, r, id, 7, look.vein, 0.55, 0.18, spin);
          patches(ctx, x, y, r, id + 'h', 7, '#0a0403', 0.52, 0.22, spin);
          break;
        default:
          patches(ctx, x, y, r, id, 7, '#e0b878', 0.36, 0.3, spin);
          break;
      }
      // The night side: a dark crescent keeps every planet round.
      const sh = ctx.createRadialGradient(x - r * 0.5, y - r * 0.5, r * 0.55, x + r * 0.2, y + r * 0.2, r * 1.25);
      sh.addColorStop(0, 'rgba(0,0,0,0)');
      sh.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = sh;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(214,196,168,0.28)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cinder Halo wears the ring it is named for.
  if (id === 'unit14' && r >= 6) {
    ctx.strokeStyle = 'rgba(224,112,30,0.65)';
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.7, r * 0.5, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Erebus is a moon under a ringed giant: a short arc of ring behind it.
  if (id === 'erebus' && r >= 6) {
    ctx.strokeStyle = 'rgba(204,165,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.9, r * 0.45, 0.4, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
}

const STAR_PALETTE = {
  warm:  { core: '#fff3d6', mid: 'rgba(244,205,130,0.55)', outer: 'rgba(232,175,90,0)' },
  amber: { core: '#ffe2b0', mid: 'rgba(235,145,55,0.55)',  outer: 'rgba(210,110,30,0)' },
  cool:  { core: '#eef5ff', mid: 'rgba(175,205,250,0.55)', outer: 'rgba(130,175,245,0)' },
  white: { core: '#ffffff', mid: 'rgba(220,228,242,0.55)', outer: 'rgba(195,210,235,0)' }
};

function drawStar(ctx, x, y, size, kind = 'warm') {
  const pal = STAR_PALETTE[kind] || STAR_PALETTE.warm;
  const r = size;

  ctx.save();
  // Soft corona
  const corona = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.0);
  corona.addColorStop(0, pal.core);
  corona.addColorStop(0.28, pal.mid);
  corona.addColorStop(1, pal.outer);
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.0, 0, Math.PI * 2);
  ctx.fill();

  // Crisp bright stellar disc
  ctx.fillStyle = pal.core;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2.6, r * 0.72), 0, Math.PI * 2);
  ctx.fill();

  // Prominent 4-point diffraction spikes
  ctx.strokeStyle = pal.mid;
  ctx.lineWidth = Math.max(1, r * 0.16);
  const spike = r * 3.2;
  ctx.beginPath();
  ctx.moveTo(x - spike, y); ctx.lineTo(x + spike, y);
  ctx.moveTo(x, y - spike); ctx.lineTo(x, y + spike);
  ctx.stroke();
  ctx.restore();
}

function stateInk(state) {
  if (state === 'complete') return COLORS.gold;
  if (state === 'open') return COLORS.amber;
  return COLORS.textMuted;
}

/**
 * Draw one world (rotating planet + label) at its current orbital position.
 * No orbit rings, pulsing rings, squares, or brackets around the planet.
 */
function drawSystem(ctx, view, w, h, node, opts) {
  const { time, animate, selected, hovered, showName, planetR } = opts;
  const worldP = planetPos(node, animate ? time : 0);
  const p = worldToScreen(view, w, h, worldP.x, worldP.y);
  if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80) return;
  const sealed = node.state === 'locked' || node.state === 'charted';

  ctx.save();
  ctx.globalAlpha = sealed ? 0.62 : 1;
  const spin = node.index * 0.9;
  drawPlanet(ctx, p.x, p.y, planetR, node.id, spin);
  ctx.restore();

  // Label: code always, name when there is room (or when picked).
  const side = node.labelSide === undefined ? 1 : node.labelSide;
  const lx = side === 0 ? p.x : p.x + side * (planetR + 12);
  const dy = side === 0 ? planetR + 16 : 0;
  ctx.textAlign = side === 0 ? 'center' : side > 0 ? 'left' : 'right';
  ctx.font = fontFor(10, '');
  ctx.fillStyle = selected ? COLORS.amber : stateInk(node.state);
  ctx.fillText(node.code, lx, p.y - 3 + dy);
  if (showName || selected || hovered) {
    ctx.font = fontFor(12, 'bold');
    ctx.fillStyle = selected || hovered ? COLORS.amber : sealed ? COLORS.textDim : COLORS.text;
    ctx.fillText(node.name.toUpperCase(), lx, p.y + 10 + dy);
    if (planetR >= 11) {
      ctx.font = fontFor(9, '');
      ctx.fillStyle = COLORS.textMuted;
      ctx.fillText(node.place, lx, p.y + 22 + dy);
    }
  }
}

function drawCompass(ctx, w, h) {
  const x = w - 34;
  const y = 40;
  ctx.save();
  ctx.strokeStyle = COLORS.lineStrong;
  ctx.fillStyle = COLORS.textMuted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20);
  ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y);
  ctx.stroke();
  ctx.font = fontFor(9);
  ctx.textAlign = 'center';
  ctx.fillText('N', x, y - 24);
  ctx.restore();
}

function drawScale(ctx, view, w, h) {
  // A bar that is 100 light-years long, wherever the zoom is.
  const px = 250 * view.k;
  const x = 14;
  const y = h - 16;
  ctx.save();
  ctx.strokeStyle = COLORS.lineStrong;
  ctx.fillStyle = COLORS.textMuted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + px, y);
  ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
  ctx.moveTo(x + px, y - 4); ctx.lineTo(x + px, y + 4);
  ctx.stroke();
  ctx.font = fontFor(9);
  ctx.textAlign = 'left';
  ctx.fillText('100 ly', x, y - 7);
  ctx.restore();
}

/** Region captions: where each act's worlds lie, printed on the plate. */
function drawActLabels(ctx, view, w, h, nodes, acts) {
  if (!acts || view.k / fitScale(w, h) > 2.6) return;
  ctx.save();
  ctx.font = fontFor(10, 'bold');
  ctx.textAlign = 'center';
  for (const a of acts) {
    const members = nodes.filter(n => n.act === a.id);
    if (!members.length) continue;
    const mx = members.reduce((s, n) => s + n.x, 0) / members.length;
    const my = members.reduce((s, n) => s + n.y, 0) / members.length;
    const dx = mx - CORE.x;
    const dy = my - CORE.y;
    const len = Math.hypot(dx, dy) || 1;
    const p = worldToScreen(view, w, h, mx + (dx / len) * 70, my + (dy / len) * 56);
    const tint = ACT_TINT[a.id] || ACT_TINT.act1;
    ctx.fillStyle = rgba(tint, 0.85);
    ctx.fillText(a.label.toUpperCase(), p.x, p.y);
  }
  ctx.restore();
}

/**
 * Draw the whole chart.
 *
 * @param ctx   any 2D context
 * @param state { nodes, lanes, view, w, h, time, animate, selectedId, hoverId, acts }
 */
export function drawGalaxy(ctx, state) {
  const { nodes, view, w, h, time = 0, animate = false, selectedId = null, hoverId = null } = state;

  drawBackdrop(ctx, view, w, h, time, animate);

  const planetR = planetPx(view, w, h);
  const showName = w >= 480 || view.k / fitScale(w, h) >= 1.5;

  // Draw each unique host star at its static position.
  const seenStars = new Set();
  const starR = Math.max(4.5, planetR * 0.58);
  for (const n of nodes) {
    if (!n.system || seenStars.has(n.system.id)) continue;
    seenStars.add(n.system.id);
    const sp = starPos(n.system, 0);
    const scr = worldToScreen(view, w, h, sp.x, sp.y);
    if (scr.x < -120 || scr.y < -120 || scr.x > w + 120 || scr.y > h + 120) continue;
    drawStar(ctx, scr.x, scr.y, starR * (n.system.starScale || 1), n.system.starKind);
  }

  // Far systems first so a zoomed-in planet is never painted over by a neighbour.
  const order = nodes.slice().sort((a, b) => b.x + b.y * 0.1 - (a.x + a.y * 0.1));
  for (const n of order) {
    drawSystem(ctx, view, w, h, n, {
      time, animate, planetR,
      selected: n.id === selectedId,
      hovered: n.id === hoverId && n.id !== selectedId,
      showName
    });
  }
  drawCompass(ctx, w, h);

  // Plate border.
  ctx.strokeStyle = COLORS.lineStrong;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

/* ------------------------------------------------------------------
   THE DOM HALF
   ------------------------------------------------------------------ */

const STATE_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Sealed', cls: 'warn' },
  charted: { label: 'No Charts', cls: 'locked' }
};

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Mount the chart.
 *
 * @param {HTMLElement} root
 * @param {object} opts
 *   nodes   [{ id, code, name, place, line, state, quests:[{done,live}], progressText,
 *              act, actions: [{ label, href?, id?, primary? }] }]  — road order, Erebus first
 *   acts    [{ id, label }]
 *   selectedId  initial selection
 *   reducedMotion
 *   onAction(actionId, node)
 * @returns {{ dispose(): void, select(id): void }}
 */
export function mountGalaxyMap(root, opts) {
  const { nodes: rawNodes, acts = [], reducedMotion = false, onAction } = opts;
  const placed = layoutSystems(rawNodes);
  const sides = labelSides(placed);
  const nodes = rawNodes.map((n, i) => ({ ...placed[i], ...n, index: i, labelSide: sides[placed[i].id] }));
  const lanes = layoutLanes(nodes);
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  root.innerHTML = `
    <div class="galaxy">
      <div class="galaxy-stage">
        <canvas class="galaxy-canvas" tabindex="0" role="application"
                aria-label="Star map. Arrow keys move the chart, plus and minus zoom, Tab and Shift Tab choose a world, Enter opens it."></canvas>
        <div class="galaxy-keys" role="group" aria-label="Chart view">
          <button type="button" class="btn-secondary quest-btn-sm m-tap" data-gx="in" aria-label="Zoom in">+</button>
          <button type="button" class="btn-secondary quest-btn-sm m-tap" data-gx="out" aria-label="Zoom out">−</button>
        </div>
      </div>
      <aside class="galaxy-plate plate" aria-live="polite"></aside>
      <ul class="galaxy-legend" aria-label="Chart key">
        <li><i class="gx-key open"></i>Open</li>
        <li><i class="gx-key done"></i>Finished</li>
        <li><i class="gx-key sealed"></i>Sealed or uncharted</li>
      </ul>
    </div>
  `;

  const canvas = root.querySelector('.galaxy-canvas');
  const plate = root.querySelector('.galaxy-plate');
  const ctx = canvas.getContext('2d');
  const prefersReduced = reducedMotion || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  let w = 0;
  let h = 0;
  let dpr = 1;
  let view = { k: 1, cx: GALAXY_W / 2, cy: GALAXY_H / 2 };
  let selectedId = opts.selectedId && byId[opts.selectedId] ? opts.selectedId : (nodes.find(n => n.state === 'open') || nodes[0]).id;
  let hoverId = null;
  let raf = 0;
  let dirty = true;
  let disposed = false;
  let lastFrame = 0;
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let tween = null;

  function wholeMap() {
    return { k: fitScale(w, h), cx: GALAXY_W / 2, cy: GALAXY_H / 2 };
  }

  let sized = false;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    // Hidden (the other tab is showing): wait for the observer to tell us it has a width.
    if (!rect.width) return;
    const nw = Math.max(280, Math.round(rect.width));
    const nh = Math.round(Math.max(300, Math.min(560, nw * 0.72)));
    const nd = Math.min(2, window.devicePixelRatio || 1);
    if (nw === w && nh === h && nd === dpr) return;
    const first = !sized;
    sized = true;
    w = nw; h = nh; dpr = nd;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (first) {
      view = wholeMap();
      // A phone cannot read fifteen worlds across 340 px: start closer, on the player's world.
      if (w < 520) {
        const n = byId[selectedId];
        view = clampView({ k: view.k * 1.7, cx: n.x, cy: n.y }, w, h);
      }
    } else {
      view = clampView(view, w, h);
    }
    dirty = true;
  }

  function flyTo(target, ms = 520) {
    const to = clampView(target, w, h);
    if (prefersReduced) { view = to; dirty = true; return; }
    tween = { from: { ...view }, to, t0: performance.now(), ms };
  }

  function focusNode(id) {
    const n = byId[id];
    if (!n) return;
    const pos = planetPos(n, prefersReduced ? 0 : lastFrame);
    flyTo({ k: fitScale(w, h) * 6, cx: pos.x, cy: pos.y });
  }

  function renderPlate() {
    const n = byId[selectedId];
    if (!n) { plate.innerHTML = ''; return; }
    const tag = STATE_TAG[n.state] || STATE_TAG.charted;
    const moons = (n.quests || []);
    plate.innerHTML = `
      <div class="galaxy-plate-head">
        <span class="eyebrow ${n.state === 'open' ? 'lit' : ''}">${escHtml(n.code)} · ${escHtml(n.place)}</span>
        <span class="tag ${tag.cls}">${tag.label}</span>
      </div>
      <h2 class="galaxy-plate-name">${escHtml(n.name)}</h2>
      <p class="galaxy-plate-line">${escHtml(n.line)}</p>
      ${moons.length ? `
        <div class="galaxy-plate-moons" aria-label="${escHtml(n.progressText || '')}">
          ${moons.map(q => `<i class="gx-moon ${q.done ? 'done' : q.live ? 'live' : ''}" title="${escHtml(q.title || '')}"></i>`).join('')}
        </div>` : ''}
      <div class="eyebrow galaxy-plate-count">${escHtml(n.progressText || '')}</div>
      <div class="galaxy-plate-actions">
        ${(n.actions || []).map(a => a.href
          ? `<a href="${escHtml(a.href)}" class="${a.primary ? 'btn-primary' : 'btn-secondary'} quest-btn-sm m-tap${a.cls ? ' ' + escHtml(a.cls) : ''}"${a.worldId ? ` data-world-id="${escHtml(a.worldId)}"` : ''} style="text-decoration: none;">${escHtml(a.label)}</a>`
          : `<button type="button" class="${a.primary ? 'btn-primary' : 'btn-secondary'} quest-btn-sm m-tap" data-gx-action="${escHtml(a.id)}">${escHtml(a.label)}</button>`).join('')}
      </div>
    `;
    plate.querySelectorAll('[data-gx-action]').forEach(btn =>
      btn.addEventListener('click', () => onAction?.(btn.dataset.gxAction, n)));
  }

  function select(id, { focus = false } = {}) {
    if (!byId[id]) return;
    selectedId = id;
    renderPlate();
    dirty = true;
    if (focus) focusNode(id);
  }

  function frame(now) {
    raf = 0;
    if (disposed) return;
    if (!canvas.isConnected) { dispose(); return; }
    if (tween) {
      const f = Math.min(1, (now - tween.t0) / tween.ms);
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      view = {
        k: tween.from.k * Math.pow(tween.to.k / tween.from.k, e),
        cx: tween.from.cx + (tween.to.cx - tween.from.cx) * e,
        cy: tween.from.cy + (tween.to.cy - tween.from.cy) * e
      };
      if (f >= 1) tween = null;
      dirty = true;
    }
    if (dirty) {
      lastFrame = now;
      dirty = false;
      if (w > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawGalaxy(ctx, { nodes, lanes, view, w, h, time: 0, animate: false, selectedId, hoverId, acts });
      }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  const local = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function zoomAt(sx, sy, factor) {
    const before = screenToWorld(view, w, h, sx, sy);
    const k = view.k * factor;
    const next = clampView({ k, cx: view.cx, cy: view.cy }, w, h);
    // Keep the world point under the cursor where it was.
    next.cx = before.x - (sx - w / 2) / next.k;
    next.cy = before.y - (sy - h / 2) / next.k;
    view = clampView(next, w, h);
    tween = null;
    dirty = true;
  }

  canvas.addEventListener('pointerdown', e => {
    canvas.focus({ preventScroll: true });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    const p = local(e);
    pointers.set(e.pointerId, p);
    tween = null;
    if (pointers.size === 1) {
      drag = { sx: p.x, sy: p.y, cx: view.cx, cy: view.cy, moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
      drag = null;
    }
  });

  canvas.addEventListener('pointermove', e => {
    const p = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const factor = (pinch.k * d / pinch.d) / view.k;
      zoomAt(mid.x, mid.y, factor);
      return;
    }
    if (drag) {
      const dx = p.x - drag.sx;
      const dy = p.y - drag.sy;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) {
        view = clampView({ k: view.k, cx: drag.cx - dx / view.k, cy: drag.cy - dy / view.k }, w, h);
        dirty = true;
      }
    } else if (e.pointerType === 'mouse') {
      const hit = hitSystem(nodes, view, w, h, p.x, p.y, 24, 0);
      const id = hit ? hit.id : null;
      if (id !== hoverId) { hoverId = id; canvas.style.cursor = id ? 'pointer' : 'grab'; dirty = true; }
    }
  });

  const end = e => {
    const p = local(e);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && pointers.size === 0) {
      if (!drag.moved) {
        const hit = hitSystem(nodes, view, w, h, p.x, p.y, 24, 0);
        if (hit) select(hit.id);
      }
      drag = null;
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); pinch = null; drag = null; });
  canvas.addEventListener('pointerleave', () => { if (hoverId) { hoverId = null; dirty = true; } });
  canvas.addEventListener('dblclick', e => {
    const p = local(e);
    const hit = hitSystem(nodes, view, w, h, p.x, p.y, 24, 0);
    if (hit) select(hit.id, { focus: true });
    else zoomAt(p.x, p.y, 1.8);
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const p = local(e);
    zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  canvas.addEventListener('keydown', e => {
    const step = 40 / view.k;
    const move = (dx, dy) => { view = clampView({ k: view.k, cx: view.cx + dx, cy: view.cy + dy }, w, h); tween = null; dirty = true; e.preventDefault(); };
    switch (e.key) {
      case 'ArrowLeft': move(-step, 0); break;
      case 'ArrowRight': move(step, 0); break;
      case 'ArrowUp': move(0, -step); break;
      case 'ArrowDown': move(0, step); break;
      case '+': case '=': zoomAt(w / 2, h / 2, 1.35); e.preventDefault(); break;
      case '-': case '_': zoomAt(w / 2, h / 2, 1 / 1.35); e.preventDefault(); break;
      case '0': flyTo(wholeMap()); e.preventDefault(); break;
      case 'Tab': {
        const i = nodes.findIndex(n => n.id === selectedId);
        const j = e.shiftKey ? i - 1 : i + 1;
        if (j >= 0 && j < nodes.length) { select(nodes[j].id, { focus: true }); e.preventDefault(); }
        break;
      }
      case 'Enter': case ' ': focusNode(selectedId); e.preventDefault(); break;
      default: break;
    }
  });

  root.querySelectorAll('[data-gx="in"]').forEach(b => b.addEventListener('click', () => zoomAt(w / 2, h / 2, 1.5)));
  root.querySelectorAll('[data-gx="out"]').forEach(b => b.addEventListener('click', () => zoomAt(w / 2, h / 2, 1 / 1.5)));

  let ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
  }
  window.addEventListener('resize', resize);

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', resize);
  }

  canvas.style.cursor = 'grab';
  resize();
  renderPlate();
  raf = requestAnimationFrame(frame);

  return { dispose, select, nodes };
}
