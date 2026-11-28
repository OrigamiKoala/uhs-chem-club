/**
 * kettle/works.js — The ironworks building, built from `works-plan.js`.
 *
 * TWO GROUPS, BECAUSE THEY ARE TWO KINDS OF THING (as Ligar's `mine.js`).
 *   works-shell      the building: every room's floor, its walls (brick to the dado, ribbed sheet over it in the halls),
 *                    the headers over its doors, the retaining walls and kerbs along the open sides of the charge bank
 *                    and the tapping pit, the louvred bands high in the west walls, the roofs. `phys: 'ground'`: it is
 *                    what everything in the works stands in, measured against it as against the pavement.
 *   works-fittings   what the building carries: stanchions and roof trusses in the halls, the crane rails and the crane,
 *                    the railings, door lintels, the shutter over the charge door, and the lamps of the aisles and ramps.
 *                    Bodies, baked into one mesh per material.
 *
 * A BAY IS NOT FURNISHED HERE. Its machinery and its bench are its host's (`stations.js`), which also hangs its lamps.
 *
 * WALLS. A room's wall is a slab `WALL_T` thick standing INSIDE that room from the room's plane, so a room sees only its
 * own walls and two rooms that share a plane make a wall twice as thick between them. A wall's outer face is on the
 * plane, which is what the yard sees. A slab runs from under the lowest floor to the room's roof; over a door it starts
 * at the door's top; at a `rail` it stops at the higher floor's kerb.
 *
 * THE LIGHT. Nothing in here is lit by the sun or the sky except through a door or a louvred band: the cover mask
 * (`lib/cover.js`, set up in `kettle.js` from the plan's `coverSpec`) takes both out of every room. The bands are real
 * holes in the wall as well, so a desktop's shadow map agrees with the mask.
 */

import * as THREE from 'three';
import { SIDE } from '../lib/workings.js';
import { WALL_T } from './works-plan.js';
import { kitFor, slabGeometry } from './kit.js';
import { wallGeometry, wallMaterial } from './grime.js';

/** Brick stands this high over a hall's floor before the sheet starts. */
const DADO = 3.4;
/** A railing's top over the floor it guards, and the kerb under it. */
export const RAIL_H = 1.1;
const KERB = 0.16;
/** A hall lamp hangs high, so it is brighter and reaches further than a bay's. */
export const HALL_LAMP = { intensity: 30, distance: 24 };
export const AISLE_LAMP = { intensity: 12, distance: 14 };

/** A room's floor: a plane on its rectangle, graded where the room is a ramp. */
function floorGeometry(plan, v, tile) {
  const r = v.rect;
  const sx = r.maxX - r.minX, sz = r.maxZ - r.minZ;
  const g = new THREE.PlaneGeometry(sx, sz, Math.max(1, Math.ceil(sx / 2)), Math.max(1, Math.ceil(sz / 2)));
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (r.minX + r.maxX) / 2;
    const z = p.getZ(i) + (r.minZ + r.maxZ) / 2;
    p.setXYZ(i, x, plan.floorOf(v, x, z), z);
    uv.setXY(i, x / tile, z / tile);
  }
  g.computeVertexNormals();
  g.setAttribute('uv1', g.attributes.uv.clone());
  return g;
}

/**
 * Build the works.
 * @param {object} w the KettleWorld (`M`, `own`, `t4`, `plan`, `lamps`, `data`)
 * @returns {{ shell: THREE.Group, fittings: THREE.Group, colliders: object[] }}
 */
