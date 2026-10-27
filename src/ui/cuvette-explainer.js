/**
 * cuvette-explainer.js — Interactive 3D explainer for complementary colour and Beer's law absorbance.
 *
 * Demonstrates:
 * 1. Complementary Colour:
 *    - White light (full visible spectrum: red, orange, yellow, green, cyan, blue, violet) enters a copper(II) sulfate solution.
 *    - Cu²⁺ ions selectively absorb orange light (~630 nm) due to d-d orbital transitions.
 *    - The remaining wavelengths (blue, cyan, green) pass through unimpeded, emerging as a vibrant blue beam.
 *    - A solution looks the complementary colour of the light it absorbs.
 *
 * 2. Beer-Lambert Law & Absorbance (A = ε · b · c):
 *    - A monochromatic orange beam (630 nm, peak absorption) enters at incident intensity I₀ = 100%.
 *    - Inside the 1.0 cm path length cuvette, Cu²⁺ ions intercept and absorb orange photons.
 *    - The beam intensity attenuates exponentially: I = I₀ · 10^(-A).
 *    - Increasing concentration (1 drop → 2 drops → 3 drops) doubles and triples absorbing particles,
 *      proportionally increasing absorbance and dimming the emergent beam.
 *
 * Fully interactive: drag to rotate/tilt in 3D, toggle between White Light and 630 nm Orange beam,
 * select concentrations, and pause/play animation.
 */

import * as THREE from 'three';
import { planAbsorb, SOLUTES } from '../learn/engine/lightdata.js';

const BG_COLOR = '#0d0c0a';

// Spectral wavelengths for white light decomposition
const SPECTRUM_CHANNELS = [
  { id: 'red',    nm: 680, name: 'Red',    hex: 0xef4444, css: '#ef4444', absorb: false, dy: -0.16, dz: -0.12 },
  { id: 'orange', nm: 630, name: 'Orange', hex: 0xfb923c, css: '#fb923c', absorb: true,  dy: -0.05, dz:  0.10 },
  { id: 'yellow', nm: 580, name: 'Yellow', hex: 0xfacc15, css: '#facc15', absorb: false, dy:  0.06, dz: -0.10 },
  { id: 'green',  nm: 530, name: 'Green',  hex: 0x22c55e, css: '#22c55e', absorb: false, dy:  0.15, dz:  0.06 },
  { id: 'cyan',   nm: 490, name: 'Cyan',   hex: 0x06b6d4, css: '#06b6d4', absorb: false, dy: -0.10, dz:  0.15 },
  { id: 'blue',   nm: 450, name: 'Blue',   hex: 0x3b82f6, css: '#3b82f6', absorb: false, dy:  0.00, dz:  0.00 },
  { id: 'violet', nm: 410, name: 'Violet', hex: 0xa855f7, css: '#a855f7', absorb: false, dy:  0.10, dz: -0.15 }
];

const PRESETS = [
  { label: '2.0 mmol/L', conc: 0.002, ionCount: 16 },
  { label: '4.0 mmol/L', conc: 0.004, ionCount: 32 },
  { label: '8.0 mmol/L', conc: 0.008, ionCount: 64 }
];

/**
 * Mount the interactive 3D cuvette explainer inside an element.
 * @param {HTMLElement} view - container for 3D canvas
 * @param {HTMLElement} wrap - outer wrapper
 * @param {Object} spec - model spec
 * @param {boolean} still - reduced motion
 * @returns {{ dispose: Function }}
 */
