/**
 * shielding-explainer.js — Visual explainer for electron shielding and effective nuclear charge (Zeff).
 *
 * Demonstrates:
 * 1. Nuclear attraction (+Z) radiating outward from the nucleus.
 * 2. Inner (core) electrons cancelling positive charges from the nucleus (shielding, S).
 * 3. Net effective pull (Zeff = Z - S) felt by the outermost valence electron.
 * 4. Comparison between shielded vs unshielded attraction and across elements (Na, Mg, Li).
 */

const ATOMS = {
  Na: {
    sym: 'Na',
    name: 'Sodium',
    z: 11,
    shells: [2, 8, 1],
    coreElectrons: 10,
    zeff: 1,
    descShielded: '10 inner electrons cancel out 10 protons. The outer electron feels a net +1 pull.',
    descUnshielded: 'Without inner electrons, the outer electron would feel the full pull of all 11 protons.'
  },
  Mg: {
    sym: 'Mg',
    name: 'Magnesium',
    z: 12,
    shells: [2, 8, 2],
    coreElectrons: 10,
    zeff: 2,
    descShielded: '10 inner electrons cancel out 10 protons. The outer electrons feel a net +2 pull.',
    descUnshielded: 'Without inner electrons, the outer electrons would feel the full pull of all 12 protons.'
  },
  Li: {
    sym: 'Li',
    name: 'Lithium',
    z: 3,
    shells: [2, 1],
    coreElectrons: 2,
    zeff: 1,
    descShielded: '2 inner electrons cancel out 2 protons. The outer electron feels a net +1 pull.',
    descUnshielded: 'Without inner electrons, the outer electron would feel the full pull of all 3 protons.'
  }
};

/**
 * Mount the interactive 3D shielding explainer inside an element.
 * @param {HTMLElement} view - container for 3D canvas
 * @param {HTMLElement} wrap - outer wrapper
 * @param {Object} spec - model spec
 * @param {boolean} still - reduced motion
 * @returns {{ dispose: Function }}
 */
export function mountShieldingExplainer(view, wrap, spec, still = false) {
  let currentKey = (spec && spec.sym && ATOMS[spec.sym]) ? spec.sym : 'Na';
  let isShielded = true;
  let disposed = false;
  let rafId = 0;
  let animTime = 0;

  // Orbit angles
  let ay = 0.45;
  let ax = 0.25;
  let drag = null;

  // 1. Controls bar
  const controlBar = document.createElement('div');
  controlBar.className = 'shielding-controls';
  controlBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 12px;background:#14120f;border-bottom:1px solid #2a241e;font-family:ui-monospace,monospace;font-size:11px;';

  // Atom buttons
  const atomGroup = document.createElement('div');
  atomGroup.style.cssText = 'display:flex;align-items:center;gap:4px;';
  const atomBtns = {};

  ['Na', 'Mg', 'Li'].forEach(sym => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = sym;
    btn.setAttribute('aria-label', ATOMS[sym].name);
    btn.style.cssText = 'padding:3px 9px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';
    btn.addEventListener('click', () => {
      currentKey = sym;
      updateButtons();
      updateReadout();
      rebuildScene();
    });
    atomGroup.appendChild(btn);
    atomBtns[sym] = btn;
  });

  // Mode toggle (Shielded vs Unshielded)
  const modeGroup = document.createElement('div');
  modeGroup.style.cssText = 'display:flex;align-items:center;gap:4px;';

  const btnShielded = document.createElement('button');
  btnShielded.type = 'button';
  btnShielded.textContent = 'Shielded';
  btnShielded.style.cssText = 'padding:3px 9px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';
  btnShielded.addEventListener('click', () => {
    if (isShielded) return;
    isShielded = true;
    updateButtons();
    updateReadout();
    rebuildScene();
  });

  const btnUnshielded = document.createElement('button');
  btnUnshielded.type = 'button';
  btnUnshielded.textContent = 'Unshielded';
  btnUnshielded.style.cssText = 'padding:3px 9px;cursor:pointer;border-radius:2px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;transition:all 0.15s ease;';
  btnUnshielded.addEventListener('click', () => {
    if (!isShielded) return;
    isShielded = false;
    updateButtons();
    updateReadout();
    rebuildScene();
  });

  modeGroup.appendChild(btnShielded);
  modeGroup.appendChild(btnUnshielded);

  controlBar.appendChild(atomGroup);
  controlBar.appendChild(modeGroup);

  // 2. Readout bar (Nuclear charge - inner electrons = effective pull)
  const readoutBar = document.createElement('div');
  readoutBar.className = 'shielding-readout';
  readoutBar.style.cssText = 'padding:7px 12px;background:#100e0c;border-bottom:1px solid #221e1a;font-family:ui-monospace,monospace;font-size:11px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;';

  // 3. Legend / explanation footer
  const infoFooter = document.createElement('div');
  infoFooter.className = 'shielding-footer';
  infoFooter.style.cssText = 'padding:6px 12px;background:#0d0c0a;border-top:1px solid #221e1a;font-family:ui-monospace,monospace;font-size:10px;color:#8c8376;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;';

  const updateButtons = () => {
    Object.keys(atomBtns).forEach(k => {
      const active = k === currentKey;
      const b = atomBtns[k];
      b.style.background = active ? '#2c2214' : '#1a1815';
      b.style.borderColor = active ? '#d99423' : '#332d26';
      b.style.border = `1px solid ${active ? '#d99423' : '#332d26'}`;
      b.style.color = active ? '#d99423' : '#a59c86';
    });

    btnShielded.style.background = isShielded ? '#1a291e' : '#1a1815';
    btnShielded.style.border = `1px solid ${isShielded ? '#4ade80' : '#332d26'}`;
    btnShielded.style.color = isShielded ? '#4ade80' : '#8c8376';

    btnUnshielded.style.background = !isShielded ? '#2c1917' : '#1a1815';
    btnUnshielded.style.border = `1px solid ${!isShielded ? '#f87171' : '#332d26'}`;
    btnUnshielded.style.color = !isShielded ? '#f87171' : '#8c8376';
  };

  const updateReadout = () => {
    const atom = ATOMS[currentKey];
    if (isShielded) {
      readoutBar.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#d99423;font-weight:700;">+${atom.z} Protons</span>
          <span style="color:#6b625a;">−</span>
          <span style="color:#60a5fa;font-weight:700;">${atom.coreElectrons} Inner Electrons</span>
          <span style="color:#6b625a;">=</span>
          <span style="color:#4ade80;font-weight:700;">+${atom.zeff} Effective Pull</span>
        </div>
        <div style="color:#8c8376;font-size:10px;">Zeff = ${atom.z} − ${atom.coreElectrons} = +${atom.zeff}</div>
      `;
      infoFooter.innerHTML = `
        <span style="color:#dcd6cc;">${atom.descShielded}</span>
        <div style="display:flex;gap:10px;font-size:10px;">
          <span style="color:#d99423;">● Nucleus</span>
          <span style="color:#60a5fa;">● Shield (${atom.coreElectrons}e⁻)</span>
          <span style="color:#4ade80;">● Outer e⁻</span>
        </div>
      `;
    } else {
      readoutBar.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#f87171;font-weight:700;">+${atom.z} Unshielded Protons</span>
          <span style="color:#6b625a;">=</span>
          <span style="color:#f87171;font-weight:700;">+${atom.z} Full Pull</span>
        </div>
        <div style="color:#8c8376;font-size:10px;">No shielding: outer shell pulled inward</div>
      `;
      infoFooter.innerHTML = `
        <span style="color:#dcd6cc;">${atom.descUnshielded}</span>
        <div style="display:flex;gap:10px;font-size:10px;">
          <span style="color:#f87171;">● Nucleus (+${atom.z})</span>
          <span style="color:#4ade80;">● Outer e⁻</span>
        </div>
      `;
    }
  };

  updateButtons();
  updateReadout();

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
    ax = Math.max(-1.1, Math.min(1.1, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };

  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  let rebuildScene = () => {};

  // Three.js 3D Setup
  import('three').then(THREE => {
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const width = Math.max(260, view.clientWidth || 340);
    const height = 230;
    renderer.setSize(width, height);
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 5.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xfff8ee, 0x14120f, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(4, 5, 4);
    scene.add(sun);

    const root = new THREE.Group();
    scene.add(root);

    // Objects to animate in loop
    let electronMeshes = [];
    let forceLineRays = [];
    let shieldMesh = null;

    rebuildScene = () => {
      // Clean previous children
      while (root.children.length > 0) {
        const obj = root.children[0];
        root.remove(obj);
        obj.traverse?.(child => {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      }

      electronMeshes = [];
      forceLineRays = [];
      shieldMesh = null;

      const atom = ATOMS[currentKey];
      const z = atom.z;

      // 1. Central Nucleus (+Z protons)
      const nucGroup = new THREE.Group();
      const nucMatAmber = new THREE.MeshStandardMaterial({
        color: 0xd99423,
        emissive: 0xd99423,
        emissiveIntensity: 0.5,
        roughness: 0.3
      });
      const nucMatGrey = new THREE.MeshStandardMaterial({
        color: 0x8c8376,
        roughness: 0.5
      });

      // Cluster of small spheres
      const sphereGeo = new THREE.SphereGeometry(0.065, 12, 10);
      const totalParts = Math.min(z + (z === 11 ? 12 : z === 12 ? 12 : 4), 24);
      for (let i = 0; i < totalParts; i++) {
        const phi = Math.acos(-1 + (2 * i) / totalParts);
        const theta = Math.sqrt(totalParts * Math.PI) * phi;
        const rad = 0.14 * Math.cbrt((i + 1) / totalParts);
        const pMesh = new THREE.Mesh(sphereGeo, i < z ? nucMatAmber : nucMatGrey);
        pMesh.position.set(rad * Math.sin(phi) * Math.cos(theta), rad * Math.cos(phi), rad * Math.sin(phi) * Math.sin(theta));
        nucGroup.add(pMesh);
      }
      root.add(nucGroup);

      // Shell radius setup
      const r1 = 0.95; // 1s
      const r2 = 1.70; // 2s 2p
      const r3Normal = 2.55; // 3s normal valence radius
      const r3Contracted = 1.65; // contracted radius if unshielded
      const rOuter = (atom.shells.length === 2)
        ? (isShielded ? r2 : 1.25)
        : (isShielded ? r3Normal : r3Contracted);

      // Track rings
      const ringMat = new THREE.LineBasicMaterial({ color: 0x3e3830, transparent: true, opacity: 0.5 });
      const ringMatOuter = new THREE.LineBasicMaterial({
        color: isShielded ? 0x4ade80 : 0xf87171,
        transparent: true,
        opacity: isShielded ? 0.45 : 0.75
      });

      const makeRing = (r, mat) => {
        const pts = [];
        const segs = 64;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return new THREE.Line(geo, mat);
      };

      // 2. Core Electron Shells (Only present or visible when shielded)
      const numInnerShells = atom.shells.length - 1;
      const electronGeo = new THREE.SphereGeometry(0.065, 12, 10);
      const coreElectronMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x2563eb,
        emissiveIntensity: 0.45,
        roughness: 0.3
      });
      const ghostCoreMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });

      for (let sIdx = 0; sIdx < numInnerShells; sIdx++) {
        const rShell = sIdx === 0 ? r1 : r2;
        const count = atom.shells[sIdx];
        root.add(makeRing(rShell, ringMat));

        for (let e = 0; e < count; e++) {
          const mesh = new THREE.Mesh(electronGeo, isShielded ? coreElectronMat : ghostCoreMat);
          mesh.userData = {
            r: rShell,
            speed: (1.5 / (1 + sIdx * 0.5)),
            phase: (e / count) * Math.PI * 2,
            isCore: true
          };
          root.add(mesh);
          electronMeshes.push(mesh);

          // Force line from nucleus to this core electron (absorbing/cancelling 1 positive charge)
          if (isShielded) {
            const lineMat = new THREE.LineDashedMaterial({
              color: 0x60a5fa,
              dashSize: 0.08,
              gapSize: 0.05,
              transparent: true,
              opacity: 0.45
            });
            const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(rShell, 0, 0)]);
            const forceLine = new THREE.Line(lineGeo, lineMat);
            forceLine.computeLineDistances();
            root.add(forceLine);
            forceLineRays.push({ line: forceLine, targetMesh: mesh, isCore: true });
          }
        }
      }

      // 3. Shielding Spherical Shell (The negative core cloud)
      if (isShielded) {
        const shieldR = (numInnerShells === 1 ? r1 : r2) + 0.18;
        const shieldGeo = new THREE.SphereGeometry(shieldR, 24, 20);
        const shieldMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.16,
          roughness: 0.2,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        root.add(shieldMesh);
      }

      // 4. Outer Shell & Valence Electron(s)
      root.add(makeRing(rOuter, ringMatOuter));
      const valCount = atom.shells[atom.shells.length - 1];
      const valMat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        emissive: 0x22c55e,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });

      for (let v = 0; v < valCount; v++) {
        const mesh = new THREE.Mesh(electronGeo, valMat);
        mesh.userData = {
          r: rOuter,
          speed: 0.6,
          phase: (v / valCount) * Math.PI * 2,
          isValence: true
        };
        root.add(mesh);
        electronMeshes.push(mesh);

        // Effective pull force lines reaching valence electron
        const pullLinesCount = isShielded ? atom.zeff : atom.z;
        for (let k = 0; k < pullLinesCount; k++) {
          const lineMat = new THREE.LineBasicMaterial({
            color: isShielded ? 0x4ade80 : 0xf87171,
            transparent: true,
            opacity: isShielded ? 0.85 : 0.6
          });
          const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(rOuter, 0, 0)]);
          const line = new THREE.Line(lineGeo, lineMat);
          root.add(line);
          forceLineRays.push({ line, targetMesh: mesh, isCore: false, rayIndex: k, totalRays: pullLinesCount });
        }
      }
    };

    rebuildScene();

    // Render loop
    const animate = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);

      if (!still) {
        animTime += 0.025;
      }

      // Smooth rotation
      root.rotation.y = ay + (still ? 0 : animTime * 0.15);
      root.rotation.x = ax;

      // Pulse shield gently
      if (shieldMesh && !still) {
        const s = 1.0 + Math.sin(animTime * 2.5) * 0.015;
        shieldMesh.scale.set(s, s, s);
      }

      // Update orbiting electron positions
      electronMeshes.forEach(mesh => {
        const speed = still ? 0 : mesh.userData.speed;
        const angle = mesh.userData.phase + animTime * speed;
        const r = mesh.userData.r;
        mesh.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      });

      // Update force line vertices to track their respective electrons
      forceLineRays.forEach(item => {
        const tPos = item.targetMesh.position;
        if (item.isCore) {
          // Inner ray ends directly at inner electron
          const posAttr = item.line.geometry.attributes.position;
          posAttr.setXYZ(1, tPos.x, tPos.y, tPos.z);
          posAttr.needsUpdate = true;
          item.line.computeLineDistances();
        } else {
          // Valence ray connects nucleus to valence electron
          const posAttr = item.line.geometry.attributes.position;
          posAttr.setXYZ(1, tPos.x, tPos.y, tPos.z);
          posAttr.needsUpdate = true;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (disposed || !view.clientWidth) return;
      const w = view.clientWidth;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    });
    ro.observe(view);

    return {
      dispose() {
        ro.disconnect();
        cancelAnimationFrame(rafId);
        renderer.dispose();
      }
    };
  }).catch(err => {
    console.error('Three.js failed to load for shielding explainer:', err);
  });

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);
      controlBar.remove();
      readoutBar.remove();
      infoFooter.remove();
    }
  };
}