export function buildWorks(w) {
  const { plan, M } = w;
  const k = kitFor(w);
  const shell = new THREE.Group();
  shell.name = 'works-shell';
  shell.userData.phys = 'ground';
  const fittings = new THREE.Group();
  fittings.name = 'works-fittings';
  const colliders = [];
  const clerestory = w.data.works.clerestory || [];

  const SKIN = {
    hall: { low: M.brick, high: M.sheet, floor: M.floorSlab || M.slab, roof: M.roofSheet },
    cast: { low: M.firebrickWall, high: M.sheet, floor: M.floorPaver || M.paver, roof: M.roofSheet },
    brick: { low: M.brick, high: M.brick, floor: M.floorSlab || M.slab, roof: M.roofSheet },
    panel: { low: M.panel, high: M.panel, floor: M.floorDeck || M.deckPlate, roof: M.hallRoof },
    concrete: { low: M.wallConcrete, high: M.wallConcrete, floor: M.floorSlab || M.slab, roof: M.wallConcrete },
    firebrick: { low: M.firebrickWall, high: M.firebrickWall, floor: M.floorPaver || M.paver, roof: M.hallRoof }
  };
  const floorRange = v => plan.floorRange(v);

  /* ------------------------------------------------------------ a wall, piece by piece */

  /** A point on a room's side: `s` along it, `inset` metres into the room. */
  const onSide = (v, side, s, inset = 0) => {
    const r = v.rect, d = SIDE[side].dir;
    const plane = r[side];
    return SIDE[side].along === 'z' ? [plane + d[0] * inset, s] : [s, plane + d[1] * inset];
  };
  /** One rectangle of wall on a room's side: `[s0, s1]` along it, `[y0, y1]` up it. */
  const wallBox = (v, side, s0, s1, y0, y1, mat) => {
    if (s1 - s0 < 0.02 || y1 - y0 < 0.02) return;
    const [x, z] = onSide(v, side, (s0 + s1) / 2, WALL_T / 2);
    const size = SIDE[side].along === 'z' ? [WALL_T, y1 - y0, s1 - s0] : [s1 - s0, y1 - y0, WALL_T];
    if (!w.builtKit) { k.slab(shell, size, mat, [x, (y0 + y1) / 2, z], { tile: 2 }); return; }
    // Built: the slab in the world's frame, its grime in its vertices (`grime.js`).
    const geo = wallGeometry({ centre: [x, (y0 + y1) / 2, z], size, floorAt: (px, pz) => w.getTerrainHeight(px, pz), roof: v.top, into: SIDE[side].dir });
    const m = new THREE.Mesh(w.own(geo), wallMaterial(mat, (...o) => w.own(...o)));
    m.castShadow = m.receiveShadow = w.t4;
    shell.add(m);
  };
  /** A stretch of a room's wall, with the louvred bands cut out of it and the dado split from the sheet. */
  const wall = (v, side, s0, s1, y0, y1) => {
    const skin = SKIN[v.skin];
    let pieces = [[s0, s1, y0, y1]];
    for (const c of clerestory.filter(c2 => c2.room === v.id && c2.side === side)) {
      const next = [];
      for (const [a, b, lo, hi] of pieces) {
        if (c.hi <= a || c.lo >= b || c.y1 <= lo || c.y0 >= hi) { next.push([a, b, lo, hi]); continue; }
        if (c.y0 > lo) next.push([a, b, lo, c.y0]);
        if (c.y1 < hi) next.push([a, b, c.y1, hi]);
        const m0 = Math.max(lo, c.y0), m1 = Math.min(hi, c.y1);
        if (c.lo > a) next.push([a, c.lo, m0, m1]);
        if (c.hi < b) next.push([c.hi, b, m0, m1]);
      }
      pieces = next;
    }
    const dado = floorRange(v)[1] + DADO;
    for (const [a, b, lo, hi] of pieces) {
      if (skin.low === skin.high || hi <= dado) wallBox(v, side, a, b, lo, hi, skin.low);
      else if (lo >= dado) wallBox(v, side, a, b, lo, hi, skin.high);
      else {
        wallBox(v, side, a, b, lo, dado, skin.low); wallBox(v, side, a, b, dado, hi, skin.high);
        // Built: where the brick stops, a sloped steel sill on the room's face sheds what runs down the sheet.
        if (w.builtKit && b - a > 0.3) {
          const [x, z] = onSide(v, side, (a + b) / 2, WALL_T + 0.035);
          k.box(shell, SIDE[side].along === 'z' ? [0.07, 0.07, b - a] : [b - a, 0.07, 0.07], M.darkSteel, [x, dado + 0.01, z], null, false);
        }
      }
    }
  };

  /** A railing along `[s0, s1]` of a room's side, on that room's own floor: posts every two metres and two rails. */
  const railing = (v, side, s0, s1) => {
    const n = Math.max(1, Math.round((s1 - s0) / 2));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const s = s0 + (s1 - s0) * (i / n);
      const [x, z] = onSide(v, side, Math.min(s1 - 0.05, Math.max(s0 + 0.05, s)), 0.12);
      const [fx, fz] = onSide(v, side, Math.min(s1 - 0.05, Math.max(s0 + 0.05, s)), 0.4);
      const y = plan.floorOf(v, fx, fz);
      if (w.builtKit) {
        // Built: tube stanchions on a toe plate, tube rails, as safety rail is made.
        k.box(fittings, [0.14, 0.012, 0.14], M.darkSteel, [x, y + 0.006, z], null, false);
        k.strut(fittings, [x, y + 0.012, z], [x, y + RAIL_H + 0.02, z], 0.024, M.darkSteel, 10);
        if (prev) for (const h of [RAIL_H, RAIL_H * 0.55]) k.strut(fittings, [prev[0], prev[1] + h, prev[2]], [x, y + h, z], 0.021, M.paintYellow, 10);
      } else {
        k.box(fittings, [0.06, RAIL_H, 0.06], M.darkSteel, [x, y + RAIL_H / 2, z], null, false);
        if (prev) for (const h of [RAIL_H, RAIL_H * 0.55]) k.bar(fittings, [prev[0], prev[1] + h, prev[2]], [x, y + h, z], 0.05, M.paintYellow);
      }
      prev = [x, y, z];
    }
  };

  /* ------------------------------------------------------------ every room */

  for (const v of plan.volumes) {
    const skin = SKIN[v.skin];
    const [lo, hi] = floorRange(v);
    const yBot = Math.min(lo, 0) - 0.3;

    // THE FLOOR.
    const floor = new THREE.Mesh(w.own(floorGeometry(plan, v, w.builtKit ? 1 : 4)), skin.floor);
    floor.name = `floor-${v.id}`;
    floor.receiveShadow = w.t4;
    shell.add(floor);

    // THE WALLS: the sides minus the doorways.
    for (const seg of plan.wallSegments(v)) wall(v, seg.side, seg.from, seg.to, yBot, v.top);

    // OVER AND UNDER EVERY OPENING.
    for (const o of v.openings) {
      const other = o.to ? plan.byId.get(o.to) : null;
      const top = plan.doorTop(v, o);
      if (o.kind === 'window') {
        wall(v, o.side, o.lo, o.hi, yBot, o.sill);
        wall(v, o.side, o.lo, o.hi, o.head, v.top);
        // Glazed once, on the plane itself, by the room that names the window: a pane in a steel frame, a mullion every 2 m.
        if (other && v.id < other.id) {
          const alongZ = SIDE[o.side].along === 'z';
          const [x, z] = onSide(v, o.side, (o.lo + o.hi) / 2, 0);
          const hgt = o.head - o.sill, yc = (o.sill + o.head) / 2, len = o.hi - o.lo;
          k.box(fittings, alongZ ? [0.03, hgt, len] : [len, hgt, 0.03], M.glass, [x, yc, z], null, false);
          for (let m = o.lo; m <= o.hi + 0.01; m += 2) {
            const [mx, mz] = onSide(v, o.side, Math.min(o.hi - 0.04, Math.max(o.lo + 0.04, m)), 0);
            k.box(fittings, alongZ ? [0.1, hgt, 0.08] : [0.08, hgt, 0.1], M.darkSteel, [mx, yc, mz], null, false);
          }
          for (const y of [o.sill + 0.04, o.head - 0.04]) k.box(fittings, alongZ ? [0.12, 0.08, len] : [len, 0.08, 0.12], M.darkSteel, [x, y, z], null, false);
        }
        continue;
      }
      if (v.top - top > 0.05) wall(v, o.side, o.lo, o.hi, top, v.top);
      if (o.kind === 'rail' && other) {
        // The other room's floor along this side, two metres at a time: where it is the higher one, this room's wall
        // retains it (to a kerb's height over it); where this room's is the higher, the railing stands on this side.
        const n = Math.round((o.hi - o.lo) / 2);
        let mineHigher = false;
        for (let i = 0; i < n; i++) {
          const a = o.lo + i * 2, b = a + 2;
          const theirs = Math.max(...[a + 0.01, b - 0.01].map(s => plan.floorOf(other, ...onSide(v, o.side, s, -0.4))));
          const mine = Math.max(...[a + 0.01, b - 0.01].map(s => plan.floorOf(v, ...onSide(v, o.side, s, 0.4))));
          if (theirs > mine + 0.05) wall(v, o.side, a, b, yBot, theirs + KERB);
          else mineHigher = true;
        }
        if (mineHigher) railing(v, o.side, o.lo, o.hi);
        continue;
      }
      // A door's lintel: a steel section across its head, on this side.
      if (o.h !== undefined) {
        const [x, z] = onSide(v, o.side, (o.lo + o.hi) / 2, WALL_T + 0.08);
        const size = SIDE[o.side].along === 'z' ? [0.16, 0.3, o.hi - o.lo + 0.5] : [o.hi - o.lo + 0.5, 0.3, 0.16];
        k.box(fittings, size, M.darkSteel, [x, top - 0.15, z]);
      }
    }

    // THE ROOF: a slab on the room's own rectangle.
    const r = v.rect;
    const roof = k.slab(shell, [r.maxX - r.minX, 0.25, r.maxZ - r.minZ], skin.roof, [(r.minX + r.maxX) / 2, v.top + 0.125, (r.minZ + r.maxZ) / 2], { tile: 3 });
    roof.name = `roof-${v.id}`;
  }

  if (w.builtKit) buildExteriorTrim(w, k, shell);

  // THE LOUVRES: mullions and three blades across each band, in the wall's own thickness.
  for (const c of clerestory) {
    const v = plan.byId.get(c.room);
    const alongZ = SIDE[c.side].along === 'z';
    for (let s = c.lo + 3; s < c.hi - 0.5; s += 3) {
      const [x, z] = onSide(v, c.side, s, WALL_T / 2);
      k.box(shell, alongZ ? [WALL_T, c.y1 - c.y0, 0.16] : [0.16, c.y1 - c.y0, WALL_T], M.darkSteel, [x, (c.y0 + c.y1) / 2, z]);
    }
    for (let i = 1; i <= 3; i++) {
      const y = c.y0 + (c.y1 - c.y0) * (i / 4);
      const [x, z] = onSide(v, c.side, (c.lo + c.hi) / 2, WALL_T / 2);
      k.box(shell, alongZ ? [WALL_T, 0.05, c.hi - c.lo] : [c.hi - c.lo, 0.05, WALL_T], M.darkSteel, [x, y, z]);
    }
  }

  /* ------------------------------------------------------------ the halls' steel */

  const nave = plan.byId.get('nave'), cast = plan.byId.get('cast'), charge = plan.byId.get('charge');
  /** A stanchion against a hall's side wall, with a disc for the walk. */
  const column = (x, z, y0, y1) => {
    k.stanchion(fittings, x, z, y0, y1, { d: 0.4, b: 0.32 });
    if (w.builtKit) {
      // Built: the column stands on a grouted pad, its base plate held down by four bolts.
      k.box(fittings, [0.78, 0.1, 0.78], M.wallConcrete, [x, y0 + 0.05, z], null, false);
      k.box(fittings, [0.56, 0.04, 0.56], M.darkSteel, [x, y0 + 0.12, z], null, false);
      for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        k.cyl(fittings, [0.028, 0.028, 0.02, 6], M.darkSteel, [x + dx * 0.21, y0 + 0.15, z + dz * 0.21], null, false);
        k.cyl(fittings, [0.012, 0.012, 0.05, 6], M.darkSteel, [x + dx * 0.21, y0 + 0.17, z + dz * 0.21], null, false);
      }
    } else k.box(fittings, [0.6, 0.06, 0.6], M.darkSteel, [x, y0 + 0.03, z], null, false);
    colliders.push({ x, z, radius: 0.32 });
  };
  /** A roof truss across x at `z`: two chords, posts and diagonals. */
  const truss = (x0, x1, z, top, depth = 2.0, panels = 6) => {
    const yT = top - 0.16, yB = top - depth;
    k.bar(fittings, [x0, yB, z], [x1, yB, z], 0.2, M.darkSteel);
    k.bar(fittings, [x0, yT, z], [x1, yT, z], 0.18, M.darkSteel);
    for (let i = 0; i <= panels; i++) {
      const x = x0 + (x1 - x0) * (i / panels);
      k.bar(fittings, [x, yB, z], [x, yT, z], 0.1, M.darkSteel);
      if (i < panels) {
        const nx = x0 + (x1 - x0) * ((i + 1) / panels);
        if (i < panels / 2) k.bar(fittings, [x, yT, z], [nx, yB, z], 0.08, M.rusted); else k.bar(fittings, [x, yB, z], [nx, yT, z], 0.08, M.rusted);
      }
    }
  };
  const inset = WALL_T + 0.26;
  // The nave: frames where no door, window or ramp mouth is (so the bays between them differ). On the charge bank's
  // side the stanchions stand at the bank's edge.
  const NAVE_FRAMES = [-33, -24, -8, 0, 7.5, 18, 31, 39];
  for (const z of NAVE_FRAMES) {
    for (const sx of [-1, 1]) column(sx * (6 - inset), z, 0, nave.top);
    truss(-6 + inset, 6 - inset, z, nave.top, 2.0, 4);
  }
  // The cast house: three frames, clear of its doors and of the Golem's ground between them.
  const CAST_FRAMES = [-63, -54, -45];
  for (const z of CAST_FRAMES) {
    for (const sx of [-1, 1]) column(sx * (12 - inset), z, 0, cast.top);
    truss(-12 + inset, 12 - inset, z, cast.top, 2.2, 8);
  }
  // The charge bank: its trusses run from its east wall to the nave's stanchions at the bank's edge (one has its own post).
  for (const z of [-24, -16, -8, 0]) {
    column(charge.rect.maxX - inset, z, 3.2, charge.top);
    if (!NAVE_FRAMES.includes(z)) column(6.5, z, 3.2, charge.top);
    truss(6 + 0.4, charge.rect.maxX - inset, z, charge.top, 2.0, 8);
  }

  // THE CRANE: two rails the length of the nave on brackets off the stanchions, and the bridge standing on them.
  const RAIL_Y = 8.5;
  for (const sx of [-1, 1]) {
    const x = sx * (6 - inset - 0.42);
    k.beam(fittings, [x, RAIL_Y, nave.rect.minZ + 0.6], [x, RAIL_Y, nave.rect.maxZ - 0.6], { d: 0.5, f: 0.3 });
    k.box(fittings, [0.07, 0.07, nave.rect.maxZ - nave.rect.minZ - 1.2], M.steel, [x, RAIL_Y + 0.285, (nave.rect.minZ + nave.rect.maxZ) / 2], null, false);
    for (const z of NAVE_FRAMES) k.box(fittings, [0.5, 0.3, 0.3], M.darkSteel, [x + sx * 0.18, RAIL_Y - 0.4, z]);
  }
  {
    const z = -16, span = (6 - inset - 0.42);
    for (const dz of [-0.9, 0.9]) k.beam(fittings, [-span, RAIL_Y + 0.75, z + dz], [span, RAIL_Y + 0.75, z + dz], { d: 0.7, f: 0.34, mat: M.paintYellow });
    for (const sx of [-1, 1]) k.box(fittings, [0.5, 0.42, 2.8], M.darkSteel, [sx * span, RAIL_Y + 0.52, z]);
    k.box(fittings, [1.6, 0.5, 2.0], M.rusted, [1.4, RAIL_Y + 1.35, z]);                       // the crab
    k.cyl(fittings, [0.28, 0.28, 1.2, 14], M.darkSteel, [1.4, RAIL_Y + 1.1, z], [0, 0, Math.PI / 2]);
    k.strut(fittings, [1.4, RAIL_Y + 0.9, z], [1.4, 6.6, z], 0.025, M.darkSteel, 5);
    k.box(fittings, [0.5, 0.6, 0.3], M.paintYellow, [1.4, 6.3, z]);                            // the hook block
    k.cyl(fittings, [0.16, 0.05, 0.4, 10], M.darkSteel, [1.4, 5.8, z]);
  }

  // THE CHARGE DOOR: a shutter's drum over it on the yard side, and the track it runs in.
  {
    const gate = nave.openings.find(o => o.kind === 'gate');
    const zc = nave.rect.maxZ;
    k.box(fittings, [gate.hi - gate.lo + 0.8, 0.7, 0.6], M.darkSteel, [(gate.lo + gate.hi) / 2, gate.h + 0.45, zc + 0.32]);
    for (const x of [gate.lo - 0.14, gate.hi + 0.14]) k.box(fittings, [0.2, gate.h + 0.1, 0.14], M.darkSteel, [x, (gate.h + 0.1) / 2, zc + 0.09]);
    // The ventilator along the nave's ridge.
    k.slab(fittings, [3.2, 1.1, nave.rect.maxZ - nave.rect.minZ - 4], M.sheet, [0, nave.top + 0.8, (nave.rect.minZ + nave.rect.maxZ) / 2], { tile: 3 });
    k.slab(fittings, [4.0, 0.12, nave.rect.maxZ - nave.rect.minZ - 3.6], M.roofSheet, [0, nave.top + 1.41, (nave.rect.minZ + nave.rect.maxZ) / 2], { tile: 3 });
  }

  /* ------------------------------------------------------------ the lamps of the aisles and ramps */

  // Down the nave, hung from the trusses' chords; in the cast house, to the sides (the air over the Golem's ground is kept).
  for (const z of [39, 31, 18, 7.5, -8, -24, -33]) k.pendant(fittings, 0, 6.6, z, nave.top - 2.0, HALL_LAMP);
  for (const [x, z] of [[-8.5, -45], [8.5, -45], [-8.5, -54], [8.5, -54]]) k.pendant(fittings, x, 8, z, cast.top - 2.2, HALL_LAMP);
  const hang = (id, x, z, drop, opts = AISLE_LAMP) => {
    const v = plan.byId.get(id);
    k.pendant(fittings, x, v.top - drop, z, v.top, opts);
  };
  hang('lobby', -18, 12, 1.6);
  hang('lobby', -27, 9, 1.6);
  hang('cabin-ramp', -17, -2, 1.4);
  hang('sump-ramp', -28, -3, 1.3);
  hang('foot', 9, 24, 1.6);
  hang('charge-ramp', 9, 12, 5.6, HALL_LAMP);
  hang('charge', 11, -4, 5.4, HALL_LAMP);
  hang('charge', 12, -19, 5.4, HALL_LAMP);
  hang('pit-ramp', 19, -40, 1.6);
  hang('pit-landing', 28, -41, 1.6);

  return { shell, fittings, colliders };
}

