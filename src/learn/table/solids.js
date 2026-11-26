/**
 * table/solids.js — atoms and molecules stand up as solids at `3D On`; the flat picture keeps everything else.
 *
 * ONE PAINTER, TWO FORMS. A bench's flat painters (`paintFixture`, `paintPiece`) are pure functions of the table, so this module runs the
 * SAME painter twice:
 *   1. against a recording context that keeps every filled circle (an atom or an ion), every stroked line that joins two of them (a
 *      bond) and every short word written on one (its symbol or charge), with the painter's own transforms applied;
 *   2. against the real canvas through a context that skips exactly those draws, so the flat picture loses its atoms, bonds and their
 *      labels and keeps its glass, scales, words and readings.
 * The recorded atoms become ball-and-stick solids (`buildSolids`): an element-coloured sphere for each circle, a rod for each bond (two
 * or three for a double or triple bond), and the symbol printed on a small tag on top of its ball. A molecule drawn space-filling
 * (circles that touch, `bonds: 'touch'`) is turned into balls and sticks the same way. What is graded is never read from the solids.
 *
 * `3D Off` has no WebGL and keeps the flat drawings: nothing here runs there (table2d strips only when `view.solids` says so, and only
 * the built table passes it). Tallow (unit01) and Lanternfall (unit02) are left as they are.
 *
 * A kit claims what it draws as particles: `claimSolids(kitId, { fixtures: { kind: cfg }, pieces: { kind: cfg } })`. `cfg`:
 *   minR, maxR   radius range, table units, of a circle that is an atom (default 0.3..6)
 *   bonds        'lines' (stroked lines between two atoms; default), 'touch' (circles that touch or overlap are bonded too), 'none'
 *   build        false: only strip the flat atoms; the kit's own dress already stands them up (a moving crowd)
 *   live         true: re-read the painter as its clock runs (a moving picture)
 *   lift         metres the lowest ball floats above the plate (default 0.002)
 *   when(f, state)  optional: claim only some of the kind's tables
 */

const SKIP_WORLDS = new Set(['unit01', 'unit02']);
const CLAIMS = new Map();
const TAU = Math.PI * 2;
const DEFAULTS = { minR: 0.3, maxR: 6, bonds: 'lines', build: true, live: false, lift: 0.002 };

/** A kit names the fixture and piece kinds whose circles are atoms. */
export function claimSolids(kitId, { fixtures = {}, pieces = {} } = {}) {
  const c = CLAIMS.get(kitId) || { fixtures: {}, pieces: {} };
  Object.assign(c.fixtures, fixtures);
  Object.assign(c.pieces, pieces);
  CLAIMS.set(kitId, c);
}

/** The claim on a fixture or a piece at `3D On` in world `skin`, or null. */
export function solidsFor(kitId, what, kind, skin, thing = null, state = null) {
  if (!skin || SKIP_WORLDS.has(skin)) return null;
  const c = CLAIMS.get(kitId)?.[what === 'piece' ? 'pieces' : 'fixtures']?.[kind];
  if (!c) return null;
  if (c.when && !c.when(thing, state)) return null;
  return { ...DEFAULTS, ...c };
}

/** Every claim, for checks. */
export function allClaims() { return CLAIMS; }

/* ------------------------------------------------------------------ recording */

const DRAWS = new Set(['fill', 'stroke', 'fillText', 'strokeText']);
let MEASURE;
const measurer = () => {
  if (MEASURE !== undefined) return MEASURE;
  try { MEASURE = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null; } catch { MEASURE = null; }
  return MEASURE;
};

function colourOf(style) {
  if (typeof style === 'string') return style;
  if (style && style.__stops?.length) {
    const s = style.__stops.slice().sort((a, b) => Math.abs(a[0] - 0.35) - Math.abs(b[0] - 0.35));
    return s[0][1];
  }
  return '#b8afa0';
}

/**
 * Run `draw(ctx)` against a context that keeps its draws. Returns `ops`: one entry per fill, stroke or text, in order, each with the
 * circles and line segments of its path (canvas pixels, transforms applied) or its text and anchor.
 */
