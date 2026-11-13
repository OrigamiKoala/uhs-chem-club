/**
 * kits/rate-3d.js — Quicklight's instruments stood up in space at `3D On`.
 *
 * ONE PICTURE, TWO FORMS (as `pans-3d.js`, `ph-3d.js`). The flat painters of the rate kit are pure functions of the table state and the clock.
 * This file runs the SAME painter against a recording context every frame and builds solid objects from what it drew:
 *
 *   a dark window (the reaction vessel's glass)    a glass tank: the particles in it swim through its depth and height, not on a flat sheet;
 *   a filled circle                                 a sphere (a particle, a molecule, the energy ball), ringed circles are catalyst rings;
 *   a polyline (a curve, an axis, a threshold)      a standing line of beads on a glass graph wall (or, for a collision track, laid along the plate);
 *   the curve of an energy profile                  a solid hill the ball rides on;
 *   a filled bar (the energy spread)                a solid column.
 *
 * Nothing is graded from this dress; the flat picture under it keeps every figure and every word. `userData.sync(f, state)` takes the table's
 * state, `userData.tick(dt, still)` advances the clock (`still` holds it for reduced motion).
 */

const SC = 4;
const CAP_SPHERE = 260;
const CAP_RING = 60;
const CAP_COL = 60;
const CAP_BEAD = 900;
const TANKS = 3;
const hash = i => { let x = (i + 1) * 2654435761 % 4294967296; x = ((x ^ (x >>> 15)) * 2246822519) % 4294967296; return (x % 10000) / 10000; };

/** How each instrument is stood up. `wall`: curves stand upright on a glass wall; `tank`: a dark window is a glass tank; `hill`: the profile curve is a solid. */
const KINDS = {
  kvessel: { wall: true, tank: true },
  lead: { wall: true, tank: false },
  kprofile: { wall: true, hill: true },
  plotter: { wall: true },
  mbhist: { wall: true, columns: true },
  collview: { wall: false, tank: true, rest: true, big: 1.5 }
};

function recorder() {
  const out = { dots: [], rings: [], rects: [], lines: [] };
  const st = { fillStyle: '#fff', strokeStyle: '#fff', globalAlpha: 1, lineWidth: 1 };
  let arc = null; let path = []; let cur = null; let dash = false;
  const noop = () => undefined;
  const ctx = new Proxy({}, {
    get(_, k) {
      switch (k) {
        case 'arc': return (x, y, r) => { arc = { x: x / SC, y: y / SC, r: r / SC }; };
        case 'beginPath': return () => { arc = null; path = []; cur = null; };
        case 'moveTo': return (x, y) => { cur = [{ x: x / SC, y: y / SC }]; path.push(cur); };
        case 'lineTo': return (x, y) => { if (!cur) { cur = []; path.push(cur); } cur.push({ x: x / SC, y: y / SC }); };
        case 'closePath': return noop;
        case 'setLineDash': return a => { dash = Array.isArray(a) && a.length > 0; };
        case 'fill': return () => { if (arc) out.dots.push({ ...arc, color: st.fillStyle, alpha: st.globalAlpha }); };
        case 'stroke': return () => {
          if (arc) out.rings.push({ ...arc, color: st.strokeStyle, alpha: st.globalAlpha });
          else for (const pts of path) if (pts.length >= 2) out.lines.push({ pts, color: st.strokeStyle, lw: st.lineWidth / SC, dash });
        };
        case 'fillRect': return (x, y, w, h) => { if (w > 2 && h > 1) out.rects.push({ x: x / SC, y: y / SC, w: w / SC, h: h / SC, color: st.fillStyle, alpha: st.globalAlpha }); };
        case 'measureText': return () => ({ width: 1 });
        case 'createLinearGradient': case 'createRadialGradient': return () => ({ addColorStop: noop });
        default: return k in st ? st[k] : noop;
      }
    },
    set(_, k, v) { st[k] = v; return true; }
  });
  return { ctx, out };
}

/** Read a handler's painter at `clock`: the circles, rings, bars and polylines it draws, in table units. */
export function readRate(handler, f, state, box, clock) {
  const { ctx, out } = recorder();
  const b = { X: d => d * SC, Y: d => d * SC, sc: SC, lay: { box, dials: [], rows: [], pict: { x: 4, y: 4, w: 30, h: 30 } }, clock, bodies: false, scope: '3d' };
  handler.paint(ctx, f, state, b);
  return out;
}

