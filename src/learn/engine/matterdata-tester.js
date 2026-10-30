/**
 * THE SOLIDS TABLE — Mirrowen's `q4-solids` bench (Unit 6)
 *
 * Every figure the bench tester prints, and every picture its window draws, comes from the rows and functions below. No stage types a
 * reading. PURE: no DOM, no three, Node-importable, shared by the drawn and the built tables.
 *
 * SOURCES AND ROUNDING.
 *   Melting points, °C, CRC Handbook of Chemistry and Physics ("Physical Constants of Inorganic Compounds" / "of Organic Compounds"),
 *   rounded to 1 °C: ice 0.00, gallium 29.76 (a metal that melts in the hand: the bench's trap for 'low melting means molecular'), naphthalene 80.26, iodine 113.7, sodium chloride 800.7, potassium chloride 770, copper 1084.6, iron 1538,
 *   silicon dioxide 1713. (Quartz changes crystal form on the way up and 1713 °C is the melting point of the silica crystal; the bench
 *   says "quartz" and does not follow the changes of form.) Iodine is held in a sealed tester, so it melts and does not sublime.
 *   Glass has no melting point. It goes from rigid to runny over a stretch of temperature, and the two ends given here are the two
 *   standard viscosity fixed points of a glass: the annealing point (below it the glass is rigid for practical purposes) and the
 *   softening point (above it the glass sags under its own weight). Fused silica (Corning 7980): annealing 1042 °C, softening 1585 °C,
 *   rounded to 1040 and 1585. Soda-lime window glass (Corning 0080): annealing 510 °C, softening 696 °C, rounded to 510 and 700.
 *   Hammer outcomes (`strike`) and current (`current`) are the standard behaviour of each solid: metals flatten and carry current cold and
 *   molten; salts shatter, carry none cold and some molten (free ions); quartz, glass and iodine carry none. Molten soda-lime glass
 *   carries current because its sodium ions can move; molten fused silica, iodine, naphthalene and ice-water carry none worth a lamp.
 *
 * ONE LINE IS A MODEL, NOT A TABLE: `stiffness(solid, T)`, the trace the Melt test draws. A crystal holds its shape right up to its
 * melting point and runs at it; a glass goes from rigid to runny smoothly between its two fixed points (a smoothstep between them).
 * The two numbers are real; the curve between them is the simplest honest shape. The bench's plate says it is a trace of how rigid
 * the sample stays.
 *
 * THE PICTURES (`arrangementOf`) are flat cartoons built here, not looked up: a crystal is a lattice of its own particles, an
 * amorphous solid is the same atoms joined into a network with no repeating pattern (random points, each joined to its nearest
 * neighbours up to three, from a fixed seed). The window draws exactly what these functions return.
 */

/* ------------------------------------------------------------------
   THE SOLIDS
   ------------------------------------------------------------------ */

/**
 * `kind`: molecular | ionic | metallic | network | amorphous. `crystalline`: its particles sit in a repeating pattern.
 * `melt`: [lo, hi] °C, equal for a crystal (it melts at one temperature) and apart for a glass (rigid at `lo`, runny at `hi`).
 * `strike`: what one hammer blow does: shatters | flattens | crumbles. `current`: does a lamp on two leads light cold, and molten.
 * `picture`: which arrangement the window draws.
 */
