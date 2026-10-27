/**
 * ionic-radius-animator.js — 3D interactive animation explainer for ionic radii trends.
 *
 * Visualizes how adding or removing an electron affects atomic size:
 *   1. REMOVING an electron (Cation Shrinks: Na 186 pm → Na⁺ 102 pm, -45%):
 *      - Stripping the lone valence electron removes the entire outermost n=3 shell.
 *      - The remaining 10 core electrons feel the unshielded pull of 11 protons.
 *      - The electron cloud contracts dramatically inward.
 *   2. ADDING an electron (Anion Swells: Cl 99 pm → Cl⁻ 181 pm, +83%):
 *      - An extra electron enters the n=3 valence shell to complete the octet.
 *      - With only 17 protons, the nuclear charge does not increase, but electron-electron
 *        repulsion between the 8 valence electrons spikes.
 *      - Mutual repulsion pushes the outer shell outward, swelling the atom.
 *   3. COMPARE ALL (Scale Ranking: Na⁺ 102 pm < Cl⁻ 181 pm < Na 186 pm):
 *      - Side-by-side 3D physical comparison of the three species in stage 5.
 */

import * as THREE from 'three';

const BG = '#0d0c0a';
const C_PROTON = 0xd99423;
const C_NEUTRON = 0x8c8376;
const C_ELECTRON = 0xeef4f8;
const C_ELECTRON_GLOW = 0x8cd5ff;
const C_REPULSION = 0xf59e0b;
const C_CONTRACTION = 0x4ade80;
const C_SHELL_NA = 0xcfc8b8;
const C_SHELL_CL = 0xc9b66a;
const C_RING = 0x9e9382;
const C_GHOST = 0x4a4640;

const MODES = [
  {
    id: 'strip',
    label: '− Strip e⁻ (Na → Na⁺)',
    tag: 'CATION SHRINKS −45%',
    tagColor: '#4ade80',
    metric: '186 pm → 102 pm (Δr = −84 pm)',
    desc: 'Losing the outer n=3 shell leaves 10 electrons pulled in by 11 protons.',
    hint: 'Watch the outer valence electron get stripped and the atom contract inward.'
  },
  {
    id: 'add',
    label: '+ Add e⁻ (Cl → Cl⁻)',
    tag: 'ANION SWELLS +83%',
    tagColor: '#f59e0b',
    metric: '99 pm → 181 pm (Δr = +82 pm)',
    desc: 'The 18th electron adds repulsion among valence electrons with no extra nuclear pull.',
    hint: 'Watch the extra electron enter and mutual repulsion swell the outer shell.'
  },
  {
    id: 'compare',
    label: '☵ Compare All (Scale)',
    tag: 'SCALE COMPARISON',
    tagColor: '#38bdf8',
    metric: 'Na⁺ (102 pm) < Cl⁻ (181 pm) < Na (186 pm)',
    desc: 'Na⁺ lost its shell (smallest); Cl⁻ swelled from repulsion; Na keeps its n=3 shell.',
    hint: 'Drag to rotate and inspect all three species to scale.'
  }
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smooth(u) {
  const c = Math.max(0, Math.min(1, u));
  return c * c * (3 - 2 * c);
}

/** Precomputed clustered nucleon points (up to 35 nucleons). */
const NUCLEON_POINTS = (() => {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 35; i++) {
    const y = 1 - (i / 34) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const dist = 0.12 + (i % 3) * 0.05;
    pts.push([Math.cos(theta) * r * dist, y * dist, Math.sin(theta) * r * dist]);
  }
  return pts;
})();

/**
 * Mount the interactive 3D ionic radius animation explainer.
 * @param {HTMLElement} view host container for 3D/2D view
 * @param {HTMLElement} wrap parent container holding controls
 * @param {object} spec ionic radius spec
 * @param {boolean} still reduced motion / still mode
 * @returns {Function} teardown function
 */
