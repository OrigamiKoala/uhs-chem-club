/**
 * crew-sim.js — where a world's crew walk, stand and stop. Pure: no THREE, no DOM.
 *
 * The runtime (`three/npc/crew.js`) moves the bodies to what this decides, and `tools/verify-npc.mjs`
 * runs the same code for ten world-minutes to prove nobody walks through a wall, into a bench's work
 * area, into another person, or gets stuck.
 *
 * THE WORLD it needs: `colliders` (boxes `{minX,maxX,minZ,maxZ}` and discs `{x,z,radius}`, the same the
 * player walks against), `getTerrainHeight(x, z)`, and `benchAnchor(questId)` for every site in
 * `data.sites`. A bench's bay (`three/bench-bay.js` `bayBoxes`: the plate, the work air, the panels,
 * the space behind and the approach) is closed to the crew as if it were a wall, so a student at a
 * bench never has someone walk through their table or stand in their view.
 *
 * THE WALK is planned on its own 0.5 m grid (a cell is closed if a collider is within the body's radius
 * plus a hand, if it is in a bay, or if the floor there is off the main level: the crew keep out of the
 * pit). Each leg between two posts is planned once (A*, then pulled straight wherever a straight line is
 * clear) and cached.
 *
 * MEMBERS each follow a looping schedule of posts: walk there, face the post's way, play its act for its
 * time, walk on. A member stops for the player standing in its next stretch of path, and two members that
 * meet give way by id; one that has waited too long steps aside. A member being talked to stops, turns to
 * the player and holds until the talk ends.
 */

export const CREW_RADIUS = 0.3;
export const WALK_SPEED = 1.0;          // m/s, nearly the walk clip's own ground speed
const CELL = 0.5;
const CLEAR = CREW_RADIUS + 0.15;
const LOOK_AHEAD = 1.6;                  // how far down its path a walker checks for someone in the way
const PERSONAL = 0.75;                   // centre-to-centre distance that counts as in the way
const SIDESTEP_AFTER = 2.5;              // seconds waiting before stepping aside
const TALK_HOLD = 1.5;                   // seconds a member lingers after a talk before walking on

/* ------------------------------------------------------------------ bays */

/** The bay volumes of every bench as world rectangles (axis-aligned bounds of each turned box). */
export function bayRects(world, bayBoxes) {
  const out = [];
  for (const site of world.data?.sites || []) {
    const a = world.benchAnchor?.(site.questId);
    if (!a) continue;
    const c = Math.cos(a.rotationY || 0), s = Math.sin(a.rotationY || 0);
    for (const [kind, b] of Object.entries(bayBoxes())) {
      if (kind === 'lean') continue;     // air over the approach, above head height
      const xs = [], zs = [];
      for (const lx of [b.min[0], b.max[0]]) for (const lz of [b.min[2], b.max[2]]) {
        // three.js rotation.y: x' = x cos + z sin, z' = -x sin + z cos
        xs.push(a.position[0] + lx * c + lz * s);
        zs.push(a.position[2] - lx * s + lz * c);
      }
      out.push({ site: site.id, kind, floorY: a.position[1], minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) });
    }
  }
  return out;
}

const inRect = (r, x, z, pad = 0) => x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;

/* ------------------------------------------------------------------ grid */