export function mountCuvetteExplainer(view, wrap, spec, still = false) {
  let disposed = false;
  let rafId = 0;
  let isPaused = Boolean(still);

  const soluteKey = spec.solute || 'cuso4';
  const solute = SOLUTES[soluteKey] || SOLUTES.cuso4;
  let mode = spec.mode || (spec.nm === 630 && spec.conc && spec.conc <= 0.005 ? 'mono' : 'white');
  let currentConc = spec.conc ?? 0.004;

  // Stable, fixed lab viewpoint (no auto-rotation)
  let ay = 0.22;
  let ax = 0.08;
  let drag = null;

  // Suppress duplicate outer caption so only one clean footer is displayed
  const captionEl = wrap.querySelector('.lq-model-caption');
  if (captionEl) captionEl.style.display = 'none';

  // 1. Controls bar
  const controlBar = document.createElement('div');
  controlBar.className = 'cuvette-controls';
  controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 12px;background:#14120f;border-bottom:1px solid #2a241e;font-family:ui-monospace,monospace;font-size:11px;';

  // Mode buttons
  const modeGroup = document.createElement('div');
  modeGroup.style.cssText = 'display:flex;align-items:center;gap:4px;';
  const modeLabel = document.createElement('span');
  modeLabel.textContent = 'MODE:';
  modeLabel.style.cssText = 'font-weight:700;color:#8c8376;margin-right:2px;';
  modeGroup.appendChild(modeLabel);

  const btnWhite = document.createElement('button');
  btnWhite.type = 'button';
  btnWhite.textContent = 'White Light (Complementary)';
  btnWhite.style.cssText = 'padding:3px 9px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';

  const btnMono = document.createElement('button');
  btnMono.type = 'button';
  btnMono.textContent = 'Beer\'s Law (630 nm Orange)';
  btnMono.style.cssText = 'padding:3px 9px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';

  modeGroup.appendChild(btnWhite);
  modeGroup.appendChild(btnMono);

  // Concentration preset buttons
  const concGroup = document.createElement('div');
  concGroup.style.cssText = 'display:flex;align-items:center;gap:4px;';
  const concLabel = document.createElement('span');
  concLabel.textContent = 'CONC:';
  concLabel.style.cssText = 'font-weight:700;color:#8c8376;margin-right:2px;';
  concGroup.appendChild(concLabel);

  const concBtns = PRESETS.map(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = preset.label;
    btn.title = preset.label;
    btn.style.cssText = 'padding:3px 8px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';
    btn.addEventListener('click', () => {
      currentConc = preset.conc;
      updateUI();
      rebuildScene();
    });
    concGroup.appendChild(btn);
    return { btn, preset };
  });

  // Play / Pause button
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
  playBtn.style.cssText = 'padding:3px 8px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;color:#a59c86;background:#1a1815;border:1px solid #332d26;margin-left:auto;';
  playBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playBtn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
    playBtn.style.color = isPaused ? '#d99423' : '#a59c86';
  });

  controlBar.appendChild(modeGroup);
  controlBar.appendChild(concGroup);
  controlBar.appendChild(playBtn);

  // 2. Readout bar
  const readoutBar = document.createElement('div');
  readoutBar.className = 'cuvette-readout';
  readoutBar.style.cssText = 'padding:6px 12px;background:#100e0c;border-bottom:1px solid #221e1a;font-family:ui-monospace,monospace;font-size:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;';

  // 3. Info / Caption footer
  const infoFooter = document.createElement('div');
  infoFooter.className = 'cuvette-footer';
  infoFooter.style.cssText = 'padding:8px 12px;background:#0d0c0a;border-top:1px solid #221e1a;font-family:ui-monospace,monospace;font-size:11px;color:#8c8376;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;';

  const updateUI = () => {
    // Mode button states
    const isWhite = mode === 'white';
    btnWhite.style.background = isWhite ? '#1e293b' : '#1a1815';
    btnWhite.style.border = `1px solid ${isWhite ? '#38bdf8' : '#332d26'}`;
    btnWhite.style.color = isWhite ? '#38bdf8' : '#8c8376';

    btnMono.style.background = !isWhite ? '#2c1e14' : '#1a1815';
    btnMono.style.border = `1px solid ${!isWhite ? '#fb923c' : '#332d26'}`;
    btnMono.style.color = !isWhite ? '#fb923c' : '#8c8376';

    // Conc button states
    concBtns.forEach(({ btn, preset }) => {
      const active = Math.abs(preset.conc - currentConc) < 0.0005;
      btn.style.background = active ? '#2c2214' : '#1a1815';
      btn.style.border = `1px solid ${active ? '#d99423' : '#332d26'}`;
      btn.style.color = active ? '#d99423' : '#a59c86';
    });

    // Absorbance computation: A = eps * b * c
    const A = planAbsorb(soluteKey, 630, 1.0, currentConc);
    const T = Math.pow(10, -A);
    const tPct = (T * 100).toFixed(1);

    if (isWhite) {
      readoutBar.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ffffff;font-weight:700;">Incident White Light</span>
          <span style="color:#6b625a;">→</span>
          <span style="color:#fb923c;font-weight:700;">Cu²⁺ Absorbs Orange (~630 nm)</span>
          <span style="color:#6b625a;">→</span>
          <span style="color:#38bdf8;font-weight:700;">Transmitted Blue Light</span>
        </div>
        <div style="color:#38bdf8;font-weight:600;font-size:10px;">Complementary Color</div>
      `;
      infoFooter.innerHTML = `
        <div style="display:flex;gap:12px;font-size:10px;font-weight:600;">
          <span style="color:#ffffff;">White In</span>
          <span style="color:#fb923c;">Orange Absorbed</span>
          <span style="color:#38bdf8;">Blue Out</span>
        </div>
      `;
    } else {
      readoutBar.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#fb923c;font-weight:700;">I₀ = 100%</span>
          <span style="color:#6b625a;">|</span>
          <span style="color:#94a3b8;">b = 1.0 cm</span>
          <span style="color:#6b625a;">|</span>
          <span style="color:#d99423;font-weight:700;">c = ${(currentConc * 1000).toFixed(1)} mmol/L</span>
          <span style="color:#6b625a;">|</span>
          <span style="color:#4ade80;font-weight:700;">A = ${A.toFixed(2)}</span>
          <span style="color:#6b625a;">|</span>
          <span style="color:#fb923c;font-weight:700;">I = ${tPct}%</span>
        </div>
        <div style="color:#8c8376;font-size:10px;font-weight:600;">A = ε · b · c</div>
      `;
      infoFooter.innerHTML = `
        <div style="display:flex;gap:12px;font-size:10px;font-weight:600;">
          <span style="color:#fb923c;">630 nm Beam</span>
          <span style="color:#4ade80;">A ∝ c</span>
        </div>
      `;
    }
  };

  btnWhite.addEventListener('click', () => {
    if (mode === 'white') return;
    mode = 'white';
    updateUI();
    rebuildScene();
  });

  btnMono.addEventListener('click', () => {
    if (mode === 'mono') return;
    mode = 'mono';
    updateUI();
    rebuildScene();
  });

  updateUI();

  wrap.insertBefore(readoutBar, view);
  wrap.insertBefore(controlBar, readoutBar);
  wrap.appendChild(infoFooter);

  // Drag interaction
  const onDown = e => {
    drag = { x: e.clientX, y: e.clientY };
    try { view.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-0.85, Math.min(0.85, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };

  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  let rebuildScene = () => {};

  // Three.js 3D Setup
  let renderer = null;
  let scene = null;
  let camera = null;
  let root = null;

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const width = Math.max(260, view.clientWidth || 340);
    const height = 230;
    renderer.setSize(width, height);
    view.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.3);
    camera.lookAt(0, 0, 0);

    // Balanced laboratory illumination
    scene.add(new THREE.HemisphereLight(0xf8fafc, 0x14120f, 1.3));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(4, 5, 4);
    scene.add(sun);
    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.45);
    blueFill.position.set(-3, -2, -2);
    scene.add(blueFill);

    root = new THREE.Group();
    scene.add(root);

    // Geometries & Materials
    const CUV_W = 1.25;
    const CUV_H = 2.15;
    const CUV_D = 0.95;

    // Beveled frame line helper
    function createBoxBevelLines(w, h, d, color = 0x94a3b8) {
      const group = new THREE.Group();
      const hw = w / 2, hh = h / 2, hd = d / 2;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 });
      const rad = 0.014;

      const addEdge = (p1, p2) => {
        const v1 = new THREE.Vector3(...p1);
        const v2 = new THREE.Vector3(...p2);
        const len = v1.distanceTo(v2);
        const geo = new THREE.CylinderGeometry(rad, rad, len, 8);
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(v1).lerp(v2, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
        group.add(m);
      };

      // 4 vertical edges
      addEdge([-hw, -hh, -hd], [-hw, hh, -hd]);
      addEdge([ hw, -hh, -hd], [ hw, hh, -hd]);
      addEdge([-hw, -hh,  hd], [-hw, hh,  hd]);
      addEdge([ hw, -hh,  hd], [ hw, hh,  hd]);

      // 4 bottom edges
      addEdge([-hw, -hh, -hd], [ hw, -hh, -hd]);
      addEdge([-hw, -hh,  hd], [ hw, -hh,  hd]);
      addEdge([-hw, -hh, -hd], [-hw, -hh,  hd]);
      addEdge([ hw, -hh, -hd], [ hw, -hh,  hd]);

      // 4 top edges
      addEdge([-hw, hh, -hd], [ hw, hh, -hd]);
      addEdge([-hw, hh,  hd], [ hw, hh,  hd]);
      addEdge([-hw, hh, -hd], [-hw, hh,  hd]);
      addEdge([ hw, hh, -hd], [ hw, hh,  hd]);

      return group;
    }

    // Dynamic objects tracked for animation loop
    let copperIons = [];
    let beamParticles = [];
    let beamMeshes = [];

    rebuildScene = () => {
      // Clear previous children
      while (root.children.length > 0) {
        const c = root.children[0];
        root.remove(c);
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      }

      copperIons = [];
      beamParticles = [];
      beamMeshes = [];

      // 1. Dark lab cuvette stand at base
      const baseGeo = new THREE.BoxGeometry(1.65, 0.16, 1.35);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 0.6, metalness: 0.4 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(0, -CUV_H / 2 - 0.08, 0);
      root.add(baseMesh);

      // Stand alignment notch/feet
      const footGeo = new THREE.BoxGeometry(0.35, 0.04, 1.45);
      const footMat = new THREE.MeshStandardMaterial({ color: 0x2e2924, roughness: 0.5, metalness: 0.5 });
      const foot1 = new THREE.Mesh(footGeo, footMat);
      foot1.position.set(-0.6, -CUV_H / 2 - 0.16, 0);
      const foot2 = new THREE.Mesh(footGeo, footMat);
      foot2.position.set(0.6, -CUV_H / 2 - 0.16, 0);
      root.add(foot1);
      root.add(foot2);

      // 2. Clear optical glass cuvette walls
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xedf8fc,
        roughness: 0.06,
        metalness: 0.05,
        transmission: 0.88,
        ior: 1.52,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });
      const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(CUV_W, CUV_H, CUV_D), glassMat);
      root.add(glassMesh);

      // Crisp glass outline bevels
      root.add(createBoxBevelLines(CUV_W, CUV_H, CUV_D, 0x94a3b8));

      // 3. Copper(II) sulfate solution liquid column
      const liqH = CUV_H * 0.82;
      const liqW = CUV_W - 0.08;
      const liqD = CUV_D - 0.08;
      const liqY = -CUV_H / 2 + liqH / 2 + 0.04;

      // Opacity scales with concentration: deeper blue for higher concentration
      const concNorm = Math.min(1.0, currentConc / 0.015);
      const liqMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.2,
        roughness: 0.08,
        metalness: 0.02,
        transparent: true,
        opacity: 0.26 + 0.48 * concNorm,
        depthWrite: false
      });
      const liquidMesh = new THREE.Mesh(new THREE.BoxGeometry(liqW, liqH, liqD), liqMat);
      liquidMesh.position.set(0, liqY, 0);
      root.add(liquidMesh);

      // Liquid Meniscus lip
      const meniscusGeo = new THREE.BoxGeometry(liqW, 0.012, liqD);
      const meniscusMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.05,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat);
      meniscusMesh.position.set(0, liqY + liqH / 2, 0);
      root.add(meniscusMesh);

      // 4. Dissolved Cu²⁺ hydrated ions
      const numIons = Math.max(16, Math.round(currentConc * 3600));
      const ionGeo = new THREE.SphereGeometry(0.048, 14, 10);
      const auraGeo = new THREE.SphereGeometry(0.085, 12, 8);
      const ringGeo = new THREE.TorusGeometry(0.12, 0.016, 8, 20);

      const ionCoreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.75,
        roughness: 0.2
      });

      const ionAuraMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });

      // Pseudo-random placement inside liquid volume
      let seed = 0x8a3c;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < numIons; i++) {
        const bx = (rnd() * 2 - 1) * (liqW * 0.44);
        const by = liqY + (rnd() * 2 - 1) * (liqH * 0.42);
        const bz = (rnd() * 2 - 1) * (liqD * 0.42);

        const ionGroup = new THREE.Group();
        const core = new THREE.Mesh(ionGeo, ionCoreMat);
        const aura = new THREE.Mesh(auraGeo, ionAuraMat);
        ionGroup.add(core);
        ionGroup.add(aura);

        // Excitation pulse ring (glows orange when absorbing 630 nm light)
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0xfb923c,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const pulseMesh = new THREE.Mesh(ringGeo, pulseMat);
        pulseMesh.rotation.x = Math.PI / 2;
        ionGroup.add(pulseMesh);

        ionGroup.position.set(bx, by, bz);
        root.add(ionGroup);

        copperIons.push({
          group: ionGroup,
          base: { x: bx, y: by, z: bz },
          phase: { x: rnd() * Math.PI * 2, y: rnd() * Math.PI * 2, z: rnd() * Math.PI * 2 },
          pulseMesh,
          pulseMat,
          excitation: 0
        });
      }

      // 5. Volumetric Light Beams (Incident, Inside Cuvette, Transmitted)
      const BEAM_RADIUS = 0.28;
      const X_IN_START = -2.7;
      const X_CUV_IN = -CUV_W / 2;
      const X_CUV_OUT = CUV_W / 2;
      const X_OUT_END = 2.7;

      const A = planAbsorb(soluteKey, 630, 1.0, currentConc);
      const T = Math.pow(10, -A);

      // Section A: Incident beam
      const lenIn = X_CUV_IN - X_IN_START;
      const inGeo = new THREE.CylinderGeometry(BEAM_RADIUS, BEAM_RADIUS, lenIn, 24);
      inGeo.rotateZ(Math.PI / 2);
      const inMat = new THREE.MeshBasicMaterial({
        color: mode === 'white' ? 0xffffff : 0xfb923c,
        transparent: true,
        opacity: mode === 'white' ? 0.30 : 0.60,
        depthWrite: false
      });
      const inBeam = new THREE.Mesh(inGeo, inMat);
      inBeam.position.set(X_IN_START + lenIn / 2, 0, 0);
      root.add(inBeam);
      beamMeshes.push(inBeam);

      // Section B: Inside cuvette beam (attenuating / colour filtering)
      const lenCuv = X_CUV_OUT - X_CUV_IN;
      const cuvBeamGeo = new THREE.CylinderGeometry(BEAM_RADIUS, BEAM_RADIUS, lenCuv, 24);
      cuvBeamGeo.rotateZ(Math.PI / 2);
      // In white light: transitions towards blue; in mono: attenuates
      const cuvBeamMat = new THREE.MeshBasicMaterial({
        color: mode === 'white' ? 0x93c5fd : 0xfb923c,
        transparent: true,
        opacity: mode === 'white' ? 0.35 : Math.max(0.18, 0.60 * (1 + T) / 2),
        depthWrite: false
      });
      const cuvBeam = new THREE.Mesh(cuvBeamGeo, cuvBeamMat);
      cuvBeam.position.set(0, 0, 0);
      root.add(cuvBeam);
      beamMeshes.push(cuvBeam);

      // Section C: Transmitted beam
      const lenOut = X_OUT_END - X_CUV_OUT;
      const outGeo = new THREE.CylinderGeometry(BEAM_RADIUS, BEAM_RADIUS, lenOut, 24);
      outGeo.rotateZ(Math.PI / 2);
      const outMat = new THREE.MeshBasicMaterial({
        color: mode === 'white' ? 0x38bdf8 : 0xfb923c,
        transparent: true,
        opacity: mode === 'white' ? 0.42 : Math.max(0.08, 0.60 * T),
        depthWrite: false
      });
      const outBeam = new THREE.Mesh(outGeo, outMat);
      outBeam.position.set(X_CUV_OUT + lenOut / 2, 0, 0);
      root.add(outBeam);
      beamMeshes.push(outBeam);

      // Section D: Source emitter housing (left) and detector sensor housing (right)
      const capGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.22, 24);
      capGeo.rotateZ(Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x222628, roughness: 0.5, metalness: 0.5 });

      const sourceHousing = new THREE.Mesh(capGeo, capMat);
      sourceHousing.position.set(X_IN_START - 0.11, 0, 0);
      root.add(sourceHousing);

      const detectorHousing = new THREE.Mesh(capGeo, capMat);
      detectorHousing.position.set(X_OUT_END + 0.11, 0, 0);
      root.add(detectorHousing);

      // 6. Traveling Photons Initialization
      beamParticles = [];
      const particleGeo = new THREE.SphereGeometry(0.038, 10, 8);

      if (mode === 'white') {
        // Multi-wavelength spectral packets
        SPECTRUM_CHANNELS.forEach((ch, chIdx) => {
          const mat = new THREE.MeshBasicMaterial({ color: ch.hex });
          const count = ch.absorb ? 22 : 12;
          for (let k = 0; k < count; k++) {
            const mesh = new THREE.Mesh(particleGeo, mat);
            const initX = X_IN_START + (k / count) * (X_OUT_END - X_IN_START);
            mesh.position.set(initX, ch.dy, ch.dz);
            root.add(mesh);
            beamParticles.push({
              mesh,
              channel: ch,
              x: initX,
              y: ch.dy,
              z: ch.dz,
              absorbed: false,
              absorbThreshold: 0.15 + (k % 4) * 0.25 // staggered absorption positions
            });
          }
        });
      } else {
        // Monochromatic orange photons (630 nm)
        const orangeMat = new THREE.MeshBasicMaterial({ color: 0xfb923c });
        const totalPhotons = 48;
        for (let k = 0; k < totalPhotons; k++) {
          const mesh = new THREE.Mesh(particleGeo, orangeMat);
          const initX = X_IN_START + (k / totalPhotons) * (X_OUT_END - X_IN_START);
          const angle = (k / totalPhotons) * Math.PI * 6;
          const r = 0.05 + 0.16 * ((k * 7) % 11) / 11;
          const py = Math.sin(angle) * r;
          const pz = Math.cos(angle) * r;
          mesh.position.set(initX, py, pz);
          root.add(mesh);
          beamParticles.push({
            mesh,
            channel: { absorb: true, hex: 0xfb923c },
            x: initX,
            y: py,
            z: pz,
            absorbed: false,
            // Probability of making it through is T
            passThrough: (k % 10) < Math.round(T * 10),
            absorbX: -0.45 + 0.9 * ((k * 13) % 17) / 17
          });
        }
      }
    };

    rebuildScene();

    // Animation Loop
    let lastTime = performance.now();
    const SPEED = 2.4; // beam travel speed

    const render = now => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Fixed viewpoint (no continuous auto-rotation)
      root.rotation.y = ay;
      root.rotation.x = ax;

      if (!isPaused) {
        const timeSec = now * 0.001;

        // 1. Animate Cu²⁺ ions (Brownian float & relaxation)
        copperIons.forEach(ion => {
          ion.group.position.x = ion.base.x + 0.03 * Math.sin(timeSec * 1.5 + ion.phase.x);
          ion.group.position.y = ion.base.y + 0.03 * Math.cos(timeSec * 1.3 + ion.phase.y);
          ion.group.position.z = ion.base.z + 0.03 * Math.sin(timeSec * 1.7 + ion.phase.z);

          // Excitation flash decay
          if (ion.excitation > 0.01) {
            ion.excitation *= 0.92;
            const sc = 1.0 + (1.0 - ion.excitation) * 1.4;
            ion.pulseMesh.scale.set(sc, sc, sc);
            ion.pulseMat.opacity = ion.excitation * 0.85;
          } else {
            ion.excitation = 0;
            ion.pulseMat.opacity = 0;
          }
        });

        // 2. Animate Traveling Photons & Absorption Events
        const X_START = -2.7;
        const X_END = 2.7;
        const X_CUV_IN = -CUV_W / 2;
        const X_CUV_OUT = CUV_W / 2;

        beamParticles.forEach(p => {
          p.x += SPEED * dt;

          // Wrap around to beginning
          if (p.x > X_END) {
            p.x = X_START;
            p.absorbed = false;
            p.mesh.visible = true;
          }

          if (mode === 'white') {
            if (p.channel.absorb) {
              // Orange photon encountering Cu²⁺ inside cuvette
              if (!p.absorbed && p.x >= X_CUV_IN + p.absorbThreshold && p.x <= X_CUV_OUT) {
                p.absorbed = true;
                p.mesh.visible = false;

                // Find nearest ion to trigger absorption flash
                let nearest = null;
                let minDist = 999;
                copperIons.forEach(ion => {
                  const d = Math.hypot(ion.group.position.x - p.x, ion.group.position.y - p.y, ion.group.position.z - p.z);
                  if (d < minDist) {
                    minDist = d;
                    nearest = ion;
                  }
                });
                if (nearest && minDist < 0.65) {
                  nearest.excitation = 1.0;
                }
              }
            }
          } else {
            // Monochromatic orange photons
            if (!p.passThrough && !p.absorbed && p.x >= p.absorbX) {
              p.absorbed = true;
              p.mesh.visible = false;

              let nearest = null;
              let minDist = 999;
              copperIons.forEach(ion => {
                const d = Math.hypot(ion.group.position.x - p.x, ion.group.position.y - p.y, ion.group.position.z - p.z);
                if (d < minDist) {
                  minDist = d;
                  nearest = ion;
                }
              });
              if (nearest && minDist < 0.6) {
                nearest.excitation = 1.0;
              }
            }
          }

          p.mesh.position.x = p.x;
        });
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

  } catch (err) {
    // Fallback: 2D Canvas rendering if WebGL fails
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 230;
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const drawFallback = () => {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(260, 40, 120, 150);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.fillRect(261, 55, 118, 134);
      ctx.fillStyle = '#dcd6cc';
      ctx.font = '12px monospace';
      ctx.fillText('CuSO4 Cuvette (b = 1.0 cm)', 240, 30);
    };
    drawFallback();
  }

  // Window resize observer
  const resizeObs = new ResizeObserver(() => {
    if (!renderer || !camera || !view) return;
    const w = Math.max(260, view.clientWidth || 340);
    const h = 230;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  try { resizeObs.observe(view); } catch (e) {}

  return {
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      try { resizeObs.disconnect(); } catch (e) {}
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);

      controlBar.remove();
      readoutBar.remove();
      infoFooter.remove();

      if (renderer) {
        try {
          renderer.dispose();
          renderer.domElement.remove();
        } catch (e) {}
      }
    }
  };
}
