/**
 * snap.js — Where a dropped piece lands.
 *
 * The geometry of the table, kept apart from the reducer so a view can ask it
 * the same questions the reducer does: what is under this point, which pieces
 * could this one join, where does a zone put its n-th item, where is the gap
 * between rail pieces. Three views (the drawn tabletop, the built one, and the
 * replay in `verify:table`) therefore decide a drop identically.
 *
 * SNAPS ARE PHYSICS, NEVER A GATEKEEPER (plan §2.3). This file finds who is
 * NEAR a dropped piece; it never says whether a join is right. That is the
 * kit's planner (`kit.planJoin`), asked for every candidate and reported as it
 * stands: `joinCandidates` returns each candidate with the planner's answer so
 * a view can show a pair that will not hold, and a drop onto it still happens.
 * A zone never refuses a piece either; a Sort tray takes whatever is dropped
 * in it and the stage's `check` decides if that was right.
 *
 * Units are table units: the table is `state.bounds` wide and high (default
 * 100 x 60), x to the right, y down the screen. The 3D view maps the plate onto
 * them; nothing here knows about pixels or metres.
 *
 * Pure: no DOM, no THREE.
 */

import { radiusOf } from './kits/registry.js';
import { insertionIndex } from './rail.js';

/* ---------------- sizes ---------------- */

export const SIZES = {
  tray: { w: 30, h: 20 },
  slot: { w: 11, h: 11 },
  container: { w: 20, h: 24 },
  rail: { w: 84, h: 12 },
  fixture: { w: 26, h: 16 },
  /** How far past a ring zone's outermost circle a drop still lands on the nearest ring. */
  ring: { r: 10, catch: 8 },
  /** The drawn site plate of a field point (T1 to T3), where a tap takes the item. */
  site: { w: 24, h: 13 }
};

/** Pitch of the grid a tray or container lays its pieces on. */
export const CELL = 10;

/** A piece is joined to a neighbour that its edge comes within this factor of touching. */
export const JOIN_REACH = 1.4;
/** A pointer within this factor of a piece's radius grabs it: generous, for fingers. */
export const GRAB_REACH = 1.5;

/* ---------------- zone keys ---------------- */

export const zoneKey = (kind, id) => (kind === 'rail' ? 'rail' : `${kind}:${id}`);

export function parseKey(key) {
  if (key === 'rail') return { kind: 'rail', id: null };
  const at = String(key).indexOf(':');
  return at < 0 ? { kind: key, id: null } : { kind: key.slice(0, at), id: key.slice(at + 1) };
}

/** `to` strings a script or a two-tap uses: `tray:ID`, `slot:ID`, `container:ID`, `rail:INDEX`, `piece:ID`, `free:X,Y`. */
export function parseTo(to) {
  const { kind, id } = parseKey(to);
  if (kind === 'rail') return { kind: 'rail', index: id === null || id === '' ? null : Number(id) };
  if (kind === 'free') {
    const [x, y] = String(id).split(',').map(Number);
    return { kind: 'free', at: { x, y } };
  }
  return { kind, id };
}

/** The `to` string for a resolved target: the inverse of `parseTo`. */
export function targetString(t) {
  if (t.kind === 'rail') return `rail:${t.index ?? ''}`;
  if (t.kind === 'free') return `free:${t.at.x},${t.at.y}`;
  return `${t.kind}:${t.id}`;
}

/* ---------------- selectors ---------------- */

/** The ids of every piece joined to `id`, directly or not, itself included, in id order. */
export function clusterOf(state, id) {
  if (!state.pieces[id]) return [];
  const seen = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const cur = queue.pop();
    for (const n of state.pieces[cur].joinedTo || []) {
      if (!seen.has(n) && state.pieces[n]) { seen.add(n); queue.push(n); }
    }
  }
  return [...seen].sort();
}

/** The ids of the pieces in a zone key, in the order they are laid out. */
export function itemsIn(state, key) {
  if (key === 'rail') return state.zones.rail ? state.zones.rail.order.slice() : [];
  return Object.values(state.pieces).filter(p => p.zone === key && !p.hidden).map(p => p.id);
}

export const linkKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/* ---------------- zones ---------------- */

export function rectOf(zone, fallback) {
  const w = zone.size?.w ?? fallback.w;
  const h = zone.size?.h ?? fallback.h;
  return { x0: zone.at.x - w / 2, y0: zone.at.y - h / 2, x1: zone.at.x + w / 2, y1: zone.at.y + h / 2, w, h };
}

const inRect = (r, p) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

/** Is `p` inside an orbit zone's circle? An orbit is round, not a rectangle: the hand drops into the atom, not its box. */
const inOrbit = (zone, p) => Math.hypot(p.x - zone.at.x, p.y - zone.at.y) <= (zone.size?.w ?? SIZES.tray.w) / 2;

/**
 * The zone under a point: the smallest first (a slot inside a tray is the slot),
 * then containers, trays, the rail. Null on open table.
 */
export function zoneAt(state, p) {
  for (const s of Object.values(state.zones.slots)) {
    if (inRect(rectOf(s, SIZES.slot), p)) return { kind: 'slot', id: s.id };
  }
  for (const c of Object.values(state.zones.containers)) {
    if (inRect(rectOf(c, SIZES.container), p)) return { kind: 'container', id: c.id };
  }
  for (const t of Object.values(state.zones.trays)) {
    if (!t.orbit) {
      if (t.spot || t.nucleus || t.round) {
        const rad = (t.size?.w ?? SIZES.tray.w) / 2;
        if (Math.hypot(p.x - t.at.x, p.y - t.at.y) <= rad) return { kind: 'tray', id: t.id };
      } else if (inRect(rectOf(t, SIZES.tray), p)) {
        return { kind: 'tray', id: t.id };
      }
    }
  }
  // An ORBIT is round: either one multi-ring atom (Stage 4) or concentric shells (Stage 5).
  // A drop lands in whichever shell ring is nearest, or inside the atom's circle.
  const orbitTrays = Object.values(state.zones.trays).filter(t => t.orbit);
  if (orbitTrays.length) {
    const centers = new Map();
    for (const t of orbitTrays) {
      const key = `${t.at.x},${t.at.y}`;
      if (!centers.has(key)) centers.set(key, []);
      centers.get(key).push(t);
    }
    for (const group of centers.values()) {
      const c = group[0].at;
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (group.length === 1 && (group[0].orbit.radii?.length || 0) > 1) {
        const t = group[0];
        const maxR = Math.max(...(t.orbit.radii || [(t.size?.w ?? SIZES.tray.w) / 2]));
        const reach = Math.max(maxR + 4, (t.size?.w ?? SIZES.tray.w) / 2);
        if (d <= reach) return { kind: 'tray', id: t.id };
      } else {
        const maxR = Math.max(...group.map(t => Math.max(...(t.orbit.radii || [(t.size?.w ?? SIZES.tray.w) / 2]))));
        if (d <= maxR + 4) {
          let best = group[0];
          let bestDiff = Infinity;
          for (const t of group) {
            const r = t.orbit.radii ? t.orbit.radii[0] : (t.size?.w ?? SIZES.tray.w) / 2;
            const diff = Math.abs(d - r);
            if (diff < bestDiff) {
              bestDiff = diff;
              best = t;
            }
          }
          return { kind: 'tray', id: best.id };
        }
      }
    }
  }
  const rail = state.zones.rail;
  if (rail && inRect(rectOf(rail, SIZES.rail), p)) return { kind: 'rail', id: rail.id || 'rail' };
  return null;
}

/**
 * Where the n-th piece of an ORBIT zone sits: on the rings round the zone's centre, closest in first.
 * `zone.orbit.rings` is the number of places on each ring (2, then 8, then 8, ... by default) and
 * `zone.orbit.radii` the ring each one is drawn on, in table units. The slots are fixed, so adding or
 * taking away one electron never moves the others.
 */
export function orbitSlot(zone, n, total = 0) {
  const caps = zone.orbit.rings || [2, 8, 8, 18];
  const radii = zone.orbit.radii || caps.map((_, i) => (zone.size?.w ?? SIZES.tray.w) * (0.5 - 0.35 / Math.max(1, i + 1)));
  let ring = 0;
  let k = n;
  while (ring < caps.length - 1 && k >= caps[ring]) { k -= caps[ring]; ring++; }
  const baseCap = Math.max(1, caps[ring] || 1);
  const cap = caps.length === 1 && total > baseCap ? total : baseCap;
  const radius = radii[Math.min(ring, radii.length - 1)];
  const ringIdx = zone.orbit.ringIndex ?? ring;
  const phase = zone.orbit.phase?.[ring] ?? (-Math.PI / 2 + ringIdx * 0.4);
  const a = phase + (k * 2 * Math.PI) / cap;
  return { x: zone.at.x + Math.cos(a) * radius, y: zone.at.y + Math.sin(a) * radius };
}

