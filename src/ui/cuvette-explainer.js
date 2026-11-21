/**
 * cuvette-explainer.js — Pure visual 3D animation for complementary colour & Beer's law.
 *
 * ZERO text, ZERO buttons, minimal elements:
 * - mode === 'white': white-light spectrum enters a blue cuvette, orange photons are absorbed inside,
 *   and blue light exits on the right.
 * - mode === 'beers' (or 'mono'): smoothly cycles concentration from low to high (more absorbing
 *   particles inside the cuvette) as orange light enters and fewer photons exit, paired with a
 *   simple visual absorbance bar rising in sync.
 */

import * as THREE from 'three';

const SPECTRUM = [
  { hex: 0xef4444, absorb: false, dy: -0.18, dz: -0.10 }, // red
  { hex: 0xfb923c, absorb: true,  dy: -0.06, dz:  0.08 }, // orange (absorbed)
  { hex: 0xfacc15, absorb: false, dy:  0.06, dz: -0.08 }, // yellow
  { hex: 0x22c55e, absorb: false, dy:  0.16, dz:  0.05 }, // green
  { hex: 0x3b82f6, absorb: false, dy: -0.02, dz: -0.02 }, // blue
  { hex: 0xa855f7, absorb: false, dy:  0.10, dz:  0.12 }  // violet
];

