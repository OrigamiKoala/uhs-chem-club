/**
 * radii-shrink-animator.js — 3D animation explainer for periodic atomic radius trends.
 *
 * Demonstrates the physical mechanism of atomic radius contraction across a period:
 * As protons and electrons are sequentially added (Li -> Be -> B -> C):
 *   1. A proton joins the nucleus and an electron enters the valence shell.
 *   2. The increased positive nuclear charge exerts a stronger electrostatic pull.
 *   3. The outer electron cloud and valence shell smoothly shrink inward.
 *
 * PURE VISUAL ANIMATION: No text is rendered anywhere in the animation.
 */

import * as THREE from 'three';

const C_PROTON = 0xd99423;
const C_NEUTRON = 0x8c8376;
const C_ELECTRON = 0xeef4f8;
const C_ELECTRON_GLOW = 0x8cd5ff;
const C_PULSE = 0xffbe40;
const C_SHELL = 0xc8c2b4;
const C_RING = 0x9e9382;
const C_GHOST = 0x4a4640;

// Atomic radii scaled proportionally to Lithium = 2.10
// Li (152 pm) -> 2.10
// Be (112 pm) -> 1.55
// B  (85 pm)  -> 1.17
// C  (77 pm)  -> 1.06
const STAGES = [
  { sym: 'Li', z: 3, n: 4, pm: 152, r: 2.10, outer: 1 },
  { sym: 'Be', z: 4, n: 5, pm: 112, r: 1.55, outer: 2 },
  { sym: 'B',  z: 5, n: 6, pm: 85,  r: 1.17, outer: 3 },
  { sym: 'C',  z: 6, n: 6, pm: 77,  r: 1.06, outer: 4 }
];

// 12 cluster coordinates for nucleons packed around origin (radius ~0.11 each)
const NUCLEON_POS = [
  [0.08, 0.08, 0.07],     // p0
  [-0.08, 0.07, -0.07],   // n0
  [-0.07, -0.08, 0.08],   // p1
  [0.07, -0.08, -0.08],   // n1
  [0.12, 0.01, -0.07],    // p2
  [-0.12, 0.01, 0.07],    // n2
  [0.00, 0.12, -0.06],    // n3
  [-0.01, -0.12, 0.06],   // p3 (Be)
  [0.06, 0.09, 0.11],     // n4
  [0.11, -0.06, 0.09],    // p4 (B)
  [-0.09, 0.10, 0.09],    // n5
  [-0.10, -0.10, -0.08]   // p5 (C)
];

// Mapping nucleon index to proton vs neutron
// Li: p0, p1, p2 (indices 0, 2, 4) + n0..n3 (indices 1, 3, 5, 6) = 7
// Be: adds p3 (index 7) + n4 (index 8)
// B:  adds p4 (index 9) + n5 (index 10)
// C:  adds p5 (index 11)
const PROTON_INDICES = [0, 2, 4, 7, 9, 11];

// Trajectories for incoming particles in each transition (Li->Be, Be->B, B->C)
const INCOMING_TRAJECTORIES = [
  {
    pStart: [2.9, 2.0, 1.2],
    eStart: [-2.7, -1.8, 1.9],
    pTarget: NUCLEON_POS[7],
    targetStep: 1
  },
  {
    pStart: [-2.8, 2.0, -1.4],
    eStart: [2.5, -2.0, -1.5],
    pTarget: NUCLEON_POS[9],
    targetStep: 2
  },
  {
    pStart: [1.8, -2.7, 1.5],
    eStart: [-2.6, 2.2, -1.3],
    pTarget: NUCLEON_POS[11],
    targetStep: 3
  }
];

function smooth(u) {
  const c = Math.max(0, Math.min(1, u));
  return c * c * (3 - 2 * c);
}

/**
 * Mounts the 3D periodic radius trend shrinking animation.
 * Strictly visual: NO text anywhere.
 */
