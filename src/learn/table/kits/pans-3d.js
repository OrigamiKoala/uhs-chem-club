/**
 * kits/pans-3d.js — The pans kit's moving models, stood up in space at `3D On`.
 *
 * ONE PICTURE, TWO FORMS. The flat painters of the pans kit (`pans-pan.js`, `pans-ratio.js`, `pans-ice.js`, `pans-free.js`, `pans-cards.js`,
 * `pans-stress.js`, `pans-beaker.js`, `pans-clips.js`) are pure functions of the table state and the clock. This file runs the SAME painter
 * against a recording context every frame: a filled circle becomes a sphere, a ringed circle a ring, a filled coloured rectangle a glass
 * column standing up from the plate, and a particle drawn inside a column floats inside it. So the 3D crowd is, particle for particle, the
 * crowd the flat bench draws; nothing is graded from it, and the flat picture under the dress keeps every figure.
 *
 * Gravity does not matter: window particles hover over the plate at their own heights and bob; column particles float in the column.
 * `dress3d(f, state, c)` returns a Group whose `userData.sync(f, state)` takes the table's state and whose `userData.tick(dt, still)`
 * advances the clock (`still` holds it for reduced motion) and re-reads the painter. At most CAP spheres, RINGS rings, COLS columns.
 */

import { allFixtureHandlers } from './pans-registry.js';

const SC = 4;
const CAP = 220;
const RINGS = 80;
const COLS = 16;
const DARK = new Set(['#100f0c', '#16140f', '#0a0908', '#1b2227', '#1d1a16', '#2a2620', '#2c2412']);
const hash = i => { let x = (i + 1) * 2654435761 % 4294967296; x = ((x ^ (x >>> 15)) * 2246822519) % 4294967296; return (x % 10000) / 10000; };

/** The context a painter draws on when it is being read, not shown: it keeps circles, rings and rectangles. */
export function recorder() {
  const out = { dots: [], rings: [], rects: [] };
  const st = { fillStyle: '#fff', strokeStyle: '#fff', globalAlpha: 1, lineWidth: 1 };
  let pending = null;
  const noop = () => undefined;
  const ctx = new Proxy({}, {
    get(_, k) {
      switch (k) {
        case 'arc': return (x, y, r) => { pending = { x: x / SC, y: y / SC, r: r / SC }; };
        case 'beginPath': return () => { pending = null; };
        case 'fill': return () => { if (pending) out.dots.push({ ...pending, color: st.fillStyle, alpha: st.globalAlpha }); };
        case 'stroke': return () => { if (pending) out.rings.push({ ...pending, color: st.strokeStyle, alpha: st.globalAlpha }); };
        case 'fillRect': return (x, y, w, h) => { if (w > 2 && h > 1 && !DARK.has(String(st.fillStyle))) out.rects.push({ x: x / SC, y: y / SC, w: w / SC, h: h / SC, color: st.fillStyle, alpha: st.globalAlpha }); };
        case 'measureText': return () => ({ width: 1 });
        case 'createLinearGradient': case 'createRadialGradient': return () => ({ addColorStop: noop });
        default: return k in st ? st[k] : noop;
      }
    },
    set(_, k, v) { st[k] = v; return true; }
  });
  return { ctx, out };
}

/** Read a fixture's painter at `clock`: the circles, rings and rectangles it draws, in table units. */
export function readPainter(handler, f, state, box, clock, scope = '3d') {
  const { ctx, out } = recorder();
  const b = { X: d => d * SC, Y: d => d * SC, sc: SC, lay: { box, dials: [], rows: [], pict: { x: 4, y: 4, w: 30, h: 30 } }, clock, bodies: false, scope };
  handler.paint(ctx, f, state, b);
  return out;
}

