/**
 * engine/cellscene.js — the generic mechanism model of Brinewire's benches. Pure, no DOM, no THREE.
 *
 * `sceneAt(spec, t)` turns a SPEC (what is in the bench now: vessels, metal strips, a wire, a salt bridge, ions, bubbles) into primitives at
 * clock time `t` seconds: `{ boxes, balls, lines, texts }` in one 3D box, x 0..1 across, y 0..0.5 up, z -0.14..0.14 deep. The flat painter
 * (`kits/cell-scene.js`) projects x and y; the 3D dress puts the same primitives in space (things may hover). Both read this, so the picture is
 * one fact. Specs are built from the planners in `engine/cellscenes.js`; a spec never carries an answer, only what is on the table.
 *
 * SPEC: { vessels:[{x0,x1,liquid}], strips:[{x,color,loss,gain,coat,label}], wire:{from,to,flow,queued,dir}|null,
 *         bridge:{flow}|null, ions:[{v,color,label,n,mode:'wait'|'to'|'from',strip}], bubbles:[{strip,color,n}], note }
 */

export const TOP = 0.46;          // height of the wire over the vessels
export const VESSEL_H = 0.3;
const frac = x => x - Math.floor(x);
const hash = (i, k) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
const ease = p => p * p * (3 - 2 * p);
const MAX_BALLS = 60;

