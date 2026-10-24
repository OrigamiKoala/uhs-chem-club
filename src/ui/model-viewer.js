/**
 * model-viewer.js — stands a reward card's model up in space, small enough to sit under the card's words.
 *
 * `mountModel(host, spec)` shows the model described by a `reward.model` spec (`learn/engine/model-parts.js`): at `3D On` as solid
 * spheres and rods that turn slowly and can be turned by dragging, and at `3D Off` (or with no WebGL) as the same parts painted flat
 * on a canvas. A wave is the exception: it is a trace lying on the desk, so it is drawn flat and animated, never turned. Reduced motion
 * shows it still. It draws nothing the spec did not say: the parts, and the words under them, come from `model-parts.js`. It owns one
 * small renderer and gives it back on `dispose()`.
 */

import { modelParts, captionOf, electronAt } from '../learn/engine/model-parts.js';
import { planTrace } from '../learn/engine/lightdata.js';
import { tierManager } from '../three/tier.js';
import { session } from '../session.js';

const BG = '#0d0c0a';
/** The bench's trace moves at one on-screen speed, so a shorter wave passes more crests a second. */
const WAVE_SPEED = 130;

const smoothstep = x => x * x * (3 - 2 * x);
/** The trace is wide and short, so on a very wide card it is held to a readable length and centred. */
const plotWidth = w => Math.max(80, Math.min(1200, w - 2 * Math.max(16, w * 0.03)));
const plotPad = w => Math.max(Math.max(16, w * 0.03), (w - plotWidth(w)) / 2);
const rgbCss = rgb => `rgb(${rgb.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;

/** How far the wave has been tuned from its first wavelength to its last, 0..1, resting at each end. */
function waveTune(t) {
  const p = (t % 10) / 10;
  if (p < 0.4) return smoothstep(p / 0.4);
  if (p < 0.5) return 1;
  if (p < 0.9) return 1 - smoothstep((p - 0.5) / 0.4);
  return 0;
}

/** +1 while the wave shortens, -1 while it lengthens, 0 while it rests. */
function waveDir(t) {
  const p = (t % 10) / 10;
  return p < 0.4 ? 1 : p < 0.5 ? 0 : p < 0.9 ? -1 : 0;
}

/**
 * The wave, drawn flat on the desk: one trace against the bench's 2400 nm ruler, with the same
 * two readings the bench prints. The crests travel at one speed, so shortening the wavelength
 * crowds them together and raises the number passing the gate; the colour follows the wavelength.
 */
function drawWave(ctx, w, h, wave, state, still) {
  const pad = plotPad(w);
  const plotW = plotWidth(w);
  const top = 52;
  const rulerY = h - 26;
  const midY = (top + rulerY) / 2;
  const amp = Math.max(12, (rulerY - top) * 0.34);
  const span = wave.span || 2400;
  const plan = planTrace(state.nm, span);
  const colour = rgbCss(plan.rgb || [220, 214, 204]);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // A slate under the wave: faint graph lines, so the wave reads as lying on the desk.
  ctx.strokeStyle = 'rgba(140,131,118,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = pad; x <= pad + plotW + 0.5; x += 48) { ctx.moveTo(x, top - 6); ctx.lineTo(x, rulerY); }
  for (let y = top - 6; y <= rulerY + 0.5; y += 24) { ctx.moveTo(pad, y); ctx.lineTo(pad + plotW, y); }
  ctx.stroke();

  // The ruler: ticks every 100 nm, numbered every 400, the bench's 2400 nm span.
  ctx.strokeStyle = '#544e46';
  ctx.beginPath();
  ctx.moveTo(pad, rulerY);
  ctx.lineTo(pad + plotW, rulerY);
  ctx.stroke();
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let n = 0; n <= span; n += 100) {
    const x = pad + (n / span) * plotW;
    const major = n % 400 === 0;
    ctx.beginPath();
    ctx.moveTo(x, rulerY);
    ctx.lineTo(x, rulerY + (major ? 7 : 4));
    ctx.stroke();
    if (major && n < span) {
      ctx.fillStyle = '#6b625a';
      ctx.fillText(String(n), x, rulerY + 9);
    }
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b625a';
  ctx.fillText('nm', pad + plotW, rulerY + 9);

  // The header: the same two readings the bench prints, live.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colour;
  ctx.fillRect(pad, 10, 16, 16);
  ctx.strokeStyle = '#544e46';
  ctx.strokeRect(pad + 0.5, 10.5, 15, 15);
  ctx.fillStyle = '#8c8376';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('CREST TO CREST', pad + 24, 17);
  ctx.fillStyle = '#dcd6cc';
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${Math.round(state.nm)} nm`, pad + 24, 35);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8c8376';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('CRESTS A SECOND', w - pad, 17);
  ctx.fillStyle = '#dcd6cc';
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${plan.e14.toFixed(2)} x 10^14 /s`, w - pad, 35);

  // The trade, in the middle: one goes up exactly as the other goes down.
  if (plotW >= 560) {
    ctx.textAlign = 'center';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = state.dir ? '#d99423' : '#6b625a';
    ctx.fillText(
      state.dir > 0 ? 'WAVELENGTH \u2193   FREQUENCY \u2191'
        : state.dir < 0 ? 'WAVELENGTH \u2191   FREQUENCY \u2193'
          : still ? 'SHORTER WAVE \u00b7 FASTER CRESTS' : 'HOLDING',
      pad + plotW / 2, 28
    );
  }

  // A faint centre line, so a crest reads as a crest.
  ctx.strokeStyle = 'rgba(140,131,118,0.28)';
  ctx.beginPath();
  ctx.moveTo(pad, midY);
  ctx.lineTo(pad + plotW, midY);
  ctx.stroke();

  // The wave, travelling left to right at one on-screen speed. As the wavelength shortens,
  // more crests pass the gate each second, and the colour follows the wavelength.
  const wavelengthPx = Math.max(8, (state.nm / span) * plotW);
  const steps = Math.min(2000, Math.round(plotW * 2));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = pad + (i / steps) * plotW;
    const y = midY - amp * Math.cos(2 * Math.PI * ((x - pad) / wavelengthPx - state.phase));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // The timing gate on the right: it lights as each crest reaches it.
  const gateX = pad + plotW;
  const gateLit = Math.cos(2 * Math.PI * (plotW / wavelengthPx - state.phase)) > 0.8;
  ctx.strokeStyle = gateLit ? '#d99423' : '#544e46';
  ctx.lineWidth = gateLit ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(gateX, midY - amp * 1.15);
  ctx.lineTo(gateX, midY + amp * 1.15);
  ctx.stroke();
  if (gateLit) {
    ctx.fillStyle = '#d99423';
    ctx.beginPath();
    ctx.arc(gateX, midY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Animate a wave model on its own canvas; it lies flat, so there is nothing to turn. */
function mountWave(view, wave, still) {
  const canvas = document.createElement('canvas');
  view.appendChild(canvas);
  view.style.cursor = 'default';
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const list = wave.nm && wave.nm.length ? wave.nm : [550];
  const long = Math.max(...list);
  const short = Math.min(...list);
  const state = { nm: still ? (long + short) / 2 : long, phase: 0.15, dir: still ? 0 : 1 };
  let W = 0;
  let H = 0;
  let raf = 0;
  let ro = null;

  const paint = () => drawWave(ctx, W, H, wave, state, still);
  const resize = () => {
    const w = Math.max(240, view.clientWidth || 320);
    const h = Math.max(160, view.clientHeight || 220);
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
  };
  resize();
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resize);
    ro.observe(view);
  } else {
    window.addEventListener('resize', resize);
  }

  if (!still) {
    const t0 = performance.now();
    let last = t0;
    const frame = now => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const t = (now - t0) / 1000;
      const u = waveTune(t);
      state.nm = long + (short - long) * u;
      state.dir = waveDir(t);
      const wavelengthPx = Math.max(8, (state.nm / (wave.span || 2400)) * plotWidth(W));
      state.phase += (dt * WAVE_SPEED) / wavelengthPx;
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

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
    items.push({ z: (z0 + z1) / 2 - 0.01, draw: () => { ctx.strokeStyle = '#8c8376'; ctx.lineWidth = b.thin ? 1.2 : b.r ? Math.max(1, b.r * k * 2) : (b.order >= 3 ? 9 : b.order > 1 ? 6 : 3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } });
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
  const hint = still ? '' : parts.wave ? 'Watch the crests crowd as the colour shifts.' : 'Drag to turn it.';
  wrap.innerHTML = `<div class="lq-model-view"></div><p class="lq-model-caption">${captionOf(spec).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))} ${hint}</p>`;
  host.appendChild(wrap);
  const view = wrap.querySelector('.lq-model-view');

  // A wave is a trace on the desk, not a solid to turn: it gets its own flat, animated canvas.
  if (parts.wave) {
    const teardownWave = mountWave(view, parts.wave, still);
    return {
      dispose() {
        try { teardownWave(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

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
    const sphereGeos = new Map();
    const sphere = (r, seg = 20) => {
      const key = `${r}|${seg}`;
      if (!sphereGeos.has(key)) { const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))); geos.push(g); sphereGeos.set(key, g); }
      return sphereGeos.get(key);
    };
    for (const s of parts.spheres) {
      const m = new THREE.Mesh(sphere(s.r, s.seg || 20), mat(s.color));
      m.position.set(...s.pos);
      group.add(m);
    }
    for (const b of parts.bonds) {
      const a = new THREE.Vector3(...b.a);
      const c = new THREE.Vector3(...b.b);
      const len = a.distanceTo(c);
      const n = b.thin ? 1 : b.order >= 3 ? 3 : b.order > 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const rad = b.thin ? 0.025 : (b.r ?? (Number.isInteger(b.order) ? 0.07 : 0.05));
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
