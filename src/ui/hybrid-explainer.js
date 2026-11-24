/**
 * hybrid-explainer.js — Clean, non-interactive animated 3D/2D orbital explainers for Ligar's hybridization bench (`q8-hybrid`):
 *   - `sigma-pi`: two carbons approaching so their head-on hybrid orbitals merge into a σ bond and their upright p orbitals fuse into a π bond. Only two labels: `σ` and `π`. No buttons, no sliders, no extra text.
 *   - `sp2`: trigonal planar sp² hybrid orbitals (each labeled `sp²`) plus the perpendicular unmixed p orbital (`unmixed p`).
 *   - `co2`: full CO₂ orbital picture — two `σ (sp)` bonds, two perpendicular `π` bonds (vertical left, horizontal right), and oxygen `lone pair` lobes, all with short labels.
 */

import * as THREE from 'three';
import { session } from '../session.js';
import { tierManager } from '../three/tier.js';

const BG = 0x0d0c0a;
const ease = t => { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); };

/** Smooth teardrop orbital lobe pointing along +Y from y=0..length. */
function makeTeardropGeo(length = 1.0, maxRadius = 0.38, segs = 20) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const r = maxRadius * Math.sin(Math.PI * u) * Math.sqrt(Math.max(0, u));
    pts.push(new THREE.Vector2(Math.max(0.001, r), u * length));
  }
  return new THREE.LatheGeometry(pts, 24);
}

/** Curved arched pi-bond cloud bridging x0..x1 along direction (dirY, dirZ). */
function makePiArchGeo(x0, x1, dirY, dirZ, arch, radius) {
  const mx = (x0 + x1) / 2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x0, dirY * arch * 0.42, dirZ * arch * 0.42),
    new THREE.Vector3(x0 + (x1 - x0) * 0.25, dirY * arch, dirZ * arch),
    new THREE.Vector3(mx, dirY * arch * 1.1, dirZ * arch * 1.1),
    new THREE.Vector3(x0 + (x1 - x0) * 0.75, dirY * arch, dirZ * arch),
    new THREE.Vector3(x1, dirY * arch * 0.42, dirZ * arch * 0.42)
  ]);
  return new THREE.TubeGeometry(curve, 22, radius, 14, false);
}

/** Draw a crisp dark-plate pill label onto a 2D overlay canvas. */
function drawLabel(ctx, text, x, y, color = '#f2b84b', alpha = 1) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.font = '700 12px "Quantico", "JetBrains Mono", monospace';
  const tw = ctx.measureText(text).width;
  const padX = 6;
  const bh = 20;
  const bw = tw + padX * 2;
  const bx = Math.round(x - bw / 2);
  const by = Math.round(y - bh / 2);
  ctx.fillStyle = 'rgba(13, 12, 10, 0.88)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

/** Project a 3D world point to 2D canvas coordinates. */
function project2D(v, camera, w, h) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
}

/**
 * Mount a clean animated hybrid/sigma-pi orbital explainer into `view`.
 * Returns a `dispose()` function.
 */