const alphaOf = (css, a = 1) => {
  const m = /rgba\(([^)]+)\)/.exec(String(css));
  if (!m) return a;
  const parts = m[1].split(',');
  return parts.length > 3 ? a * parseFloat(parts[3]) : a;
};
const isDark = css => {
  const s = String(css);
  if (!/^#[0-9a-f]{6}$/i.test(s)) return false;
  const n = parseInt(s.slice(1), 16);
  return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) < 120;
};

function distToLines(lines, x, y) {
  let best = 1e9;
  for (const l of lines) {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i]; const b = l.pts[i + 1];
      const dx = b.x - a.x; const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
      best = Math.min(best, Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t)));
    }
  }
  return best;
}

export function rateDress(handler, kindName) {
  const opt = KINDS[kindName] || {};
  return function dress3d(f, state, c) {
    const { THREE, scale: s, toPlate, own, box, ground } = c;
    const group = new THREE.Group();
    group.name = 'rate-3d';
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); const p = new THREE.Vector3(); const col = new THREE.Color();
    const colorOf = (css, alpha = 1) => {
      try { col.set(String(css).replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)')); } catch { col.set(0xffffff); }
      if (alpha < 1) col.lerp(new THREE.Color(0x0e1116), 1 - alpha);
      return col;
    };
    const inst = (geo, cap, rough = 0.38, metal = 0.12) => {
      const m = new THREE.InstancedMesh(geo, own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: metal })), cap);
      m.frustumCulled = false; m.count = 0; m.castShadow = false; m.receiveShadow = false;
      m.setColorAt(0, new THREE.Color(0xffffff));
      group.add(m);
      return m;
    };
    const spheres = inst(new THREE.SphereGeometry(1, 14, 10), CAP_SPHERE);
    const rings = inst(new THREE.TorusGeometry(1, 0.14, 6, 20), CAP_RING);
    const beads = inst(new THREE.SphereGeometry(1, 7, 5), CAP_BEAD, 0.5, 0.1);
    const cols = inst(new THREE.BoxGeometry(1, 1, 1), CAP_COL, 0.5, 0.1);

    const glassMat = own(new THREE.MeshStandardMaterial({ color: 0xbfd2e0, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }));
    const edgeMat = own(new THREE.LineBasicMaterial({ color: 0x9fb4c4, transparent: true, opacity: 0.7 }));
    const tanks = [];
    for (let i = 0; i < TANKS; i++) {
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(own(new THREE.BoxGeometry(1, 1, 1)), glassMat);
      mesh.renderOrder = 3;
      const edges = new THREE.LineSegments(own(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1))), edgeMat);
      const liquid = new THREE.Mesh(own(new THREE.BoxGeometry(1, 1, 1)), own(new THREE.MeshStandardMaterial({ color: 0xd89236, roughness: 0.3, transparent: true, opacity: 0.12, depthWrite: false })));
      g.add(liquid, mesh, edges); g.visible = false; g.userData.liquid = liquid; g.userData.mesh = mesh;
      group.add(g); tanks.push(g);
    }
    const wallMat = own(new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.34, depthWrite: false }));
    const wall = new THREE.Mesh(own(new THREE.BoxGeometry(1, 1, 1)), wallMat);
    wall.visible = false; wall.renderOrder = 1; group.add(wall);
    const hillMat = own(new THREE.MeshStandardMaterial({ color: 0x6f8fb0, roughness: 0.55, metalness: 0.12, transparent: true, opacity: 0.42 }));
    const hill = new THREE.Mesh(new THREE.BufferGeometry(), hillMat);
    hill.visible = false; hill.frustumCulled = false; group.add(hill);
    let hillSig = '';

    const live = { f, state, clock: 0.001 };
    const where = (x, y) => toPlate({ x, y });
    const setM = (mesh, i, px, py, pz, sx, sy, sz) => { p.set(px, py, pz); sc.set(sx, sy, sz); m4.compose(p, q, sc); mesh.setMatrixAt(i, m4); };
    const done = (mesh, n) => { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };

    const rebuild = () => {
      const out = readRate(handler, live.f, live.state, box, live.clock);
      const t = live.clock;
      const lines = out.lines;
      // The baseline the standing graph rests on: the lowest line drawn (the horizontal axis).
      let baseY = box.y0 + live.f.size.h - 4; let minX = 1e9; let maxX = -1e9; let topY = 1e9;
      if (opt.wall && lines.length) {
        baseY = -1e9;
        for (const l of lines) for (const pt of l.pts) { baseY = Math.max(baseY, pt.y); minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x); topY = Math.min(topY, pt.y); }
      }
      const H = y => Math.max(0, (baseY - y) * s);

      // Glass tanks and bars from the filled rectangles.
      const tankRects = []; let ci = 0;
      for (const r of out.rects) {
        const a = alphaOf(r.color, r.alpha);
        const dark = isDark(r.color);
        if (opt.tank && dark && r.w >= 9 && r.h >= 9 && tankRects.length < TANKS) { tankRects.push(r); continue; }
        if (opt.columns && a >= 0.5 && ci < CAP_COL) {
          const cx = r.x + r.w / 2; const pl = where(cx, baseY);
          const hh = Math.max(0.004, r.h * s);
          setM(cols, ci, pl.x, ground + 0.004 + hh / 2, pl.z - 0.8 * s, Math.max(0.003, r.w * s * 0.92), hh, 1.6 * s);
          cols.setColorAt(ci, colorOf(r.color, 1)); ci++;
        } else if (!dark && a > 0 && ci < CAP_COL && r.w * r.h > 12) {
          // A highlight region (a tap zone, a surface band): a thin slab on the plate.
          const pl = where(r.x + r.w / 2, r.y + r.h / 2);
          setM(cols, ci, pl.x, ground + 0.006, pl.z, r.w * s, 0.004 + Math.min(0.01, a * 0.02), r.h * s);
          cols.setColorAt(ci, colorOf(r.color, Math.max(0.4, a * 2))); ci++;
        }
      }
      done(cols, ci);
      tanks.forEach((g, i) => {
        const r = tankRects[i];
        g.visible = Boolean(r);
        if (!r) return;
        const th = Math.min(r.w, r.h) * 0.85 * s;
        const pl = where(r.x + r.w / 2, r.y + r.h / 2);
        g.position.set(pl.x, ground + 0.004 + th / 2, pl.z);
        g.scale.set(r.w * s, th, r.h * s);
        g.userData.liquid.scale.set(0.98, 0.7, 0.98); g.userData.liquid.position.y = -0.15;
      });

      // Spheres: swimming in a tank, standing on the graph wall at a curve, or resting on the plate.
      const nearCurve = d => opt.wall && lines.length && distToLines(lines, d.x, d.y) < 2.4;
      let si = 0;
      for (let i = 0; i < out.dots.length && si < CAP_SPHERE; i++) {
        const d = out.dots[i];
        const rad = Math.max(0.0035, d.r * s * 0.85 * (opt.big || 1));
        let px; let py; let pz;
        const tank = tankRects.find(r => d.x >= r.x && d.x <= r.x + r.w && d.y >= r.y && d.y <= r.y + r.h);
        if (tank) {
          const th = Math.min(tank.w, tank.h) * 0.85 * s;
          const pl = where(d.x, d.y);
          const ph = 0.5 + 0.5 * Math.sin(t * (0.45 + hash(i + 3) * 0.7) + i * 2.1);
          px = pl.x; pz = pl.z; py = ground + 0.004 + rad + (opt.rest ? 0 : ph * Math.max(0, th - rad * 2));
        } else if (nearCurve(d)) {
          const pl = where(d.x, baseY);
          px = pl.x; pz = pl.z - (opt.hill ? 1.5 * s : 0); py = ground + 0.006 + H(d.y) + (opt.hill ? rad * 0.6 : 0);
        } else {
          const pl = where(d.x, d.y);
          px = pl.x; pz = pl.z; py = ground + 0.008 + rad + Math.sin(t * (0.8 + hash(i + 9)) + i) * 0.4 * s;
        }
        setM(spheres, si, px, py, pz, rad, rad, rad);
        spheres.setColorAt(si, colorOf(d.color, d.alpha)); si++;
      }
      done(spheres, si);

      let ri = 0;
      for (let i = 0; i < out.rings.length && ri < CAP_RING; i++) {
        const r = out.rings[i];
        const tank = tankRects.find(k => r.x >= k.x && r.x <= k.x + k.w && r.y >= k.y && r.y <= k.y + k.h);
        const pl = where(r.x, r.y);
        let py = ground + 0.008;
        if (tank) { const th = Math.min(tank.w, tank.h) * 0.85 * s; py = ground + 0.006 + (0.5 + 0.5 * Math.sin(t * (0.5 + hash(i + 5)) + i * 1.7)) * th; }
        p.set(pl.x, py, pl.z); sc.setScalar(Math.max(0.004, r.r * s));
        q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); m4.compose(p, q, sc); rings.setMatrixAt(ri, m4);
        rings.setColorAt(ri, colorOf(r.color, r.alpha)); ri++; q.identity();
      }
      done(rings, ri);

      // Polylines: beads along each, standing on the wall (or laid on the plate for a track).
      let bi = 0;
      let hillPts = null;
      lines.forEach((l, li) => {
        const lw = Math.max(0.16, l.lw * 0.5) * s * (l.dash ? 0.7 : 1);
        const isAxis = l.pts.length <= 3;
        const radius = isAxis ? 0.16 * s : lw * 1.4;
        const keep = opt.hill && !isAxis && !l.dash && l.pts.length > 20 && !hillPts;
        if (keep) hillPts = l.pts;
        for (let i = 0; i < l.pts.length - 1 && bi < CAP_BEAD; i++) {
          const a = l.pts[i]; const b2 = l.pts[i + 1];
          const len = Math.hypot(b2.x - a.x, b2.y - a.y);
          const step = l.dash ? 1.8 : 0.8;
          const n = Math.max(1, Math.ceil(len / step));
          for (let k = 0; k < n && bi < CAP_BEAD; k++) {
            if (l.dash && k % 2) continue;
            const u = k / n; const x = a.x + (b2.x - a.x) * u; const y = a.y + (b2.y - a.y) * u;
            const pl = where(x, opt.wall ? baseY : y);
            const py = opt.wall ? ground + 0.006 + H(y) : ground + 0.02;
            setM(beads, bi, pl.x, py, pl.z - (opt.hill && !isAxis ? 1.5 * s : 0), radius, radius, radius);
            beads.setColorAt(bi, colorOf(l.color, 1)); bi++;
          }
        }
        void li;
      });
      done(beads, bi);

      // The glass wall behind a standing graph.
      if (opt.wall && lines.length && maxX > minX) {
        const wh = Math.max(0.01, H(topY) + 0.01);
        const pl = where((minX + maxX) / 2, baseY);
        wall.visible = true;
        wall.position.set(pl.x, ground + 0.004 + wh / 2, pl.z - (opt.hill ? 3.1 * s : 0.5 * s));
        wall.scale.set((maxX - minX + 2) * s, wh, 0.002);
      } else wall.visible = false;

      // The solid hill under an energy profile's curve.
      if (opt.hill && hillPts) {
        const sig = hillPts.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(';');
        if (sig !== hillSig) {
          hillSig = sig;
          const shape = new THREE.Shape();
          const first = where(hillPts[0].x, baseY);
          shape.moveTo(0, 0);
          hillPts.forEach(pt => shape.lineTo(where(pt.x, baseY).x - first.x, H(pt.y)));
          const last = hillPts[hillPts.length - 1];
          shape.lineTo(where(last.x, baseY).x - first.x, 0);
          shape.closePath();
          hill.geometry.dispose();
          hill.geometry = new THREE.ExtrudeGeometry(shape, { depth: 3 * s, bevelEnabled: false, steps: 1 });
          hill.position.set(first.x, ground + 0.006, first.z - 3 * s);
        }
        hill.visible = true;
      } else hill.visible = false;

      group.userData.counts = { dots: si, rings: ri, beads: bi, columns: ci, tanks: tankRects.length };
    };
    group.userData.sync = (nf, ns) => { live.f = nf; live.state = ns; rebuild(); };
    group.userData.tick = (dt, still) => { if (!still && dt > 0) live.clock += Math.min(dt, 0.05); rebuild(); };
    rebuild();
    return group;
  };
}

/** Give every live-or-graphed fixture of the rate kit a 3D dress made from its own painter. Run once, after the fixtures register. */
export function installRateDresses(handlers) {
  for (const [kind, h] of handlers) if (KINDS[kind] && h.paint && !h.dress3d) h.dress3d = rateDress(h, kind);
}