export function mountRadiiShrink(view, wrap, spec, still) {
  let disposed = false;
  let raf = 0;
  let teardown = () => {};

  // Drag tilt & turn
  let ay = 0.45;
  let ax = 0.22;
  let drag = null;

  const onDown = e => {
    drag = { x: e.clientX, y: e.clientY };
    try { view.setPointerCapture(e.pointerId); } catch (err) {}
  };
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

  const init = async () => {
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const getW = () => Math.max(240, view.clientWidth || 320);
    const getH = () => Math.max(200, view.clientHeight || 220);
    renderer.setSize(getW(), getH());
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, getW() / getH(), 0.1, 100);
    camera.position.set(0, 0.9, 5.6);
    camera.lookAt(0, 0, 0);

    // Soft warm lighting
    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x14120f, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(4, 5, 4);
    scene.add(sun);
    const backLight = new THREE.DirectionalLight(0xd99423, 0.4);
    backLight.position.set(-3, -2, -3);
    scene.add(backLight);

    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    // Reusable geometries & materials
    const sphereGeo = new THREE.SphereGeometry(0.105, 18, 14);
    const electronGeo = new THREE.SphereGeometry(0.065, 16, 12);
    const trailDotGeo = new THREE.SphereGeometry(0.038, 10, 8);

    const matProton = new THREE.MeshStandardMaterial({
      color: C_PROTON,
      emissive: C_PROTON,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.15
    });

    const matNeutron = new THREE.MeshStandardMaterial({
      color: C_NEUTRON,
      roughness: 0.65,
      metalness: 0.1
    });

    const matElectron = new THREE.MeshStandardMaterial({
      color: C_ELECTRON,
      emissive: C_ELECTRON_GLOW,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    const matTrailProton = new THREE.MeshBasicMaterial({
      color: C_PROTON,
      transparent: true,
      opacity: 0.45
    });

    const matTrailElectron = new THREE.MeshBasicMaterial({
      color: C_ELECTRON_GLOW,
      transparent: true,
      opacity: 0.45
    });

    // 1. Nucleus Group
    const nucleusGroup = new THREE.Group();
    atomGroup.add(nucleusGroup);

    const nucleonMeshes = [];
    NUCLEON_POS.forEach((pos, idx) => {
      const isProton = PROTON_INDICES.includes(idx);
      const mesh = new THREE.Mesh(sphereGeo, isProton ? matProton : matNeutron);
      mesh.position.set(pos[0], pos[1], pos[2]);
      nucleusGroup.add(mesh);
      nucleonMeshes.push({ mesh, isProton, basePos: pos, idx });
    });

    // 2. Initial Lithium Reference Ghost Boundary (Permanent baseline at 2.10)
    const ghostRadius = STAGES[0].r;
    const ghostGeo = new THREE.BufferGeometry();
    const ghostPoints = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      ghostPoints.push(new THREE.Vector3(Math.cos(theta) * ghostRadius, 0, Math.sin(theta) * ghostRadius));
    }
    ghostGeo.setFromPoints(ghostPoints);
    const ghostMat = new THREE.LineDashedMaterial({
      color: C_GHOST,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.4
    });
    const ghostRing = new THREE.Line(ghostGeo, ghostMat);
    ghostRing.computeLineDistances();
    atomGroup.add(ghostRing);

    // Ghost sphere silhouette
    const ghostSphereGeo = new THREE.SphereGeometry(ghostRadius, 32, 20);
    const ghostSphereMat = new THREE.MeshBasicMaterial({
      color: C_GHOST,
      wireframe: true,
      transparent: true,
      opacity: 0.07
    });
    const ghostSphere = new THREE.Mesh(ghostSphereGeo, ghostSphereMat);
    atomGroup.add(ghostSphere);

    // 3. Inner Shell (1s core - 2 electrons at fixed r=0.52)
    const innerRadius = 0.52;
    const innerGroup = new THREE.Group();
    innerGroup.rotation.x = 0.35;
    innerGroup.rotation.z = 0.2;
    atomGroup.add(innerGroup);

    const innerRingGeo = new THREE.BufferGeometry();
    const innerRingPts = [];
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      innerRingPts.push(new THREE.Vector3(Math.cos(theta) * innerRadius, 0, Math.sin(theta) * innerRadius));
    }
    innerRingGeo.setFromPoints(innerRingPts);
    const innerRingMat = new THREE.LineBasicMaterial({ color: 0x544e46, transparent: true, opacity: 0.4 });
    innerGroup.add(new THREE.Line(innerRingGeo, innerRingMat));

    const innerElectrons = [
      new THREE.Mesh(electronGeo, matElectron),
      new THREE.Mesh(electronGeo, matElectron)
    ];
    innerElectrons.forEach(e => innerGroup.add(e));

    // 4. Outer Shell Boundary (Translucent atom volume that shrinks)
    const outerSphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const outerSphereMat = new THREE.MeshStandardMaterial({
      color: C_SHELL,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const outerSphere = new THREE.Mesh(outerSphereGeo, outerSphereMat);
    atomGroup.add(outerSphere);

    // Outer Orbit Rings (tilted valence rings that scale with atom radius)
    const ringSegments = 64;
    const unitRingGeo = new THREE.BufferGeometry();
    const unitRingPts = [];
    for (let i = 0; i <= ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      unitRingPts.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    unitRingGeo.setFromPoints(unitRingPts);
    const outerRingMat = new THREE.LineBasicMaterial({
      color: C_RING,
      transparent: true,
      opacity: 0.65
    });

    const outerRingGroup1 = new THREE.Group();
    outerRingGroup1.rotation.x = 0.35;
    outerRingGroup1.rotation.y = 0.2;
    const ringLine1 = new THREE.Line(unitRingGeo, outerRingMat);
    outerRingGroup1.add(ringLine1);
    atomGroup.add(outerRingGroup1);

    const outerRingGroup2 = new THREE.Group();
    outerRingGroup2.rotation.x = -0.45;
    outerRingGroup2.rotation.z = 0.35;
    const ringLine2 = new THREE.Line(unitRingGeo, outerRingMat);
    outerRingGroup2.add(ringLine2);
    atomGroup.add(outerRingGroup2);

    // Valence Electrons (up to 4 outer electrons on the shrinking shell)
    const outerElectrons = [
      { mesh: new THREE.Mesh(electronGeo, matElectron), ring: 1, basePhase: 0 },
      { mesh: new THREE.Mesh(electronGeo, matElectron), ring: 1, basePhase: Math.PI },
      { mesh: new THREE.Mesh(electronGeo, matElectron), ring: 2, basePhase: Math.PI * 0.5 },
      { mesh: new THREE.Mesh(electronGeo, matElectron), ring: 2, basePhase: Math.PI * 1.5 }
    ];
    outerElectrons.forEach(oe => {
      oe.mesh.visible = false;
      atomGroup.add(oe.mesh);
    });

    // 5. Attraction Force / Inward Coulomb Pull Ripple
    const pulseRingGeo = new THREE.BufferGeometry();
    const pulseRingPts = [];
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      pulseRingPts.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    pulseRingGeo.setFromPoints(pulseRingPts);
    const pulseRingMat = new THREE.LineBasicMaterial({
      color: C_PULSE,
      transparent: true,
      opacity: 0
    });
    const pulseRing = new THREE.Line(pulseRingGeo, pulseRingMat);
    atomGroup.add(pulseRing);

    // Inward attraction line rays (flash from outer shell toward nucleus on proton entry)
    const rayCount = 8;
    const rayGeo = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(rayCount * 2 * 3);
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.LineBasicMaterial({
      color: C_PULSE,
      transparent: true,
      opacity: 0
    });
    const rayLines = new THREE.LineSegments(rayGeo, rayMat);
    atomGroup.add(rayLines);

    // 6. Incoming Particle Projectiles & Trails
    const flyingProton = new THREE.Mesh(sphereGeo, matProton);
    flyingProton.visible = false;
    atomGroup.add(flyingProton);

    const flyingElectron = new THREE.Mesh(electronGeo, matElectron);
    flyingElectron.visible = false;
    atomGroup.add(flyingElectron);

    const pTrails = [
      new THREE.Mesh(trailDotGeo, matTrailProton),
      new THREE.Mesh(trailDotGeo, matTrailProton),
      new THREE.Mesh(trailDotGeo, matTrailProton)
    ];
    pTrails.forEach(m => { m.visible = false; atomGroup.add(m); });

    const eTrails = [
      new THREE.Mesh(trailDotGeo, matTrailElectron),
      new THREE.Mesh(trailDotGeo, matTrailElectron),
      new THREE.Mesh(trailDotGeo, matTrailElectron)
    ];
    eTrails.forEach(m => { m.visible = false; atomGroup.add(m); });

    // Handle view resize
    const ro = new ResizeObserver(() => {
      if (disposed) return;
      const nw = getW();
      const nh = getH();
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(view);

    // Click/tap to restart cycle
    const onClick = () => { tStart = performance.now(); };
    view.addEventListener('click', onClick);

    let tStart = performance.now();
    const CYCLE_DURATION = 12.0; // seconds

    const renderFrame = now => {
      if (disposed) return;

      const elapsed = (now - tStart) / 1000;
      const t = elapsed % CYCLE_DURATION;

      // Subtle slow auto-spin when not dragging
      if (!still && !drag) ay += 0.0025;
      atomGroup.rotation.y = ay;
      atomGroup.rotation.x = ax;

      // Determine current radius R(t), active nucleon counts, and incoming particles
      let currentR = STAGES[0].r;
      let activeProtons = 3;
      let activeNeutrons = 4;
      let activeOuterElectrons = 1;
      let pulseIntensity = 0;
      let pulseR = 0;
      let raysIntensity = 0;

      flyingProton.visible = false;
      flyingElectron.visible = false;
      pTrails.forEach(m => { m.visible = false; });
      eTrails.forEach(m => { m.visible = false; });

      // TIMELINE BREAKDOWN:
      // 0.0 .. 1.8 : Lithium hold (3p, 4n, 1 outer e, R = 2.10)
      // 1.8 .. 4.2 : Step 1 -> Be (4p, 5n, 2 outer e, R -> 1.55)
      //   1.8 .. 2.5: incoming proton & electron fly in
      //   2.5 .. 3.6: contraction to 1.55, nuclear pulse
      //   3.6 .. 4.2: Be hold
      // 4.2 .. 6.6 : Step 2 -> B (5p, 6n, 3 outer e, R -> 1.17)
      //   4.2 .. 4.9: incoming particles fly in
      //   4.9 .. 6.0: contraction to 1.17, nuclear pulse
      //   6.0 .. 6.6: B hold
      // 6.6 .. 9.0 : Step 3 -> C (6p, 6n, 4 outer e, R -> 1.06)
      //   6.6 .. 7.3: incoming particles fly in
      //   7.3 .. 8.4: contraction to 1.06, nuclear pulse
      //   8.4 .. 10.4: Carbon hold (compact atom)
      // 10.4 .. 12.0: Smooth reset / expansion back to Lithium

      if (t < 1.8) {
        // Lithium stage
        currentR = STAGES[0].r;
        activeProtons = 3;
        activeNeutrons = 4;
        activeOuterElectrons = 1;
      } else if (t < 4.2) {
        // Transition 1: Li -> Be
        const dt = t - 1.8;
        const traj = INCOMING_TRAJECTORIES[0];
        if (dt < 0.7) {
          // Flight phase
          const u = smooth(dt / 0.7);
          currentR = STAGES[0].r;
          activeProtons = 3;
          activeNeutrons = 4;
          activeOuterElectrons = 1;

          flyingProton.visible = true;
          flyingProton.position.set(
            traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * u,
            traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * u,
            traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * u
          );

          flyingElectron.visible = true;
          const eTarget = [currentR * 0.9, 0.4, currentR * 0.4];
          flyingElectron.position.set(
            traj.eStart[0] + (eTarget[0] - traj.eStart[0]) * u,
            traj.eStart[1] + (eTarget[1] - traj.eStart[1]) * u,
            traj.eStart[2] + (eTarget[2] - traj.eStart[2]) * u
          );

          // Trails
          pTrails.forEach((pt, i) => {
            const ut = Math.max(0, u - (i + 1) * 0.08);
            pt.visible = true;
            pt.position.set(
              traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * ut,
              traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * ut,
              traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * ut
            );
          });
        } else if (dt < 1.8) {
          // Contraction phase
          const u = smooth((dt - 0.7) / 1.1);
          currentR = STAGES[0].r + (STAGES[1].r - STAGES[0].r) * u;
          activeProtons = 4;
          activeNeutrons = 5;
          activeOuterElectrons = 2;

          const pU = (dt - 0.7) / 0.9;
          if (pU < 1) {
            pulseIntensity = Math.sin(pU * Math.PI);
            pulseR = 0.15 + pU * currentR * 1.1;
            raysIntensity = Math.max(0, 1 - pU * 1.4);
          }
        } else {
          // Be hold
          currentR = STAGES[1].r;
          activeProtons = 4;
          activeNeutrons = 5;
          activeOuterElectrons = 2;
        }
      } else if (t < 6.6) {
        // Transition 2: Be -> B
        const dt = t - 4.2;
        const traj = INCOMING_TRAJECTORIES[1];
        if (dt < 0.7) {
          const u = smooth(dt / 0.7);
          currentR = STAGES[1].r;
          activeProtons = 4;
          activeNeutrons = 5;
          activeOuterElectrons = 2;

          flyingProton.visible = true;
          flyingProton.position.set(
            traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * u,
            traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * u,
            traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * u
          );

          flyingElectron.visible = true;
          const eTarget = [-currentR * 0.8, -0.3, currentR * 0.5];
          flyingElectron.position.set(
            traj.eStart[0] + (eTarget[0] - traj.eStart[0]) * u,
            traj.eStart[1] + (eTarget[1] - traj.eStart[1]) * u,
            traj.eStart[2] + (eTarget[2] - traj.eStart[2]) * u
          );

          pTrails.forEach((pt, i) => {
            const ut = Math.max(0, u - (i + 1) * 0.08);
            pt.visible = true;
            pt.position.set(
              traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * ut,
              traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * ut,
              traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * ut
            );
          });
        } else if (dt < 1.8) {
          const u = smooth((dt - 0.7) / 1.1);
          currentR = STAGES[1].r + (STAGES[2].r - STAGES[1].r) * u;
          activeProtons = 5;
          activeNeutrons = 6;
          activeOuterElectrons = 3;

          const pU = (dt - 0.7) / 0.9;
          if (pU < 1) {
            pulseIntensity = Math.sin(pU * Math.PI);
            pulseR = 0.15 + pU * currentR * 1.1;
            raysIntensity = Math.max(0, 1 - pU * 1.4);
          }
        } else {
          // B hold
          currentR = STAGES[2].r;
          activeProtons = 5;
          activeNeutrons = 6;
          activeOuterElectrons = 3;
        }
      } else if (t < 10.4) {
        // Transition 3: B -> C (holds until 10.4)
        const dt = t - 6.6;
        const traj = INCOMING_TRAJECTORIES[2];
        if (dt < 0.7) {
          const u = smooth(dt / 0.7);
          currentR = STAGES[2].r;
          activeProtons = 5;
          activeNeutrons = 6;
          activeOuterElectrons = 3;

          flyingProton.visible = true;
          flyingProton.position.set(
            traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * u,
            traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * u,
            traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * u
          );

          flyingElectron.visible = true;
          const eTarget = [0.2, currentR * 0.85, -currentR * 0.5];
          flyingElectron.position.set(
            traj.eStart[0] + (eTarget[0] - traj.eStart[0]) * u,
            traj.eStart[1] + (eTarget[1] - traj.eStart[1]) * u,
            traj.eStart[2] + (eTarget[2] - traj.eStart[2]) * u
          );

          pTrails.forEach((pt, i) => {
            const ut = Math.max(0, u - (i + 1) * 0.08);
            pt.visible = true;
            pt.position.set(
              traj.pStart[0] + (traj.pTarget[0] - traj.pStart[0]) * ut,
              traj.pStart[1] + (traj.pTarget[1] - traj.pStart[1]) * ut,
              traj.pStart[2] + (traj.pTarget[2] - traj.pStart[2]) * ut
            );
          });
        } else if (dt < 1.8) {
          const u = smooth((dt - 0.7) / 1.1);
          currentR = STAGES[2].r + (STAGES[3].r - STAGES[2].r) * u;
          activeProtons = 6;
          activeNeutrons = 6;
          activeOuterElectrons = 4;

          const pU = (dt - 0.7) / 0.9;
          if (pU < 1) {
            pulseIntensity = Math.sin(pU * Math.PI);
            pulseR = 0.15 + pU * currentR * 1.1;
            raysIntensity = Math.max(0, 1 - pU * 1.4);
          }
        } else {
          // Carbon hold
          currentR = STAGES[3].r;
          activeProtons = 6;
          activeNeutrons = 6;
          activeOuterElectrons = 4;
        }
      } else {
        // Reset phase (10.4 .. 12.0)
        const u = smooth((t - 10.4) / 1.6);
        currentR = STAGES[3].r + (STAGES[0].r - STAGES[3].r) * u;
        activeProtons = 3;
        activeNeutrons = 4;
        activeOuterElectrons = 1;
      }

      // Update Nucleon visibility and positions
      let pCount = 0;
      let nCount = 0;
      nucleonMeshes.forEach(nm => {
        if (nm.isProton) {
          pCount++;
          nm.mesh.visible = pCount <= activeProtons;
        } else {
          nCount++;
          nm.mesh.visible = nCount <= activeNeutrons;
        }
      });

      // Update Outer Boundary Sphere scale
      outerSphere.scale.set(currentR, currentR, currentR);

      // Update Outer Orbit Rings scale
      ringLine1.scale.set(currentR, currentR, currentR);
      ringLine2.scale.set(currentR, currentR, currentR);

      // Orbit inner electrons (1s)
      const omegaIn = 3.6;
      innerElectrons.forEach((ie, idx) => {
        const phi = idx * Math.PI + t * omegaIn;
        ie.position.set(Math.cos(phi) * innerRadius, 0, Math.sin(phi) * innerRadius);
      });

      // Orbit outer electrons on shrinking valence shell
      const omegaOut = 2.4;
      outerElectrons.forEach((oe, idx) => {
        if (idx < activeOuterElectrons) {
          oe.mesh.visible = true;
          const phi = oe.basePhase + t * omegaOut;
          const group = oe.ring === 1 ? outerRingGroup1 : outerRingGroup2;
          const localX = Math.cos(phi) * currentR;
          const localZ = Math.sin(phi) * currentR;
          const p = new THREE.Vector3(localX, 0, localZ).applyEuler(group.rotation);
          oe.mesh.position.copy(p);
        } else {
          oe.mesh.visible = false;
        }
      });

      // Attraction Pulse Ring update
      if (pulseIntensity > 0.02) {
        pulseRing.visible = true;
        pulseRing.scale.set(pulseR, pulseR, pulseR);
        pulseRingMat.opacity = pulseIntensity * 0.75;
      } else {
        pulseRing.visible = false;
      }

      // Inward Force Ray Lines update
      if (raysIntensity > 0.05) {
        rayLines.visible = true;
        rayMat.opacity = raysIntensity * 0.65;
        const posAttr = rayGeo.attributes.position;
        for (let i = 0; i < rayCount; i++) {
          const theta = (i / rayCount) * Math.PI * 2 + t * 0.5;
          const outerX = Math.cos(theta) * currentR;
          const outerY = Math.sin(theta * 2) * 0.25;
          const outerZ = Math.sin(theta) * currentR;
          const innerX = outerX * 0.25;
          const innerY = outerY * 0.25;
          const innerZ = outerZ * 0.25;

          posAttr.setXYZ(i * 2, outerX, outerY, outerZ);
          posAttr.setXYZ(i * 2 + 1, innerX, innerY, innerZ);
        }
        posAttr.needsUpdate = true;
      } else {
        rayLines.visible = false;
      }

      renderer.render(scene, camera);

      if (!still) {
        raf = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame(performance.now());

    teardown = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      view.removeEventListener('click', onClick);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);

      renderer.dispose();
      renderer.domElement.remove();

      sphereGeo.dispose();
      electronGeo.dispose();
      trailDotGeo.dispose();
      ghostGeo.dispose();
      ghostSphereGeo.dispose();
      innerRingGeo.dispose();
      outerSphereGeo.dispose();
      unitRingGeo.dispose();
      pulseRingGeo.dispose();
      rayGeo.dispose();

      matProton.dispose();
      matNeutron.dispose();
      matElectron.dispose();
      matTrailProton.dispose();
      matTrailElectron.dispose();
      ghostMat.dispose();
      ghostSphereMat.dispose();
      innerRingMat.dispose();
      outerSphereMat.dispose();
      outerRingMat.dispose();
      pulseRingMat.dispose();
      rayMat.dispose();
    };
  };

  init();

  return () => {
    disposed = true;
    try { teardown(); } catch (err) {}
  };
}