export function record(draw, size = { width: 1024, height: 1024 }) {
  const ops = [];
  const st = { fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic' };
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let path = [];
  let pen = null;
  const tp = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const scaleOf = () => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
  const mul = (a, b, c, d, e, f) => { m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; };
  const grad = () => { const g = { __stops: [], addColorStop: (o, c) => g.__stops.push([o, c]) }; return g; };
  const noop = () => undefined;
  const fns = {
    save: () => { stack.push({ m: m.slice(), st: { ...st } }); },
    restore: () => { const s = stack.pop(); if (s) { m = s.m; Object.assign(st, s.st); } },
    translate: (x, y) => mul(1, 0, 0, 1, x, y),
    scale: (x, y) => mul(x, 0, 0, y, 0, 0),
    rotate: a => mul(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0),
    transform: (a, b, c, d, e, f) => mul(a, b, c, d, e, f),
    setTransform: (a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) => { if (typeof a === 'object' && a) { m = [a.a ?? 1, a.b ?? 0, a.c ?? 0, a.d ?? 1, a.e ?? 0, a.f ?? 0]; } else m = [a, b, c, d, e, f]; },
    resetTransform: () => { m = [1, 0, 0, 1, 0, 0]; },
    getTransform: () => ({ a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] }),
    beginPath: () => { path = []; pen = null; },
    closePath: noop,
    moveTo: (x, y) => { pen = tp(x, y); path.push({ t: 'move', p: pen }); },
    lineTo: (x, y) => { const q = tp(x, y); if (pen) path.push({ t: 'seg', a: pen, b: q }); pen = q; },
    arc: (x, y, r, s0 = 0, s1 = TAU, ccw = false) => {
      const sweep = Math.abs(s1 - s0);
      path.push({ t: 'arc', c: tp(x, y), r: r * scaleOf(), full: sweep >= TAU - 0.02 || (ccw && sweep === 0) });
      pen = tp(x + r * Math.cos(s1), y + r * Math.sin(s1));
    },
    ellipse: (x, y, rx, ry, rot, s0 = 0, s1 = TAU) => {
      const full = Math.abs(s1 - s0) >= TAU - 0.02;
      path.push(Math.abs(rx - ry) <= 0.12 * Math.max(rx, ry) ? { t: 'arc', c: tp(x, y), r: ((rx + ry) / 2) * scaleOf(), full } : { t: 'other' });
      pen = null;
    },
    rect: () => { path.push({ t: 'other' }); },
    roundRect: () => { path.push({ t: 'other' }); },
    quadraticCurveTo: (cx, cy, x, y) => { path.push({ t: 'other' }); pen = tp(x, y); },
    bezierCurveTo: (a, b, c, d, x, y) => { path.push({ t: 'other' }); pen = tp(x, y); },
    arcTo: (a, b, x, y) => { path.push({ t: 'other' }); pen = tp(x, y); },
    fill: arg => { ops.push({ kind: 'fill', path: arg && typeof arg === 'object' ? [{ t: 'other' }] : path.slice(), color: colourOf(st.fillStyle), alpha: st.globalAlpha }); },
    stroke: arg => { ops.push({ kind: 'stroke', path: arg && typeof arg === 'object' ? [{ t: 'other' }] : path.slice(), color: colourOf(st.strokeStyle), alpha: st.globalAlpha, width: st.lineWidth * scaleOf() }); },
    fillText: (t, x, y) => { ops.push({ kind: 'text', text: String(t), at: tp(x, y), color: colourOf(st.fillStyle), font: st.font, align: st.textAlign, base: st.textBaseline }); },
    strokeText: (t, x, y) => { ops.push({ kind: 'text', text: String(t), at: tp(x, y), color: colourOf(st.strokeStyle), stroke: true }); },
    measureText: t => {
      // The real canvas measures, so a painter that fits its words by their width draws the same draws here as on the plate.
      const m2 = measurer();
      if (m2) { m2.font = st.font; return m2.measureText(t); }
      const px = Number(/(\d+(?:\.\d+)?)px/.exec(st.font)?.[1] || 10);
      return { width: String(t).length * px * 0.58, actualBoundingBoxAscent: px * 0.72, actualBoundingBoxDescent: px * 0.2 };
    },
    createLinearGradient: grad,
    createRadialGradient: grad,
    createConicGradient: grad,
    createPattern: () => null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)), width: w, height: h }),
    putImageData: noop,
    drawImage: noop,
    setLineDash: noop,
    getLineDash: () => [],
    clip: noop,
    isPointInPath: () => false
  };
  const canvas = { width: size.width || 1024, height: size.height || 1024 };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k === 'canvas') return canvas;
      if (k in fns) return fns[k];
      if (k in st) return st[k];
      return noop;
    },
    set(_, k, v) { st[k] = v; return true; },
    has: () => true
  });
  try { draw(ctx); } catch (e) { /* a painter that throws on the recorder leaves its picture flat */ return null; }
  return ops;
}

