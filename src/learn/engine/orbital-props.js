/**
 * orbital-props.js — Authentic 3D orbital pieces and physical mixing apparatus for tabletop benches.
 *
 * Provides:
 *   - `buildOrbitalPiece3D(c, p, state)`: Real 3D orbital models (spherical s, dumbbell px/py/pz,
 *     directional hybrid lobes) with quantum wave phase colors and live electrons inside the clouds.
 *   - `buildMixer3D(f, state, c)`: Physical 3D mixing apparatus with a swirling vortex in the mixing bowl,
 *     energy conduit wave bridge, and blossoming 3D hybrid orbitals (tetrahedral sp³, trigonal sp², etc.)
 *     with electrons inside each hybrid cloud.
 */

import * as THREE from 'three';
import { rectOf, SIZES } from '../table/snap.js';
import { bowlRead, bondedOrb } from '../table/kits/domain-orbitals.js';
import { planDomains } from './vsepr.js';

/* ------------------------------------------------------------------ colors & palette */

const COLOR = Object.freeze({
  amberPhase: 0xe59b24,  // (+) wave phase
  cyanPhase:  0x0099dd,  // (-) wave phase
  sCloud:     0xe59b24,  // s orbital warm cloud
  sCloudCore: 0xffd266,  // s orbital inner density
  bondedGlow: 0x84b93e,  // phosphor resonance when bonded
  electron:   0xffffff,  // electron core
  electronGlow: 0xffdd66, // electron emissive warm glow
  spinDown:   0x7cd4fd,  // pale cyan for opposite spin
  carbonHub:  0x1f1f1e,  // graphite carbon nucleus
  nucleus:    0xe0ded8,  // atom nucleus
  brass:      0x9a7c3a,  // weathered lab brass
  iron:       0x3a3a38,  // darkened iron
  copper:     0xa05a38,  // conduit copper
  vortexRing: 0x38bdf8   // energy vortex
});

/* ------------------------------------------------------------------ geometry builders */

/** Lathe teardrop geometry for a dumbbell or hybrid lobe pointing along +Y. */
function buildTeardropLobeGeo(length = 1.0, maxRadius = 0.44, N = 20) {
  const points = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Pinched at nucleus (t=0), bulbous at t=0.6, rounded smooth at tip (t=1)
    const r = maxRadius * Math.sin(Math.PI * t) * Math.sqrt(Math.max(0, t));
    const y = t * length;
    points.push(new THREE.Vector2(Math.max(0, r), y));
  }
  return new THREE.LatheGeometry(points, 24);
}

/** Turned metal pedestal for the orbital piece. */
function buildPedestalGeo(baseR, height) {
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(baseR, 0),
    new THREE.Vector2(baseR, height * 0.25),
    new THREE.Vector2(baseR * 0.88, height * 0.5),
    new THREE.Vector2(baseR * 0.76, height * 0.82),
    new THREE.Vector2(baseR * 0.62, height),
    new THREE.Vector2(0, height)
  ];
  return new THREE.LatheGeometry(points, 24);
}

/* ------------------------------------------------------------------ helpers */

function own(c, mat) {
  if (!mat) return mat;
  if (c?.own) return c.own(mat);
  mat.userData = mat.userData || {};
  mat.userData.tableOwned = true;
  return mat;
}

/* ------------------------------------------------------------------ electron helper */

/** Build an electron sphere with bright emissive glow. */
function createElectronMesh(c, radius, emissiveColor = COLOR.electronGlow) {
  const geo = new THREE.SphereGeometry(radius, 16, 12);
  const mat = own(c, new THREE.MeshStandardMaterial({
    color: COLOR.electron,
    emissive: emissiveColor,
    emissiveIntensity: 1.1,
    roughness: 0.2
  }));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  return mesh;
}

/* ------------------------------------------------------------------ 3D ORBITAL PIECE */

/* ------------------------------------------------------------------ SEATED ORBITALS (one atom) */

/** How high, in table units, a seated atom's orbital plane floats above the plate: clear of the p orbital standing through it. */
export const SEAT_FLOAT = 18;
const SEAT_LOBE = 22;
const SEAT_P = 17;

