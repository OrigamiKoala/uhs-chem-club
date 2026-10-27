/**
 * orbital-3d-viewer.js — Interactive 3D orbital animations for reward cards and debriefs.
 *
 * Renders textbook-accurate 3D boundary isosurfaces (lobes and rings) with wave phase colors
 * (amber for +, cyan for -), coordinate axes, and quantum probability density particles.
 */

import { sampleOrbital } from '../learn/engine/orbitals.js';

const BG = '#0d0c0a';

/** Build a smooth teardrop orbital lobe revolving around the +Y axis. */
function buildLobeGeometry(THREE, length = 1.25, maxRadius = 0.52) {
  const points = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Pinched at nucleus (t=0), bulbous at t=0.65, rounded smooth at tip (t=1)
    const r = maxRadius * Math.sin(Math.PI * t) * Math.sqrt(t);
    const y = t * length;
    points.push(new THREE.Vector2(Math.max(0, r), y));
  }
  return new THREE.LatheGeometry(points, 24);
}

/** Definition of the five d-orbitals with orientations, phases and descriptions. */
export const D_ORBITALS_DEF = [
  {
    id: '3dz2',
    label: '3d(z²)',
    name: '3dz²',
    shape: 'Two lobes & donut ring',
    desc: 'Two dumbbell lobes along the z-axis (positive phase, amber) and a toroidal donut ring in the xy-plane (negative phase, cyan). Conical nodal surfaces separate the lobes from the ring.',
    features: ['2 Lobes along ±Z', 'Toroidal ring in XY plane', 'Conical nodes at θ ≈ 54.7°'],
    lobes: [
      { dir: [0, 1, 0], phase: 1 },
      { dir: [0, -1, 0], phase: 1 }
    ],
    torus: { r: 0.62, tube: 0.16, phase: -1 }
  },
  {
    id: '3dxy',
    label: '3d(xy)',
    name: '3dxy',
    shape: 'Four lobes in xy-plane',
    desc: 'Four cloverleaf lobes lying in the horizontal xy-plane pointing at 45° between the x and y axes. Nodal planes lie at x = 0 and y = 0.',
    features: ['4 Lobes in XY plane', '45° between X and Y axes', 'Planar nodes at x=0, y=0'],
    lobes: [
      { dir: [0.707, 0, 0.707], phase: 1 },
      { dir: [-0.707, 0, 0.707], phase: -1 },
      { dir: [-0.707, 0, -0.707], phase: 1 },
      { dir: [0.707, 0, -0.707], phase: -1 }
    ]
  },
  {
    id: '3dxz',
    label: '3d(xz)',
    name: '3dxz',
    shape: 'Four lobes in xz-plane',
    desc: 'Four cloverleaf lobes lying in the vertical xz-plane pointing at 45° between the x and z axes. Nodal planes lie at x = 0 and z = 0.',
    features: ['4 Lobes in XZ plane', 'Vertical orientation', 'Planar nodes at x=0, z=0'],
    lobes: [
      { dir: [0.707, 0.707, 0], phase: 1 },
      { dir: [-0.707, 0.707, 0], phase: -1 },
      { dir: [-0.707, -0.707, 0], phase: 1 },
      { dir: [0.707, -0.707, 0], phase: -1 }
    ]
  },
  {
    id: '3dyz',
    label: '3d(yz)',
    name: '3dyz',
    shape: 'Four lobes in yz-plane',
    desc: 'Four cloverleaf lobes lying in the vertical yz-plane pointing at 45° between the y and z axes. Nodal planes lie at y = 0 and z = 0.',
    features: ['4 Lobes in YZ plane', 'Vertical orientation', 'Planar nodes at y=0, z=0'],
    lobes: [
      { dir: [0, 0.707, 0.707], phase: 1 },
      { dir: [0, 0.707, -0.707], phase: -1 },
      { dir: [0, -0.707, -0.707], phase: 1 },
      { dir: [0, -0.707, 0.707], phase: -1 }
    ]
  },
  {
    id: '3dx2y2',
    label: '3d(x²-y²)',
    name: '3dx²-y²',
    shape: 'Four lobes along x & y axes',
    desc: 'Four cloverleaf lobes pointing directly along the x and y axes. Nodal planes lie at 45° between the axes (x = ±y).',
    features: ['4 Lobes along X & Y axes', 'Directly along axes', 'Planar nodes at x=±y'],
    lobes: [
      { dir: [1, 0, 0], phase: 1 },
      { dir: [-1, 0, 0], phase: 1 },
      { dir: [0, 0, 1], phase: -1 },
      { dir: [0, 0, -1], phase: -1 }
    ]
  },
  {
    id: 'all',
    label: 'All 5',
    name: 'All Five d Orbitals',
    shape: 'Five degenerate d orbitals',
    desc: 'The complete set of five d orbitals from the third shell up. Four have four cloverleaf lobes, and one has two lobes with a donut ring.',
    features: ['ml = -2, -1, 0, +1, +2', 'Hold up to 10 electrons', 'Key in transition metals'],
    all: true
  }
];