export function mountIonicRadius(view, wrap, spec, still) {
  let disposed = false;
  let raf = 0;
  let teardown = () => {};
  let currentMode = MODES[0];
  let animTime = 0;

  // 1. Controls bar
  const bar = document.createElement('div');
  bar.className = 'lq-ir-bar';
  bar.style.cssText = 'display:flex;gap:4px;padding:6px 8px;background:#14120f;border-bottom:1px solid #2e2a26;flex-wrap:wrap;align-items:center;';

  const label = document.createElement('span');
  label.textContent = 'ACTION:';
  label.style.cssText = 'font-family:ui-monospace,monospace;font-size:10px;font-weight:bold;color:#8c8376;margin-right:2px;';
  bar.appendChild(label);

  const modeButtons = [];
  MODES.forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = m.label;
    const isAct = m.id === currentMode.id;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;padding:3px 8px;cursor:pointer;border:1px solid ${isAct ? '#d99423' : '#3e3933'};background:${isAct ? '#2a2214' : '#1a1815'};color:${isAct ? '#d99423' : '#a59c86'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      if (currentMode.id === m.id) {
        animTime = 0;
        return;
      }
      currentMode = m;
      animTime = 0;
      modeButtons.forEach(({ b, mode }) => {
        const act = mode.id === currentMode.id;
        b.style.borderColor = act ? '#d99423' : '#3e3933';
        b.style.background = act ? '#2a2214' : '#1a1815';
        b.style.color = act ? '#d99423' : '#a59c86';
      });
      updateStatus();
      syncSceneMode();
    });
    bar.appendChild(btn);
    modeButtons.push({ b: btn, mode: m });
  });

  // Replay button
  const replayBtn = document.createElement('button');
  replayBtn.type = 'button';
  replayBtn.textContent = '⟳ Replay';
  replayBtn.style.cssText = 'margin-left:auto;font-family:ui-monospace,monospace;font-size:10px;padding:3px 8px;cursor:pointer;border:1px solid #3e3933;background:#1a1815;color:#a59c86;border-radius:2px;';
  replayBtn.addEventListener('click', () => {
    animTime = 0;
  });
  bar.appendChild(replayBtn);

  // 2. Status readout banner
  const statusBar = document.createElement('div');
  statusBar.className = 'lq-ir-status';
  statusBar.style.cssText = 'padding:6px 12px;font-family:ui-monospace,monospace;font-size:11px;background:#0d0c0a;border-bottom:1px solid #24201c;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;';

  const updateStatus = () => {
    statusBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="display:inline-block;padding:1px 6px;background:${currentMode.tagColor}22;color:${currentMode.tagColor};border:1px solid ${currentMode.tagColor}44;font-size:10px;font-weight:700;border-radius:2px;">${currentMode.tag}</span>
        <span style="color:#dcd6cc;font-weight:600;">${currentMode.metric}</span>
      </div>
      <div style="font-size:10px;color:#8c8376;">
        ${currentMode.desc}
      </div>
    `;
  };
  updateStatus();

  wrap.insertBefore(statusBar, view);
  wrap.insertBefore(bar, statusBar);

  let syncSceneMode = () => {};

  // 3. Fallback 2D flat canvas for still / reduced motion
  if (still) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 240;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const drawFlat = () => {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (currentMode.id === 'strip') {
        // Na (186 pm) -> Na+ (102 pm)
        const cx1 = 180, cy = 120, r1 = 80;
        const cx2 = 460, r2 = 44;

        // Na neutral
        ctx.strokeStyle = '#544e46';
        ctx.beginPath(); ctx.arc(cx1, cy, r1, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(207,200,184,0.1)';
        ctx.beginPath(); ctx.arc(cx1, cy, r1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C_SHELL_NA;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Na (186 pm)', cx1, cy - r1 - 10);
        ctx.fillText('[2, 8, 1]', cx1, cy + r1 + 18);

        // Arrow
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('− 1 e⁻ (strip)', 320, cy - 10);
        ctx.fillText('→', 320, cy + 10);

        // Na+ ion
        ctx.strokeStyle = '#4ade80';
        ctx.beginPath(); ctx.arc(cx2, cy, r2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(74,222,128,0.12)';
        ctx.beginPath(); ctx.arc(cx2, cy, r2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.fillText('Na⁺ (102 pm)', cx2, cy - r2 - 10);
        ctx.fillText('[2, 8]', cx2, cy + r2 + 18);
      } else if (currentMode.id === 'add') {
        // Cl (99 pm) -> Cl- (181 pm)
        const cx1 = 180, cy = 120, r1 = 43;
        const cx2 = 460, r2 = 78;

        // Cl neutral
        ctx.strokeStyle = '#544e46';
        ctx.beginPath(); ctx.arc(cx1, cy, r1, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(201,182,106,0.1)';
        ctx.beginPath(); ctx.arc(cx1, cy, r1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C_SHELL_CL;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Cl (99 pm)', cx1, cy - r1 - 10);
        ctx.fillText('[2, 8, 7]', cx1, cy + r1 + 18);

        // Arrow
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('+ 1 e⁻ (add)', 320, cy - 10);
        ctx.fillText('→', 320, cy + 10);

        // Cl- ion
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(cx2, cy, r2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(245,158,11,0.12)';
        ctx.beginPath(); ctx.arc(cx2, cy, r2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Cl⁻ (181 pm)', cx2, cy - r2 - 10);
        ctx.fillText('[2, 8, 8]', cx2, cy + r2 + 18);
      } else {
        // Compare All
        const items = [
          { label: 'Na⁺ (102 pm)', r: 44, cx: 130, color: '#4ade80', config: '[2, 8]' },
          { label: 'Cl⁻ (181 pm)', r: 78, cx: 320, color: '#f59e0b', config: '[2, 8, 8]' },
          { label: 'Na (186 pm)',  r: 80, cx: 510, color: C_SHELL_NA, config: '[2, 8, 1]' }
        ];
        items.forEach(({ label, r, cx, color, config }) => {
          ctx.strokeStyle = color;
          ctx.beginPath(); ctx.arc(cx, 120, r, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `${color}22`;
          ctx.beginPath(); ctx.arc(cx, 120, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = color;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, cx, 120 - r - 10);
          ctx.fillText(config, cx, 120 + r + 18);
        });
      }
    };
    drawFlat();
    syncSceneMode = drawFlat;
    return () => {
      bar.remove();
      statusBar.remove();
      canvas.remove();
    };
  }

  // 4. 3D WebGL Implementation
  let ay = 0.55;
  let ax = 0.25;
  let drag = null;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) {} };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-0.9, Math.min(0.9, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const init3D = async () => {
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const getW = () => Math.max(240, view.clientWidth || 320);
    const getH = () => Math.max(200, view.clientHeight || 220);
    renderer.setSize(getW(), getH());
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, getW() / getH(), 0.1, 100);
    camera.position.set(0, 0.8, 5.8);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x14120f, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(4, 5, 4);
    scene.add(sun);
    const fillLight = new THREE.DirectionalLight(0xd99423, 0.4);
    fillLight.position.set(-3, -2, -3);
    scene.add(fillLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Reusable geometries
    const sphereGeo = new THREE.SphereGeometry(0.09, 14, 10);
    const electronGeo = new THREE.SphereGeometry(0.062, 14, 10);
    const trailDotGeo = new THREE.SphereGeometry(0.034, 8, 6);

    const matProton = new THREE.MeshStandardMaterial({ color: C_PROTON, emissive: C_PROTON, emissiveIntensity: 0.35, roughness: 0.35 });
    const matNeutron = new THREE.MeshStandardMaterial({ color: C_NEUTRON, roughness: 0.65 });
    const matElectron = new THREE.MeshStandardMaterial({ color: C_ELECTRON, emissive: C_ELECTRON_GLOW, emissiveIntensity: 0.85, roughness: 0.2 });

    // Ghost dashed ring
    const ghostSegments = 64;
    const ghostRingGeo = new THREE.BufferGeometry();
    const ghostRingPts = [];
    for (let i = 0; i <= ghostSegments; i++) {
      const theta = (i / ghostSegments) * Math.PI * 2;
      ghostRingPts.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    ghostRingGeo.setFromPoints(ghostRingPts);
    const matGhostRing = new THREE.LineDashedMaterial({ color: C_GHOST, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.45 });

    // Translucent shell sphere
    const shellSphereGeo = new THREE.SphereGeometry(1, 28, 20);
    const matShellSphere = new THREE.MeshStandardMaterial({
      color: C_SHELL_NA,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const shellSphere = new THREE.Mesh(shellSphereGeo, matShellSphere);
    rootGroup.add(shellSphere);

    // Orbit Ring Line
    const unitRingGeo = new THREE.BufferGeometry();
    const unitRingPts = [];
    for (let i = 0; i <= ghostSegments; i++) {
      const theta = (i / ghostSegments) * Math.PI * 2;
      unitRingPts.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    unitRingGeo.setFromPoints(unitRingPts);
    const matUnitRing = new THREE.LineBasicMaterial({ color: C_RING, transparent: true, opacity: 0.65 });
    const valenceRing = new THREE.Line(unitRingGeo, matUnitRing);
    rootGroup.add(valenceRing);

    // Ghost baseline ring
    const ghostRing = new THREE.Line(ghostRingGeo, matGhostRing);
    ghostRing.computeLineDistances();
    rootGroup.add(ghostRing);

    // Contraction ripple ring
    const matContraction = new THREE.LineBasicMaterial({ color: C_CONTRACTION, transparent: true, opacity: 0 });
    const contractionRing = new THREE.Line(unitRingGeo, matContraction);
    rootGroup.add(contractionRing);

    // Repulsion ripple ring
    const matRepulsion = new THREE.LineBasicMaterial({ color: C_REPULSION, transparent: true, opacity: 0 });
    const repulsionRing = new THREE.Line(unitRingGeo, matRepulsion);
    rootGroup.add(repulsionRing);

    // Nucleus meshes
    const nucleusGroup = new THREE.Group();
    rootGroup.add(nucleusGroup);
    const nucleonMeshes = [];
    NUCLEON_POINTS.forEach(([x, y, z], idx) => {
      const isProton = idx % 2 === 0;
      const m = new THREE.Mesh(sphereGeo, isProton ? matProton : matNeutron);
      m.position.set(x, y, z);
      nucleusGroup.add(m);
      nucleonMeshes.push(m);
    });

    // Core Shell (1s, 2s) Orbit Rings & Electrons
    const coreGroup = new THREE.Group();
    rootGroup.add(coreGroup);

    const innerRingMat = new THREE.LineBasicMaterial({ color: 0x544e46, transparent: true, opacity: 0.4 });
    const ring1s = new THREE.Line(unitRingGeo, innerRingMat);
    ring1s.scale.set(0.36, 0.36, 0.36);
    coreGroup.add(ring1s);

    const ring2s = new THREE.Line(unitRingGeo, innerRingMat);
    ring2s.scale.set(0.72, 0.72, 0.72);
    ring2s.rotation.x = 0.35;
    coreGroup.add(ring2s);

    const coreElectrons = [];
    // 2 electrons on 1s
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(electronGeo, matElectron);
      coreGroup.add(m);
      coreElectrons.push({ mesh: m, shell: 1, phase: i * Math.PI, r: 0.36 });
    }
    // 8 electrons on 2s
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(electronGeo, matElectron);
      coreGroup.add(m);
      coreElectrons.push({ mesh: m, shell: 2, phase: (i / 8) * Math.PI * 2, r: 0.72 });
    }

    // Valence Electrons (up to 8)
    const valenceElectrons = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(electronGeo, matElectron);
      rootGroup.add(m);
      valenceElectrons.push({ mesh: m, phase: (i / 8) * Math.PI * 2 });
    }

    // Free flying / moving electron (for strip or add trajectory)
    const movingElectron = new THREE.Mesh(electronGeo, matElectron);
    rootGroup.add(movingElectron);
    const movingTrailDots = [];
    for (let i = 0; i < 8; i++) {
      const td = new THREE.Mesh(trailDotGeo, new THREE.MeshBasicMaterial({ color: C_ELECTRON_GLOW, transparent: true, opacity: 0.4 }));
      rootGroup.add(td);
      movingTrailDots.push(td);
    }

    // Compare Mode Group (3 separate atom spheres side by side)
    const compareGroup = new THREE.Group();
    rootGroup.add(compareGroup);
    compareGroup.visible = false;

    const compareAtoms = [
      { sym: 'Na+', pm: 102, r: 0.85, x: -2.2, color: '#4ade80', z: 11, e: 10, charge: '+1' },
      { sym: 'Cl-', pm: 181, r: 1.51, x: 0.0,  color: '#f59e0b', z: 17, e: 18, charge: '−1' },
      { sym: 'Na',  pm: 186, r: 1.55, x: 2.2,  color: C_SHELL_NA, z: 11, e: 11, charge: '0' }
    ].map(cfg => {
      const grp = new THREE.Group();
      grp.position.set(cfg.x, 0, 0);

      // Translucent shell sphere
      const sphMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const sph = new THREE.Mesh(shellSphereGeo, sphMat);
      sph.scale.set(cfg.r, cfg.r, cfg.r);
      grp.add(sph);

      // Outer ring
      const rngMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.7 });
      const rng = new THREE.Line(unitRingGeo, rngMat);
      rng.scale.set(cfg.r, cfg.r, cfg.r);
      grp.add(rng);

      // Small central nucleus sphere
      const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), matProton);
      grp.add(nuc);

      // Valence electrons
      const eMeshes = [];
      const numE = cfg.sym === 'Na+' ? 4 : cfg.sym === 'Cl-' ? 8 : 1;
      for (let i = 0; i < numE; i++) {
        const em = new THREE.Mesh(electronGeo, matElectron);
        grp.add(em);
        eMeshes.push({ mesh: em, phase: (i / numE) * Math.PI * 2, r: cfg.r });
      }

      compareGroup.add(grp);
      return { grp, cfg, eMeshes };
    });

    syncSceneMode = () => {
      const mode = currentMode.id;
      if (mode === 'compare') {
        compareGroup.visible = true;
        nucleusGroup.visible = false;
        coreGroup.visible = false;
        shellSphere.visible = false;
        valenceRing.visible = false;
        ghostRing.visible = false;
        contractionRing.visible = false;
        repulsionRing.visible = false;
        movingElectron.visible = false;
        movingTrailDots.forEach(d => { d.visible = false; });
        valenceElectrons.forEach(ve => { ve.mesh.visible = false; });
      } else {
        compareGroup.visible = false;
        nucleusGroup.visible = true;
        coreGroup.visible = true;
        shellSphere.visible = true;
        valenceRing.visible = true;
        ghostRing.visible = true;
      }
    };
    syncSceneMode();

    const ro = new ResizeObserver(() => {
      const w = getW();
      const h = getH();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(view);

    // Animation Loop
    let lastT = performance.now();
    const render = now => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      animTime += dt;

      // Subtle rotation
      if (!drag) ay += 0.003;
      rootGroup.rotation.y = ay;
      rootGroup.rotation.x = ax;

      const cycle = animTime % 4.2;
      const mode = currentMode.id;

      if (mode === 'strip') {
        // Mode 1: Na (186 pm, R=1.95) -> Na+ (102 pm, R=1.07)
        // Active Nucleons: Na = 11 protons + 12 neutrons = 23
        nucleonMeshes.forEach((nm, idx) => { nm.visible = idx < 23; });
        matShellSphere.color.set(C_SHELL_NA);

        const rNeutral = 1.95;
        const rIon = 1.07;
        ghostRing.visible = true;
        ghostRing.scale.set(rNeutral, rNeutral, rNeutral);

        // Core electrons orbit (10 core electrons)
        coreElectrons.forEach(ce => {
          ce.mesh.visible = true;
          const phi = ce.phase + animTime * (ce.shell === 1 ? 4.5 : 3.0);
          ce.mesh.position.set(Math.cos(phi) * ce.r, 0, Math.sin(phi) * ce.r);
        });

        // 1 valence electron on n=3
        valenceElectrons.forEach((ve, idx) => { ve.mesh.visible = false; });

        let currentR = rNeutral;
        let contractionAlpha = 0;
        let stripT = 0;

        if (cycle < 0.6) {
          // Neutral atom orbiting stably
          currentR = rNeutral;
          movingElectron.visible = true;
          const phi = animTime * 2.2;
          movingElectron.position.set(Math.cos(phi) * rNeutral, 0, Math.sin(phi) * rNeutral);
          movingTrailDots.forEach(td => { td.visible = false; });
          valenceRing.scale.set(rNeutral, rNeutral, rNeutral);
          matUnitRing.opacity = 0.65;
          matShellSphere.opacity = 0.14;
        } else if (cycle < 2.0) {
          // Stripping & Shrinking Phase
          stripT = (cycle - 0.6) / 1.4;
          const easeT = smooth(stripT);
          currentR = rNeutral - (rNeutral - rIon) * easeT;

          // Outer electron escaping trajectory
          movingElectron.visible = true;
          const escapeDist = rNeutral + stripT * 3.5;
          const escapeAngle = 0.6 * 2.2 + stripT * 1.5;
          movingElectron.position.set(
            Math.cos(escapeAngle) * escapeDist,
            stripT * 1.8,
            Math.sin(escapeAngle) * escapeDist
          );

          // Trail dots
          movingTrailDots.forEach((td, idx) => {
            td.visible = true;
            const lag = (idx + 1) * 0.08;
            const tLag = Math.max(0, stripT - lag);
            const dLag = rNeutral + tLag * 3.5;
            const aLag = 0.6 * 2.2 + tLag * 1.5;
            td.position.set(Math.cos(aLag) * dLag, tLag * 1.8, Math.sin(aLag) * dLag);
          });

          // Outer ring fades out as valence shell drops off
          matUnitRing.opacity = Math.max(0, 0.65 * (1 - easeT));
          contractionAlpha = Math.sin(stripT * Math.PI);
        } else {
          // Ion holding stable Na+
          currentR = rIon;
          movingElectron.visible = false;
          movingTrailDots.forEach(td => { td.visible = false; });
          matUnitRing.opacity = 0;
          matShellSphere.opacity = 0.16;
        }

        shellSphere.scale.set(currentR, currentR, currentR);
        valenceRing.scale.set(currentR, currentR, currentR);

        // Contraction ripple
        if (contractionAlpha > 0.05) {
          contractionRing.visible = true;
          const ripR = rNeutral - (rNeutral - rIon) * (1 - contractionAlpha);
          contractionRing.scale.set(ripR, ripR, ripR);
          matContraction.opacity = contractionAlpha * 0.8;
        } else {
          contractionRing.visible = false;
        }
        repulsionRing.visible = false;

      } else if (mode === 'add') {
        // Mode 2: Cl (99 pm, R=1.04) -> Cl- (181 pm, R=1.92)
        // Active Nucleons: Cl = 17 protons + 18 neutrons = 35
        nucleonMeshes.forEach(nm => { nm.visible = true; });
        matShellSphere.color.set(C_SHELL_CL);

        const rNeutral = 1.04;
        const rIon = 1.92;
        ghostRing.visible = true;
        ghostRing.scale.set(rNeutral, rNeutral, rNeutral);

        // Core electrons orbit (10 core electrons)
        coreElectrons.forEach(ce => {
          ce.mesh.visible = true;
          const phi = ce.phase + animTime * (ce.shell === 1 ? 4.5 : 3.0);
          ce.mesh.position.set(Math.cos(phi) * ce.r, 0, Math.sin(phi) * ce.r);
        });

        let currentR = rNeutral;
        let repulsionAlpha = 0;

        if (cycle < 0.6) {
          // Neutral Cl: 7 valence electrons orbiting at 99 pm
          currentR = rNeutral;
          movingElectron.visible = false;
          movingTrailDots.forEach(td => { td.visible = false; });
          valenceElectrons.forEach((ve, idx) => {
            ve.mesh.visible = idx < 7;
            const phi = ve.phase + animTime * 2.2;
            ve.mesh.position.set(Math.cos(phi) * rNeutral, 0, Math.sin(phi) * rNeutral);
          });
        } else if (cycle < 2.2) {
          // Incoming 8th electron & Swelling
          const inT = (cycle - 0.6) / 1.6;
          const easeT = smooth(inT);

          if (inT < 0.45) {
            // Electron flying inward
            const flyT = inT / 0.45;
            movingElectron.visible = true;
            const inDist = 4.0 - flyT * (4.0 - rNeutral);
            const inAngle = Math.PI * 0.75 - flyT * Math.PI * 0.5;
            movingElectron.position.set(Math.cos(inAngle) * inDist, (1 - flyT) * 1.5, Math.sin(inAngle) * inDist);

            movingTrailDots.forEach((td, idx) => {
              td.visible = true;
              const lagT = Math.max(0, flyT - (idx + 1) * 0.08);
              const dLag = 4.0 - lagT * (4.0 - rNeutral);
              const aLag = Math.PI * 0.75 - lagT * Math.PI * 0.5;
              td.position.set(Math.cos(aLag) * dLag, (1 - lagT) * 1.5, Math.sin(aLag) * dLag);
            });

            currentR = rNeutral;
            valenceElectrons.forEach((ve, idx) => {
              ve.mesh.visible = idx < 7;
              const phi = ve.phase + animTime * 2.2;
              ve.mesh.position.set(Math.cos(phi) * rNeutral, 0, Math.sin(phi) * rNeutral);
            });
          } else {
            // Swelling under electron-electron repulsion!
            movingElectron.visible = false;
            movingTrailDots.forEach(td => { td.visible = false; });

            const swellT = (inT - 0.45) / 0.55;
            const easeSwell = smooth(swellT);
            currentR = rNeutral + (rIon - rNeutral) * easeSwell;
            repulsionAlpha = Math.sin(easeSwell * Math.PI);

            // All 8 valence electrons orbiting on expanding shell
            valenceElectrons.forEach((ve, idx) => {
              ve.mesh.visible = true;
              const phi = ve.phase + animTime * (2.2 - easeSwell * 0.8);
              ve.mesh.position.set(Math.cos(phi) * currentR, 0, Math.sin(phi) * currentR);
            });
          }
        } else {
          // Stable Cl- anion holding at 181 pm
          currentR = rIon;
          movingElectron.visible = false;
          movingTrailDots.forEach(td => { td.visible = false; });
          valenceElectrons.forEach(ve => {
            ve.mesh.visible = true;
            const phi = ve.phase + animTime * 1.4;
            ve.mesh.position.set(Math.cos(phi) * rIon, 0, Math.sin(phi) * rIon);
          });
        }

        shellSphere.scale.set(currentR, currentR, currentR);
        valenceRing.scale.set(currentR, currentR, currentR);

        // Repulsion ripple
        if (repulsionAlpha > 0.05) {
          repulsionRing.visible = true;
          const ripR = currentR + repulsionAlpha * 0.25;
          repulsionRing.scale.set(ripR, ripR, ripR);
          matRepulsion.opacity = repulsionAlpha * 0.85;
        } else {
          repulsionRing.visible = false;
        }
        contractionRing.visible = false;

      } else {
        // Mode 3: Compare All
        compareAtoms.forEach(({ eMeshes }) => {
          eMeshes.forEach(em => {
            const phi = em.phase + animTime * 2.0;
            em.mesh.position.set(Math.cos(phi) * em.r, 0, Math.sin(phi) * em.r);
          });
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    render(performance.now());

    teardown = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);

      renderer.dispose();
      renderer.domElement.remove();

      sphereGeo.dispose();
      electronGeo.dispose();
      trailDotGeo.dispose();
      ghostRingGeo.dispose();
      shellSphereGeo.dispose();
      unitRingGeo.dispose();

      matProton.dispose();
      matNeutron.dispose();
      matElectron.dispose();
      matGhostRing.dispose();
      matShellSphere.dispose();
      matUnitRing.dispose();
      matContraction.dispose();
      matRepulsion.dispose();
      innerRingMat.dispose();
    };
  };

  init3D();

  return () => {
    disposed = true;
    try { teardown(); } catch (err) {}
    bar.remove();
    statusBar.remove();
  };
}