export class WalkGrid {
  /**
   * @param {object} world   colliders + getTerrainHeight
   * @param {object[]} bays  from `bayRects`
   * @param {object} opts
   *   bounds   half-size of a square about the origin (m), or a rectangle { minX, maxX, minZ, maxZ }
   *   floor    [min, max] ground height the crew walk on
   *   maxStep  when set, ground whose height changes more than this across one 0.5 m cell is closed
   *            (a cliff, a wall face or a terrace edge), so a world with hills and ramps is walked by its
   *            slopes rather than by one flat level
   *   keepOff  discs { x, z, radius } closed as if walls (a boss arena)
   */
  constructor(world, bays, { bounds = 72, floor = [-0.6, 1.2], maxStep = null, keepOff = [], defer = false } = {}) {
    this.world = world;
    this.bays = bays;
    this.keepOff = keepOff;
    const r = typeof bounds === 'number' ? { minX: -bounds, maxX: bounds, minZ: -bounds, maxZ: bounds } : bounds;
    this.rect = r;
    this.NI = Math.round((r.maxX - r.minX) / CELL);
    this.NJ = Math.round((r.maxZ - r.minZ) / CELL);
    this.floor = floor;
    this.maxStep = maxStep;
    // Colliders bucketed on a 4 m lattice, so each cell tests only the few nearby.
    this.buckets = new Map();
    const reach = CLEAR + 0.6;
    for (const c of world.colliders) {
      const minX = c.radius !== undefined ? c.x - c.radius : c.minX, maxX = c.radius !== undefined ? c.x + c.radius : c.maxX;
      const minZ = c.radius !== undefined ? c.z - c.radius : c.minZ, maxZ = c.radius !== undefined ? c.z + c.radius : c.maxZ;
      if (!(maxX > r.minX - reach && minX < r.maxX + reach && maxZ > r.minZ - reach && minZ < r.maxZ + reach)) continue;
      for (let bi = Math.floor((minX - reach) / 4); bi <= Math.floor((maxX + reach) / 4); bi++) {
        for (let bj = Math.floor((minZ - reach) / 4); bj <= Math.floor((maxZ + reach) / 4); bj++) {
          const k = bi * 100003 + bj;
          if (!this.buckets.has(k)) this.buckets.set(k, []);
          this.buckets.get(k).push(c);
        }
      }
    }
    this.closed = new Uint8Array(this.NI * this.NJ);
    this.filled = 0;
    this.cache = new Map();
    // `defer`: the runtime fills the grid a few milliseconds a frame (`fill`) rather than all at once.
    if (!defer) this.fill(Infinity);
  }

  /** Close cells for up to `budgetMs`; true once every cell is done. */
  fill(budgetMs) {
    const total = this.NI * this.NJ;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t0 = now();
    while (this.filled < total) {
      const c = this.filled++;
      const [x, z] = this.center(Math.floor(c / this.NJ), c % this.NJ);
      this.closed[c] = this.blockedAt(x, z, CLEAR) ? 1 : 0;
      if ((this.filled & 255) === 0 && now() - t0 > budgetMs) return this.filled >= total;
    }
    return true;
  }

  get ready() { return this.filled >= this.NI * this.NJ; }

  center(i, j) { return [this.rect.minX + (i + 0.5) * CELL, this.rect.minZ + (j + 0.5) * CELL]; }

  cellOf(x, z) {
    return [Math.floor((x - this.rect.minX) / CELL), Math.floor((z - this.rect.minZ) / CELL)];
  }