/** Build 3D mesh for an orbital specification */
function createOrbitalMesh(THREE, def, scale = 1) {
  const group = new THREE.Group();

  // Materials with phase colors: amber (+) and cyan (-)
  const matPos = new THREE.MeshStandardMaterial({
    color: 0xe69f00,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
  });
  const matNeg = new THREE.MeshStandardMaterial({
    color: 0x0072b2,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
  });

  // 1. Central Nucleus
  const nucGeo = new THREE.SphereGeometry(0.08 * scale, 16, 12);
  const nucMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, emissive: 0xfffae0, emissiveIntensity: 0.6, roughness: 0.2 });
  const nucleus = new THREE.Mesh(nucGeo, nucMat);
  group.add(nucleus);

  // 2. Lobes
  if (def.lobes) {
    const lobeGeo = buildLobeGeometry(THREE, 1.25 * scale, 0.52 * scale);
    def.lobes.forEach(l => {
      const mesh = new THREE.Mesh(lobeGeo, l.phase > 0 ? matPos : matNeg);
      const v = new THREE.Vector3(...l.dir).normalize();
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      group.add(mesh);
    });
  }

  // 3. Torus ring (for 3dz2)
  if (def.torus) {
    const torGeo = new THREE.TorusGeometry(def.torus.r * scale, def.torus.tube * scale, 20, 48);
    const torMesh = new THREE.Mesh(torGeo, def.torus.phase > 0 ? matPos : matNeg);
    torMesh.rotation.x = Math.PI / 2; // lie in horizontal plane
    group.add(torMesh);
  }

  // 4. Coordinate Axes
  const axisLen = 1.65 * scale;
  const lineMat = new THREE.LineBasicMaterial({ color: 0x544e46, transparent: true, opacity: 0.55 });
  for (const dir of [[axisLen, 0, 0], [0, axisLen, 0], [0, 0, axisLen]]) {
    const pts = [new THREE.Vector3(-dir[0], -dir[1], -dir[2]), new THREE.Vector3(...dir)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, lineMat));
  }

  return group;
}

