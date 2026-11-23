/**
 * shape-explainer.js — 3D/2D molecular shape explainer for Ligar's VSEPR bench (`q6-shape`).
 *
 * Shows:
 *   - Central atom + bonded atoms and rods from `vsepr.planDomains`
 *   - Elongated translucent pear-shaped lone pair lobes with two electron dots (never spheres that look like atoms)
 *   - An amber angle arc and crisp angle measurement label on every shape
 *   - Optional `morphFrom: 'CH4'` animation (for H₂O): starts in tetrahedral 109.5° geometry and morphs
 *     smoothly into bent 104.5° as the two lone pairs expand and push the bonds closer together.
 */

import * as THREE from 'three';
import { planDomains, RIG_MOLECULES, angleBetween } from '../learn/engine/vsepr.js';
import { COLOR } from '../learn/engine/model-parts-ligar.js';
import { session } from '../session.js';
import { tierManager } from '../three/tier.js';

const RADIUS = { H: 0.25, C: 0.38, N: 0.36, O: 0.34, F: 0.30, B: 0.36, S: 0.44, Cl: 0.44, P: 0.42, Xe: 0.46 };
const dim = el => RADIUS[el] || 0.34;
const lenOf = sym => (sym === 'H' ? 1.05 : 1.25);

const ease = x => x * x * (3 - 2 * x);
const norm3 = v => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};
const lerp3 = (a, b, t) => norm3([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);

/** Pick two bonded arms whose angle matches the canonical bond angle to display. */
function pickAnglePair(plan, spec) {
  const bonded = plan.vectors.map((v, i) => ({ v, i })).filter(x => x.v.kind !== 'lone');
  if (bonded.length < 2) return null;
  if (spec.mol === 'PCl5') {
    // Pick two equatorial bonds (120°)
    for (let a = 0; a < bonded.length; a++) {
      for (let b = a + 1; b < bonded.length; b++) {
        const ang = angleBetween(plan, bonded[a].i, bonded[b].i);
        if (Math.abs(ang - 120) < 3) return [bonded[a].i, bonded[b].i, ang];
      }
    }
  }
  let best = [bonded[0].i, bonded[1].i, angleBetween(plan, bonded[0].i, bonded[1].i)];
  for (let a = 0; a < bonded.length; a++) {
    for (let b = a + 1; b < bonded.length; b++) {
      const ang = angleBetween(plan, bonded[a].i, bonded[b].i);
      if (ang < best[2]) best = [bonded[a].i, bonded[b].i, ang];
    }
  }
  return best;
}

/** Build an elongated pear/teardrop lone-pair lobe mesh aligned along +Y from y=0..L. */
function makeLonePairLobe(geos, mats) {
  const g = new THREE.Group();
  const L = 1.15;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const y = u * L;
    const rad = 0.36 * Math.sin(u * Math.PI) * (0.22 + 0.95 * Math.pow(u, 0.72));
    pts.push(new THREE.Vector2(Math.max(0.002, rad), y));
  }
  const lobeGeo = new THREE.LatheGeometry(pts, 24);
  geos.push(lobeGeo);
  const lobeMat = new THREE.MeshPhysicalMaterial({
    color: 0xe5a83b,
    emissive: 0x4a2a04,
    emissiveIntensity: 0.38,
    roughness: 0.16,
    metalness: 0,
    transparent: true,
    opacity: 0.36,
    clearcoat: 1,
    depthWrite: false
  });
  mats.push(lobeMat);
  g.add(new THREE.Mesh(lobeGeo, lobeMat));

  const eGeo = new THREE.SphereGeometry(0.072, 12, 10);
  geos.push(eGeo);
  const eMat = new THREE.MeshStandardMaterial({
    color: 0xfff0b8,
    emissive: 0xe59b24,
    emissiveIntensity: 0.95,
    roughness: 0.2
  });
  mats.push(eMat);
  for (const sx of [-1, 1]) {
    const dot = new THREE.Mesh(eGeo, eMat);
    dot.position.set(sx * 0.11, L * 0.68, 0);
    g.add(dot);
  }
  return g;
}