/**
 * An orbital that is part of an atom (`props.seat`, `kit domain-orbitals.js`): the lobe is drawn from the atom's nucleus, not from
 * the piece's own spot, so the orbitals of one atom stand round one nucleus. The p orbital (`props.nucleus`) carries the atom itself:
 * the nucleus on a stem from a brass foot, with its name on the foot. A lobe that points at a hydrogen shows the hydrogen nucleus.
 * Once an orbital is in a bond it turns green and swells toward its partner; the orbital with the lower id also draws the cloud
 * the two share (a spindle on the axis for a sigma bond, one above and one below the axis for a pi bond), faded in as the atoms arrive.
 */
function buildSeatedOrbital3D(c, p, state) {
  const u = c.s || 0.01;
  const g = new THREE.Group();
  const seat = p.props.seat;
  const N = new THREE.Vector3(-seat.dx * u, 0, -seat.dy * u);
  const bonded = bondedOrb(state, p);
  const partnerId = p.joinedTo.find(id => state.pieces[id]?.kind === 'orb');
  const partner = partnerId ? state.pieces[partnerId] : null;

  const mk = (color, opacity) => own(c, new THREE.MeshStandardMaterial({
    color, roughness: 0.22, metalness: 0.08, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
  }));
  const pos = mk(bonded ? COLOR.bondedGlow : COLOR.amberPhase, bonded ? 0.6 : 0.5);
  const neg = mk(bonded ? COLOR.bondedGlow : COLOR.cyanPhase, bonded ? 0.6 : 0.5);

  const cloud = new THREE.Group();
  cloud.position.copy(N);
  g.add(cloud);
  const swell = new THREE.Group();
  cloud.add(swell);

  const electrons = [];
  const eR = 1.5 * u;
  const addElectron = (at, dir, phase, tint) => {
    const e = createElectronMesh(c, eR, tint);
    e.position.copy(at);
    cloud.add(e);
    electrons.push({ mesh: e, base: at.clone(), dir, phase });
  };

  if (p.props.type === 'p') {
    const geo = buildTeardropLobeGeo(SEAT_P * u, 8.5 * u);
    const up = new THREE.Mesh(geo, pos);
    const down = new THREE.Mesh(geo, neg);
    down.rotation.x = Math.PI;
    swell.add(up, down);
    const e = p.props.e || 0;
    if (e >= 1) addElectron(new THREE.Vector3(0, SEAT_P * 0.55 * u, 0), new THREE.Vector3(0, 1, 0), 0, COLOR.electronGlow);
    if (e >= 2) addElectron(new THREE.Vector3(0, -SEAT_P * 0.55 * u, 0), new THREE.Vector3(0, -1, 0), Math.PI, COLOR.spinDown);
  } else {
    const dirAng = p.props.dir ?? 0;
    const dir = new THREE.Vector3(Math.cos(dirAng), 0, Math.sin(dirAng)).normalize();
    const major = new THREE.Mesh(buildTeardropLobeGeo(SEAT_LOBE * u, 8 * u), pos);
    const minor = new THREE.Mesh(buildTeardropLobeGeo(6 * u, 2.6 * u), neg);
    major.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    minor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    swell.add(major, minor);
    if ((p.props.e || 0) >= 1) addElectron(dir.clone().multiplyScalar(SEAT_LOBE * 0.55 * u), dir, 0, COLOR.electronGlow);
    if (p.props.to === 'h') {
      const h = new THREE.Mesh(
        new THREE.SphereGeometry(2.6 * u, 16, 12),
        own(c, new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.4, metalness: 0.2 }))
      );
      h.position.copy(dir.clone().multiplyScalar((SEAT_LOBE + 1.5) * u)).add(N);
      g.add(h);
    }
  }

  if (p.props.nucleus) {
    const nuc = new THREE.Mesh(
      new THREE.SphereGeometry(3.3 * u, 22, 16),
      own(c, new THREE.MeshStandardMaterial({ color: COLOR.carbonHub, roughness: 0.35, metalness: 0.55 }))
    );
    nuc.position.copy(N);
    g.add(nuc);
    const brass = m => m?.ligBrassWorn || own(c, new THREE.MeshStandardMaterial({ color: COLOR.brass, roughness: 0.46, metalness: 0.82 }));
    const footH = 1.6 * u;
    const foot = new THREE.Mesh(buildPedestalGeo(6.5 * u, footH), brass(c.mats));
    foot.position.set(N.x, -SEAT_FLOAT * u, N.z);
    foot.castShadow = true;
    g.add(foot);
    const stemLen = (SEAT_FLOAT - 3.3) * u - footH;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * u, 0.9 * u, stemLen, 12), brass(c.mats));
    stem.position.set(N.x, -SEAT_FLOAT * u + footH + stemLen / 2, N.z);
    g.add(stem);
    if (c.label && p.props.atomLabel) {
      const plaque = c.label(p.props.atomLabel, 9 * u, 2.6 * u, { dim: false, bg: '#16140f' });
      if (plaque) {
        plaque.position.set(N.x, -SEAT_FLOAT * u + footH * 0.6, N.z + 6.4 * u);
        plaque.rotation.x = -0.25;
        g.add(plaque);
      }
    }
  }

  // What the pair shares, drawn once, by the lower id.
  let shared = null;
  if (bonded && partner && p.id < partner.id) {
    const mine = { x: p.at.x - seat.dx, y: p.at.y - seat.dy };
    const theirs = { x: partner.at.x - partner.props.seat.dx, y: partner.at.y - partner.props.seat.dy };
    const mid = new THREE.Vector3(N.x + ((theirs.x - mine.x) / 2) * u, 0, N.z + ((theirs.y - mine.y) / 2) * u);
    const along = Math.atan2(theirs.y - mine.y, theirs.x - mine.x);
    const gap = Math.hypot(theirs.x - mine.x, theirs.y - mine.y);
    const sharedMat = own(c, new THREE.MeshStandardMaterial({
      color: COLOR.bondedGlow, roughness: 0.2, emissive: COLOR.bondedGlow, emissiveIntensity: 0.25, transparent: true, opacity: 0, depthWrite: false
    }));
    const spindle = (y, rx, ry) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), sharedMat);
      m.scale.set(rx * u, ry * u, ry * u);
      m.position.set(mid.x, y * u, mid.z);
      m.rotation.y = -along;
      return m;
    };
    shared = new THREE.Group();
    if (p.props.type === 'p') {
      shared.add(spindle(SEAT_P * 0.62, gap * 0.55 + 3, 5.2), spindle(-SEAT_P * 0.62, gap * 0.55 + 3, 5.2));
    } else {
      shared.add(spindle(0, gap * 0.5, 4.2));
    }
    shared.userData.mat = sharedMat;
    g.add(shared);
  }

  const wide = p.props.type === 'p' ? 1.75 : 1.2;
  let t = 0;
  let grow = bonded ? 0 : 1;
  g.userData.tick = (delta, still) => {
    t += delta;
    if (bonded) grow = Math.min(1, grow + delta / 0.9);
    const k = bonded ? 1 + (wide - 1) * grow : 1;
    if (p.props.type === 'p') swell.scale.set(k, 1, k);
    else swell.scale.set(1, k, k);
    if (shared) shared.userData.mat.opacity = 0.42 * grow;
    if (still) return;
    for (const em of electrons) {
      em.mesh.position.copy(em.base).addScaledVector(em.dir, Math.sin(t * 2.6 + em.phase) * 0.9 * u);
    }
  };
  g.userData.tick(0, true);
  return g;
}