/** Mount interactive 5 d-orbitals 3D viewer. */
export function mountDOrbitals3D(view, wrap, config, still) {
  let activeOrbital = D_ORBITALS_DEF[0];

  // 1. Tab buttons bar
  const bar = document.createElement('div');
  bar.className = 'lq-orbital-bar';
  bar.style.cssText = 'display:flex;gap:4px;padding:6px 8px;background:#14120f;border-bottom:1px solid #2e2a26;flex-wrap:wrap;align-items:center;';

  const label = document.createElement('span');
  label.textContent = 'ORBITAL:';
  label.style.cssText = 'font-family:ui-monospace,monospace;font-size:10px;font-weight:bold;color:#8c8376;margin-right:2px;';
  bar.appendChild(label);

  const btns = [];
  D_ORBITALS_DEF.forEach(o => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = o.label;
    const isAct = o.id === activeOrbital.id;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;padding:3px 7px;cursor:pointer;border:1px solid ${isAct ? '#d99423' : '#3e3933'};background:${isAct ? '#2a2214' : '#1a1815'};color:${isAct ? '#d99423' : '#a59c86'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      activeOrbital = o;
      btns.forEach(({ b, item }) => {
        const act = item.id === activeOrbital.id;
        b.style.borderColor = act ? '#d99423' : '#3e3933';
        b.style.background = act ? '#2a2214' : '#1a1815';
        b.style.color = act ? '#d99423' : '#a59c86';
      });
      updateScene();
      updateStatus();
    });
    bar.appendChild(btn);
    btns.push({ b: btn, item: o });
  });

  // Phase legend
  const legend = document.createElement('div');
  legend.style.cssText = 'margin-left:auto;display:flex;gap:8px;align-items:center;font-size:10px;font-family:ui-monospace,monospace;';
  legend.innerHTML = `
    <span style="display:flex;align-items:center;gap:3px;"><span style="display:inline-block;width:8px;height:8px;background:#e69f00;border-radius:1px;"></span><span style="color:#e69f00;">+ Phase</span></span>
    <span style="display:flex;align-items:center;gap:3px;"><span style="display:inline-block;width:8px;height:8px;background:#0072b2;border-radius:1px;"></span><span style="color:#38bdf8;">− Phase</span></span>
  `;
  bar.appendChild(legend);

  // 2. Status / description box
  const statusBox = document.createElement('div');
  statusBox.className = 'lq-orbital-status';
  statusBox.style.cssText = 'padding:6px 10px;background:#100e0c;border-bottom:1px solid #24201c;font-family:ui-monospace,monospace;font-size:11px;display:flex;flex-direction:column;gap:3px;';

  const updateStatus = () => {
    statusBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;padding:1px 5px;background:#d9942322;color:#d99423;border:1px solid #d9942355;font-size:10px;font-weight:bold;border-radius:2px;">${activeOrbital.name}</span>
        <span style="color:#dcd6cc;font-weight:600;">${activeOrbital.shape}</span>
      </div>
    `;
  };
  updateStatus();

  wrap.insertBefore(statusBox, view);
  wrap.insertBefore(bar, statusBox);

  let disposed = false;
  let raf = 0;
  let teardown = () => {};
  let updateScene = () => {};

  // Drag interaction
  let ay = 0.6;
  let ax = 0.35;
  let drag = null;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) {} };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-1.1, Math.min(1.1, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const init3D = async () => {
    const THREE = await import('three');
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const w = Math.max(260, view.clientWidth || 340);
    const h = 230;
    renderer.setSize(w, h);
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 4.8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xfff8ee, 0x14120f, 1.3));
    const sun1 = new THREE.DirectionalLight(0xffffff, 1.2);
    sun1.position.set(4, 5, 4);
    scene.add(sun1);
    const sun2 = new THREE.DirectionalLight(0x78a142, 0.4);
    sun2.position.set(-4, -2, -3);
    scene.add(sun2);

    const root = new THREE.Group();
    scene.add(root);

    // Particle cloud for active orbital
    let particlesMesh = null;
    const particleMat = new THREE.PointsMaterial({ color: 0xd99423, size: 0.045, transparent: true, opacity: 0.75 });

    updateScene = () => {
      // Clear previous orbital meshes
      while (root.children.length > 0) {
        const obj = root.children[0];
        root.remove(obj);
        obj.traverse?.(child => {
          child.geometry?.dispose();
        });
      }

      if (activeOrbital.all) {
        // Show all 5 in an arc
        const singleDefs = D_ORBITALS_DEF.filter(x => !x.all);
        const radius = 2.4;
        singleDefs.forEach((def, idx) => {
          const angle = ((idx - 2) / 2) * 0.75;
          const m = createOrbitalMesh(THREE, def, 0.42);
          m.position.set(Math.sin(angle) * radius, 0, (Math.cos(angle) - 1) * radius);
          root.add(m);
        });
        camera.position.set(0, 1.6, 5.8);
      } else {
        // Single focused orbital
        const m = createOrbitalMesh(THREE, activeOrbital, 1.0);
        root.add(m);

        // Add real wavefunction sampled dots
        const sampleKey = activeOrbital.id === '3dx2y2' ? '3dx2y2' : activeOrbital.id;
        try {
          const pts = sampleOrbital(sampleKey, 140, 1);
          let reach = 1;
          for (const p of pts) reach = Math.max(reach, Math.hypot(p.x, p.y, p.z));
          const k = 1.35 / reach;
          const pos = new Float32Array(pts.length * 3);
          pts.forEach((p, i) => {
            pos[i * 3] = p.x * k;
            pos[i * 3 + 1] = p.z * k;
            pos[i * 3 + 2] = p.y * k;
          });
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          particlesMesh = new THREE.Points(geo, particleMat);
          root.add(particlesMesh);
        } catch (e) {}

        camera.position.set(0, 1.2, 4.6);
      }
    };

    updateScene();

    const t0 = performance.now();
    const animate = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.007;
      root.rotation.set(ax, ay, 0);

      // Gentle wave pulse on particles
      if (particlesMesh && !still) {
        const pulse = 1 + Math.sin((now - t0) * 0.003) * 0.04;
        particlesMesh.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    teardown = () => {
      renderer.dispose();
      renderer.domElement.remove();
    };
  };

  init3D().catch(() => {});

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    teardown();
    wrap.remove();
  };
}

/** Mount interactive s, p, and d orbital 3D animations for the debrief. */
export function mountDebriefOrbitalViewer(host, config, still) {
  const container = document.createElement('div');
  container.className = 'lq-debrief-orbital-viewer';
  container.style.cssText = 'display:flex;flex-direction:column;width:100%;background:#0d0c0a;border-radius:3px;overflow:hidden;';
  host.appendChild(container);

  let activeType = 's'; // 's', 'p', 'd'
  let activeDIndex = 0;

  // 1. Top tabs: s, p, d
  const nav = document.createElement('div');
  nav.style.cssText = 'display:flex;gap:6px;padding:6px 8px;background:#161411;border-bottom:1px solid #2e2a26;align-items:center;flex-wrap:wrap;';

  const title = document.createElement('span');
  title.textContent = '3D ORBITAL SHAPES:';
  title.style.cssText = 'font-family:ui-monospace,monospace;font-size:10px;font-weight:bold;color:#8c8376;margin-right:4px;';
  nav.appendChild(title);

  const tabs = [
    { type: 's', label: 's Orbital (Sphere)', desc: 's Orbital (l = 0): Perfect spherical symmetry. An electron has equal probability density in all directions. Holds up to 2 electrons.' },
    { type: 'p', label: 'p Orbital (Two Lobes)', desc: 'p Orbital (l = 1): Dumbbell shape with two opposite lobes separated by a planar node through the nucleus. Set of 3 (px, py, pz) holds up to 6 electrons.' },
    { type: 'd', label: 'd Orbitals (Four Lobes & Ring)', desc: 'd Orbitals (l = 2): Set of 5 orbitals. Four have four cloverleaf lobes, and one has two lobes with a donut ring. Holds up to 10 electrons.' }
  ];

  const tabBtns = tabs.map(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t.label;
    const isAct = t.type === activeType;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;padding:3px 8px;cursor:pointer;border:1px solid ${isAct ? '#d99423' : '#3e3933'};background:${isAct ? '#2a2214' : '#1a1815'};color:${isAct ? '#d99423' : '#a59c86'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      activeType = t.type;
      tabBtns.forEach(({ b, item }) => {
        const act = item.type === activeType;
        b.style.borderColor = act ? '#d99423' : '#3e3933';
        b.style.background = act ? '#2a2214' : '#1a1815';
        b.style.color = act ? '#d99423' : '#a59c86';
      });
      dSubNav.style.display = activeType === 'd' ? 'flex' : 'none';
      updateScene();
      updateDesc();
    });
    nav.appendChild(btn);
    return { b: btn, item: t };
  });

  // d-orbital sub tabs
  const dSubNav = document.createElement('div');
  dSubNav.style.cssText = 'display:none;gap:4px;padding:4px 8px;background:#100e0c;border-bottom:1px solid #24201c;align-items:center;';
  const dLabel = document.createElement('span');
  dLabel.textContent = 'd:';
  dLabel.style.cssText = 'font-family:ui-monospace,monospace;font-size:9px;color:#8c8376;margin-right:2px;';
  dSubNav.appendChild(dLabel);

  const dBtns = D_ORBITALS_DEF.map((o, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = o.label;
    const isAct = idx === activeDIndex;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:9.5px;padding:2px 6px;cursor:pointer;border:1px solid ${isAct ? '#d99423' : '#322d26'};background:${isAct ? '#241e12' : '#14120f'};color:${isAct ? '#d99423' : '#8c8376'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      activeDIndex = idx;
      dBtns.forEach(({ b, i }) => {
        const act = i === activeDIndex;
        b.style.borderColor = act ? '#d99423' : '#322d26';
        b.style.background = act ? '#241e12' : '#14120f';
        b.style.color = act ? '#d99423' : '#8c8376';
      });
      updateScene();
      updateDesc();
    });
    dSubNav.appendChild(btn);
    return { b: btn, i: idx };
  });

  container.appendChild(nav);
  container.appendChild(dSubNav);

  // 2. 3D Viewport container
  const view3D = document.createElement('div');
  view3D.style.cssText = 'width:100%;height:210px;position:relative;cursor:grab;touch-action:none;';
  container.appendChild(view3D);

  // 3. Description banner at bottom
  const descBanner = document.createElement('div');
  descBanner.style.cssText = 'padding:6px 10px;background:#12100d;border-top:1px solid #24201c;font-family:ui-monospace,monospace;font-size:10.5px;color:#8c8376;line-height:1.4;';
  container.appendChild(descBanner);

  const updateDesc = () => {
    if (activeType === 's') {
      descBanner.innerHTML = `<span style="color:#d99423;font-weight:bold;">s Orbital (1s):</span> Spherical probability cloud. Electron is equally likely in all directions from the nucleus with no angular nodes.`;
    } else if (activeType === 'p') {
      descBanner.innerHTML = `<span style="color:#d99423;font-weight:bold;">p Orbital (2pz):</span> Two lobes separated by a flat nodal plane (xy-plane) through the nucleus where the probability of finding the electron is zero.`;
    } else {
      const dDef = D_ORBITALS_DEF[activeDIndex];
      descBanner.innerHTML = `<span style="color:#d99423;font-weight:bold;">${dDef.name}:</span> ${dDef.desc}`;
    }
  };
  updateDesc();

  let disposed = false;
  let raf = 0;
  let teardown = () => {};
  let updateScene = () => {};

  // Drag interaction
  let ay = 0.5;
  let ax = 0.3;
  let drag = null;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view3D.setPointerCapture(e.pointerId); } catch (err) {} };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-1.1, Math.min(1.1, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view3D.addEventListener('pointerdown', onDown);
  view3D.addEventListener('pointermove', onMove);
  view3D.addEventListener('pointerup', onUp);
  view3D.addEventListener('pointercancel', onUp);

  const init3D = async () => {
    const THREE = await import('three');
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const w = Math.max(260, view3D.clientWidth || 340);
    const h = 210;
    renderer.setSize(w, h);
    view3D.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 4.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xfff8ee, 0x14120f, 1.3));
    const sun1 = new THREE.DirectionalLight(0xffffff, 1.2);
    sun1.position.set(4, 5, 4);
    scene.add(sun1);

    const root = new THREE.Group();
    scene.add(root);

    // Shared materials
    const matAmber = new THREE.MeshStandardMaterial({ color: 0xe69f00, roughness: 0.35, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x0072b2, roughness: 0.35, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const matNuc = new THREE.MeshStandardMaterial({ color: 0xfffae0, emissive: 0xfffae0, emissiveIntensity: 0.7 });

    updateScene = () => {
      while (root.children.length > 0) {
        const obj = root.children[0];
        root.remove(obj);
        obj.traverse?.(c => c.geometry?.dispose());
      }

      // Nucleus
      const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), matNuc);
      root.add(nucleus);

      // Coordinate axes
      const axisLen = 1.6;
      const lineMat = new THREE.LineBasicMaterial({ color: 0x544e46, transparent: true, opacity: 0.5 });
      for (const dir of [[axisLen, 0, 0], [0, axisLen, 0], [0, 0, axisLen]]) {
        const pts = [new THREE.Vector3(-dir[0], -dir[1], -dir[2]), new THREE.Vector3(...dir)];
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      }

      if (activeType === 's') {
        // s orbital: spherical surface + dots
        const sphereGeo = new THREE.SphereGeometry(1.05, 32, 24);
        const sphereMat = new THREE.MeshStandardMaterial({ color: 0xe69f00, roughness: 0.4, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
        root.add(new THREE.Mesh(sphereGeo, sphereMat));

        // Sample dots inside
        try {
          const pts = sampleOrbital('1s', 120, 1);
          let reach = 1; for (const p of pts) reach = Math.max(reach, Math.hypot(p.x, p.y, p.z));
          const k = 1.0 / reach;
          const pos = new Float32Array(pts.length * 3);
          pts.forEach((p, i) => { pos[i * 3] = p.x * k; pos[i * 3 + 1] = p.z * k; pos[i * 3 + 2] = p.y * k; });
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          root.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffda73, size: 0.045, transparent: true, opacity: 0.8 })));
        } catch (e) {}

      } else if (activeType === 'p') {
        // p orbital: two lobes + nodal plane
        const lobeGeo = buildLobeGeometry(THREE, 1.25, 0.52);
        const m1 = new THREE.Mesh(lobeGeo, matAmber);
        m1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0));
        root.add(m1);
        const m2 = new THREE.Mesh(lobeGeo, matCyan);
        m2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0));
        root.add(m2);

        // Faint horizontal nodal plane
        const planeGeo = new THREE.PlaneGeometry(2.4, 2.4);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.rotation.x = Math.PI / 2;
        root.add(planeMesh);

      } else {
        // d orbital: active selected d orbital
        const dDef = D_ORBITALS_DEF[activeDIndex];
        if (dDef.all) {
          const singleDefs = D_ORBITALS_DEF.filter(x => !x.all);
          const rad = 2.2;
          singleDefs.forEach((def, idx) => {
            const angle = ((idx - 2) / 2) * 0.75;
            const m = createOrbitalMesh(THREE, def, 0.38);
            m.position.set(Math.sin(angle) * rad, 0, (Math.cos(angle) - 1) * rad);
            root.add(m);
          });
        } else {
          root.add(createOrbitalMesh(THREE, dDef, 1.0));
        }
      }
    };

    updateScene();

    const animate = () => {
      if (disposed) return;
      if (!still && !drag) ay += 0.007;
      root.rotation.set(ax, ay, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    teardown = () => {
      renderer.dispose();
      renderer.domElement.remove();
    };
  };

  init3D().catch(() => {});

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      teardown();
      container.remove();
    }
  };
}