export function mountCuvetteExplainer(view, wrap, spec = {}, still = false) {
  let disposed = false;
  let rafId = 0;
  const mode = spec.mode === 'white' ? 'white' : 'beers';

  view.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:190px;background:#0b0a08;';
  view.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 2.6, 0.1, 50);
  camera.position.set(0, 1.0, 6.2);
  camera.lookAt(0, 0, 0);

  const amb = new THREE.AmbientLight(0xffffff, 0.95);
  const key = new THREE.DirectionalLight(0xfff4e0, 1.1);
  key.position.set(3, 5, 4);
  scene.add(amb, key);

  // Clean glass cuvette
  const cuvetteGroup = new THREE.Group();
  const glassEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15, 2.1, 1.15)),
    new THREE.LineBasicMaterial({ color: 0x8fa3b0, transparent: true, opacity: 0.65 })
  );
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x2482c8, transparent: true, opacity: 0.34, roughness: 0.2, depthWrite: false
  });
  const liquid = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.72, 1.06), liquidMat);
  liquid.position.y = -0.12;
  cuvetteGroup.add(glassEdges, liquid);
  scene.add(cuvetteGroup);

  // Solute particles inside cuvette
  const MAX_IONS = 54;
  const ionGeo = new THREE.SphereGeometry(0.06, 10, 8);
  const ionMat = new THREE.MeshStandardMaterial({ color: 0x5ab8f0, roughness: 0.35 });
  const ions = [];
  for (let i = 0; i < MAX_IONS; i++) {
    const m = new THREE.Mesh(ionGeo, ionMat);
    // Deterministic spread inside cuvette volume
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.5) / MAX_IONS) * 0.42;
    const baseY = -0.82 + ((i * 37) % MAX_IONS) / MAX_IONS * 1.48;
    m.userData = { x: Math.cos(a) * r, y: baseY, z: Math.sin(a) * r, phase: i * 0.7 };
    m.position.set(m.userData.x, m.userData.y, m.userData.z);
    cuvetteGroup.add(m);
    ions.push(m);
  }

  // Incoming & outgoing translucent beam sleeves
  const inBeamMat = new THREE.MeshBasicMaterial({
    color: mode === 'white' ? 0xd8dce0 : 0xfb923c, transparent: true, opacity: 0.22, depthWrite: false
  });
  const outBeamMat = new THREE.MeshBasicMaterial({
    color: mode === 'white' ? 0x3b82f6 : 0xfb923c, transparent: true, opacity: 0.28, depthWrite: false
  });
  const beamGeo = new THREE.CylinderGeometry(0.24, 0.24, 2.3, 18, 1, true);
  beamGeo.rotateZ(Math.PI / 2);
  const inBeam = new THREE.Mesh(beamGeo, inBeamMat);
  inBeam.position.set(-1.72, 0, 0);
  const outBeam = new THREE.Mesh(beamGeo, outBeamMat);
  outBeam.position.set(1.72, 0, 0);
  scene.add(inBeam, outBeam);

  // Photon spheres streaming left -> right
  const photonGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const photons = [];
  if (mode === 'white') {
    for (let wave = 0; wave < 7; wave++) {
      SPECTRUM.forEach((ch, idx) => {
        const mat = new THREE.MeshBasicMaterial({ color: ch.hex, transparent: true, opacity: 0.95 });
        const m = new THREE.Mesh(photonGeo, mat);
        m.userData = { offset: (wave / 7) + idx * 0.012, dy: ch.dy, dz: ch.dz, absorb: ch.absorb, mat };
        scene.add(m);
        photons.push(m);
      });
    }
  } else {
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.95 });
      const m = new THREE.Mesh(photonGeo, mat);
      const ang = i * 2.1;
      const rad = 0.04 + ((i * 7) % 10) / 10 * 0.14;
      m.userData = {
        offset: i / 28,
        dy: Math.cos(ang) * rad,
        dz: Math.sin(ang) * rad,
        slot: (i * 13) % 28 / 28,
        mat
      };
      scene.add(m);
      photons.push(m);
    }
  }

  // Simple visual absorbance meter bar on right (only in 'beers' mode; zero text)
  let barFill = null;
  if (mode === 'beers') {
    const barBg = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.6, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x1e2226 })
    );
    barBg.position.set(3.25, 0, 0);
    const barFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.22, 1.6, 0.06)),
      new THREE.LineBasicMaterial({ color: 0x5c5346 })
    );
    barFrame.position.copy(barBg.position);
    barFill = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.56, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xe59b24 })
    );
    barFill.position.set(3.25, -0.78, 0.01);
    scene.add(barBg, barFrame, barFill);
  }

  const resize = () => {
    if (disposed) return;
    const w = view.clientWidth || 520;
    const h = 190;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(view);

  let t0 = performance.now();
  const render = now => {
    if (disposed) return;
    const t = still ? 2.4 : (now - t0) / 1000;

    // Gentle camera sway so 3D depth reads effortlessly
    camera.position.x = Math.sin(t * 0.35) * 0.45;
    camera.lookAt(mode === 'beers' ? 0.3 : 0, 0, 0);

    // Concentration sweep in 'beers' mode (0.15 -> 1.0 -> 0.15 over 7s)
    const concLevel = mode === 'white' ? 0.5 : 0.15 + 0.85 * (0.5 - 0.5 * Math.cos(t * 0.9));
    const activeIons = Math.round(6 + concLevel * (MAX_IONS - 6));
    liquidMat.opacity = 0.14 + concLevel * 0.46;

    for (let i = 0; i < MAX_IONS; i++) {
      const m = ions[i];
      m.visible = i < activeIons;
      if (m.visible) {
        m.position.y = m.userData.y + Math.sin(t * 1.4 + m.userData.phase) * 0.04;
      }
    }

    if (mode === 'white') {
      outBeamMat.opacity = 0.32;
      for (const m of photons) {
        const u = (t * 0.32 + m.userData.offset) % 1;
        const x = -2.85 + u * 5.7;
        m.position.set(x, m.userData.dy, m.userData.dz);
        if (m.userData.absorb && x > -0.15) {
          const fade = Math.max(0, 1 - (x + 0.15) / 0.45);
          m.userData.mat.opacity = fade;
          m.scale.setScalar(1 + (1 - fade) * 0.6);
        } else {
          m.userData.mat.opacity = 0.92;
          m.scale.setScalar(1);
        }
      }
    } else {
      const transmit = Math.pow(10, -concLevel * 1.05);
      outBeamMat.opacity = 0.05 + transmit * 0.34;
      for (const m of photons) {
        const u = (t * 0.34 + m.userData.offset) % 1;
        const x = -2.85 + u * 5.7;
        m.position.set(x, m.userData.dy, m.userData.dz);
        const absorbed = m.userData.slot > transmit;
        if (absorbed && x > -0.25) {
          const fade = Math.max(0, 1 - (x + 0.25) / 0.5);
          m.userData.mat.opacity = fade;
          m.scale.setScalar(1 + (1 - fade) * 0.5);
        } else {
          m.userData.mat.opacity = 0.92;
          m.scale.setScalar(1);
        }
      }
      if (barFill) {
        const hFrac = Math.max(0.06, concLevel);
        barFill.scale.y = hFrac;
        barFill.position.y = -0.78 + (1.56 * hFrac) / 2;
      }
    }

    renderer.render(scene, camera);
    if (!still) rafId = requestAnimationFrame(render);
  };
  render(t0);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      scene.traverse(obj => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
        else obj.material?.dispose?.();
      });
      renderer.dispose();
    }
  };
}