export const SOLIDS = Object.freeze({
  ice:         { id: 'ice',         name: 'ice',                  formula: 'H₂O',      kind: 'molecular',  crystalline: true,  melt: { lo: 0,    hi: 0 },    strike: 'shatters', current: { cold: false, molten: false }, picture: 'ice' },
  iodine:      { id: 'iodine',      name: 'iodine',               formula: 'I₂',       kind: 'molecular',  crystalline: true,  melt: { lo: 114,  hi: 114 },  strike: 'crumbles', current: { cold: false, molten: false }, picture: 'iodine' },
  naphthalene: { id: 'naphthalene', name: 'naphthalene',          formula: 'C₁₀H₈',    kind: 'molecular',  crystalline: true,  melt: { lo: 80,   hi: 80 },   strike: 'crumbles', current: { cold: false, molten: false }, picture: 'naphthalene' },
  salt:        { id: 'salt',        name: 'salt',                 formula: 'NaCl',     kind: 'ionic',      crystalline: true,  melt: { lo: 801,  hi: 801 },  strike: 'shatters', current: { cold: false, molten: true },  picture: 'salt' },
  potassium:   { id: 'potassium',   name: 'potassium chloride',   formula: 'KCl',      kind: 'ionic',      crystalline: true,  melt: { lo: 770,  hi: 770 },  strike: 'shatters', current: { cold: false, molten: true },  picture: 'salt' },
  gallium:     { id: 'gallium',     name: 'gallium',              formula: 'Ga',       kind: 'metallic',   crystalline: true,  melt: { lo: 30,   hi: 30 },   strike: 'shatters', current: { cold: true,  molten: true },  picture: 'copper' },
  copper:      { id: 'copper',      name: 'copper',               formula: 'Cu',       kind: 'metallic',   crystalline: true,  melt: { lo: 1085, hi: 1085 }, strike: 'flattens', current: { cold: true,  molten: true },  picture: 'copper' },
  iron:        { id: 'iron',        name: 'iron',                 formula: 'Fe',       kind: 'metallic',   crystalline: true,  melt: { lo: 1538, hi: 1538 }, strike: 'flattens', current: { cold: true,  molten: true },  picture: 'copper' },
  quartz:      { id: 'quartz',      name: 'quartz',               formula: 'SiO₂',     kind: 'network',    crystalline: true,  melt: { lo: 1713, hi: 1713 }, strike: 'shatters', current: { cold: false, molten: false }, picture: 'quartz' },
  silica:      { id: 'silica',      name: 'fused silica glass',   formula: 'SiO₂',     kind: 'amorphous',  crystalline: false, melt: { lo: 1040, hi: 1585 }, strike: 'shatters', current: { cold: false, molten: false }, picture: 'silica' },
  glass:       { id: 'glass',       name: 'window glass',         formula: 'soda-lime', kind: 'amorphous', crystalline: false, melt: { lo: 510,  hi: 700 },  strike: 'shatters', current: { cold: false, molten: true },  picture: 'glass' }
});

export const solid = id => SOLIDS[id];
export const STRIKE_WORD = Object.freeze({ shatters: 'shatters', flattens: 'flattens', crumbles: 'crumbles' });

/* ------------------------------------------------------------------
   THE TESTS
   ------------------------------------------------------------------ */

/** How rigid a sample is at `T` °C, 1 (holds its shape) to 0 (runs): a step at a crystal's melting point, a smooth fall across a glass's range. */
export function stiffness(s, T) {
  const { lo, hi } = s.melt;
  if (hi <= lo) return T < lo ? 1 : 0;
  const x = (T - lo) / (hi - lo);
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  return 1 - x * x * (3 - 2 * x);
}

/**
 * The Melt test: heat from `T0` to `maxT` °C. `{ lo, hi }` is where the trace falls (`hi` equals `lo` for a sharp fall); a sample that is
 * still rigid at `maxT` is `{ held: true, maxT }`, and one that starts to fall but is not runny by `maxT` has `hi: null`.
 */
export function meltReading(s, { T0 = 0, maxT = 2000 } = {}) {
  const { lo, hi } = s.melt;
  if (lo > maxT) return { held: true, maxT };
  if (lo < T0) return { lo: T0, hi: Math.max(T0, Math.min(hi, maxT)), maxT };
  return { lo, hi: hi > maxT ? null : hi, maxT };
}

/** The Strike test: what one hammer blow does. */
export const strikeReading = s => s.strike;

/** The Current test: does the lamp light cold, and molten? `molten` is null when the sample never runs within `maxT`, so it cannot be tested. */
export function currentReading(s, { maxT = 2000 } = {}) {
  return { cold: s.current.cold, molten: s.melt.hi > maxT ? null : s.current.molten };
}