/* ------------------------------------------------------------------ reading */

const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Read a recording: atoms (circles in the claimed size range), the bonds between them and the labels on them, plus the indexes of the
 * draws that made them (`skip`), in canvas pixels. `sc` is canvas pixels per table unit.
 */
export function readOps(ops, sc, cfg) {
  const atoms = [];
  const skip = new Set();
  const minPx = cfg.minR * sc; const maxPx = cfg.maxR * sc;
  const inside = (c, r) => atoms.findIndex(a => near(a.c, c) + r <= a.r * 1.08);
  ops.forEach((op, i) => {
    if (op.kind !== 'fill' || !op.path.length || op.path.some(s => s.t !== 'arc' || !s.full)) return;
    if (op.alpha < 0.2) return;
    let mine = false;
    for (const a of op.path) {
      const host = inside(a.c, a.r);
      if (host >= 0) {
        // A shade, a highlight or a core painted on an atom already read: part of that atom.
        const h = atoms[host];
        if (near(h.c, a.c) < h.r * 0.15 && a.r >= h.r * 0.7) h.color = op.color;
        mine = true;
        continue;
      }
      if (a.r < minPx || a.r > maxPx) continue;
      atoms.push({ c: a.c, r: a.r, color: op.color, alpha: op.alpha, label: '' });
      mine = true;
    }
    if (mine) skip.add(i);
  });
  const atomAt = (p, slack) => {
    let best = -1; let bd = Infinity;
    atoms.forEach((a, j) => { const d = near(a.c, p); if (d <= a.r * slack + 1 && d < bd) { bd = d; best = j; } });
    return best;
  };
  const bondCount = new Map();
  const addBond = (i, j) => { if (i === j || i < 0 || j < 0) return; const k = i < j ? `${i}-${j}` : `${j}-${i}`; bondCount.set(k, (bondCount.get(k) || 0) + 1); };
  ops.forEach((op, i) => {
    if (op.kind === 'stroke') {
      if (!op.path.length) return;
      let all = true;
      const segs = [];
      for (const s of op.path) {
        if (s.t === 'move') continue;
        if (s.t === 'arc') {
          // An atom's outline (a rim round the ball, a charge ring on it).
          const h = atoms.findIndex(a => near(a.c, s.c) < a.r * 0.2 && Math.abs(s.r - a.r) <= a.r * 0.35);
          if (h < 0) all = false;
          continue;
        }
        if (s.t !== 'seg') { all = false; continue; }
        if (cfg.bonds === 'none') { all = false; continue; }
        const A = atomAt(s.a, 1.6); const B = atomAt(s.b, 1.6);
        if (A >= 0 && B >= 0 && A !== B) segs.push([A, B]);
        else if (A >= 0 && A === B) { /* a mark inside one atom (a charge sign) */ } else all = false;
      }
      if (all) {
        skip.add(i);
        for (const [A, B] of segs) addBond(A, B);
      }
    } else if (op.kind === 'text') {
      const t = op.text.trim();
      if (!t || t.length > 5) return;
      const j = atomAt(op.at, 1.15);
      if (j < 0) return;
      skip.add(i);
      if (!atoms[j].label) atoms[j].label = t;
      else if (atoms[j].label.length + t.length <= 5) atoms[j].label += t;
    }
  });
  if (cfg.bonds === 'touch') {
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = near(atoms[i].c, atoms[j].c);
        if (d < (atoms[i].r + atoms[j].r) * 0.98 && d > Math.max(atoms[i].r, atoms[j].r) * 0.35) {
          const k = `${i}-${j}`;
          if (!bondCount.has(k)) bondCount.set(k, 1);
        }
      }
    }
  }
  const bonds = [...bondCount].map(([k, n]) => { const [a, b] = k.split('-').map(Number); return { a, b, order: Math.min(3, n) }; });
  return { atoms, bonds, skip };
}