  /** True when a body of radius `r` cannot stand at (x, z). */
  /** `stepTol` loosens the step test (the checks allow a little, as they do for walls). */
  blockedAt(x, z, r = CREW_RADIUS, stepTol = 0) {
    const R = this.rect;
    if (x < R.minX + 1 || x > R.maxX - 1 || z < R.minZ + 1 || z > R.maxZ - 1) return true;
    const h = this.world.getTerrainHeight;
    const y = h.call(this.world, x, z);
    if (!(y >= this.floor[0] && y <= this.floor[1])) return true;
    if (this.maxStep !== null) {
      const d = CELL / 2;
      const ys = [h.call(this.world, x + d, z), h.call(this.world, x - d, z), h.call(this.world, x, z + d), h.call(this.world, x, z - d)];
      if (Math.max(y, ...ys) - Math.min(y, ...ys) > this.maxStep + stepTol) return true;
    }
    for (const k of this.keepOff) if (Math.hypot(x - k.x, z - k.z) < k.radius + r) return true;
    const near = this.buckets.get(Math.floor(x / 4) * 100003 + Math.floor(z / 4)) || [];
    for (const c of near) {
      if (c.radius !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.radius + r) return true; }
      else if (inRect(c, x, z, r)) return true;
    }
    for (const b of this.bays) if (inRect(b, x, z, r)) return true;
    return false;
  }

  open(i, j) { return i >= 0 && j >= 0 && i < this.NI && j < this.NJ && !this.closed[i * this.NJ + j]; }

  /** True when a body walks straight from a to b with every 0.2 m of it standing clear. */
  clearLine(a, b, r = CLEAR, stepTol = 0) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / 0.2));
    for (let k = 0; k <= n; k++) {
      if (this.blockedAt(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, r, stepTol)) return false;
    }
    return true;
  }

  /** The walk from a to b as [[x, z], ...] starting at a and ending at b, or null. Cached by endpoints. */
  path(a, b) {
    const key = `${a[0].toFixed(2)},${a[1].toFixed(2)}>${b[0].toFixed(2)},${b[1].toFixed(2)}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const p = this.plan(a, b);
    this.cache.set(key, p);
    return p;
  }

  plan(a, b) {
    const NI = this.NI, NJ = this.NJ;
    const nearestOpen = ([i, j]) => {
      for (let r = 0; r < 8; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (this.open(i + di, j + dj)) return [i + di, j + dj];
      }
      return null;
    };
    const s = nearestOpen(this.cellOf(a[0], a[1]));
    const t = nearestOpen(this.cellOf(b[0], b[1]));
    if (!s || !t) return null;
    const idx = (i, j) => i * NJ + j;
    const g = new Float32Array(NI * NJ).fill(Infinity);
    const from = new Int32Array(NI * NJ).fill(-1);
    const done = new Uint8Array(NI * NJ);
    const h = (i, j) => {
      const dx = Math.abs(i - t[0]), dz = Math.abs(j - t[1]);
      return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
    };
    // A binary heap of [f, cell].
    const heap = [];
    const push = (f, c) => {
      heap.push([f, c]);
      let k = heap.length - 1;
      while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    const s0 = idx(s[0], s[1]), t0 = idx(t[0], t[1]);
    g[s0] = 0;
    push(h(s[0], s[1]), s0);
    const STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    while (heap.length) {
      const [, c] = pop();
      if (done[c]) continue;
      done[c] = 1;
      if (c === t0) break;
      const ci = Math.floor(c / NJ), cj = c % NJ;
      for (const [di, dj, w] of STEPS) {
        const ni = ci + di, nj = cj + dj;
        if (!this.open(ni, nj)) continue;
        // No cutting a corner between two closed cells.
        if (di && dj && (!this.open(ci + di, cj) || !this.open(ci, cj + dj))) continue;
        const n = idx(ni, nj);
        const ng = g[c] + w;
        if (ng < g[n]) { g[n] = ng; from[n] = c; push(ng + h(ni, nj), n); }
      }
    }
    if (!done[t0]) return null;
    const cells = [];
    for (let c = t0; c !== -1; c = from[c]) cells.push(this.center(Math.floor(c / NJ), c % NJ));
    cells.reverse();
    const pts = [a, ...cells, b];
    // Pull the string: from each kept point, go as far down the list as a straight line stays clear.
    const out = [pts[0]];
    let k = 0;
    while (k < pts.length - 1) {
      let far = k + 1;
      for (let m = pts.length - 1; m > k + 1; m--) {
        if (this.clearLine(pts[k], pts[m], CREW_RADIUS + 0.05)) { far = m; break; }
      }
      out.push(pts[far]);
      k = far;
    }
    return out;
  }
}

/* ------------------------------------------------------------------ members */

/** A small seeded random, so a run (and the check) is the same every time. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const angleTo = (dx, dz) => Math.atan2(dx, dz);   // the bodies face +z at yaw 0
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export class CrewSim {
  /**
   * @param {WalkGrid} grid
   * @param {object[]} defs   crew declarations (`src/npc/<world>-crew.js` CREW)
   * @param {object} posts    post id → { pos: [x, z], face: yaw, acts?: [...] }
   */
  constructor(grid, defs, posts, { seed = 7 } = {}) {
    this.grid = grid;
    this.posts = posts;
    this.random = rng(seed);
    this.members = defs.map((def, n) => {
      const first = posts[def.schedule[0].post];
      return {
        id: def.id, def, order: n,
        x: first.pos[0], z: first.pos[1], yaw: first.face ?? 0,
        state: 'act', act: def.schedule[0].act || 'idle',
        leg: 0, timer: this.dwell(def.schedule[0]) * (0.3 + 0.7 * this.random()),
        path: null, pi: 0, wait: 0, hold: 0, speed: 0, talking: false, stuck: 0
      };
    });
  }

  dwell(stop) {
    const [lo, hi] = Array.isArray(stop.for) ? stop.for : [stop.for || 20, stop.for || 20];
    return lo + (hi - lo) * this.random();
  }

  member(id) { return this.members.find(m => m.id === id) || null; }

  /** The talk began: stop, turn to the speaker. */
  startTalk(id) {
    const m = this.member(id);
    if (!m) return;
    m.talking = true;
    m.speed = 0;
  }

  endTalk(id) {
    const m = this.member(id);
    if (!m) return;
    m.talking = false;
    m.hold = TALK_HOLD;
  }

  /**
   * Advance everyone by `dt` seconds. `player` is { x, z } (or null when there is no player on foot).
   * Returns nothing; read `members`.
   */
  update(dt, player = null) {
    for (const m of this.members) this.step(m, dt, player);
  }

  step(m, dt, player) {
    // A member in an opening scene (`three/mystery/director.js`) is moved by the scene, not by the schedule.
    if (m.scripted) return;
    if (m.talking) {
      m.speed = 0;
      if (player) this.turn(m, angleTo(player.x - m.x, player.z - m.z), dt, 4);
      return;
    }
    if (m.hold > 0) {
      m.hold -= dt;
      m.speed = 0;
      return;
    }
    const sched = m.def.schedule;
    if (m.state === 'act') {
      const post = this.posts[sched[m.leg].post];
      if (post.face !== undefined) this.turn(m, post.face, dt, 2.5);
      m.timer -= dt;
      if (m.timer > 0) return;
      // Walk on to the next stop.
      const next = (m.leg + 1) % sched.length;
      const to = this.posts[sched[next].post].pos;
      const path = this.grid.path([m.x, m.z], to);
      if (!path) { m.timer = 5; return; }   // nowhere to go: stay a while longer
      m.leg = next;
      m.path = path;
      m.pi = 1;
      m.state = 'walk';
      m.wait = 0;
      return;
    }
    // Walking.
    const target = m.path[m.pi];
    if (!target) { this.arrive(m); return; }
    const dx = target[0] - m.x, dz = target[1] - m.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) {
      m.pi++;
      if (m.pi >= m.path.length) this.arrive(m);
      return;
    }
    const ux = dx / d, uz = dz / d;
    const blocker = this.blockerAhead(m, ux, uz, player);
    if (blocker) {
      m.speed = 0;
      m.wait += dt;
      this.turn(m, angleTo(ux, uz), dt, 3);
      if (m.wait > SIDESTEP_AFTER) this.sidestep(m, ux, uz, blocker);
      return;
    }
    m.wait = 0;
    // Turn first when the corner is sharp; walk while turning when it is gentle.
    const want = angleTo(ux, uz);
    const off = Math.abs(wrap(want - m.yaw));
    this.turn(m, want, dt, 3.2);
    const v = off > 1.2 ? 0.25 * WALK_SPEED : WALK_SPEED;
    const go = Math.min(d, v * dt);
    m.x += ux * go;
    m.z += uz * go;
    m.speed = go / Math.max(dt, 1e-6);
  }

  arrive(m) {
    const stop = m.def.schedule[m.leg];
    m.state = 'act';
    m.act = stop.act || 'idle';
    m.timer = this.dwell(stop);
    m.path = null;
    m.speed = 0;
  }

  turn(m, want, dt, rate) {
    const d = wrap(want - m.yaw);
    const k = Math.min(1, rate * dt);
    m.yaw = wrap(m.yaw + d * k);
  }

  /** Someone standing in the next stretch of this member's way: the player, or a member with the right of way. */
  blockerAhead(m, ux, uz, player) {
    const inWay = (x, z) => {
      const rx = x - m.x, rz = z - m.z;
      const along = rx * ux + rz * uz;
      if (along < 0 || along > LOOK_AHEAD) return false;
      const across = Math.abs(rx * uz - rz * ux);
      return across < PERSONAL;
    };
    if (player && inWay(player.x, player.z)) return { x: player.x, z: player.z, player: true };
    for (const o of this.members) {
      if (o === m) continue;
      if (!inWay(o.x, o.z)) continue;
      // Two walkers meeting: the one later in the roster gives way (it waits, then steps aside), so the
      // earlier one walks on until they are close; at arm's length both hold. Anyone standing is in the way.
      if (o.state === 'walk' && o.order > m.order && Math.hypot(o.x - m.x, o.z - m.z) > 2 * CREW_RADIUS + 0.35) continue;
      return { x: o.x, z: o.z };
    }
    return null;
  }

  /** Step aside: a waypoint off to the right (or left) of the blocker, then on along the path. */
  sidestep(m, ux, uz) {
    for (const side of [1, -1]) {
      for (const off of [0.9, 1.3]) {
        const sx = m.x + uz * side * off * -1 + ux * 0.3;
        const sz = m.z + ux * side * off + uz * 0.3;
        if (!this.grid.blockedAt(sx, sz, CLEAR) && this.grid.clearLine([m.x, m.z], [sx, sz], CREW_RADIUS)) {
          const rest = this.grid.path([sx, sz], m.path[m.path.length - 1]);
          if (!rest) continue;
          m.path = [[m.x, m.z], ...rest];
          m.pi = 1;
          m.wait = 0;
          return;
        }
      }
    }
    m.wait = 0;   // nowhere to step: wait again
  }
}