/** Build a curved 3D amber arc between two unit vectors `va` and `vb` at radius `rad`. */
function makeAngleArcPoints(va, vb, rad = 0.68, steps = 20) {
  const A = new THREE.Vector3(...va).normalize();
  const B = new THREE.Vector3(...vb).normalize();
  const dot = Math.max(-1, Math.min(1, A.dot(B)));
  const omega = Math.acos(dot);
  const pts = [];
  if (omega > Math.PI - 0.04) {
    // 180° arc: curve cleanly through a perpendicular axis
    const perp = Math.abs(A.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const mid = new THREE.Vector3().crossVectors(A, perp).normalize();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      pts.push(A.clone().multiplyScalar(Math.cos(a) * rad).addScaledVector(mid, Math.sin(a) * rad));
    }
    return pts;
  }
  const sinO = Math.sin(omega) || 1;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const p = A.clone().multiplyScalar(Math.sin((1 - f) * omega) / sinO)
      .addScaledVector(B, Math.sin(f * omega) / sinO)
      .normalize().multiplyScalar(rad);
    pts.push(p);
  }
  return pts;
}

/** Mount a crisp 3D (or 2D fallback) VSEPR shape explainer with labeled angles and elongated lone pairs. */
export function mountShapeExplainer(host, spec) {
  const mol = RIG_MOLECULES[spec.mol];
  if (!mol) return null;
  const plan = planDomains(mol.arms);
  const morphPlan = spec.morphFrom && RIG_MOLECULES[spec.morphFrom]
    ? planDomains(RIG_MOLECULES[spec.morphFrom].arms)
    : null;
  const pair = pickAnglePair(plan, spec);
  const baseAngleText = spec.angleLabel || (pair ? `${Number.isInteger(pair[2]) ? pair[2] : pair[2].toFixed(1)}°` : '');

  const wrap = document.createElement('div');
  wrap.className = 'lq-model';
  wrap.style.position = 'relative';
  const stage = document.createElement('div');
  stage.className = 'lq-model-stage';
  stage.style.position = 'relative';
  wrap.appendChild(stage);

  // Floating angle badge overlay (always crisp, never occluded)
  const badge = document.createElement('div');
  badge.style.cssText = 'position:absolute;top:10px;right:12px;padding:4px 9px;background:rgba(13,12,10,0.88);border:1px solid #d99423;color:#f2a629;font:700 13px/1.2 "Quantico","JetBrains Mono",monospace;letter-spacing:0.04em;pointer-events:none;';
  badge.textContent = baseAngleText;
  if (baseAngleText) stage.appendChild(badge);

  const cap = document.createElement('div');
  cap.className = 'lq-model-caption';
  cap.textContent = spec.caption || `${mol.label} · ${baseAngleText}`;
  wrap.appendChild(cap);
  host.appendChild(wrap);

  const reduced = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const use3D = !session.no3d && tierManager.getTier() !== 'T0';

  if (!use3D) {
    const canvas = document.createElement('canvas');
    const w = Math.max(260, Math.round(stage.getBoundingClientRect().width || 360));
    const h = Math.max(150, Math.round(stage.getBoundingClientRect().height || 180));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    stage.insertBefore(canvas, badge);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d0c0a';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const sc = Math.min(w, h) * 0.28;
    // Draw bonds and lone pairs in clean 2D projection
    for (const v of plan.vectors) {
      const px = cx + v.v[0] * sc;
      const py = cy - v.v[1] * sc;
      if (v.kind === 'lone') {
        const ang = Math.atan2(py - cy, px - cx);
        ctx.save();
        ctx.translate((cx + px) / 2, (cy + py) / 2);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, 0, sc * 0.45, sc * 0.22, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(229,155,36,0.3)';
        ctx.fill();
        ctx.strokeStyle = '#e59b24';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = '#8c8376';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = COLOR[v.sym] || '#d8d2c4';
        ctx.beginPath();
        ctx.arc(px, py, dim(v.sym) * sc * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = COLOR[mol.hub] || '#8c8376';
    ctx.beginPath();
    ctx.arc(cx, cy, dim(mol.hub) * sc * 0.45, 0, Math.PI * 2);
    ctx.fill();
    return { dispose() { wrap.remove(); } };
  }

  let disposed = false;
  let raf = 0;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x0d0c0a, 1);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  const rect = stage.getBoundingClientRect();
  const w = Math.max(220, Math.round(rect.width || 360));
  const h = Math.max(150, Math.round(rect.height || 185));
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  stage.insertBefore(renderer.domElement, badge);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 40);
  camera.position.set(0, 0.45, 4.7);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const key = new THREE.DirectionalLight(0xfff4dc, 1.35);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xaab8cc, 0.45);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  const geos = [];
  const mats = [];
  const makeMat = hex => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.18 });
    mats.push(m);
    return m;
  };

  // Central atom
  const hubGeo = new THREE.SphereGeometry(dim(mol.hub), 24, 16);
  geos.push(hubGeo);
  group.add(new THREE.Mesh(hubGeo, makeMat(COLOR[mol.hub] || COLOR.H)));

  // Arm meshes (atoms + rods, or elongated lone-pair lobes)
  const up = new THREE.Vector3(0, 1, 0);
  const armEntries = plan.vectors.map((v, i) => {
    const startV = morphPlan && morphPlan.vectors[i] ? morphPlan.vectors[i].v : v.v;
    const endV = v.v;
    if (v.kind === 'lone') {
      const lobe = makeLonePairLobe(geos, mats);
      group.add(lobe);
      return { kind: 'lone', mesh: lobe, startV, endV };
    }
    const L = lenOf(v.sym);
    const aGeo = new THREE.SphereGeometry(dim(v.sym), 20, 14);
    const rGeo = new THREE.CylinderGeometry(0.065, 0.065, L, 10);
    geos.push(aGeo, rGeo);
    const atomMesh = new THREE.Mesh(aGeo, makeMat(COLOR[v.sym] || COLOR.H));
    const rodMesh = new THREE.Mesh(rGeo, makeMat('#8c8376'));
    group.add(atomMesh, rodMesh);
    return { kind: 'atom', atomMesh, rodMesh, L, startV, endV };
  });

  // Amber angle arc line between the selected pair of bonded atoms
  let arcLine = null;
  let arcGeo = null;
  if (pair) {
    arcGeo = new THREE.BufferGeometry();
    geos.push(arcGeo);
    const arcMat = new THREE.LineBasicMaterial({ color: 0xf2a629 });
    mats.push(arcMat);
    arcLine = new THREE.Line(arcGeo, arcMat);
    group.add(arcLine);
  }

  const updatePose = (morphT) => {
    const curDirs = armEntries.map(e => lerp3(e.startV, e.endV, morphT));
    armEntries.forEach((e, i) => {
      const dir = new THREE.Vector3(...curDirs[i]);
      if (e.kind === 'lone') {
        e.mesh.quaternion.setFromUnitVectors(up, dir);
        // When morphing from CH4 -> H2O, lone pairs visibly expand from narrow (0.55) to full wide lobe (1.08)
        const s = morphPlan ? (0.55 + 0.55 * morphT) : 1.0;
        e.mesh.scale.set(s, 0.72 + 0.34 * morphT, s);
      } else {
        e.atomMesh.position.copy(dir).multiplyScalar(e.L);
        e.rodMesh.position.copy(dir).multiplyScalar(e.L * 0.5);
        e.rodMesh.quaternion.setFromUnitVectors(up, dir);
      }
    });
    if (pair && arcGeo) {
      const va = curDirs[pair[0]];
      const vb = curDirs[pair[1]];
      const pts = makeAngleArcPoints(va, vb, 0.68, 22);
      arcGeo.setFromPoints(pts);
      if (morphPlan) {
        const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
        const deg = Math.acos(dot) * 180 / Math.PI;
        badge.textContent = `${deg.toFixed(1)}°`;
      }
    }
  };

  updatePose(morphPlan && !reduced ? 0 : 1);

  // Drag to rotate
  let drag = null;
  let ax = 0.26;
  let ay = 0.45;
  const dom = renderer.domElement;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; dom.setPointerCapture?.(e.pointerId); };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.012;
    ax = Math.max(-1.2, Math.min(1.2, ax + (e.clientY - drag.y) * 0.012));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);

  const t0 = performance.now();
  const loop = now => {
    if (disposed) return;
    const elapsed = (now - t0) / 1000;
    if (!reduced && !drag) ay += 0.007;
    if (morphPlan && !reduced) {
      // Hold tetrahedral 1.2s -> morph smoothly to bent over 1.8s -> hold bent 2.2s -> reset
      const cyc = elapsed % 5.6;
      const m = cyc < 1.2 ? 0 : cyc < 3.0 ? ease((cyc - 1.2) / 1.8) : cyc < 5.2 ? 1 : 1 - ease((cyc - 5.2) / 0.4);
      updatePose(m);
    }
    group.rotation.set(ax, ay, 0);
    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
      renderer.dispose();
      wrap.remove();
    }
  };
}