export function mountHybridExplainer(view, spec, still = false) {
  const kind = spec?.kind || 'sigma-pi';
  view.innerHTML = '';
  view.style.position = 'relative';
  view.style.minHeight = '190px';
  view.style.height = '190px';
  view.style.background = '#0d0c0a';
  view.style.overflow = 'hidden';

  const w = Math.max(280, Math.round(view.getBoundingClientRect().width || 460));
  const h = 190;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = Math.round(w * dpr);
  labelCanvas.height = Math.round(h * dpr);
  labelCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  const lctx = labelCanvas.getContext('2d');

  const use3D = !session.no3d && tierManager.getTier() !== 'T0';
  let raf = 0;
  let disposed = false;

  if (!use3D) {
    // Clean 2D canvas fallback
    view.appendChild(labelCanvas);
    const draw2D = (t) => {
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.fillStyle = '#0d0c0a';
      lctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      if (kind === 'sigma-pi') {
        const cyc = still ? 0.65 : (t % 4.6) / 4.6;
        const merge = cyc < 0.4 ? ease(cyc / 0.4) : cyc < 0.72 ? 1 : 1 - ease((cyc - 0.72) / 0.28);
        const sep = 110 - 54 * merge;
        // Pi arches
        lctx.fillStyle = `rgba(229, 155, 36, ${0.22 + 0.35 * merge})`;
        lctx.beginPath(); lctx.ellipse(cx, cy - 36, 46 + (1 - merge) * 28, 16, 0, 0, Math.PI * 2); lctx.fill();
        lctx.fillStyle = `rgba(42, 168, 224, ${0.22 + 0.35 * merge})`;
        lctx.beginPath(); lctx.ellipse(cx, cy + 36, 46 + (1 - merge) * 28, 16, 0, 0, Math.PI * 2); lctx.fill();
        // Sigma overlap
        lctx.fillStyle = `rgba(132, 185, 62, ${0.35 + 0.45 * merge})`;
        lctx.beginPath(); lctx.ellipse(cx, cy, sep * 0.65, 16, 0, 0, Math.PI * 2); lctx.fill();
        for (const sx of [-1, 1]) {
          lctx.fillStyle = '#2d2b28';
          lctx.beginPath(); lctx.arc(cx + sx * sep / 2, cy, 12, 0, Math.PI * 2); lctx.fill();
        }
        drawLabel(lctx, 'σ', cx, cy, '#9ad94b', 0.35 + 0.65 * merge);
        drawLabel(lctx, 'π', cx, cy - 58, '#f2b84b', 0.35 + 0.65 * merge);
      } else if (kind === 'sp2') {
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI * 2) / 3 - Math.PI / 2;
          lctx.fillStyle = 'rgba(229, 155, 36, 0.55)';
          lctx.beginPath(); lctx.ellipse(cx + Math.cos(a) * 38, cy + Math.sin(a) * 26, 26, 13, a, 0, Math.PI * 2); lctx.fill();
          drawLabel(lctx, 'sp²', cx + Math.cos(a) * 76, cy + Math.sin(a) * 44, '#f2b84b');
        }
        lctx.fillStyle = 'rgba(42, 168, 224, 0.55)';
        lctx.beginPath(); lctx.ellipse(cx, cy - 42, 13, 28, 0, 0, Math.PI * 2); lctx.fill();
        lctx.beginPath(); lctx.ellipse(cx, cy + 42, 13, 28, 0, 0, Math.PI * 2); lctx.fill();
        drawLabel(lctx, 'unmixed p', cx + 56, cy - 56, '#5cc8f7');
      } else {
        drawLabel(lctx, 'σ (sp)', cx - 44, cy, '#9ad94b');
        drawLabel(lctx, 'π', cx - 44, cy - 42, '#f2b84b');
        drawLabel(lctx, 'π', cx + 44, cy + 42, '#5cc8f7');
        drawLabel(lctx, 'lone pair', cx - 120, cy - 30, '#d8c38a');
        drawLabel(lctx, 'lone pair', cx + 120, cy + 30, '#d8c38a');
      }
    };
    const t0 = performance.now();
    const loop = (now) => {
      if (disposed) return;
      draw2D((now - t0) / 1000);
      if (!still) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { disposed = true; cancelAnimationFrame(raf); };
  }

  // Three.js 3D renderer + 2D label canvas overlay
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  renderer.setClearColor(BG, 1);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  view.appendChild(renderer.domElement);
  view.appendChild(labelCanvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 40);
  camera.position.set(0, kind === 'sp2' ? 1.55 : kind === 'co2' ? 1.35 : 0.75, kind === 'co2' ? 6.2 : 5.4);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.35);
  key.position.set(3.5, 5, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7cc8f5, 0.55);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const geos = [];
  const mats = [];
  const trackG = g => { geos.push(g); return g; };
  const trackM = m => { mats.push(m); return m; };

  const matAmber = trackM(new THREE.MeshPhysicalMaterial({
    color: 0xe59b24, emissive: 0x4f2d04, emissiveIntensity: 0.25,
    roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.68, depthWrite: false, side: THREE.DoubleSide
  }));
  const matCyan = trackM(new THREE.MeshPhysicalMaterial({
    color: 0x2aa8e0, emissive: 0x0a384e, emissiveIntensity: 0.28,
    roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide
  }));
  const matGreen = trackM(new THREE.MeshPhysicalMaterial({
    color: 0x84b93e, emissive: 0x2b450d, emissiveIntensity: 0.35,
    roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide
  }));
  const matLP = trackM(new THREE.MeshPhysicalMaterial({
    color: 0xd9b86c, emissive: 0x3b2c0a, emissiveIntensity: 0.2,
    roughness: 0.24, metalness: 0.05, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide
  }));
  const matC = trackM(new THREE.MeshStandardMaterial({ color: 0x2c2a27, roughness: 0.38, metalness: 0.15 }));
  const matB = trackM(new THREE.MeshStandardMaterial({ color: 0xc27848, roughness: 0.38, metalness: 0.15 }));
  const matO = trackM(new THREE.MeshStandardMaterial({ color: 0xb83a32, roughness: 0.36, metalness: 0.12 }));
  const matElec = trackM(new THREE.MeshStandardMaterial({ color: 0xfff2c2, emissive: 0xe59b24, emissiveIntensity: 0.95 }));

  const root = new THREE.Group();
  scene.add(root);

  let updateScene = () => {};

  if (kind === 'sigma-pi') {
    // Two carbon atoms approaching: head-on hybrid lobes merge into σ, upright p orbitals fuse into π
    const lobeGeo = trackG(makeTeardropGeo(1.18, 0.38));
    const pLobeGeo = trackG(makeTeardropGeo(1.08, 0.34));
    const nucGeo = trackG(new THREE.SphereGeometry(0.22, 22, 16));

    const leftAtom = new THREE.Group();
    const rightAtom = new THREE.Group();
    root.add(leftAtom, rightAtom);

    const makeAtom = (grp, dirX) => {
      grp.add(new THREE.Mesh(nucGeo, matC));
      // Head-on hybrid lobe pointing toward partner
      const hyb = new THREE.Mesh(lobeGeo, matAmber.clone());
      mats.push(hyb.material);
      hyb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dirX, 0, 0));
      grp.add(hyb);
      // Upright p orbital (top amber, bottom cyan)
      const pTop = new THREE.Mesh(pLobeGeo, matAmber.clone());
      mats.push(pTop.material);
      const pBot = new THREE.Mesh(pLobeGeo, matCyan.clone());
      mats.push(pBot.material);
      pBot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0));
      grp.add(pTop, pBot);
      return { hyb, pTop, pBot };
    };

    const L = makeAtom(leftAtom, 1);
    const R = makeAtom(rightAtom, -1);

    // Merged sigma cloud (center) & fused pi arches (top & bottom)
    const sigmaCloudMat = trackM(matGreen.clone());
    const sigmaCloud = new THREE.Mesh(trackG(new THREE.CapsuleGeometry(0.32, 0.9, 10, 20)), sigmaCloudMat);
    sigmaCloud.rotation.z = Math.PI / 2;
    root.add(sigmaCloud);

    const piTopMat = trackM(matAmber.clone());
    const piBotMat = trackM(matCyan.clone());
    const piTop = new THREE.Mesh(trackG(makePiArchGeo(-0.78, 0.78, 1, 0, 0.78, 0.24)), piTopMat);
    const piBot = new THREE.Mesh(trackG(makePiArchGeo(-0.78, 0.78, -1, 0, 0.78, 0.24)), piBotMat);
    root.add(piTop, piBot);

    updateScene = (t) => {
      const cyc = still ? 0.6 : (t % 4.8) / 4.8;
      // 0..0.42 approach & merge, 0.42..0.74 hold bonded, 0.74..1.0 separate
      const merge = cyc < 0.42 ? ease(cyc / 0.42) : cyc < 0.74 ? 1 : 1 - ease((cyc - 0.74) / 0.26);
      const halfSep = 1.95 - 1.17 * merge; // 1.95 -> 0.78
      leftAtom.position.x = -halfSep;
      rightAtom.position.x = halfSep;

      // Fade individual approaching lobes into the fused sigma + pi clouds as they overlap
      const indivOp = 0.72 * (1 - 0.82 * Math.max(0, (merge - 0.35) / 0.65));
      for (const a of [L, R]) {
        a.hyb.material.opacity = indivOp;
        a.pTop.material.opacity = indivOp;
        a.pBot.material.opacity = indivOp;
      }
      const fusedOp = ease((merge - 0.25) / 0.65);
      sigmaCloudMat.opacity = 0.84 * fusedOp;
      sigmaCloud.scale.set(1, 0.6 + 0.4 * fusedOp, 1);
      piTopMat.opacity = 0.72 * fusedOp;
      piBotMat.opacity = 0.66 * fusedOp;
      piTop.scale.set(0.75 + 0.25 * fusedOp, 0.85 + 0.15 * fusedOp, 1);
      piBot.scale.set(0.75 + 0.25 * fusedOp, 0.85 + 0.15 * fusedOp, 1);

      root.rotation.y = still ? 0.18 : Math.sin(t * 0.55) * 0.28;

      // Only two labels: sigma and pi
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, w, h);
      const sPt = project2D(new THREE.Vector3(0, 0, 0.35).applyEuler(root.rotation), camera, w, h);
      const pPt = project2D(new THREE.Vector3(0, 1.15, 0).applyEuler(root.rotation), camera, w, h);
      const alpha = 0.2 + 0.8 * fusedOp;
      drawLabel(lctx, 'σ', sPt.x, sPt.y, '#9ad94b', alpha);
      drawLabel(lctx, 'π', pPt.x, Math.max(16, pPt.y), '#f2b84b', alpha);
    };
  } else if (kind === 'sp2') {
    // 3 trigonal planar sp² lobes (amber, each labeled "sp²") + 1 vertical unmixed p orbital (labeled "unmixed p")
    const nuc = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.24, 22, 16)), matB);
    root.add(nuc);

    const sp2Geo = trackG(makeTeardropGeo(1.42, 0.40));
    const backGeo = trackG(makeTeardropGeo(0.42, 0.15));
    const sp2Dirs = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-0.5, 0, 0.866),
      new THREE.Vector3(-0.5, 0, -0.866)
    ];
    sp2Dirs.forEach(dir => {
      const m = new THREE.Mesh(sp2Geo, matAmber);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      root.add(m);
      const b = new THREE.Mesh(backGeo, matAmber);
      b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
      root.add(b);
    });

    // Unmixed p orbital standing perpendicular (along Y)
    const pGeo = trackG(makeTeardropGeo(1.32, 0.34));
    const pTop = new THREE.Mesh(pGeo, matCyan);
    const pBot = new THREE.Mesh(pGeo, matCyan);
    pBot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0));
    root.add(pTop, pBot);

    updateScene = (t) => {
      root.rotation.y = still ? 0.42 : t * 0.45;
      root.updateMatrixWorld(true);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, w, h);

      sp2Dirs.forEach(dir => {
        const pt = dir.clone().multiplyScalar(1.52).applyMatrix4(root.matrixWorld);
        const p2 = project2D(pt, camera, w, h);
        drawLabel(lctx, 'sp²', p2.x, Math.max(16, Math.min(h - 14, p2.y)), '#f2b84b');
      });
      const pTopPt = new THREE.Vector3(0, 1.38, 0).applyMatrix4(root.matrixWorld);
      const p2Top = project2D(pTopPt, camera, w, h);
      drawLabel(lctx, 'unmixed p', p2Top.x + 36, Math.max(16, p2Top.y + 4), '#5cc8f7');
    };
  } else {
    // CO2: linear O=C=O with all orbitals (2 σ (sp), 2 perpendicular π, and 2 lone pairs on each O)
    const xC = 0;
    const xL = -1.72;
    const xR = 1.72;

    const cMesh = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.24, 22, 16)), matC);
    const oL = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.22, 22, 16)), matO);
    oL.position.x = xL;
    const oR = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.22, 22, 16)), matO);
    oR.position.x = xR;
    root.add(cMesh, oL, oR);

    // Two sp sigma bond clouds along X
    const sigGeo = trackG(new THREE.CapsuleGeometry(0.20, 0.96, 8, 16));
    const sigL = new THREE.Mesh(sigGeo, matGreen);
    sigL.rotation.z = Math.PI / 2;
    sigL.position.x = (xL + xC) / 2;
    const sigR = new THREE.Mesh(sigGeo, matGreen);
    sigR.rotation.z = Math.PI / 2;
    sigR.position.x = (xC + xR) / 2;
    root.add(sigL, sigR);

    // Left C=O pi bond (vertical, Y axis, amber)
    root.add(new THREE.Mesh(trackG(makePiArchGeo(xL, xC, 1, 0, 0.68, 0.18)), matAmber));
    root.add(new THREE.Mesh(trackG(makePiArchGeo(xL, xC, -1, 0, 0.68, 0.18)), matAmber));

    // Right C=O pi bond (horizontal, Z axis, cyan — perpendicular to left pi bond)
    root.add(new THREE.Mesh(trackG(makePiArchGeo(xC, xR, 0, 1, 0.68, 0.18)), matCyan));
    root.add(new THREE.Mesh(trackG(makePiArchGeo(xC, xR, 0, -1, 0.68, 0.18)), matCyan));

    // Two sp² lone pairs on each oxygen (angled 120° away from the C=O axis, in the plane perpendicular to its pi bond)
    const lpGeo = trackG(makeTeardropGeo(0.95, 0.28));
    const eGeo = trackG(new THREE.SphereGeometry(0.055, 10, 8));
    const addLonePair = (ox, dir) => {
      const grp = new THREE.Group();
      grp.position.set(ox, 0, 0);
      grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      grp.add(new THREE.Mesh(lpGeo, matLP));
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(eGeo, matElec);
        e.position.set(sx * 0.085, 0.64, 0);
        grp.add(e);
      }
      root.add(grp);
    };
    // Left O has vertical pi (Y), so its two lone pairs lie in the XZ plane
    addLonePair(xL, new THREE.Vector3(-0.5, 0, 0.866));
    addLonePair(xL, new THREE.Vector3(-0.5, 0, -0.866));
    // Right O has horizontal pi (Z), so its two lone pairs lie in the XY plane
    addLonePair(xR, new THREE.Vector3(0.5, 0.866, 0));
    addLonePair(xR, new THREE.Vector3(0.5, -0.866, 0));

    updateScene = (t) => {
      root.rotation.y = still ? 0.26 : Math.sin(t * 0.5) * 0.36;
      root.rotation.x = still ? 0.14 : 0.14 + Math.cos(t * 0.35) * 0.1;
      root.updateMatrixWorld(true);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, w, h);

      const proj = (x, y, z) => project2D(new THREE.Vector3(x, y, z).applyMatrix4(root.matrixWorld), camera, w, h);
      const pSigL = proj(-0.86, 0, 0.18);
      const pSigR = proj(0.86, 0, 0.18);
      const pPiL = proj(-0.86, 0.92, 0);
      const pPiR = proj(0.86, -0.1, 0.95);
      const pLpL = proj(xL - 0.62, 0.12, 0.85);
      const pLpR = proj(xR + 0.58, 0.95, 0);

      drawLabel(lctx, 'σ (sp)', pSigL.x, pSigL.y, '#9ad94b');
      drawLabel(lctx, 'σ (sp)', pSigR.x, pSigR.y, '#9ad94b');
      drawLabel(lctx, 'π', pPiL.x, Math.max(15, pPiL.y), '#f2b84b');
      drawLabel(lctx, 'π', pPiR.x, Math.min(h - 14, pPiR.y + 10), '#5cc8f7');
      drawLabel(lctx, 'lone pair', Math.max(42, pLpL.x), Math.min(h - 14, pLpL.y), '#e2cc94');
      drawLabel(lctx, 'lone pair', Math.min(w - 42, pLpR.x), Math.max(15, pLpR.y), '#e2cc94');
    };
  }

  const t0 = performance.now();
  const frame = (now) => {
    if (disposed) return;
    updateScene((now - t0) / 1000);
    renderer.render(scene, camera);
    if (!still) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    renderer.dispose();
    geos.forEach(g => g.dispose());
    mats.forEach(m => m.dispose());
    renderer.domElement.remove();
    labelCanvas.remove();
  };
}