/** The trace a Melt test draws: `[T, stiffness]` points from `T0` to `maxT`, with the vertical step of a sharp melt kept exact. */
export function meltTrace(s, { T0 = 0, maxT = 2000, n = 80 } = {}) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const T = T0 + ((maxT - T0) * i) / n;
    pts.push([T, stiffness(s, T)]);
  }
  const { lo, hi } = s.melt;
  if (hi <= lo && lo > T0 && lo <= maxT) {
    const k = pts.findIndex(p => p[0] >= lo);
    pts.splice(k, 0, [lo, 1]);
    if (pts[k + 1][0] === lo) pts[k + 1] = [lo, 0]; else pts.splice(k + 1, 0, [lo, 0]);
  }
  return pts;
}

/** A temperature as printed: whole °C with a true minus. */
export const fmtT = T => `${Math.round(T) < 0 ? '−' : ''}${Math.abs(Math.round(T))}`;

/** What a card prints for a Melt reading: `114 °C`, `510–700 °C`, `> 200 °C`. */
export function meltText(m) {
  if (m.held) return `> ${fmtT(m.maxT)} °C`;
  if (m.hi == null) return `${fmtT(m.lo)}+ °C`;
  return m.hi === m.lo ? `${fmtT(m.lo)} °C` : `${fmtT(m.lo)}–${fmtT(m.hi)} °C`;
}

/** Does the reading fall at one temperature (a sharp step), as against over a range? Null for a sample that held. */
export const isSharp = m => (m.held ? null : m.hi === m.lo);

/* ------------------------------------------------------------------
   THE PICTURES
   ------------------------------------------------------------------ */

/** A deterministic random stream (Mulberry32) from a string. */
function rng(name) {
  let a = 2166136261 >>> 0;
  for (const ch of String(name)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The panel every picture is drawn in, in picture units. */
export const PIC = Object.freeze({ w: 32, h: 18 });

/** Naphthalene's ten carbons: two six-rings sharing one edge (bond length 1, centred). */
const NAPH = { atoms: [[0, 0.5], [0, -0.5], [-0.866, 1], [-1.732, 0.5], [-1.732, -0.5], [-0.866, -1], [0.866, 1], [1.732, 0.5], [1.732, -0.5], [0.866, -1]],
  bonds: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 1], [0, 6], [6, 7], [7, 8], [8, 9], [9, 1]] };
const WATER = { atoms: [['O', 0, 0.3], ['H', -0.78, -0.35], ['H', 0.78, -0.35]], bonds: [[0, 1], [0, 2]] };
const IODINE = { atoms: [['I', -0.5, 0], ['I', 0.5, 0]], bonds: [[0, 1]] };

const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** Molecules on a grid, every one the same way up (`turn` turns every other one a quarter, as iodine packs). */
function moleculeGrid(glyph, cols, rows, dx, dy, u, { turn = false, ink = {} } = {}) {
  const atoms = []; const bonds = [];
  const x0 = (PIC.w - (cols - 1) * dx) / 2; const y0 = (PIC.h - (rows - 1) * dy) / 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = turn && (i + j) % 2 ? Math.PI / 2 : 0;
    const base = atoms.length;
    glyph.atoms.forEach(at => {
      const [el, gx, gy] = typeof at[0] === 'string' ? at : ['C', at[0], at[1]];
      const [rx, ry] = rot(gx, -gy, a);
      atoms.push({ x: x0 + i * dx + rx * u, y: y0 + j * dy + ry * u, k: el, r: (ink[el] ?? (el === 'H' ? 0.3 : 0.5)) * u * 0.6 });
    });
    glyph.bonds.forEach(([p, q]) => bonds.push([base + p, base + q]));
  }
  return { atoms, bonds, dots: [] };
}