/** A context that passes everything through to `real` but skips the draws in `skip` (indexes into the same painter's draws). */
export function stripping(real, skip) {
  let n = 0;
  return new Proxy(real, {
    get(target, k) {
      if (DRAWS.has(k)) {
        const fn = target[k];
        return (...args) => { const i = n++; if (skip.has(i)) return undefined; return fn.apply(target, args); };
      }
      const v = target[k];
      return typeof v === 'function' ? v.bind(target) : v;
    },
    set(target, k, v) { target[k] = v; return true; }
  });
}

/** Paint `draw` on `ctx` without the atoms, bonds and labels it draws. `sc`: canvas pixels per table unit. */
export function paintStripped(ctx, draw, sc, cfg) {
  const ops = record(draw, ctx.canvas || undefined);
  if (!ops) { draw(ctx); return null; }
  const read = readOps(ops, sc, cfg);
  draw(read.skip.size ? stripping(ctx, read.skip) : ctx);
  return read;
}

/* ------------------------------------------------------------------ building */

const SYMBOL_COLOUR = { H: 0xe9e4d8, C: 0x3a3733, N: 0x4a6fb5, O: 0xc8432f, F: 0x8fbf5a, Cl: 0x5fa14a, Br: 0x8a3b26, I: 0x6b3f8a, S: 0xd2b43c, P: 0xd07a2c, Na: 0x8d6fc2, K: 0x7a5bb0, Ca: 0x8a8f80, Mg: 0x5c9a54, Fe: 0xb06a3a, Cu: 0xc07a45, Zn: 0x8c93a0, Ag: 0xbfc2c4, Li: 0xb07ad0 };

/**
 * Lay a recording out as solids. Returns a Group whose `userData.set(read, place)` re-lays it from a fresh reading.
 * `place(px, py)` maps canvas pixels to `{ x, z }` metres in the group's frame; `pxToM` is metres per canvas pixel; `baseY` the plate.
 */