/**
 * Builds an authentic 3D orbital model in space for any quest bench.
 * Renders true 3D clouds (spherical s, dumbbell p, directional hybrid lobe)
 * with quantum phase colors and visible electrons inside the clouds.
 */
export function buildOrbitalPiece3D(c, p, state) {
  if (p.props.seat) return buildSeatedOrbital3D(c, p, state);
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw || 0.032;

  // 1. Turned metal base pedestal resting on the tabletop
  const baseR = R * 0.74;
  const baseH = R * 0.22;
  const standMat = m?.ligBrassWorn || own(c, new THREE.MeshStandardMaterial({
    color: COLOR.brass,
    roughness: 0.46,
    metalness: 0.82
  }));
  const standGeo = buildPedestalGeo(baseR, baseH);
  const standMesh = new THREE.Mesh(standGeo, standMat);
  standMesh.castShadow = true;
  standMesh.receiveShadow = true;
  g.add(standMesh);
  g.userData.baseMesh = standMesh;

  // Collar ring at top of base
  const collarMat = m?.ligIron || own(c, new THREE.MeshStandardMaterial({
    color: COLOR.iron,
    roughness: 0.55,
    metalness: 0.8
  }));
  const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.64, baseR * 0.66, baseH * 0.35, 20), collarMat);
  collarMesh.position.y = baseH + baseH * 0.15;
  g.add(collarMesh);

  // Etched plaque / badge on base front
  const plaqueW = baseR * 1.3;
  const plaqueH = baseH * 0.65;
  const labelText = p.props.atomLabel ? `${p.props.atomLabel} ${p.label}` : p.label;
  if (c.label) {
    const labelMesh = c.label(labelText, plaqueW, plaqueH, { dim: false, bg: '#16140f' });
    if (labelMesh) {
      labelMesh.position.set(0, baseH * 0.5, baseR * 0.88);
      labelMesh.rotation.x = -0.25;
      g.add(labelMesh);
    }
  }

  // 2. Elevated 3D Orbital Cloud
  const cy = baseH + R * 1.15;
  g.userData.joinY = cy;
  g.userData.height = cy + R * 1.15;

  const cloudGroup = new THREE.Group();
  cloudGroup.position.set(0, cy, 0);
  g.add(cloudGroup);

  const bonded = bondedOrb(state, p);
  const cloudAlpha = bonded ? 0.68 : 0.54;

  const matPos = own(c, new THREE.MeshStandardMaterial({
    color: bonded ? COLOR.bondedGlow : COLOR.amberPhase,
    roughness: 0.22,
    metalness: 0.08,
    transparent: true,
    opacity: cloudAlpha,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const matNeg = own(c, new THREE.MeshStandardMaterial({
    color: bonded ? COLOR.bondedGlow : COLOR.cyanPhase,
    roughness: 0.22,
    metalness: 0.08,
    transparent: true,
    opacity: cloudAlpha,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  // Central tiny nucleus speck
  const nucMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.09, 14, 10),
    own(c, new THREE.MeshStandardMaterial({ color: COLOR.nucleus, roughness: 0.3, metalness: 0.5 }))
  );
  cloudGroup.add(nucMesh);

  // 3. Build orbital-specific shape
  const type = p.props.type;
  const electronsGroup = new THREE.Group();
  cloudGroup.add(electronsGroup);

  const electronMeshes = [];
  const eCount = p.props.e || 0;
  const eRadius = R * 0.125;

  if (type === 's') {
    // S ORBITAL: Spherical probability cloud
    const sRadius = R * 0.82;
    const sMesh = new THREE.Mesh(new THREE.SphereGeometry(sRadius, 28, 20), matPos);
    cloudGroup.add(sMesh);

    // Inner probability density shell
    const innerMat = own(c, new THREE.MeshBasicMaterial({
      color: COLOR.sCloudCore,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.BackSide
    }));
    cloudGroup.add(new THREE.Mesh(new THREE.SphereGeometry(sRadius * 0.55, 20, 16), innerMat));

    // Electrons inside s cloud
    if (eCount >= 1) {
      const e1 = createElectronMesh(c, eRadius, COLOR.electronGlow);
      e1.position.set(sRadius * 0.38, 0, 0);
      electronsGroup.add(e1);
      electronMeshes.push({ mesh: e1, basePos: new THREE.Vector3(sRadius * 0.38, 0, 0), speed: 2.2, phase: 0 });
    }
    if (eCount >= 2) {
      const e2 = createElectronMesh(c, eRadius * 0.95, COLOR.spinDown);
      e2.position.set(-sRadius * 0.38, 0, 0);
      electronsGroup.add(e2);
      electronMeshes.push({ mesh: e2, basePos: new THREE.Vector3(-sRadius * 0.38, 0, 0), speed: 2.2, phase: Math.PI });
    }

  } else if (type === 'p') {
    // P ORBITAL: Two opposite teardrop lobes along the declared axis
    const pLen = R * 0.94;
    const pRad = R * 0.44;
    const lobeGeo = buildTeardropLobeGeo(pLen, pRad);

    const lobePos = new THREE.Mesh(lobeGeo, matPos);
    const lobeNeg = new THREE.Mesh(lobeGeo, matNeg);

    // Axis orientation: x = along X, y = along Z (table depth), z = along Y (vertical height)
    const axis = p.props.axis || 'x';
    const axisDir = axis === 'x' ? new THREE.Vector3(1, 0, 0)
      : axis === 'y' ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);

    const negDir = axisDir.clone().negate();
    lobePos.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisDir);
    lobeNeg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), negDir);

    cloudGroup.add(lobePos);
    cloudGroup.add(lobeNeg);

    // Faint planar node disc at boundary
    const nodeGeo = new THREE.CircleGeometry(pRad * 0.85, 16);
    const nodeMat = own(c, new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
    nodeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axisDir);
    cloudGroup.add(nodeMesh);

    // Electrons inside p lobes
    if (eCount >= 1) {
      const e1 = createElectronMesh(c, eRadius, COLOR.electronGlow);
      const pos1 = axisDir.clone().multiplyScalar(pLen * 0.55);
      e1.position.copy(pos1);
      electronsGroup.add(e1);
      electronMeshes.push({ mesh: e1, basePos: pos1, dir: axisDir, speed: 2.6, phase: 0 });
    }
    if (eCount >= 2) {
      const e2 = createElectronMesh(c, eRadius * 0.95, COLOR.spinDown);
      const pos2 = negDir.clone().multiplyScalar(pLen * 0.55);
      e2.position.copy(pos2);
      electronsGroup.add(e2);
      electronMeshes.push({ mesh: e2, basePos: pos2, dir: negDir, speed: 2.6, phase: Math.PI });
    }

  } else {
    // HYBRID ORBITAL (sp, sp2, sp3, or directional lobe)
    const majorLen = R * 1.15;
    const majorRad = R * 0.46;
    const minorLen = R * 0.36;
    const minorRad = R * 0.18;

    const majorGeo = buildTeardropLobeGeo(majorLen, majorRad);
    const minorGeo = buildTeardropLobeGeo(minorLen, minorRad);

    const majorMesh = new THREE.Mesh(majorGeo, matPos);
    const minorMesh = new THREE.Mesh(minorGeo, matNeg);

    // Direction in horizontal plane
    const dirAng = p.props.dir ?? 0;
    const dirVec = new THREE.Vector3(Math.cos(dirAng), 0, Math.sin(dirAng)).normalize();
    const oppVec = dirVec.clone().negate();

    majorMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec);
    minorMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), oppVec);

    cloudGroup.add(majorMesh);
    cloudGroup.add(minorMesh);

    // Electrons inside hybrid lobe
    if (eCount >= 1) {
      const e1 = createElectronMesh(c, eRadius, COLOR.electronGlow);
      const pos1 = dirVec.clone().multiplyScalar(majorLen * 0.58);
      e1.position.copy(pos1);
      electronsGroup.add(e1);
      electronMeshes.push({ mesh: e1, basePos: pos1, dir: dirVec, speed: 2.4, phase: 0 });
    }
    if (eCount >= 2) {
      const e2 = createElectronMesh(c, eRadius * 0.95, COLOR.spinDown);
      const pos2 = dirVec.clone().multiplyScalar(majorLen * 0.44);
      e2.position.copy(pos2);
      electronsGroup.add(e2);
      electronMeshes.push({ mesh: e2, basePos: pos2, dir: dirVec, speed: 2.4, phase: Math.PI });
    }
  }

  // 4. Live electron circulation & cloud quantum breathing
  let t = 0;
  g.userData.tick = (delta, still) => {
    if (still) return;
    t += delta;

    // Subtle cloud breathing
    const breath = 1 + Math.sin(t * 2.4) * 0.022;
    cloudGroup.scale.set(breath, breath, breath);

    // Animate electrons inside clouds
    for (const em of electronMeshes) {
      if (type === 's') {
        const rad = em.basePos.length();
        const ang = t * em.speed + em.phase;
        em.mesh.position.set(
          Math.cos(ang) * rad,
          Math.sin(ang * 1.5) * (rad * 0.28),
          Math.sin(ang) * rad
        );
      } else if (em.dir) {
        const wobble = Math.sin(t * em.speed + em.phase) * (R * 0.06);
        em.mesh.position.copy(em.basePos).addScaledVector(em.dir, wobble);
      }
    }
  };

  return g;
}