/** Alternating discs on a square grid. */
function checker(cols, rows, pitch) {
  const atoms = [];
  const x0 = (PIC.w - (cols - 1) * pitch) / 2; const y0 = (PIC.h - (rows - 1) * pitch) / 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cation = (i + j) % 2 === 0;
    atoms.push({ x: x0 + i * pitch, y: y0 + j * pitch, k: cation ? 'cation' : 'anion', r: cation ? 1.05 : 1.7 });
  }
  return { atoms, bonds: [], dots: [] };
}

/** Metal ions packed in rows, with free electrons drifting in the gaps between them. */
function metalGrid(cols, rows, pitch) {
  const atoms = []; const dots = [];
  const r = rng('metal');
  const x0 = (PIC.w - (cols - 1) * pitch - pitch / 2) / 2 + 1; const dy = pitch * 0.866; const y0 = (PIC.h - (rows - 1) * dy) / 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) atoms.push({ x: x0 + i * pitch + (j % 2 ? pitch / 2 : 0), y: y0 + j * dy, k: 'metal', r: 1.25 });
  // The holes of the packing: the middle of each triangle of three ions that touch, kept at random.
  for (let a = 0; a < atoms.length; a++) for (let b = a + 1; b < atoms.length; b++) for (let c = b + 1; c < atoms.length; c++) {
    const A = atoms[a]; const B = atoms[b]; const Cc = atoms[c];
    if ([[A, B], [B, Cc], [A, Cc]].every(([p, q]) => Math.hypot(p.x - q.x, p.y - q.y) < pitch * 1.1) && r() < 0.35) dots.push({ x: (A.x + B.x + Cc.x) / 3, y: (A.y + B.y + Cc.y) / 3 });
  }
  return { atoms, bonds: [], dots };
}

/** A honeycomb network of `Si` nodes (each bonded to three) with an `O` at the middle of every bond. */
function honeycomb(hexCols, hexRows, b) {
  const nodes = []; const key = new Map();
  const add = (x, y) => { const k = `${Math.round(x * 20)},${Math.round(y * 20)}`; if (!key.has(k)) { key.set(k, nodes.length); nodes.push({ x, y }); } return key.get(k); };
  const edges = new Set();
  for (let j = 0; j < hexRows; j++) for (let i = 0; i < hexCols; i++) {
    const cx = i * Math.sqrt(3) * b + (j % 2 ? (Math.sqrt(3) * b) / 2 : 0); const cy = j * 1.5 * b;
    const ring = [];
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; ring.push(add(cx + b * Math.cos(a), cy + b * Math.sin(a))); }
    for (let k = 0; k < 6; k++) { const p = ring[k]; const q = ring[(k + 1) % 6]; edges.add(p < q ? `${p}-${q}` : `${q}-${p}`); }
  }
  const xs = nodes.map(n => n.x); const ys = nodes.map(n => n.y);
  const ox = (PIC.w - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs); const oy = (PIC.h - (Math.max(...ys) - Math.min(...ys))) / 2 - Math.min(...ys);
  return { nodes: nodes.map(n => ({ x: n.x + ox, y: n.y + oy })), edges: [...edges].map(e => e.split('-').map(Number)) };
}

/** Random points at least `gap` apart (a blue-noise scatter), `n` of them, inside the picture with a margin. */
function scatter(n, gap, seed, margin = 1.6) {
  const r = rng(seed); const pts = [];
  for (let tries = 0; pts.length < n && tries < 40000; tries++) {
    const p = { x: margin + r() * (PIC.w - 2 * margin), y: margin + r() * (PIC.h - 2 * margin) };
    if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= gap)) pts.push(p);
  }
  return pts;
}

/** Join each point to its nearest neighbours, shortest pairs first, three at most: a network with no repeating pattern. */
function nearestNetwork(pts, reach) {
  const pairs = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) pairs.push([Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y), i, j]);
  pairs.sort((a, b) => a[0] - b[0]);
  const deg = new Array(pts.length).fill(0); const edges = []; const arms = pts.map(() => []);
  // A bond is not laid close beside one the atom already has: the arms of an atom keep at least `spread` degrees apart.
  const spread = 70;
  const open = (i, j) => arms[i].every(k => {
    const u = [pts[j].x - pts[i].x, pts[j].y - pts[i].y]; const v = [pts[k].x - pts[i].x, pts[k].y - pts[i].y];
    return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI >= spread;
  });
  for (const [d, i, j] of pairs) {
    if (d <= reach && deg[i] < 3 && deg[j] < 3 && open(i, j) && open(j, i)) { edges.push([i, j]); deg[i]++; deg[j]++; arms[i].push(j); arms[j].push(i); }
  }
  return edges;
}