export function buildSolids(THREE, own, { cap = 160, rodCap = 240, baseY = 0, lift = 0.002 } = {}) {
  const group = new THREE.Group();
  group.name = 'solid-atoms';
  const ballMat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.06 }));
  const rodMat = own(new THREE.MeshStandardMaterial({ color: 0x8c8376, roughness: 0.55, metalness: 0.12 }));
  const balls = new THREE.InstancedMesh(own(new THREE.SphereGeometry(1, 20, 14)), ballMat, cap);
  const rods = new THREE.InstancedMesh(own(new THREE.CylinderGeometry(1, 1, 1, 10)), rodMat, rodCap);
  for (const im of [balls, rods]) { im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = false; group.add(im); }
  balls.setColorAt(0, new THREE.Color(0xffffff));
  const tags = new THREE.Group();
  group.add(tags);
  const tagTex = new Map();
  const tagPool = [];
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const v = new THREE.Vector3(); const sv = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0); const col = new THREE.Color(); const dark = new THREE.Color(0x100f0c);

  const texFor = (text, ink) => {
    const key = `${text}|${ink}`;
    if (tagTex.has(key)) return tagTex.get(key);
    if (typeof document === 'undefined') return null;
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const x = cv.getContext('2d');
    if (!x) return null;
    x.clearRect(0, 0, 128, 128);
    x.font = `700 ${text.length > 2 ? 46 : 64}px Quantico, "JetBrains Mono", monospace`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 10; x.strokeStyle = 'rgba(12,11,9,0.85)'; x.strokeText(text, 64, 68);
    x.fillStyle = ink; x.fillText(text, 64, 68);
    const tex = own(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    tagTex.set(key, tex);
    return tex;
  };
  const tagGeo = own(new THREE.PlaneGeometry(1, 1));

  group.userData.set = (read, place, pxToM) => {
    if (!read) { balls.count = 0; rods.count = 0; tags.children.forEach(t => { t.visible = false; }); return; }
    const { atoms, bonds } = read;
    // Molecules (atoms joined by bonds) lie level: each at the height of its biggest ball.
    const root = atoms.map((_, i) => i);
    const find = i => (root[i] === i ? i : (root[i] = find(root[i])));
    for (const b of bonds) root[find(b.a)] = find(b.b);
    const bonded = new Set(bonds.flatMap(b => [b.a, b.b]));
    const rad = atoms.map((a, i) => a.r * pxToM * (bonded.has(i) ? 0.6 : 0.9));
    const top = new Map();
    atoms.forEach((a, i) => { const k = find(i); top.set(k, Math.max(top.get(k) || 0, rad[i])); });
    const pos = atoms.map((a, i) => { const p = place(a.c[0], a.c[1]); return [p.x, baseY + lift + top.get(find(i)), p.z]; });
    const n = Math.min(cap, atoms.length);
    for (let i = 0; i < n; i++) {
      v.set(...pos[i]); sv.setScalar(Math.max(0.0015, rad[i])); q.identity();
      m4.compose(v, q, sv); balls.setMatrixAt(i, m4);
      const sym = /^[A-Z][a-z]?/.exec(atoms[i].label || '')?.[0];
      try { col.set(String(atoms[i].color)); } catch { col.set(SYMBOL_COLOUR[sym] ?? 0xb8afa0); }
      if (atoms[i].alpha < 1) col.lerp(dark, Math.min(0.6, 1 - atoms[i].alpha));
      balls.setColorAt(i, col);
    }
    balls.count = n;
    balls.instanceMatrix.needsUpdate = true;
    if (balls.instanceColor) balls.instanceColor.needsUpdate = true;
    let r = 0;
    for (const b of bonds) {
      if (b.a >= n || b.b >= n) continue;
      const A = new THREE.Vector3(...pos[b.a]); const B = new THREE.Vector3(...pos[b.b]);
      const len = A.distanceTo(B);
      if (len < 1e-5) continue;
      const dir = B.clone().sub(A).normalize();
      const thick = Math.max(0.0008, Math.min(rad[b.a], rad[b.b]) * (b.order > 1 ? 0.2 : 0.28));
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(thick * 2.2);
      const offs = b.order === 1 ? [0] : b.order === 2 ? [-0.5, 0.5] : [-1, 0, 1];
      q.setFromUnitVectors(up, dir);
      for (const o of offs) {
        if (r >= rodCap) break;
        v.copy(A).lerp(B, 0.5).addScaledVector(side, o);
        sv.set(thick, len, thick);
        m4.compose(v, q, sv); rods.setMatrixAt(r++, m4);
      }
    }
    rods.count = r;
    rods.instanceMatrix.needsUpdate = true;
    // The symbol (or charge) a flat atom carried is printed on a tag lying on top of its ball.
    let t = 0;
    for (let i = 0; i < n; i++) {
      const label = atoms[i].label;
      if (!label) continue;
      const sym = /^[A-Z][a-z]?/.exec(label)?.[0];
      try { col.set(String(atoms[i].color)); } catch { col.set(SYMBOL_COLOUR[sym] ?? 0xb8afa0); }
      const lum = 0.299 * col.r + 0.587 * col.g + 0.114 * col.b;
      const tex = texFor(label, lum > 0.52 ? '#14100c' : '#f5f0e6');
      if (!tex) continue;
      let mesh = tagPool[t];
      if (!mesh) {
        mesh = new THREE.Mesh(tagGeo, own(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })));
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 3;
        tagPool[t] = mesh; tags.add(mesh);
      }
      if (mesh.material.map !== tex) { mesh.material.map = tex; mesh.material.needsUpdate = true; }
      const w = Math.max(0.006, rad[i] * 2.1);
      mesh.scale.set(w, w, 1);
      mesh.position.set(pos[i][0], pos[i][1] + rad[i] + 0.0006, pos[i][2]);
      mesh.visible = true;
      t++;
    }
    for (let k = t; k < tagPool.length; k++) tagPool[k].visible = false;
    group.userData.counts = { atoms: n, bonds: bonds.length, rods: r, tags: t };
  };
  return group;
}