function along(poly, p) {
  const seg = poly.slice(1).map((b, i) => Math.hypot(b[0] - poly[i][0], b[1] - poly[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = p * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const u = seg[i] ? Math.min(1, d / seg[i]) : 0;
      return [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * u, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * u];
    }
    d -= seg[i];
  }
  return poly[poly.length - 1];
}

export function stripTop(s) { return 0.02 + 0.34; }

export function sceneAt(spec, t) {
  const boxes = []; const balls = []; const lines = []; const texts = [];
  const vessels = spec.vessels || []; const strips = spec.strips || [];
  vessels.forEach((v, i) => {
    boxes.push({ kind: 'glass', x: (v.x0 + v.x1) / 2, y: VESSEL_H / 2, z: 0, w: v.x1 - v.x0, h: VESSEL_H, d: 0.26, color: '#9fb4c0', a: 0.12 });
    boxes.push({ kind: 'liquid', x: (v.x0 + v.x1) / 2, y: (VESSEL_H * 0.78) / 2, z: 0, w: v.x1 - v.x0 - 0.01, h: VESSEL_H * 0.78, d: 0.25, color: v.liquid || '#2f4a56', a: 0.42 });
  });
  strips.forEach((s, i) => {
    const w = 0.036 * (1 - 0.55 * (s.loss || 0));
    boxes.push({ kind: 'strip', x: s.x, y: 0.02 + 0.17, z: 0, w, h: 0.34, d: 0.1, color: s.color, a: 1 });
    if (s.gain > 0) boxes.push({ kind: 'coat', x: s.x, y: 0.02 + 0.13, z: 0, w: w + 0.012 * s.gain + 0.004, h: 0.26 * Math.min(1, 0.35 + s.gain), d: 0.1 + 0.012 * s.gain, color: s.coat || s.color, a: 1 });
    if (s.label) texts.push({ x: s.x, y: -0.045, label: s.label });
  });
  // The wire: strip tops, up, across, down.
  for (const w of spec.wires || (spec.wire ? [spec.wire] : [])) {
    const a = strips[w.from]; const b = strips[w.to];
    const poly = [[a.x, 0.36], [a.x, TOP], [b.x, TOP], [b.x, 0.36]];
    lines.push({ pts: poly.map(([x, y]) => [x, y, 0]), color: '#6b625a' });
    const dir = w.dir === -1 ? -1 : 1;
    const n = Math.min(12, w.flow || 0);
    for (let i = 0; i < n; i++) {
      const p = frac(t * 0.3 * (w.speed || 1) * dir + i / Math.max(1, n));
      const [x, y] = along(poly, p);
      balls.push({ kind: 'e', x, y, z: 0, r: 0.011, color: '#e59b24', a: 1, label: '−' });
    }
    const end = dir === -1 ? a : b;
    for (let i = 0; i < Math.min(8, w.queued || 0); i++) {
      balls.push({ kind: 'e', x: end.x - 0.04 + (i % 4) * 0.026 + Math.sin(t * 7 + i) * 0.004, y: 0.4 + Math.floor(i / 4) * 0.032 + Math.cos(t * 6 + i) * 0.004, z: 0, r: 0.011, color: '#e59b24', a: 1, label: '−', prob: true });
    }
  }
  // The salt bridge: an arch between the first two vessels; cations run one way, anions the other.
  if (spec.bridge && vessels.length > 1) {
    const x0 = (vessels[0].x0 + vessels[0].x1) / 2 + 0.06; const x1 = (vessels[1].x0 + vessels[1].x1) / 2 - 0.06;
    const arch = [[x0, 0.25], [x0, 0.37], [x1, 0.37], [x1, 0.25]];
    lines.push({ pts: arch.map(([x, y]) => [x, y, 0.1]), color: spec.bridge.rod ? '#b8b0a0' : '#8fb0c8', thick: true });
    const n = Math.min(6, spec.bridge.flow || 0);
    for (let i = 0; i < n; i++) {
      const sign = i % 2 ? -1 : 1;
      const p = frac(t * 0.2 * sign + i / Math.max(1, n));
      const [x, y] = along(arch, p);
      balls.push({ kind: 'ion', x, y, z: 0.1, r: 0.012, color: sign > 0 ? '#9aa3b8' : '#c9c4a0', a: 1, label: sign > 0 ? '+' : '−' });
    }
  }
  // Ions.
  (spec.ions || []).forEach((g, gi) => {
    const v = vessels[g.v] || vessels[0];
    const n = Math.min(14, g.n || 0);
    const st = strips[g.strip];
    for (let i = 0; i < n; i++) {
      const k = gi * 31 + i;
      const homeX = v.x0 + 0.04 + hash(k, 1) * (v.x1 - v.x0 - 0.08);
      const homeY = 0.04 + hash(k, 2) * (VESSEL_H * 0.7 - 0.04);
      const homeZ = (hash(k, 3) - 0.5) * 0.18;
      let x = homeX + Math.sin(t * (0.9 + hash(k, 4)) + k) * 0.015; let y = homeY + Math.cos(t * (1.1 + hash(k, 5)) + k) * 0.015; let z = homeZ; let a = 1;
      if (st && (g.mode === 'to' || g.mode === 'from')) {
        const p = frac(t * (g.rate || 0.22) + hash(k, 6));
        const sx = st.x + (homeX < st.x ? -0.025 : 0.025);
        if (g.mode === 'to') { x = homeX + (sx - homeX) * ease(p); y = homeY + (0.14 - homeY) * ease(p); z = homeZ * (1 - ease(p)); a = p > 0.94 ? 0 : 1; }
        else { x = sx + (homeX - sx) * ease(p); y = 0.14 + (homeY - 0.14) * ease(p); z = homeZ * ease(p); a = 1 - p * p; }
      }
      balls.push({ kind: 'ion', x, y, z, r: 0.017, color: g.color, a, label: g.label || '', prob: Boolean(g.prob) });
    }
  });
  (spec.bubbles || []).forEach((b, bi) => {
    const st = strips[b.strip];
    for (let i = 0; i < Math.min(6, b.n || 0); i++) {
      const p = frac(t * 0.35 + i / 6 + bi * 0.17);
      balls.push({ kind: 'gas', x: st.x + (hash(i + bi * 9, 7) - 0.5) * 0.05, y: 0.12 + p * 0.3, z: (hash(i, 8) - 0.5) * 0.06, r: 0.009 + 0.004 * p, color: b.color || '#dcd6cc', a: 0.9 - p * 0.5, label: '' });
    }
  });
  if (balls.length > MAX_BALLS) balls.length = MAX_BALLS;
  if (spec.note) texts.push({ x: 0.5, y: 0.5, label: spec.note, note: true });
  return { boxes, balls, lines, texts };
}

/** A spec is live when anything in it is set to move. */
export const specLive = spec => Boolean(spec && ((spec.wires || (spec.wire ? [spec.wire] : [])).some(w => w.flow || w.queued) || (spec.ions || []).some(g => g.n) || (spec.bubbles || []).some(b => b.n) || spec.bridge?.flow));

export const sceneSignature = (spec, t) => JSON.stringify(sceneAt(spec, t));