export function dressRecorded(handler) {
  return function dress3d(f, state, c) {
    const { THREE, scale: s, toPlate, own, box, ground } = c;
    const group = new THREE.Group();
    group.name = 'pans-crowd';
    const mk = (geo, color, cap) => {
      const m = new THREE.InstancedMesh(geo, own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.15 })), cap);
      m.frustumCulled = false; m.count = 0; m.castShadow = false;
      m.setColorAt(0, new THREE.Color(color));
      group.add(m);
      return m;
    };
    const spheres = mk(new THREE.SphereGeometry(1, 12, 8), 0xffffff, CAP);
    const rings = mk(new THREE.TorusGeometry(1, 0.12, 6, 18), 0xe59b24, RINGS);
    const cols = mk(new THREE.BoxGeometry(1, 1, 1), 0xffffff, COLS);
    cols.material.transparent = true; cols.material.opacity = 0.34; cols.renderOrder = 2;
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); const p = new THREE.Vector3();
    const col = new THREE.Color();
    const live = { f, state, clock: 0.001 };
    const colorOf = (css, alpha = 1) => {
      try { col.set(String(css)); } catch { col.set(0xffffff); }
      if (alpha < 1) col.lerp(new THREE.Color(0x100f0c), 1 - alpha);
      return col;
    };
    const where = (x, y) => toPlate({ x, y });
    const rebuild = () => {
      const out = readPainter(handler, live.f, live.state, box, live.clock);
      // The columns: a filled coloured rectangle stands up from the plate, as wide as it is on the flat bench, as deep as it is wide.
      const bars = out.rects.slice(0, COLS);
      bars.forEach((r, i) => {
        const cx = r.x + r.w / 2; const cy = r.y + r.h;
        const pl = where(cx, cy);
        sc.set(Math.max(0.002, r.w * s), Math.max(0.002, r.h * s), Math.max(0.002, r.w * s));
        p.set(pl.x, ground + 0.004 + (r.h * s) / 2, pl.z - (r.w * s) / 2);
        m4.compose(p, q, sc); cols.setMatrixAt(i, m4);
        cols.setColorAt(i, colorOf(r.color, r.alpha));
      });
      cols.count = bars.length; cols.instanceMatrix.needsUpdate = true; if (cols.instanceColor) cols.instanceColor.needsUpdate = true;
      const inBar = d => bars.find(r => d.x >= r.x - 0.2 && d.x <= r.x + r.w + 0.2 && d.y >= r.y - 0.2 && d.y <= r.y + r.h + 0.2);
      const dots = out.dots.slice(0, CAP);
      dots.forEach((d, i) => {
        const bar = inBar(d);
        const rad = Math.max(0.0035, d.r * s * 0.85);
        let pos;
        if (bar) {
          // A particle drawn inside a column floats inside it: across the column, up it by how far it is from the foot, and in depth by its own number.
          const pl = where(d.x, bar.y + bar.h);
          pos = [pl.x, ground + 0.004 + (bar.y + bar.h - d.y) * s, pl.z - bar.w * s * (0.2 + 0.6 * hash(i))];
        } else {
          const pl = where(d.x, d.y);
          pos = [pl.x, ground + 0.008 + hash(i) * 4 * s + Math.sin(live.clock * (0.8 + hash(i + 9)) + i) * 0.5 * s, pl.z];
        }
        p.set(pos[0], pos[1], pos[2]); sc.setScalar(rad);
        m4.compose(p, q, sc); spheres.setMatrixAt(i, m4);
        // A dark dot in a column takes the column's own colour, lightened, so it shows against the glass.
        if (bar && /^rgba\(16, ?15/.test(String(d.color))) spheres.setColorAt(i, colorOf(bar.color).clone().lerp(new THREE.Color(0xffffff), 0.55));
        else spheres.setColorAt(i, colorOf(d.color, d.alpha));
      });
      spheres.count = dots.length; spheres.instanceMatrix.needsUpdate = true; if (spheres.instanceColor) spheres.instanceColor.needsUpdate = true;
      const rs = out.rings.slice(0, RINGS);
      rs.forEach((r, i) => {
        const near = dots.findIndex(d => Math.abs(d.x - r.x) < 0.05 && Math.abs(d.y - r.y) < 0.05);
        const bar = near >= 0 ? inBar(dots[near]) : null;
        const pl = where(r.x, r.y);
        const h = near >= 0 ? ground + 0.008 + hash(near) * 4 * s + Math.sin(live.clock * (0.8 + hash(near + 9)) + near) * 0.5 * s : ground + 0.008;
        p.set(pl.x, bar ? ground + 0.004 + (bar.y + bar.h - r.y) * s : h, pl.z);
        sc.setScalar(Math.max(0.004, r.r * s));
        q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        m4.compose(p, q, sc); rings.setMatrixAt(i, m4);
        rings.setColorAt(i, colorOf(r.color, r.alpha));
        q.identity();
      });
      rings.count = rs.length; rings.instanceMatrix.needsUpdate = true; if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
      group.userData.counts = { dots: dots.length, rings: rs.length, columns: bars.length };
    };
    group.userData.sync = (nf, ns) => { live.f = nf; live.state = ns; rebuild(); };
    group.userData.tick = (dt, still) => { if (!still && dt > 0) live.clock += Math.min(dt, 0.05); rebuild(); };
    rebuild();
    return group;
  };
}

/** Give every live fixture of the pans kit a 3D dress made from its own painter. Run once, after every bench has registered. */
export function installDresses() {
  for (const h of allFixtureHandlers()) if (h.live && h.paint && !h.dress3d) h.dress3d = dressRecorded(h);
}