/* ------------------------------------------------------------------ fixtures and pieces */

const SC = 8; // recorder pixels per table unit

/**
 * The solids over a claimed fixture. `paint(ctx, f, state, b)` is the kit's fixture painter; `c` the dress context table3d gives a
 * `dress3d` (`THREE`, `scale`, `toPlate`, `own`, `box`, `ground`). Returns a Group with `userData.sync/update/tick`, or null.
 */
export function fixtureSolids(paint, f, state, c, cfg, layOf) {
  if (!cfg || cfg.build === false) return null;
  const { THREE, scale: s, toPlate, own, ground } = c;
  const live = { f, state, clock: 0.001, acc: 0 };
  const take = () => {
    const lay = layOf(live.f, live.state);
    const X = u => u * SC; const Y = u => u * SC;
    const b = { x0: X(lay.box.x0), y0: Y(lay.box.y0), x1: X(lay.box.x1), y1: Y(lay.box.y1), sc: SC, X, Y, lay, bodies: true, clock: live.clock, scope: '' };
    const W = Math.ceil(X(lay.box.x1) + SC); const H = Math.ceil(Y(lay.box.y1) + SC);
    const ops = record(ctx => paint(ctx, live.f, live.state, b), { width: W, height: H });
    return ops ? readOps(ops, SC, cfg) : null;
  };
  const first = take();
  // Room for a crowd that grows (a chain that splits, a sample that fills): half again what the first reading holds.
  const n = first?.atoms.length || 0;
  const solids = buildSolids(THREE, own, { baseY: ground, lift: cfg.lift, cap: Math.max(160, Math.ceil(n * 1.5) + 16), rodCap: Math.max(240, (first?.bonds.length || 0) * 4 + 24) });
  const lay = r => solids.userData.set(r, (px, py) => toPlate({ x: px / SC, y: py / SC }), s / SC);
  const read = () => lay(take());
  lay(first);
  solids.userData.update = (nf, ns) => { live.f = nf || live.f; live.state = ns || live.state; read(); };
  solids.userData.sync = solids.userData.update;
  solids.userData.tick = (dt, still) => {
    if (!cfg.live || still) return;
    live.clock += Math.min(dt, 0.05); live.acc += dt;
    if (live.acc < 1 / 30) return;
    live.acc = 0;
    read();
  };
  return solids;
}

/**
 * The solids standing on a claimed piece: the piece's face is painted without them (`paintStripped`), and this lays them on top.
 * `paintPiece` is the kit's; `K` the face's canvas pixels per table unit; `s` metres per table unit; `top` the face's height.
 */
export function pieceSolids(THREE, own, paintPiece, p, state, o, cfg, { K, s, top }) {
  if (!cfg || cfg.build === false) return null;
  const ops = record(ctx => paintPiece(ctx, p, state, o), { width: Math.ceil(o.x * 2), height: Math.ceil(o.y * 2) });
  if (!ops) return null;
  const read = readOps(ops, K, cfg);
  if (!read.atoms.length) return null;
  const solids = buildSolids(THREE, own, { baseY: top, lift: cfg.lift ?? 0.001, cap: Math.max(8, read.atoms.length), rodCap: Math.max(8, read.bonds.length * 3) });
  solids.userData.set(read, (px, py) => ({ x: ((px - o.x) / K) * s, z: ((py - o.y) / K) * s }), s / K);
  return solids;
}