/** Silicon and oxygen from a node graph: an `Si` at every node, an `O` at the middle of every bond (the bonds run Si–O–Si). */
function silicaFrom(nodes, edges, extra = []) {
  const atoms = nodes.map(n => ({ x: n.x, y: n.y, k: 'Si', r: 0.95 }));
  const bonds = [];
  for (const [i, j] of edges) {
    const o = atoms.length;
    atoms.push({ x: (nodes[i].x + nodes[j].x) / 2, y: (nodes[i].y + nodes[j].y) / 2, k: 'O', r: 0.5 });
    bonds.push([i, o], [o, j]);
  }
  for (const e of extra) atoms.push({ x: e.x, y: e.y, k: 'cation', r: 0.9 });
  return { atoms, bonds, dots: [] };
}

const MEMO = new Map();

/**
 * The atoms, bonds and free electrons of a picture, in picture units (`PIC`): `{ atoms: [{x, y, k, r}], bonds: [[i, j]], dots: [{x, y}] }`.
 * `k` is the kind of particle (an element symbol, `cation`, `anion` or `metal`).
 */
export function arrangementOf(picture) {
  if (MEMO.has(picture)) return MEMO.get(picture);
  let out;
  if (picture === 'ice') out = moleculeGrid(WATER, 5, 3, 6.2, 5.6, 3.0);
  else if (picture === 'iodine') out = moleculeGrid(IODINE, 5, 3, 6.4, 6.0, 3.0, { turn: true, ink: { I: 0.62 } });
  else if (picture === 'naphthalene') out = moleculeGrid(NAPH, 3, 2, 10.4, 8.6, 1.9, { ink: { C: 0.6 } });
  else if (picture === 'salt') out = checker(8, 4, 3.9);
  else if (picture === 'copper') out = metalGrid(7, 5, 3.9);
  else if (picture === 'quartz') {
    const h = honeycomb(4, 3, 3.1);
    out = silicaFrom(h.nodes, h.edges);
  } else if (picture === 'silica' || picture === 'glass') {
    // The same number of silicon atoms as the crystal, scattered, then joined to their nearest neighbours.
    const hc = honeycomb(4, 3, 3.1);
    const pts = scatter(hc.nodes.length, 2.9, picture === 'silica' ? 'silica' : 'glass');
    const edges = nearestNetwork(pts, 4.4);
    const extra = picture === 'glass' ? scatter(4, 3.1, 'glass-na', 2).filter(p => pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 2.2)) : [];
    out = silicaFrom(pts, edges, extra);
  } else throw new Error(`matterdata-tester: no picture "${picture}"`);
  MEMO.set(picture, out);
  return out;
}

/**
 * The angles, in degrees, between the bonds at every silicon with three bonds (the three angles at each): measured from the drawn
 * picture. A crystal has one angle; a glass has a spread.
 */
export function bondAngles(arr) {
  const out = [];
  const nbr = arr.atoms.map(() => []);
  for (const [i, j] of arr.bonds) { nbr[i].push(j); nbr[j].push(i); }
  arr.atoms.forEach((a, i) => {
    if (a.k !== 'Si') return;
    // The Si–O bonds are the arms; between two arms the angle is measured at the silicon.
    const arms = nbr[i];
    if (arms.length !== 3) return;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) {
      const u = [arr.atoms[arms[p]].x - a.x, arr.atoms[arms[p]].y - a.y]; const v = [arr.atoms[arms[q]].x - a.x, arr.atoms[arms[q]].y - a.y];
      const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
      out.push((Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI);
    }
  });
  return out;
}