/* ------------------------------------------------------------------ 3D MIXER APPARATUS */

/**
 * Builds the physical 3D mixing apparatus for `mixbowl` fixtures.
 * Animates the orbitals physically mixing together in 3D space:
 * - A swirling vortex in the mixing bowl on the left.
 * - Energy stream conduit bridge across the center.
 * - Emergence and 3D blossoming of hybrid orbitals (e.g. four sp³ lobes for methane)
 *   with electrons inside each hybrid cloud.
 */
export function buildMixer3D(f, state, c) {
  const { THREE, mats: m, toPlate, ground, scale: s } = c;
  const root = new THREE.Group();

  const bowlZone = state.zones?.containers?.[f.props.zone] || {
    at: { x: f.at.x - 20, y: f.at.y + 4 },
    size: { w: 48, h: 26 }
  };

  const pBowl = toPlate(bowlZone.at);
  const r = rectOf(f, SIZES.fixture);
  const spot = f.props.out;
  const outAt = spot ? spot : { x: (bowlZone.at.x + bowlZone.size.w / 2 + r.x1) / 2 + 1, y: r.y0 + (r.y1 - r.y0) * 0.55 };
  const pOut = toPlate(outAt);

  // 1. Mixing Basin Hardware (Left)
  const basinW = bowlZone.size.w * s * 0.94;
  const basinD = bowlZone.size.h * s * 0.94;
  const rimH = 0.018;

  const rimMat = m?.ligBrassWorn || own(c, new THREE.MeshStandardMaterial({ color: COLOR.brass, roughness: 0.48, metalness: 0.78 }));
  const floorMat = m?.ligLining || own(c, new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.85 }));

  // Outer basin rim
  const basinGroup = new THREE.Group();
  basinGroup.position.set(pBowl.x, ground, pBowl.z);
  root.add(basinGroup);

  const basinFloor = new THREE.Mesh(new THREE.BoxGeometry(basinW * 0.92, 0.004, basinD * 0.92), floorMat);
  basinFloor.position.y = 0.002;
  basinFloor.receiveShadow = true;
  basinGroup.add(basinFloor);

  // Swirling vortex in mixing bowl
  const vortexGroup = new THREE.Group();
  vortexGroup.position.set(0, rimH + 0.012, 0);
  basinGroup.add(vortexGroup);

  // Glowing containment field rings
  const ringGeo = new THREE.TorusGeometry(basinD * 0.32, 0.0016, 12, 36);
  const ringMat = own(c, new THREE.MeshBasicMaterial({ color: COLOR.vortexRing, transparent: true, opacity: 0.55 }));
  const vortexRing1 = new THREE.Mesh(ringGeo, ringMat);
  vortexRing1.rotation.x = Math.PI / 2;
  vortexGroup.add(vortexRing1);

  const vortexRing2 = new THREE.Mesh(ringGeo, ringMat);
  vortexRing2.rotation.x = Math.PI / 2;
  vortexRing2.scale.set(0.68, 0.68, 0.68);
  vortexGroup.add(vortexRing2);

  // Ghost/energy replicas of input orbitals in the vortex
  const inputOrbsGroup = new THREE.Group();
  vortexGroup.add(inputOrbsGroup);

  // 2. Conduit Bridge between bowl and output hub
  const bridgeLen = Math.hypot(pOut.x - pBowl.x, pOut.z - pBowl.z);
  const bridgeAng = Math.atan2(pOut.z - pBowl.z, pOut.x - pBowl.x);
  const bridgeMidX = (pBowl.x + pOut.x) / 2;
  const bridgeMidZ = (pBowl.z + pOut.z) / 2;

  const conduitMat = m?.ligCopper || own(c, new THREE.MeshStandardMaterial({ color: COLOR.copper, roughness: 0.38, metalness: 0.88 }));
  const pipeGeo = new THREE.CylinderGeometry(0.0032, 0.0032, bridgeLen * 0.72, 14);

  const pipe1 = new THREE.Mesh(pipeGeo, conduitMat);
  pipe1.rotation.z = Math.PI / 2;
  pipe1.rotation.y = -bridgeAng;
  pipe1.position.set(bridgeMidX, ground + 0.008, bridgeMidZ + 0.014);
  root.add(pipe1);

  const pipe2 = new THREE.Mesh(pipeGeo, conduitMat);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.rotation.y = -bridgeAng;
  pipe2.position.set(bridgeMidX, ground + 0.008, bridgeMidZ - 0.014);
  root.add(pipe2);

  // 3. Output Reactor Plinth & Central Carbon Atom (Right)
  const reactorGroup = new THREE.Group();
  reactorGroup.position.set(pOut.x, ground, pOut.z);
  root.add(reactorGroup);

  // Stepped brass pedestal
  const plinthGeo = new THREE.CylinderGeometry(0.044, 0.052, 0.022, 28);
  const plinthMesh = new THREE.Mesh(plinthGeo, rimMat);
  plinthMesh.position.y = 0.011;
  plinthMesh.receiveShadow = true;
  reactorGroup.add(plinthMesh);

  // Central Hub Carbon Atom
  const hubRadius = 0.018;
  const hubY = 0.022 + hubRadius * 1.6;
  const hubMat = own(c, new THREE.MeshStandardMaterial({ color: COLOR.carbonHub, roughness: 0.32, metalness: 0.25 }));
  const hubMesh = new THREE.Mesh(new THREE.SphereGeometry(hubRadius, 24, 18), hubMat);
  hubMesh.position.y = hubY;
  reactorGroup.add(hubMesh);

  // Carbon symbol plaque on plinth
  if (c.label) {
    const hubLabel = c.label(f.props.hub || 'C', 0.024, 0.024, { dim: false, bg: '#16140f' });
    if (hubLabel) {
      hubLabel.position.set(0, 0.012, 0.048);
      reactorGroup.add(hubLabel);
    }
  }

  // 4. Hybrid Orbitals Container (Blooming in true 3D space above the carbon atom)
  const hybridGroup = new THREE.Group();
  hybridGroup.position.set(0, hubY, 0);
  reactorGroup.add(hybridGroup);

  // State trackers for animation
  let activeLobesCount = 0;
  let activeHybridType = null;
  let bloomProgress = 1.0;
  let mixTime = 0;
  const hybridLobeMeshes = [];

  /** Rebuild the 3D hybrid orbitals matching current blend state */
  function syncHybridLobes(read) {
    // Clear old lobes
    while (hybridGroup.children.length > 0) {
      const child = hybridGroup.children[0];
      hybridGroup.remove(child);
      child.traverse?.(o => o.geometry?.dispose?.());
    }
    hybridLobeMeshes.length = 0;

    // Clear and rebuild vortex input orbitals in mixing bowl
    while (inputOrbsGroup.children.length > 0) {
      const child = inputOrbsGroup.children[0];
      inputOrbsGroup.remove(child);
      child.traverse?.(o => o.geometry?.dispose?.());
    }

    if (!read.held.length) {
      activeLobesCount = 0;
      activeHybridType = null;
      vortexGroup.visible = false;
      return;
    }

    vortexGroup.visible = true;

    // Build mini input orbital representations in the vortex
    const held = read.held;
    held.forEach((orb, i) => {
      const orbGroup = new THREE.Group();
      const angle = (i / held.length) * Math.PI * 2;
      const rOrb = basinD * 0.28;
      orbGroup.position.set(Math.cos(angle) * rOrb, 0.008, Math.sin(angle) * rOrb);

      if (orb.props.type === 's') {
        const geo = new THREE.SphereGeometry(0.012, 14, 10);
        const mat = own(c, new THREE.MeshStandardMaterial({ color: COLOR.amberPhase, transparent: true, opacity: 0.65 }));
        orbGroup.add(new THREE.Mesh(geo, mat));
        orbGroup.add(createElectronMesh(c, 0.0035, COLOR.electronGlow));
      } else {
        const pLen = 0.018;
        const pRad = 0.007;
        const lobeGeo = buildTeardropLobeGeo(pLen, pRad, 12);
        const m1 = new THREE.Mesh(lobeGeo, own(c, new THREE.MeshStandardMaterial({ color: COLOR.amberPhase, transparent: true, opacity: 0.65 })));
        const m2 = new THREE.Mesh(lobeGeo, own(c, new THREE.MeshStandardMaterial({ color: COLOR.cyanPhase, transparent: true, opacity: 0.65 })));
        m2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0));
        orbGroup.add(m1);
        orbGroup.add(m2);
        orbGroup.add(createElectronMesh(c, 0.0032, COLOR.electronGlow));
      }
      inputOrbsGroup.add(orbGroup);
    });

    if (!read.blend.blends) {
      activeLobesCount = 0;
      activeHybridType = null;
      return;
    }

    activeLobesCount = read.lobes;
    activeHybridType = read.hybrid;
    bloomProgress = 0.0; // Trigger physical growth animation

    // Compute 3D direction vectors for the hybrid orbitals
    // sp3 = 4 tetrahedral vectors (109.5°):
    let vectors = [];
    if (read.lobes === 4) {
      // Regular tetrahedron
      vectors = [
        new THREE.Vector3(1, 1, 1).normalize(),
        new THREE.Vector3(1, -1, -1).normalize(),
        new THREE.Vector3(-1, 1, -1).normalize(),
        new THREE.Vector3(-1, -1, 1).normalize()
      ];
    } else if (read.lobes === 3) {
      // Trigonal planar at 120°
      vectors = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-0.5, 0, 0.866),
        new THREE.Vector3(-0.5, 0, -0.866)
      ];
    } else if (read.lobes === 2) {
      // Linear at 180°
      vectors = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0)
      ];
    } else {
      const plan = planDomains(Array.from({ length: read.lobes }, () => ({ kind: 'atom', sym: 'X', mult: 1 })));
      vectors = plan.vectors.map(v => new THREE.Vector3(...v.v).normalize());
    }

    // Build the 3D hybrid lobes with electrons inside
    const lobeLen = 0.052;
    const lobeRad = 0.021;
    const lobeGeo = buildTeardropLobeGeo(lobeLen, lobeRad);
    const backGeo = buildTeardropLobeGeo(lobeLen * 0.32, lobeRad * 0.42);

    const matLobePos = own(c, new THREE.MeshStandardMaterial({
      color: COLOR.amberPhase,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      side: THREE.DoubleSide
    }));

    const matLobeNeg = own(c, new THREE.MeshStandardMaterial({
      color: COLOR.cyanPhase,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide
    }));

    vectors.forEach((v, idx) => {
      const lobeRoot = new THREE.Group();

      const forwardMesh = new THREE.Mesh(lobeGeo, matLobePos);
      forwardMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      lobeRoot.add(forwardMesh);

      const backMesh = new THREE.Mesh(backGeo, matLobeNeg);
      backMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().negate());
      lobeRoot.add(backMesh);

      // Electron inside each hybrid cloud!
      const eMesh = createElectronMesh(c, 0.0052, COLOR.electronGlow);
      const ePos = v.clone().multiplyScalar(lobeLen * 0.62);
      eMesh.position.copy(ePos);
      lobeRoot.add(eMesh);

      hybridGroup.add(lobeRoot);
      hybridLobeMeshes.push({ group: lobeRoot, eMesh, baseEPos: ePos, dir: v, idx });
    });

    // If leftover p orbitals exist (e.g. sp2 has 1 leftover p orbital, sp has 2)
    if (read.leftoverP > 0) {
      const pLen = 0.046;
      const pRad = 0.018;
      const unhybPGeo = buildTeardropLobeGeo(pLen, pRad);
      for (let k = 0; k < Math.min(read.leftoverP, 2); k++) {
        const pAxis = k === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const pRoot = new THREE.Group();

        const p1 = new THREE.Mesh(unhybPGeo, matLobePos);
        p1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pAxis);
        pRoot.add(p1);

        const p2 = new THREE.Mesh(unhybPGeo, matLobeNeg);
        p2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pAxis.clone().negate());
        pRoot.add(p2);

        // Electron in leftover p orbital
        const pEMesh = createElectronMesh(c, 0.0048, COLOR.spinDown);
        pEMesh.position.copy(pAxis.clone().multiplyScalar(pLen * 0.58));
        pRoot.add(pEMesh);

        hybridGroup.add(pRoot);
        hybridLobeMeshes.push({ group: pRoot, eMesh: pEMesh, baseEPos: pEMesh.position.clone(), dir: pAxis, idx: 90 + k });
      }
    }
  }

  // Initial build from state
  syncHybridLobes(bowlRead(state, f.id));

  // 5. Update & Tick hooks
  root.userData.update = (fixture, newState) => {
    const read = bowlRead(newState, fixture.id);
    const key = `${read.held.map(o => o.id).sort().join(',')}:${read.lobes}:${read.hybrid}`;
    if (root.userData.lastKey !== key) {
      root.userData.lastKey = key;
      syncHybridLobes(read);
    }
  };

  root.userData.tick = (delta, still) => {
    if (still) {
      hybridGroup.scale.set(1, 1, 1);
      return;
    }

    mixTime += delta;

    // Swirl mixing vortex in the bowl
    vortexGroup.rotation.y += delta * 2.8;
    inputOrbsGroup.rotation.y -= delta * 1.2;

    // Physical growth / blooming transition of hybrid orbitals
    if (bloomProgress < 1.0) {
      bloomProgress = Math.min(1.0, bloomProgress + delta * 2.2);
      // Smooth organic blossoming ease-out
      const scale = Math.sin((bloomProgress * Math.PI) / 2);
      hybridGroup.scale.set(scale, scale, scale);
    } else {
      hybridGroup.scale.set(1, 1, 1);
    }

    // Continuous 3D rotation of hybrid orbitals around the vertical axis
    // so the student can inspect the spatial arrangement from all angles
    hybridGroup.rotation.y += delta * 0.65;

    // Animate electrons hovering inside each hybrid cloud
    for (const h of hybridLobeMeshes) {
      const wobble = Math.sin(mixTime * 2.6 + h.idx) * 0.0028;
      h.eMesh.position.copy(h.baseEPos).addScaledVector(h.dir, wobble);
    }
  };

  return root;
}