/** Where a tray's or container's n-th item sits: a grid from its top-left, or a ring round an orbit's centre. */
export function layoutIn(zone, fallback, n, total = 0) {
  if (zone.orbit) return orbitSlot(zone, n, total);
  if (zone.spot || zone.nucleus) {
    if (total <= 1) return { x: zone.at.x, y: zone.at.y };
    if (total <= 4) {
      const a = (n * 2 * Math.PI) / total - Math.PI / 2;
      return { x: zone.at.x + Math.cos(a) * 2.4, y: zone.at.y + Math.sin(a) * 2.4 };
    }
    const centerCount = total <= 6 ? 1 : 2;
    const outerCount = total - centerCount;
    if (n < centerCount) {
      const off = centerCount === 1 ? 0 : (n === 0 ? -1.5 : 1.5);
      return { x: zone.at.x + off, y: zone.at.y };
    }
    const idx = n - centerCount;
    const a = (idx * 2 * Math.PI) / outerCount - Math.PI / 2;
    const rad = total <= 6 ? 3.3 : 3.8;
    return { x: zone.at.x + Math.cos(a) * rad, y: zone.at.y + Math.sin(a) * rad };
  }
  const r = rectOf(zone, fallback);
  // A zone for big pieces (a dish) declares its own pitch (`cell`); the default is for the small ones.
  const cell = zone.cell || CELL;
  // A zone for wide, flat pieces (a card of words) declares a row pitch of its own (`cellH`) as well.
  const cellH = zone.cellH || cell;
  const cols = Math.max(1, Math.floor(r.w / cell));
  const col = n % cols;
  const row = Math.floor(n / cols);
  return { x: r.x0 + cell / 2 + col * cell, y: r.y0 + cellH / 2 + row * cellH };
}

/**
 * Where the rail puts `count` pieces: evenly along it. With `gapAt` set, room
 * is left for one more piece at that index (the pieces slide apart), and the
 * result lists the positions of the `count` pieces that are there.
 */
export function railPositions(rail, count, gapAt = null) {
  const r = rectOf(rail, SIZES.rail);
  const slots = count + (gapAt === null ? 0 : 1);
  const step = r.w / Math.max(1, slots);
  const out = [];
  for (let i = 0; i < slots; i++) {
    if (gapAt !== null && i === gapAt) continue;
    out.push({ x: r.x0 + step * (i + 0.5), y: rail.at.y });
  }
  return out;
}

/** The gap a point's x is over on the rail, among the pieces other than `id`. */
export function railIndexAt(state, x, id = null) {
  const rail = state.zones.rail;
  if (!rail) return 0;
  const pos = railPositions(rail, rail.order.length);
  const centres = rail.order.map((o, i) => [o, pos[i].x]).filter(([o]) => o !== id).map(([, cx]) => cx);
  return insertionIndex(centres, x);
}

/* ---------------- joins ---------------- */

/**
 * Who could `id` join if dropped at `at`. Each candidate carries the kit's
 * planner answer, so a view can show a pair that will not hold; the list is
 * nearest first. Only pieces on open table are join targets (not hidden ones,
 * not those standing in a zone), and a piece never joins its own cluster.
 */
export function joinCandidates(state, kit, id, at) {
  const me = state.pieces[id];
  if (!me) return [];
  const mine = new Set(clusterOf(state, id));
  const out = [];
  for (const o of Object.values(state.pieces)) {
    // Joining happens on open table. A piece standing in a tray, a container,
    // a slot or on the rail is where the player put it, and a drop onto that
    // zone is a drop into the zone, never an accidental join with its tenant.
    if (mine.has(o.id) || o.hidden || o.token || o.zone) continue;
    // A kind can opt out of being joined at all (`kinds.x.nojoin`): a particle set down beside
    // another is just set down.
    if (kit.kinds?.[me.kind]?.nojoin || kit.kinds?.[o.kind]?.nojoin) continue;
    // A tool (a lens, a cutter) is laid ON things; nothing is ever laid on a tool.
    // (A tool that is itself a target, `kinds.x.target`, is the exception: an arm clipped to a hub is laid on it, and a
    // protractor is laid on the arm.)
    if (kit.kinds?.[o.kind]?.tool && !kit.kinds[o.kind].target) continue;
    // A kit may say that two pieces have nothing to do with each other (`kit.pairable`): a block set down
    // beside a block is just set down, where a hammer set on it is a blow.
    if (kit.pairable && !kit.pairable(me, o, state)) continue;
    const reach = (radiusOf(kit, me) + radiusOf(kit, o)) * JOIN_REACH;
    const dist = Math.hypot(o.at.x - at.x, o.at.y - at.y);
    if (dist <= reach) out.push({ id: o.id, dist, plan: kit.planJoin(me, o, state) });
  }
  return out.sort((a, b) => a.dist - b.dist || (a.id < b.id ? -1 : 1));
}