/**
 * THE OUTSIDE OF THE WORKS (built kit only): what a brick-and-sheet shed has where it meets the weather. Along every
 * stretch of wall that faces the yard: a concrete plinth course at the foot, a steel sill where the brick stops under
 * the sheet, a gutter at the eaves and a downpipe every dozen metres; at every outside corner, a steel angle the
 * height of the wall. All of it is the shell's (`phys: 'ground'`), standing proud of the wall's outer face by
 * centimetres, under the wall colliders' reach.
 */
function buildExteriorTrim(w, k, shell) {
  const { plan, M } = w;
  const outside = (x, z) => plan.volumeAt(x, z) === null;
  const at = (v, side, s, off) => {
    const r = v.rect, d = SIDE[side].dir, plane = r[side];
    return SIDE[side].along === 'z' ? [plane + d[0] * off, s] : [s, plane + d[1] * off];
  };
  const dims = (side, along, up, out) => SIDE[side].along === 'z' ? [out, up, along] : [along, up, out];
  for (const v of plan.volumes) {
    const hall = v.skin === 'hall' || v.skin === 'cast';
    const dado = plan.floorRange(v)[1] + DADO;
    const sides = new Set();
    for (const seg of plan.wallSegments(v)) {
      // The stretches of this segment with the yard behind them, a metre at a time.
      const runs = [];
      let start = null;
      for (let s = seg.from; s <= seg.to + 1e-6; s += 0.5) {
        const sc = Math.min(seg.to - 0.05, Math.max(seg.from + 0.05, s));
        const ext = outside(...at(v, seg.side, sc, -0.6));
        if (ext && start === null) start = sc;
        if ((!ext || s + 0.5 > seg.to + 1e-6) && start !== null) { runs.push([start, ext ? seg.to : sc]); start = null; }
      }
      for (const [a0, b0] of runs) {
        const a = a0 <= seg.from + 0.06 ? seg.from : a0, b = b0 >= seg.to - 0.06 ? seg.to : b0;
        if (b - a < 0.6) continue;
        sides.add(seg.side);
        const mid = (a + b) / 2, len = b - a;
        const ground = Math.min(...[a, mid, b].map(s => w.field.outside(...at(v, seg.side, s, -0.6))));
        // The plinth course: a hand's breadth proud, from below the yard to knee height.
        const [px, pz] = at(v, seg.side, mid, -0.045);
        k.box(shell, dims(seg.side, len, 0.85, 0.09), M.wallConcrete, [px, ground + 0.12, pz], null, false);
        // The sill where the brick stops under the sheet.
        if (hall && dado < v.top - 0.5) {
          const [sx, sz] = at(v, seg.side, mid, -0.04);
          k.box(shell, dims(seg.side, len, 0.08, 0.08), M.darkSteel, [sx, dado + 0.01, sz], null, false);
        }
        // The gutter at the eaves, and its downpipes.
        const [gx, gz] = at(v, seg.side, mid, -0.11);
        k.box(shell, dims(seg.side, len, 0.18, 0.2), M.darkSteel, [gx, v.top + 0.02, gz], null, false);
        if (len > 7) {
          const n = Math.max(1, Math.round(len / 12));
          for (let i = 0; i < n; i++) {
            const s = a + len * ((i + 0.5) / n);
            const [dx, dz] = at(v, seg.side, s, -0.12);
            const g0 = w.field.outside(dx, dz);
            k.strut(shell, [dx, g0 + 0.25, dz], [dx, v.top - 0.08, dz], 0.055, M.darkSteel, 10);
            k.cyl(shell, [0.07, 0.07, 0.06, 10], M.darkSteel, [dx, v.top - 0.6, dz], null, false);
            k.cyl(shell, [0.07, 0.07, 0.06, 10], M.darkSteel, [dx, ground + 2.4, dz], null, false);
            const [ox, oz] = at(v, seg.side, s, -0.3);
            k.strut(shell, [dx, g0 + 0.28, dz], [ox, g0 + 0.1, oz], 0.055, M.darkSteel, 10);   // the shoe
          }
        }
      }
    }
    // Outside corners: both sides of the corner face the yard, and so does the diagonal.
    const r = v.rect;
    for (const [cx, cz, sxs, szs] of [[r.minX, r.minZ, 'minX', 'minZ'], [r.maxX, r.minZ, 'maxX', 'minZ'], [r.minX, r.maxZ, 'minX', 'maxZ'], [r.maxX, r.maxZ, 'maxX', 'maxZ']]) {
      if (!sides.has(sxs) || !sides.has(szs)) continue;
      const ox = sxs === 'minX' ? -1 : 1, oz = szs === 'minZ' ? -1 : 1;
      if (!outside(cx + ox * 0.6, cz + oz * 0.6) || !outside(cx + ox * 0.6, cz - oz * 0.6) || !outside(cx - ox * 0.6, cz + oz * 0.6)) continue;
      const g0 = w.field.outside(cx + ox * 0.3, cz + oz * 0.3);
      const h = v.top + 0.2 - (g0 + 0.55), y = g0 + 0.55 + h / 2;
      k.box(shell, [0.16, h, 0.035], M.darkSteel, [cx + ox * 0.06, y, cz + oz * 0.0175], null, false);
      k.box(shell, [0.035, h, 0.16], M.darkSteel, [cx + ox * 0.0175, y, cz + oz * 0.06], null, false);
    }
  }
}

