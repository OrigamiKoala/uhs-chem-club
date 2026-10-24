/**
 * model-viewer.js — stands a reward card's model up in space, small enough to sit under the card's words.
 *
 * `mountModel(host, spec)` shows the model described by a `reward.model` spec (`learn/engine/model-parts.js`): at `3D On` as solid
 * spheres and rods that turn slowly and can be turned by dragging, and at `3D Off` (or with no WebGL) as the same parts painted flat
 * on a canvas. Reduced motion shows it still. It draws nothing the spec did not say: the parts, and the words under them, come from
 * `model-parts.js`. It owns one small renderer and gives it back on `dispose()`.
 */

import { modelParts, captionOf, electronAt } from '../learn/engine/model-parts.js';
import { tierManager } from '../three/tier.js';
import { session } from '../session.js';

const BG = '#0d0c0a';

/** Rotate a point about y then x. */
function turn([x, y, z], ay, ax) {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/** The flat picture: the same parts, projected, back to front. */
function paintFlat(ctx, w, h, parts, t, ay, ax) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const k = (Math.min(w, h) * 0.42) / Math.max(1, parts.radius);
  const px = ([x, y, z]) => { const [a, b, c] = turn([x, y, z], ay, ax); return [w / 2 + a * k, h / 2 - b * k, c]; };
  const items = [];
  for (const r of parts.rings) {
    const steps = 48;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push(px([r.center[0] + Math.cos(a) * r.r, r.center[1] + Math.sin(a) * r.r * Math.sin(r.tilt), r.center[2] + Math.sin(a) * r.r * Math.cos(r.tilt)]));
    }
    items.push({ z: -99, draw: () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.strokeStyle = '#544e46'; ctx.lineWidth = 1; ctx.stroke(); } });
  }
  for (const b of parts.bonds) {
    const [x0, y0, z0] = px(b.a);
    const [x1, y1, z1] = px(b.b);
    items.push({ z: (z0 + z1) / 2 - 0.01, draw: () => { ctx.strokeStyle = '#8c8376'; ctx.lineWidth = b.r ? Math.max(1, b.r * k * 2) : (b.order >= 3 ? 9 : b.order > 1 ? 6 : 3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } });
  }
  for (const s of parts.spheres) {
    const [x, y, z] = px(s.pos);
    items.push({ z, draw: () => { ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, s.r * k), 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); ctx.strokeStyle = '#2e2a26'; ctx.lineWidth = 1; ctx.stroke(); } });
  }
  for (const e of parts.electrons) {
    const [x, y, z] = px(electronAt(e, t));
    items.push({ z, draw: () => { ctx.beginPath(); ctx.arc(x, y, Math.max(2, k * 0.05), 0, Math.PI * 2); ctx.fillStyle = '#dcd6cc'; ctx.fill(); } });
  }
  items.sort((a, b) => a.z - b.z).forEach(i => i.draw());
}

/**
 * Mount a model in `host`. Returns `{ dispose }`.
 * @param {HTMLElement} host
 * @param {object} spec a `reward.model` spec
 */
export function mountModel(host, spec) {
  const parts = modelParts(spec);
  const still = Boolean(session.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const wrap = document.createElement('div');
  wrap.className = 'lq-model';
  wrap.innerHTML = `<div class="lq-model-view"></div><p class="lq-model-caption">${captionOf(spec).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))} ${still ? '' : 'Drag to turn it.'}</p>`;
  host.appendChild(wrap);
  const view = wrap.querySelector('.lq-model-view');

  let ay = 0.5;
  let ax = 0.25;
  let drag = null;
  let raf = 0;
  let disposed = false;
  let teardown = () => {};

  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.012;
    ax = Math.max(-1.2, Math.min(1.2, ax + (e.clientY - drag.y) * 0.012));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const flat = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const t0 = performance.now();
    const frame = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.004;
      paintFlat(ctx, canvas.width, canvas.height, parts, still ? 0 : (now - t0) / 1000, ay, ax);
      if (!still || drag) raf = requestAnimationFrame(frame);
    };
    frame(t0);
    if (still) { // a still picture repaints only when it is turned
      const repaint = () => paintFlat(ctx, canvas.width, canvas.height, parts, 0, ay, ax);
      view.addEventListener('pointermove', repaint);
    }
    teardown = () => canvas.remove();
  };

  const solid = async () => {
    const THREE = await import('three');
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const w = Math.max(240, view.clientWidth || 320);
    const h = 220;
    renderer.setSize(w, h);
    view.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    camera.position.set(0, 0, parts.radius * 3.2 + 1.5);
    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x1a1814, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(3, 4, 5);
    scene.add(sun);
    const group = new THREE.Group();
    scene.add(group);
    const mats = new Map();
    const mat = color => { if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.15 })); return mats.get(color); };
    const geos = [];
    const sphere = (r, seg = 20) => { const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)); geos.push(g); return g; };
    for (const s of parts.spheres) {
      const m = new THREE.Mesh(sphere(s.r), mat(s.color));
      m.position.set(...s.pos);
      group.add(m);
    }
    for (const b of parts.bonds) {
      const a = new THREE.Vector3(...b.a);
      const c = new THREE.Vector3(...b.b);
      const len = a.distanceTo(c);
      const n = b.order >= 3 ? 3 : b.order > 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const rad = b.r ?? (Number.isInteger(b.order) ? 0.07 : 0.05);
        const g = new THREE.CylinderGeometry(rad, rad, len, 10);
        geos.push(g);
        const m = new THREE.Mesh(g, mat('#8c8376'));
        m.position.copy(a).lerp(c, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize());
        // Rods of a multiple bond lie side by side across the bond's axis (a pair above and below, or three in a row).
        if (n === 2) m.position.y += (i ? 0.1 : -0.1);
        else if (n === 3) m.position.y += (i - 1) * 0.16;
        group.add(m);
      }
    }
    for (const r of parts.rings) {
      const g = new THREE.TorusGeometry(r.r, 0.008, 6, 72);
      geos.push(g);
      const m = new THREE.Mesh(g, mat('#6b625a'));
      m.position.set(...r.center);
      m.rotation.x = Math.PI / 2 - r.tilt;
      group.add(m);
    }
    const eMeshes = parts.electrons.map(e => {
      const m = new THREE.Mesh(sphere(0.06, 12), mat('#dcd6cc'));
      group.add(m);
      return m;
    });
    const t0 = performance.now();
    const frame = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.006;
      group.rotation.set(ax, ay, 0);
      const t = still ? 0 : (now - t0) / 1000;
      parts.electrons.forEach((e, i) => eMeshes[i].position.set(...electronAt(e, t)));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    teardown = () => {
      renderer.dispose();
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
      renderer.domElement.remove();
    };
  };

  const wants3D = tierManager.currentTier !== 'T1';
  if (wants3D) solid().catch(() => { if (!disposed) flat(); });
  else flat();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      try { teardown(); } catch (err) { /* gone */ }
      wrap.remove();
    }
  };
}