/**
 * What a drop at `at` means: a zone, a piece to join, or open table. This is
 * the one place a drag is turned into a `place` target, and `pointFor` is its
 * inverse, which is what lets a two-tap and a drag reach the same state.
 */
export function resolveDrop(state, kit, id, at) {
  const zone = zoneAt(state, at);
  if (zone) {
    if (zone.kind === 'rail') return { kind: 'rail', index: railIndexAt(state, at.x, id) };
    return zone;
  }
  const near = joinCandidates(state, kit, id, at)[0];
  if (near) return { kind: 'piece', id: near.id };
  return { kind: 'free', at: clampTo(state, at, radiusOf(kit, state.pieces[id])) };
}

export function clampTo(state, p, r = 0) {
  const { w, h } = state.bounds;
  return { x: Math.max(r, Math.min(w - r, p.x)), y: Math.max(r, Math.min(h - r, p.y)) };
}

/**
 * The point a drop for target `to` would be made at, so a script step can be
 * replayed as a drag. The inverse of `resolveDrop` for every kind of target.
 */
export function pointFor(state, kit, to, id) {
  const t = typeof to === 'string' ? parseTo(to) : to;
  if (t.kind === 'free') return { ...t.at };
  if (t.kind === 'slot') return { ...state.zones.slots[t.id].at };
  if (t.kind === 'tray') {
    const zone = state.zones.trays[t.id];
    if (zone?.orbit) {
      const items = itemsIn(state, 'tray:' + t.id);
      return orbitSlot(zone, items.length, items.length + 1);
    }
    return { ...zone.at };
  }
  if (t.kind === 'container') return { ...state.zones.containers[t.id].at };
  if (t.kind === 'piece') {
    // Just touching the target, on whichever side is open table and nearest it. Of every side that would land on the
    // target, the one that lands on it by the widest margin over the next piece is taken, so a pointer a hair off still
    // lands on the target (a joint standing between two atoms is only ever a hair from one of them).
    const o = state.pieces[t.id];
    const reach = (radiusOf(kit, o) + radiusOf(kit, state.pieces[id])) * 0.8;
    const spokes = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    let best = null;
    for (const k of [1, 0.75]) {
      for (const [dx, dy] of spokes) {
        const p = { x: o.at.x + dx * reach * k, y: o.at.y + dy * reach * k };
        if (zoneAt(state, p)) continue;
        const list = joinCandidates(state, kit, id, p);
        if (list[0]?.id !== t.id) continue;
        const margin = list[1] ? list[1].dist - list[0].dist : Infinity;
        if (!best || margin > best.margin + 1e-9) best = { p, margin };
      }
    }
    // A target too small to stand beside without a neighbour being nearer (a box in a row of boxes) is dropped on at its middle.
    if (!best && !zoneAt(state, o.at) && joinCandidates(state, kit, id, o.at)[0]?.id === t.id) return { ...o.at };
    return best ? best.p : { x: o.at.x + reach, y: o.at.y };
  }
  if (t.kind === 'rail') {
    const rail = state.zones.rail;
    const pos = railPositions(rail, rail.order.length);
    const xs = rail.order.map((o, i) => [o, pos[i].x]).filter(([o]) => o !== id).map(([, x]) => x);
    const i = Math.max(0, Math.min(xs.length, t.index ?? xs.length));
    const x = xs.length === 0 ? rail.at.x
      : i === 0 ? xs[0] - 1
      : i >= xs.length ? xs[xs.length - 1] + 1
      : (xs[i - 1] + xs[i]) / 2;
    return { x, y: rail.at.y };
  }
  return { x: 0, y: 0 };
}