/**
 * THE SHAFTS: the dust in the light that comes through each louvred band and the charge door. One mesh of thin, faint,
 * unlit prisms running from each opening down the sun's own direction to the floor it lands on. They do not glow and
 * they cast nothing: they are air with dust in it, drawn where the cover mask says the sun is.
 */
export function buildShafts(w, sun) {
  const { openings } = w.plan.coverSpec();
  const dir = sun.clone().normalize().multiplyScalar(-1);   // the way the light travels
  const pos = [];
  const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (const o of openings) {
    // The opening's four corners, and where each lands: on the floor of its reach, or its far wall.
    const corners = o.axis === 'x'
      ? [[o.at, o.lo[0], o.lo[1]], [o.at, o.lo[0], o.hi[1]], [o.at, o.hi[0], o.hi[1]], [o.at, o.hi[0], o.lo[1]]]
      : [[o.lo[0], o.lo[1], o.at], [o.hi[0], o.lo[1], o.at], [o.hi[0], o.hi[1], o.at], [o.lo[0], o.hi[1], o.at]];
    const land = corners.map(p => {
      let t = Infinity;
      for (let i = 0; i < 3; i++) {
        if (Math.abs(dir.getComponent(i)) < 1e-4) continue;
        const wallAt = dir.getComponent(i) > 0 ? o.reach.max[i] : o.reach.min[i];
        const ti = (wallAt - p[i]) / dir.getComponent(i);
        if (ti > 0) t = Math.min(t, ti);
      }
      // The floor under the light, where it is higher than the reach's own bottom.
      for (let s = 1; s < t; s += 0.5) {
        const q = [p[0] + dir.x * s, p[1] + dir.y * s, p[2] + dir.z * s];
        if (q[1] <= w.getTerrainHeight(q[0], q[2]) + 0.05) { t = s; break; }
      }
      return [p[0] + dir.x * t, p[1] + dir.y * t, p[2] + dir.z * t];
    });
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quad(corners[i], corners[j], land[j], land[i]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe2b4, transparent: true, opacity: 0.045, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(w.own(geo), w.own(mat));
  mesh.name = 'light-shafts';
  mesh.userData.noMerge = true;
  mesh.userData.phys = 'ambient';
  mesh.renderOrder = 2;
  return mesh;
}

export { slabGeometry };
