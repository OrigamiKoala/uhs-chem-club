/**
 * ligar-materials-3d.js — True 3D models of materials for Ligar's lattice quests (Unit 3).
 *
 * Instead of 2D diagrams under glass, materials stand as rich 3D structures on the tabletop:
 *   1. Ionic Crystal (Salt / NaCl): 3D alternating crystal lattice of Na⁺ and Cl⁻ ions with ionic bonds.
 *   2. Molecular Solid (Vent / Sulfur): Discrete 3-atom molecules packed together by weak intermolecular forces.
 *   3. Metallic Solid (Copper, Brass, Iron, Steel): Close-packed cation lattice in an electron sea.
 *      - Pure metal: ordered cation lattice with drifting delocalized electron sea.
 *      - Substitutional alloy (Brass): occasional substituted zinc atoms in the lattice.
 *      - Interstitial alloy (Steel): small carbon atoms nestled in the lattice interstices.
 *   4. Covalent Network Solid (Arch / Quartz / Diamond): Continuous interconnected 3D covalent cage network.
 *
 * DYNAMIC BEHAVIORS:
 *   - Thermal Shaking: As temperature rises on the hotplate, atoms oscillate around their equilibrium
 *     lattice positions with frequency and amplitude scaling with T / T_melt. Bonds flex and follow.
 *   - Molten Liquid Transition: When T >= T_melt (molten), the solid collapses into a flowing, rippling
 *     molten liquid pool with dynamic surface wave animation and material-specific incandescent glow
 *     (and free-drifting mobile ions for molten salt!).
 */

import * as THREE from 'three';
import { roundedSlab, wallGeometry, lathe } from './table-props.js';
import { mulberry32, hashId } from './plates.js';

function getHotplateTemp(p, state) {
  if (!p || p.zone || !state?.fixtures) return null;
  const at = p.at;
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'hotplate') continue;
    const { x, y } = f.at;
    const { w = 80, h = 30 } = f.size || {};
    if (at.x >= x - w / 2 && at.x <= x + w / 2 && at.y >= y - h / 2 && at.y <= y + h / 2) {
      return f.dials?.heat?.value ?? 0;
    }
  }
  return null;
}

const AMBER = '#e59b24';
const DUST = '#847c6e';
const PHOSPHOR = '#f2a629';
const STEEL = '#666055';

/** Create a cylinder bond mesh connecting points a and b */
function makeBondCylinder(a, b, r, mat) {
  const vA = new THREE.Vector3(...a);
  const vB = new THREE.Vector3(...b);
  const len = vA.distanceTo(vB);
  const geo = new THREE.CylinderGeometry(r, r, len, 8);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(vA).lerp(vB, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vB.clone().sub(vA).normalize());
  m.castShadow = true;
  return m;
}

/**
 * Build a 3D Material Model on an ore/crucible block
 */
export function build3DMaterialBlock(c, opts = {}) {
  const mats = c?.mats || opts.mats || {};
  const own = obj => (c && typeof c.own === 'function' ? c.own(obj) : obj);
  const m = {
    ligIron: mats.ligIron || own(new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8 })),
    ligHazard: mats.ligHazard || own(new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.5 })),
    labSteel: mats.labSteel || own(new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.35, metalness: 0.9 })),
    ligBrassWorn: mats.ligBrassWorn || own(new THREE.MeshStandardMaterial({ color: 0x9a7c3a, roughness: 0.46, metalness: 0.86 })),
    ligSlate: mats.ligSlate || own(new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.92 })),
    ...mats
  };

  const {
    decl = {},
    label = 'BLOCK',
    tint = 'bone',
    sealed = false,
    molten = false,
    temp = null,
    phase = 'intact',
    leads = false,
    current = false,
    seedId = 'x',
    piece = null,
    hw = c?.hw ?? 0.042,
    hh = c?.hh ?? 0.032
  } = opts;

  const g = new THREE.Group();
  g.name = `material-block-${seedId}`;
  const seed = (hashId(seedId) % 9973) + 1;
  const rnd = mulberry32(seed);

  const w = hw * 1.96;
  const d = hh * 1.96;
  const bodyH = 0.042;
  const baseY = bodyH + 0.003;

  // Crucible basin dimensions
  const fw = w * 0.88;
  const fd = d * 0.72;
  const basinCenterZ = -d * 0.09;

  // ------------------------------------------------------------------
  // 1. BASE AND CRUCIBLE CASING
  // ------------------------------------------------------------------
  if (sealed) {
    // Sealed crate (Stage 5): welded steel container with hazard bands
    g.add(at(new THREE.Mesh(roundedSlab(w, d, bodyH, 0.016, 0.003), m.ligIron), 0, 0, 0));
    g.add(at(new THREE.Mesh(roundedSlab(w * 0.98, d * 0.22, 0.006, 0.003, 0.0012), m.ligHazard), 0, bodyH, d * 0.38));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const boltGeo = new THREE.CylinderGeometry(0.004, 0.0045, 0.004, 6);
        const boltMesh = new THREE.Mesh(boltGeo, m.labSteel);
        boltMesh.position.set(sx * (w / 2 - 0.014), bodyH + 0.002, sz * (d / 2 - 0.014));
        g.add(boltMesh);
      }
    }
  } else {
    // Open Crucible Pedestal: Refractory dark stone body with brass rim
    const stoneCol = 0x242220;
    const stoneMat = own(new THREE.MeshStandardMaterial({
      color: stoneCol,
      roughness: 0.88,
      metalness: 0.15
    }));
    g.add(at(new THREE.Mesh(roundedSlab(w, d, bodyH, 0.014, 0.003), stoneMat), 0, 0, 0));

    // Outer brass bezel framing the top edge
    const rimMat = m.ligBrassWorn;
    const rim = new THREE.Mesh(wallGeometry(w * 0.94, d * 0.94, 0.007, 0.008, 0.005, 0.0012), rimMat);
    rim.position.set(0, bodyH - 0.001, 0);
    g.add(rim);

    // Inner refractory ceramic lining floor of the crucible basin
    const liningMat = m.ligSlate || own(new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.92 }));
    const basinFloor = new THREE.Mesh(roundedSlab(fw, fd, 0.003, 0.004, 0.001), liningMat);
    basinFloor.position.set(0, baseY - 0.001, basinCenterZ);
    g.add(basinFloor);
  }

  // ------------------------------------------------------------------
  // 2. NAMEPLATE & READOUTS (Front Lip)
  // ------------------------------------------------------------------
  const plateW = fw;
  const plateH = d * 0.18;
  const plateZ = d * 0.38;
  const plateY = bodyH + 0.0045;

  const statusText = molten ? 'MOLTEN' : (phase === 'struck' && opts.blow ? String(opts.blow).toUpperCase() : 'SOLID');
  const statusColor = molten ? AMBER : DUST;

  const nameplateMesh = c.paint(plateW, plateH, (ctx, W, H) => {
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#383226';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Block Label
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dec89a';
    ctx.fillText(label, 6, H * 0.52);

    // Status readout
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, W - 6, H * 0.52);
  }, { seed: `${seedId}|${label}|${statusText}|${molten ? 1 : 0}`, px: 256 });

  nameplateMesh.rotation.x = -Math.PI / 2;
  nameplateMesh.position.set(0, plateY, plateZ);
  g.add(nameplateMesh);

  // Leads Indicator Lamp (lit when leads are attached and current conducts)
  if (leads) {
    const lampCol = current ? 0x44ff33 : 0x223320;
    const lampEmissive = current ? new THREE.Color(0x33ee22) : new THREE.Color(0x000000);
    const lampMat = own(new THREE.MeshStandardMaterial({
      color: lampCol,
      emissive: lampEmissive,
      emissiveIntensity: current ? 0.95 : 0.0,
      roughness: 0.25,
      metalness: 0.2
    }));
    const lampCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.004, 0.003, 12), m.ligBrassWorn);
    lampCollar.position.set(plateW * 0.38, plateY + 0.002, plateZ - plateH * 0.05);
    const lampLens = new THREE.Mesh(new THREE.SphereGeometry(0.0026, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lampMat);
    lampLens.position.set(plateW * 0.38, plateY + 0.004, plateZ - plateH * 0.05);
    g.add(lampCollar);
    g.add(lampLens);
  }

  // If sealed, we don't display the internal atomic lattice (the player deduces it from behavior)
  if (sealed) {
    g.userData.height = bodyH + 0.015;
    return g;
  }

  // ------------------------------------------------------------------
  // 3. 3D MATERIAL STRUCTURE (Solid State)
  // ------------------------------------------------------------------
  const solidGroup = new THREE.Group();
  solidGroup.name = 'solid-material';
  g.add(solidGroup);

  const buildType = decl.build || 'grid';
  const meltTemp = decl.melt || 800;

  // Track dynamic atoms and bonds for thermal shaking
  const dynamicAtoms = [];
  const dynamicBonds = [];
  const mobileElectrons = [];

  // MATERIAL BUILDERS
  if (buildType === 'grid') {
    // ----------------------------------------------------------------
    // IONIC CRYSTAL LATTICE (e.g. Salt / NaCl)
    // ----------------------------------------------------------------
    const nx = 4;
    const nz = 3;
    const ny = 2;
    const spanX = fw * 0.74;
    const spanZ = fd * 0.66;
    const stepX = spanX / (nx - 1);
    const stepZ = spanZ / (nz - 1);
    const stepY = 0.014;

    const rCat = 0.0052; // Na+ smaller
    const rAni = 0.0072; // Cl- larger

    const catMat = own(new THREE.MeshStandardMaterial({
      color: 0xf5edd8, // Bone / ivory Na+
      roughness: 0.28,
      metalness: 0.08
    }));
    const aniMat = own(new THREE.MeshStandardMaterial({
      color: 0x7fa868, // Sage-tinted mineral green Cl-
      roughness: 0.25,
      metalness: 0.05
    }));
    const bondMat = own(new THREE.MeshStandardMaterial({
      color: 0xa8a89e,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6
    }));

    const catGeo = new THREE.SphereGeometry(rCat, 16, 12);
    const aniGeo = new THREE.SphereGeometry(rAni, 16, 12);

    const gridNodes = [];

    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const isCat = (ix + iz + iy) % 2 === 0;
          const px = -spanX / 2 + ix * stepX;
          const pz = basinCenterZ - spanZ / 2 + iz * stepZ;
          const py = baseY + 0.007 + iy * stepY;

          const sphere = new THREE.Mesh(isCat ? catGeo : aniGeo, isCat ? catMat : aniMat);
          sphere.position.set(px, py, pz);
          sphere.castShadow = true;
          solidGroup.add(sphere);

          const node = {
            mesh: sphere,
            basePos: new THREE.Vector3(px, py, pz),
            curPos: new THREE.Vector3(px, py, pz),
            phase: rnd() * Math.PI * 2,
            isCation: isCat
          };
          dynamicAtoms.push(node);
          gridNodes.push({ ix, iz, iy, node });
        }
      }
    }

    // Connect nearest neighbor lattice bonds (X, Z, Y)
    const atCoord = (x, z, y) => gridNodes.find(n => n.ix === x && n.iz === z && n.iy === y)?.node;
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const cur = atCoord(ix, iz, iy);
          if (!cur) continue;
          if (ix + 1 < nx) {
            const next = atCoord(ix + 1, iz, iy);
            addDynamicBond(cur, next, 0.0011, bondMat);
          }
          if (iz + 1 < nz) {
            const next = atCoord(ix, iz + 1, iy);
            addDynamicBond(cur, next, 0.0011, bondMat);
          }
          if (iy + 1 < ny) {
            const next = atCoord(ix, iz, iy + 1);
            addDynamicBond(cur, next, 0.0011, bondMat);
          }
        }
      }
    }

  } else if (buildType === 'clusters') {
    // ----------------------------------------------------------------
    // MOLECULAR SOLID (e.g. Vent / Sulfur - discrete molecular clusters)
    // ----------------------------------------------------------------
    const molMat = own(new THREE.MeshStandardMaterial({
      color: 0xebba38, // Sulfur mineral amber/yellow
      roughness: 0.28,
      metalness: 0.1
    }));
    const bondMat = own(new THREE.MeshStandardMaterial({
      color: 0x5a5246,
      roughness: 0.4
    }));
    const imfMat = own(new THREE.MeshStandardMaterial({
      color: 0x908c7e,
      roughness: 0.5,
      transparent: true,
      opacity: 0.35
    }));

    const atomGeo = new THREE.SphereGeometry(0.0055, 16, 12);

    // Arrange 6 discrete 3-atom bent molecules (2 rows of 3)
    const numRows = 2;
    const numCols = 3;
    const spanX = fw * 0.74;
    const spanZ = fd * 0.58;
    const stepX = spanX / (numCols - 1);
    const stepZ = spanZ / (numRows - 1);

    const molCenters = [];

    for (let r = 0; r < numRows; r++) {
      for (let cIdx = 0; cIdx < numCols; cIdx++) {
        const cx = -spanX / 2 + cIdx * stepX;
        const cz = basinCenterZ - spanZ / 2 + r * stepZ;
        const cy = baseY + 0.008;

        // Central atom
        const cAtom = createAtomNode(cx, cy + 0.004, cz, atomGeo, molMat);
        // Left bonded atom
        const lAtom = createAtomNode(cx - 0.0065, cy, cz - 0.004, atomGeo, molMat);
        // Right bonded atom
        const rAtom = createAtomNode(cx + 0.0065, cy, cz + 0.004, atomGeo, molMat);

        // Intramolecular covalent bonds (strong)
        addDynamicBond(cAtom, lAtom, 0.0014, bondMat);
        addDynamicBond(cAtom, rAtom, 0.0014, bondMat);

        molCenters.push(cAtom);
      }
    }

    // Weak intermolecular lines between adjacent molecules
    for (let i = 0; i < molCenters.length - 1; i++) {
      addDynamicBond(molCenters[i], molCenters[i + 1], 0.0004, imfMat);
    }

  } else if (buildType === 'metallic') {
    // ----------------------------------------------------------------
    // METALLIC SOLID (Copper, Brass, Iron, Steel)
    // ----------------------------------------------------------------
    const isCopper = tint === 'rust' || !decl.alloy;
    const isBrass = decl.alloy === 'sub';
    const isSteel = decl.alloy === 'int';

    const baseColor = isCopper ? 0xdb6832 : (isBrass ? 0xd4a838 : 0x888c94);
    const metalMat = own(new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.2,
      metalness: 0.88
    }));
    const subMat = isBrass ? own(new THREE.MeshStandardMaterial({ color: 0xe8da9e, roughness: 0.24, metalness: 0.85 })) : null;
    const intMat = isSteel ? own(new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.7 })) : null;

    const rCat = 0.0056;
    const catGeo = new THREE.SphereGeometry(rCat, 16, 12);
    const subGeo = isBrass ? new THREE.SphereGeometry(rCat * 1.25, 16, 12) : null;
    const intGeo = isSteel ? new THREE.SphereGeometry(rCat * 0.48, 12, 8) : null;

    // 2 close-packed layers
    const nx = 5;
    const nz = 3;
    const spanX = fw * 0.76;
    const spanZ = fd * 0.65;
    const stepX = spanX / (nx - 1);
    const stepZ = spanZ / (nz - 1);

    // Bottom layer
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const px = -spanX / 2 + ix * stepX;
        const pz = basinCenterZ - spanZ / 2 + iz * stepZ;
        const py = baseY + 0.0075;

        const isSubstituted = isBrass && (ix + iz * 2) % 4 === 1;
        createAtomNode(px, py, pz, isSubstituted ? subGeo : catGeo, isSubstituted ? subMat : metalMat);
      }
    }

    // Top staggered layer
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const px = -spanX / 2 + (ix + 0.5) * stepX;
        const pz = basinCenterZ - spanZ / 2 + (iz + 0.5) * stepZ;
        const py = baseY + 0.0075 + rCat * 1.45;

        createAtomNode(px, py, pz, catGeo, metalMat);

        // Interstitial carbon atoms in steel
        if (isSteel && (ix + iz) % 2 === 0) {
          createAtomNode(px, baseY + 0.0075 + rCat * 0.5, pz, intGeo, intMat);
        }
      }
    }

    // Delocalized Mobile Electron Sea (Phosphor particle swarm)
    const eMat = own(new THREE.MeshBasicMaterial({ color: 0xffea66 }));
    const eGeo = new THREE.SphereGeometry(0.0016, 8, 6);
    for (let i = 0; i < 18; i++) {
      const eMesh = new THREE.Mesh(eGeo, eMat);
      const ex = (rnd() - 0.5) * spanX * 0.9;
      const ez = basinCenterZ + (rnd() - 0.5) * spanZ * 0.9;
      const ey = baseY + 0.008 + rnd() * 0.015;
      eMesh.position.set(ex, ey, ez);
      solidGroup.add(eMesh);
      mobileElectrons.push({
        mesh: eMesh,
        origin: new THREE.Vector3(ex, ey, ez),
        speed: 1.5 + rnd() * 2.0,
        phase: rnd() * Math.PI * 2
      });
    }

  } else {
    // ----------------------------------------------------------------
    // COVALENT NETWORK SOLID (e.g. Arch / Diamond / Quartz)
    // ----------------------------------------------------------------
    const netMat = own(new THREE.MeshStandardMaterial({
      color: 0x686e7a, // Dark lustrous refractory mineral
      roughness: 0.28,
      metalness: 0.35
    }));
    const bondMat = own(new THREE.MeshStandardMaterial({
      color: 0x8c94a2,
      roughness: 0.3
    }));

    const atomGeo = new THREE.SphereGeometry(0.0052, 16, 12);

    const nx = 4;
    const nz = 3;
    const ny = 2;
    const spanX = fw * 0.76;
    const spanZ = fd * 0.65;
    const stepX = spanX / (nx - 1);
    const stepZ = spanZ / (nz - 1);
    const stepY = 0.014;

    const netNodes = [];

    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const shift = (iy % 2 === 1) ? stepX * 0.25 : 0;
          const px = -spanX / 2 + ix * stepX + shift;
          const pz = basinCenterZ - spanZ / 2 + iz * stepZ;
          const py = baseY + 0.008 + iy * stepY;

          const node = createAtomNode(px, py, pz, atomGeo, netMat);
          netNodes.push({ ix, iz, iy, node });
        }
      }
    }

    // Sturdy 3D covalent bonds interconnecting all atoms
    const atCoord = (x, z, y) => netNodes.find(n => n.ix === x && n.iz === z && n.iy === y)?.node;
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const cur = atCoord(ix, iz, iy);
          if (!cur) continue;
          if (ix + 1 < nx) addDynamicBond(cur, atCoord(ix + 1, iz, iy), 0.0014, bondMat);
          if (iz + 1 < nz) addDynamicBond(cur, atCoord(ix, iz + 1, iy), 0.0014, bondMat);
          if (iy + 1 < ny) addDynamicBond(cur, atCoord(ix, iz, iy + 1), 0.0014, bondMat);
          if (ix + 1 < nx && iz + 1 < nz && iy + 1 < ny) {
            addDynamicBond(cur, atCoord(ix + 1, iz + 1, iy + 1), 0.0012, bondMat);
          }
        }
      }
    }
  }

  function createAtomNode(x, y, z, geo, mat) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    solidGroup.add(mesh);
    const node = {
      mesh,
      basePos: new THREE.Vector3(x, y, z),
      curPos: new THREE.Vector3(x, y, z),
      phase: rnd() * Math.PI * 2
    };
    dynamicAtoms.push(node);
    return node;
  }

  function addDynamicBond(nodeA, nodeB, r, mat) {
    if (!nodeA || !nodeB) return;
    const vA = nodeA.basePos;
    const vB = nodeB.basePos;
    const len = vA.distanceTo(vB);
    const geo = new THREE.CylinderGeometry(r, r, len, 8);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(vA).lerp(vB, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vB.clone().sub(vA).normalize());
    m.castShadow = true;
    solidGroup.add(m);
    dynamicBonds.push({
      mesh: m,
      nodeA,
      nodeB,
      baseLen: len
    });
  }

  // ------------------------------------------------------------------
  // 4. MOLTEN LIQUID POOL (Active when molten)
  // ------------------------------------------------------------------
  const liquidGroup = new THREE.Group();
  liquidGroup.name = 'molten-liquid';
  g.add(liquidGroup);

  // Determine liquid material properties based on chemical class
  let liquidColor = 0xe06020;
  let liquidEmissive = 0xff3b00;
  let emissiveIntensity = 0.75;
  let liquidRoughness = 0.18;
  let liquidMetalness = 0.85;
  let isTransparent = false;
  let liquidOpacity = 1.0;

  if (buildType === 'grid') {
    // Molten salt: luminous amber transparent melt
    liquidColor = 0xdec070;
    liquidEmissive = 0x8a5010;
    emissiveIntensity = 0.45;
    liquidRoughness = 0.15;
    liquidMetalness = 0.1;
    isTransparent = true;
    liquidOpacity = 0.88;
  } else if (buildType === 'clusters') {
    // Molten sulfur: rich golden-amber viscous liquid
    liquidColor = 0xc89018;
    liquidEmissive = 0x502800;
    emissiveIntensity = 0.35;
    liquidRoughness = 0.20;
    liquidMetalness = 0.1;
    isTransparent = true;
    liquidOpacity = 0.92;
  } else if (buildType === 'web') {
    // Molten network: radiant incandescent magma
    liquidColor = 0xff8833;
    liquidEmissive = 0xff5500;
    emissiveIntensity = 0.95;
    liquidRoughness = 0.22;
    liquidMetalness = 0.4;
  }

  const liquidMat = own(new THREE.MeshStandardMaterial({
    color: liquidColor,
    emissive: new THREE.Color(liquidEmissive),
    emissiveIntensity,
    roughness: liquidRoughness,
    metalness: liquidMetalness,
    transparent: isTransparent,
    opacity: liquidOpacity
  }));

  // High-density surface grid for dynamic wave ripples
  const gridW = fw * 0.94;
  const gridD = fd * 0.90;
  const liquidGeo = new THREE.PlaneGeometry(gridW, gridD, 36, 26);
  liquidGeo.rotateX(-Math.PI / 2);
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  const liquidSurfaceY = baseY + 0.007;
  liquidMesh.position.set(0, liquidSurfaceY, basinCenterZ);
  liquidGroup.add(liquidMesh);

  // Floating mobile particles in molten salt (Na+ and Cl- ions swimming in melt)
  const swimmingIons = [];
  if (buildType === 'grid') {
    const naMat = own(new THREE.MeshStandardMaterial({ color: 0xffe8c8, roughness: 0.2 }));
    const clMat = own(new THREE.MeshStandardMaterial({ color: 0x98b888, roughness: 0.2 }));
    for (let i = 0; i < 12; i++) {
      const isNa = i % 2 === 0;
      const sMesh = new THREE.Mesh(new THREE.SphereGeometry(isNa ? 0.0032 : 0.0045, 12, 8), isNa ? naMat : clMat);
      liquidGroup.add(sMesh);
      swimmingIons.push({
        mesh: sMesh,
        cx: (rnd() - 0.5) * gridW * 0.7,
        cz: basinCenterZ + (rnd() - 0.5) * gridD * 0.7,
        r: 0.006 + rnd() * 0.012,
        speed: 1.2 + rnd() * 1.5,
        phase: rnd() * Math.PI * 2
      });
    }
  }

  // Visibility toggle
  solidGroup.visible = !molten;
  liquidGroup.visible = molten;

  // ------------------------------------------------------------------
  // 5. ANIMATION TICK & DYNAMIC STATE SYNC
  // ------------------------------------------------------------------
  let totalTime = 0;
  let targetTemp = temp ?? 0;
  let activeTemp = targetTemp;

  g.userData.height = bodyH + 0.028;

  // Sync called whenever table state updates (e.g. dial turned)
  g.userData.sync = (updatedPiece, state) => {
    if (!state || !updatedPiece) return;
    const hpTemp = getHotplateTemp(updatedPiece, state);
    if (hpTemp !== null) {
      targetTemp = hpTemp;
    } else {
      targetTemp = 0;
    }
    const isMoltenNow = targetTemp >= meltTemp;
    if (isMoltenNow !== molten) {
      solidGroup.visible = !isMoltenNow;
      liquidGroup.visible = isMoltenNow;
    }
  };

  // Tick called every frame (60fps)
  g.userData.tick = (dt, still) => {
    totalTime += dt;
    if (still) return;

    // Smooth temperature easing
    activeTemp += (targetTemp - activeTemp) * Math.min(1.0, dt * 8.0);

    const isCurrentlyMolten = molten || (activeTemp >= meltTemp);

    // Toggle groups
    solidGroup.visible = !isCurrentlyMolten;
    liquidGroup.visible = isCurrentlyMolten;

    if (!isCurrentlyMolten) {
      // --------------------------------------------------------------
      // THERMAL SHAKING (Solid State)
      // --------------------------------------------------------------
      const normHeat = Math.min(1.2, Math.max(0, activeTemp / meltTemp));

      // Shaking parameters scale with temperature
      const amp = 0.00015 + 0.0028 * Math.pow(normHeat, 1.35);
      const freq = 14.0 + 36.0 * Math.sqrt(normHeat);

      // Displace each atom around equilibrium position
      for (let i = 0; i < dynamicAtoms.length; i++) {
        const atom = dynamicAtoms[i];
        const ph = atom.phase;
        const dx = amp * (Math.sin(freq * totalTime * 1.05 + ph) + 0.35 * Math.sin(2.3 * freq * totalTime + ph * 1.5));
        const dy = amp * 0.5 * (Math.cos(freq * totalTime * 0.92 + ph * 1.2) + 0.25 * Math.sin(1.7 * freq * totalTime));
        const dz = amp * (Math.cos(freq * totalTime * 1.12 + ph * 0.8) + 0.35 * Math.cos(2.1 * freq * totalTime + ph));

        atom.curPos.set(atom.basePos.x + dx, atom.basePos.y + dy, atom.basePos.z + dz);
        atom.mesh.position.copy(atom.curPos);
      }

      // Update bond cylinders to follow vibrating endpoints
      const dir = new THREE.Vector3();
      const mid = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      for (let i = 0; i < dynamicBonds.length; i++) {
        const bond = dynamicBonds[i];
        const pA = bond.nodeA.curPos;
        const pB = bond.nodeB.curPos;

        mid.copy(pA).lerp(pB, 0.5);
        bond.mesh.position.copy(mid);

        dir.subVectors(pB, pA);
        const curLen = dir.length();
        if (curLen > 1e-6) {
          dir.normalize();
          bond.mesh.quaternion.setFromUnitVectors(up, dir);
          bond.mesh.scale.set(1, curLen / bond.baseLen, 1);
        }
      }

      // Mobile electrons drift in metal
      if (mobileElectrons.length) {
        const eSpeed = 1.0 + normHeat * 5.0;
        for (let i = 0; i < mobileElectrons.length; i++) {
          const e = mobileElectrons[i];
          const t = totalTime * e.speed * eSpeed + e.phase;
          e.mesh.position.set(
            e.origin.x + Math.sin(t * 1.2) * 0.005,
            e.origin.y + Math.cos(t * 1.6) * 0.002,
            e.origin.z + Math.cos(t * 1.1) * 0.004
          );
        }
      }

    } else {
      // --------------------------------------------------------------
      // MOLTEN LIQUID FLOW (Liquid State)
      // --------------------------------------------------------------
      const pos = liquidGeo.attributes.position;
      const count = pos.count;
      const t = totalTime;

      // Surface wave ripples
      for (let i = 0; i < count; i++) {
        const lx = pos.getX(i);
        const lz = pos.getZ(i);

        const w1 = 0.0012 * Math.sin(42 * lx + 4.8 * t) * Math.cos(34 * lz + 3.9 * t);
        const w2 = 0.0008 * Math.sin(58 * (lx + lz) + 6.2 * t);
        const w3 = 0.0005 * Math.cos(72 * (lx - lz) + 3.5 * t);

        pos.setY(i, w1 + w2 + w3);
      }
      pos.needsUpdate = true;
      liquidGeo.computeVertexNormals();

      // Swimming ions in molten salt
      for (let i = 0; i < swimmingIons.length; i++) {
        const ion = swimmingIons[i];
        const it = t * ion.speed + ion.phase;
        ion.mesh.position.set(
          ion.cx + Math.cos(it) * ion.r,
          liquidSurfaceY + 0.002 + Math.sin(it * 1.5) * 0.001,
          ion.cz + Math.sin(it) * ion.r
        );
      }
    }
  };

  return g;
}

const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };
