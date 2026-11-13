/**
 * foebody.js — Spoil, built.
 *
 * The bodies a fight stands on the bench at T4 (docs/plans/storyline-and-combat.md,
 * Phase 5). They are procedural, from a small kit, the way `basalt.js` builds
 * rock: a basalt warden is jointed hexagonal columns, a recipe golem a riveted boiler,
 * the Compressor a cylinder block with a stroking rod, and the boss bodies likewise.
 *
 * THE RULES THIS FILE ANSWERS TO
 *   - NO MAGIC. A body never decides what it does. `setPose(pose, plan)` is told
 *     the pose by `Encounter`, which got it from `planFoe`, which asked the
 *     instrument's own planner. This file only knows how to MOVE into a pose.
 *   - THE IDLE BODY GIVES NOTHING AWAY. A body's shape comes from its id, so two foes
 *     that look alike on the bench look alike here.
 *   - DISPERSED, NEVER KILLED. A foe goes dark and comes apart. No gore, no remains.
 *   - SCOURED PLATE. Plate grey and bone white; amber only for a REAL EVENT.
 *     No eyes, no glow, no bloom.
 *   - REDUCED MOTION. `setPose(..., instant)` snaps, and the idle tremor is off.
 *
 * Every body is built in the frame of the station's well: origin on the well
 * floor, +y up, +z toward the player. It is told nothing about the world.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeRng, hashStr, canvas2d, enableAO, cachedMaterial } from '../../three/materials/pbr-kit.js';


/** The well, in metres. A body must fit inside it. */
export const WELL_R = 0.27;

/* ------------------------------------------------------------------
   SHARED GEOMETRY
   ------------------------------------------------------------------ */

let blobTex = null;
/** A soft contact shadow, drawn once: the foe sits ON the plate, not above it. */
function contactTexture() {
  if (blobTex) return blobTex;
  const c = canvas2d(64, 64);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

function contactShadow(radius, y = 0.0165) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: contactTexture(), transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = 1;
  return m;
}

/** An invisible, generous press target: a finger arrives at a glancing angle. */
function hitTarget(radius, height) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  m.position.y = height / 2;
  m.userData.foeHit = true;
  return m;
}

/* ------------------------------------------------------------------
   THE BASALT WARDEN
   Columnar jointed basalt prisms with horizontal cleavage planes.
   ------------------------------------------------------------------ */

function basaltMaterial() {
  return cachedMaterial('foe:basalt-warden', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x222326,
      roughness: 0.88,
      metalness: 0.12
    });
  });
}

function basaltJointMaterial() {
  return cachedMaterial('foe:basalt-joint', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.95,
      metalness: 0.05
    });
  });
}

export function buildBasaltWarden(foe) {
  const group = new THREE.Group();
  group.name = `warden:${foe.id}`;
  const rng = makeRng(hashStr(`warden:${foe.id}`));

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };

  const rig = new THREE.Group();
  group.add(rig);
  // The warden fights from the corner pad of a table (`table/layout.js` `FOE_PAD`) now that every bench is a tabletop, so it is a
  // squatter, narrower body than the one that stood in a well: every pose (columns splayed, swung round, spread in the dispersal)
  // stays inside the pad.
  group.scale.setScalar(0.58);

  const mat = basaltMaterial();
  const jointMat = basaltJointMaterial();

  const columns = [];
  const COLS = 7;
  for (let c = 0; c < COLS; c++) {
    const isCenter = c === 0;
    const angle = isCenter ? 0 : ((c - 1) * Math.PI) / 3 + (rng() - 0.5) * 0.15;
    const dist = isCenter ? 0 : 0.052 + (rng() - 0.5) * 0.01;
    const rHex = 0.026 + (rng() - 0.5) * 0.006;
    const colH = isCenter ? 0.16 : 0.11 + rng() * 0.04;
    const jointsCount = 2;
    const segH = colH / jointsCount;

    const colGroup = new THREE.Group();
    colGroup.position.set(Math.cos(angle) * dist, 0.01, Math.sin(angle) * dist);
    colGroup.rotation.y = rng() * Math.PI;

    const segments = [];
    for (let s = 0; s < jointsCount; s++) {
      const geo = own(new THREE.CylinderGeometry(rHex * 0.95, rHex, segH * 0.97, 6));
      enableAO(geo);
      const mesh = new THREE.Mesh(geo, s === 0 ? mat : jointMat);
      mesh.position.y = (s + 0.5) * segH;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      colGroup.add(mesh);
      segments.push(mesh);
    }

    rig.add(colGroup);
    columns.push({ colGroup, segments, angle, dist, segH });
  }

  const hit = hitTarget(0.18, 0.18);
  hit.position.y = 0.09;
  group.add(hit);

  const body = {
    species: 'basalt warden',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.18,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() {
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);

      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        group.position.y = body.baseY - f * 0.01;
        rig.scale.set(1 + f * 0.35, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.35);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      const l = body.lunge;
      group.position.z = body.baseZ + l * 0.08;
      group.rotation.y = body.look * 0.3;

      const tremor = !body.still && body.pose === 'idle' ? Math.sin(t * 2.2 + body.phase) * 0.003 : 0;
      const cleaved = body.pose === 'cleaved' ? 0.022 : 0;
      // The rig benches: columns spread to the arms the hub holds, the whole body
      // swings round in a field, and the upper blocks turn or will not.
      const splay = body.pose === 'splayed' ? 0.4 + 0.12 * Math.min(6, (body.plan && body.plan.arms) || 2) : 0;
      const swing = body.pose === 'turned' ? Math.min(1, body.since / 0.9) * (Math.PI / 2) : 0;
      const shiver = body.pose === 'still' && !body.still ? Math.sin(t * 38) * 0.0025 : 0;
      group.rotation.y = body.look * 0.3 + swing;
      group.position.x = body.baseX + shiver;

      const grip = body.pose === 'gripped' ? 0.45 * Math.min(1, (body.plan && body.plan.grip) || 0) : 0;
      columns.forEach((col, i) => {
        col.colGroup.position.y = 0.01 + tremor * ((i % 2 === 0) ? 1 : -1);
        const reach = col.dist * (1 + splay - grip);
        col.colGroup.position.x = Math.cos(col.angle) * reach;
        col.colGroup.position.z = Math.sin(col.angle) * reach;
        if (col.segments[1]) {
          col.segments[1].position.x = cleaved;
          col.segments[1].position.z = cleaved * 0.5;
          if (body.pose === 'free') col.segments[1].rotation.y = body.still ? 0.6 : t * 2.2;
          else if (body.pose === 'locked') {
            col.segments[1].rotation.y = 0;
            col.segments[1].position.x = body.still ? 0 : Math.sin(t * 45) * 0.002;
          } else col.segments[1].rotation.y = 0;
        }
      });
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE RECIPE GOLEM
   A riveted cylindrical reaction boiler with pressure gauges.
   ------------------------------------------------------------------ */

function boilerMaterial() {
  return cachedMaterial('foe:golem-boiler', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x33363a,
      roughness: 0.6,
      metalness: 0.8
    });
  });
}

function brassMaterial() {
  return cachedMaterial('foe:golem-brass', () => {
    return new THREE.MeshStandardMaterial({
      color: 0xba944c,
      roughness: 0.35,
      metalness: 0.9
    });
  });
}

export function buildRecipeGolem(foe) {
  const group = new THREE.Group();
  group.name = `golem:${foe.id}`;

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };

  const rig = new THREE.Group();
  group.add(rig);

  const bMat = boilerMaterial();
  const brassMat = brassMaterial();

  const bodyH = 0.09;
  const bodyR = 0.055;
  const boilerGeo = own(new THREE.CylinderGeometry(bodyR, bodyR * 1.05, bodyH, 16));
  enableAO(boilerGeo);
  const boilerMesh = new THREE.Mesh(boilerGeo, bMat);
  boilerMesh.position.y = bodyH * 0.5 + 0.02;
  boilerMesh.castShadow = true;
  rig.add(boilerMesh);

  const capGeo = own(new THREE.SphereGeometry(bodyR, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  enableAO(capGeo);
  const capMesh = new THREE.Mesh(capGeo, bMat);
  capMesh.position.y = bodyH + 0.02;
  rig.add(capMesh);

  const band1Geo = own(new THREE.TorusGeometry(bodyR + 0.002, 0.004, 6, 20));
  const band1 = new THREE.Mesh(band1Geo, brassMat);
  band1.rotation.x = Math.PI / 2;
  band1.position.y = 0.04;
  rig.add(band1);

  const band2Geo = own(new THREE.TorusGeometry(bodyR + 0.002, 0.004, 6, 20));
  const band2 = new THREE.Mesh(band2Geo, brassMat);
  band2.rotation.x = Math.PI / 2;
  band2.position.y = 0.08;
  rig.add(band2);

  const gaugeGeo = own(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12));
  const gaugeMesh = new THREE.Mesh(gaugeGeo, brassMat);
  gaugeMesh.rotation.x = Math.PI / 2;
  gaugeMesh.position.set(0, 0.07, bodyR + 0.005);
  rig.add(gaugeMesh);

  const needleGeo = own(new THREE.BoxGeometry(0.002, 0.016, 0.002));
  const needleMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const needleMesh = new THREE.Mesh(needleGeo, needleMat);
  needleMesh.position.set(0, 0.07, bodyR + 0.01);
  rig.add(needleMesh);

  const ventGeo = own(new THREE.CylinderGeometry(0.012, 0.015, 0.025, 10));
  const ventMesh = new THREE.Mesh(ventGeo, brassMat);
  ventMesh.position.set(0, bodyH + bodyR + 0.02, 0);
  rig.add(ventMesh);

  const hit = hitTarget(0.18, 0.18);
  hit.position.y = 0.09;
  group.add(hit);

  const body = {
    species: 'recipe golem',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.18,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() {
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);

      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.4);
        group.position.y = body.baseY - f * 0.01;
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.96), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      const l = body.lunge;
      group.position.z = body.baseZ + l * 0.05;
      group.rotation.y = body.look * 0.3;

      const pressurePulse = !body.still ? Math.sin(t * 3.5 + body.phase) * 0.004 : 0;
      rig.scale.set(1 + pressurePulse, 1 - pressurePulse * 0.5, 1 + pressurePulse);

      const needleAngle = body.pose === 'starved' ? -0.8 : body.pose === 'balanced' ? 0.3 : Math.sin(t * 4.0) * 0.25;
      needleMesh.rotation.z = needleAngle;
    },

    dispose() {
      for (const g of owned) g.dispose();
      needleMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE COMPRESSOR
   A cylinder block with a head, a piston rod and a flywheel. It is a boss, so
   it is built only at the scale the well allows: a stroke you can count.
   ------------------------------------------------------------------ */

export function buildCompressor(foe) {
  const group = new THREE.Group();
  group.name = `compressor:${foe.id}`;

  const shadow = contactShadow(0.15);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const iron = boilerMaterial();
  const brass = brassMaterial();

  const blockGeo = own(new RoundedBoxGeometry(0.11, 0.07, 0.06, 2, 0.006));
  enableAO(blockGeo);
  const block = new THREE.Mesh(blockGeo, iron);
  block.position.set(-0.02, 0.06, 0);
  block.castShadow = true;
  rig.add(block);
  const finGeo = own(new THREE.BoxGeometry(0.004, 0.02, 0.064));
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(finGeo, iron);
    fin.position.set(-0.06 + i * 0.014, 0.105, 0);
    rig.add(fin);
  }
  const headGeo = own(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 14));
  const head = new THREE.Mesh(headGeo, brass);
  head.position.set(-0.05, 0.12, 0);
  rig.add(head);
  const wheelGeo = own(new THREE.TorusGeometry(0.036, 0.007, 8, 24));
  const wheel = new THREE.Mesh(wheelGeo, iron);
  wheel.position.set(0.065, 0.06, 0.036);
  rig.add(wheel);
  const spokeGeo = own(new THREE.BoxGeometry(0.07, 0.004, 0.004));
  const spoke = new THREE.Mesh(spokeGeo, brass);
  wheel.add(spoke);
  const spoke2 = new THREE.Mesh(spokeGeo, brass);
  spoke2.rotation.z = Math.PI / 2;
  wheel.add(spoke2);
  const rodGeo = own(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8));
  const rod = new THREE.Mesh(rodGeo, brass);
  rod.rotation.z = Math.PI / 2;
  rig.add(rod);
  for (const lx of [-0.06, 0.03]) {
    const leg = new THREE.Mesh(own(new THREE.BoxGeometry(0.012, 0.03, 0.05)), iron);
    leg.position.set(lx, 0.015, 0);
    rig.add(leg);
  }
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xcfcfd2, transparent: true, opacity: 0.0, depthWrite: false });
  const plumeGeo = own(new THREE.ConeGeometry(0.014, 0.05, 10, 1, true));
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.set(0.0, 0.14, 0.03);
  rig.add(plume);

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the compressor',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.16,
    look: 0, spin: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      // The flywheel turns at the stroke the pose names: brisk, slow under load, stopped when dispersed.
      const rate = body.still ? 0 : body.pose === 'dispersed' ? 0 : body.pose === 'laboured' ? 1.1 : body.pose === 'easy' ? 5 : 3;
      body.spin += rate * dt;
      if (body.pose === 'dispersed' && body.since > 2.2) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write() {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      wheel.rotation.z = body.spin;
      // The rod follows the crank: it reaches into the head and back out.
      const reach = Math.cos(body.spin) * 0.012;
      rod.position.set(-0.01 + reach, 0.06, 0.0);
      plumeMat.opacity = body.pose === 'venting' ? 0.35 : 0;
      head.position.y = 0.12 + (body.pose === 'laboured' ? -0.002 : 0);
    },

    dispose() {
      for (const g of owned) g.dispose();
      plumeMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

export function buildHopper(foe) {
  const group = new THREE.Group();
  group.name = `hopper:${foe.id}`;
  const owned = [];
  const own = g => { owned.push(g); return g; };

  const chitin = boilerMaterial();
  const blade = brassMaterial();

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const rig = new THREE.Group();
  group.add(rig);

  const thoraxGeo = own(new THREE.ConeGeometry(0.04, 0.09, 6));
  thoraxGeo.rotateX(0.4);
  const thorax = new THREE.Mesh(thoraxGeo, chitin);
  thorax.position.set(0, 0.05, 0);
  rig.add(thorax);

  const headGeo = own(new THREE.SphereGeometry(0.02, 8, 8));
  headGeo.scale(1, 1.2, 1.4);
  const head = new THREE.Mesh(headGeo, chitin);
  head.position.set(0, 0.09, 0.03);
  rig.add(head);

  // Scythe blades
  const scythes = [];
  for (const sx of [-1, 1]) {
    const bladeGeo = own(new THREE.ConeGeometry(0.012, 0.11, 4));
    bladeGeo.rotateX(-0.8);
    const bladeMesh = new THREE.Mesh(bladeGeo, blade);
    bladeMesh.position.set(sx * 0.04, 0.07, 0.03);
    bladeMesh.rotation.z = -sx * 0.3;
    rig.add(bladeMesh);
    scythes.push(bladeMesh);
  }

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the hopper',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    reach: 0.16,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed' && body.since > 2.0) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      if (!body.still) {
        thorax.position.y = 0.05 + Math.sin(t * 3.5) * 0.004;
        for (let i = 0; i < scythes.length; i++) {
          const sx = i === 0 ? -1 : 1;
          scythes[i].rotation.z = -sx * (0.3 + Math.sin(t * 4.0) * 0.06);
        }
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

export function buildLanternEater(foe) {
  const group = new THREE.Group();
  group.name = `lantern-eater:${foe.id}`;
  const owned = [];
  const own = g => { owned.push(g); return g; };

  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.7, metalness: 0.2 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide });

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const rig = new THREE.Group();
  group.add(rig);

  const bodyMesh = new THREE.Mesh(own(new THREE.DodecahedronGeometry(0.04, 0)), shadowMat);
  bodyMesh.position.set(0, 0.06, 0);
  rig.add(bodyMesh);

  const wings = [];
  for (const sx of [-1, 1]) {
    const wingGeo = own(new THREE.PlaneGeometry(0.09, 0.06));
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(sx * 0.06, 0.07, 0);
    wing.rotation.y = sx * 0.4;
    rig.add(wing);
    wings.push({ mesh: wing, side: sx });
  }

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the lantern-eater',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    reach: 0.16,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed' && body.since > 2.0) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      if (!body.still) {
        bodyMesh.position.y = 0.06 + Math.sin(t * 2.8) * 0.005;
        const flap = Math.sin(t * 8.0) * 0.35;
        for (const w of wings) {
          w.mesh.rotation.y = w.side * (0.4 + flap);
        }
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
      shadowMat.dispose(); wingMat.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE CRUCIBLE
   A trunnion-mounted refractory furnace pot with a clamping lid and flue vent.
   ------------------------------------------------------------------ */

export function buildCrucible(foe) {
  const group = new THREE.Group();
  group.name = `crucible:${foe.id}`;

  const shadow = contactShadow(0.15);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const iron = boilerMaterial();
  const brass = brassMaterial();

  const potGeo = own(new THREE.CylinderGeometry(0.052, 0.038, 0.085, 14));
  enableAO(potGeo);
  const pot = new THREE.Mesh(potGeo, iron);
  pot.position.set(0, 0.062, 0);
  pot.castShadow = true;
  rig.add(pot);

  const ringGeo = own(new THREE.TorusGeometry(0.054, 0.005, 8, 20));
  const ring = new THREE.Mesh(ringGeo, brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.072, 0);
  rig.add(ring);

  const trunnionGeo = own(new THREE.BoxGeometry(0.13, 0.012, 0.012));
  const trunnion = new THREE.Mesh(trunnionGeo, iron);
  trunnion.position.set(0, 0.072, 0);
  rig.add(trunnion);

  const lidGeo = own(new THREE.CylinderGeometry(0.048, 0.052, 0.014, 14));
  enableAO(lidGeo);
  const lid = new THREE.Mesh(lidGeo, brass);
  lid.position.set(0, 0.11, 0);
  rig.add(lid);

  for (const lx of [-0.038, 0.038]) {
    const leg = new THREE.Mesh(own(new THREE.BoxGeometry(0.012, 0.024, 0.045)), iron);
    leg.position.set(lx, 0.012, 0);
    rig.add(leg);
  }

  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xcfcfd2, transparent: true, opacity: 0.0, depthWrite: false });
  const plumeGeo = own(new THREE.ConeGeometry(0.014, 0.04, 10, 1, true));
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.set(0, 0.135, 0);
  rig.add(plume);

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the crucible',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.16,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      } else {
        rig.scale.set(1, 1, 1);
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      const tremor = !body.still && body.pose === 'heated' ? Math.sin(t * 14 + body.phase) * 0.0025 : 0;
      pot.position.x = tremor;
      lid.position.y = 0.11 + (body.pose === 'vented' ? 0.008 : 0);
      lid.rotation.z = body.pose === 'cracked' ? 0.08 : 0;
      plumeMat.opacity = body.pose === 'vented' ? 0.35 : 0;
    },

    dispose() {
      for (const g of owned) g.dispose();
      plumeMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE UNDERTOW
   A low brine crawler: a salt-crusted iron hull on six legs, an intake maw at the front and a siphon head on a short neck.
   ------------------------------------------------------------------ */

export function buildUndertow(foe) {
  const group = new THREE.Group();
  group.name = `undertow:${foe.id}`;

  const shadow = contactShadow(0.17);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const iron = boilerMaterial();
  const brass = brassMaterial();

  const hullGeo = own(new RoundedBoxGeometry(0.15, 0.05, 0.09, 2, 0.008));
  enableAO(hullGeo);
  const hull = new THREE.Mesh(hullGeo, iron);
  hull.position.set(0, 0.06, 0);
  hull.castShadow = true;
  rig.add(hull);

  const legs = [];
  const legGeo = own(new THREE.BoxGeometry(0.01, 0.045, 0.01));
  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(legGeo, iron);
    leg.position.set(-0.055 + (i % 3) * 0.055, 0.022, i < 3 ? -0.05 : 0.05);
    rig.add(leg);
    legs.push(leg);
  }

  const mawGeo = own(new THREE.CylinderGeometry(0.022, 0.03, 0.03, 12));
  const maw = new THREE.Mesh(mawGeo, brass);
  maw.rotation.z = Math.PI / 2;
  maw.position.set(0.09, 0.055, 0);
  rig.add(maw);

  const neckGeo = own(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 8));
  const neck = new THREE.Mesh(neckGeo, iron);
  neck.position.set(-0.04, 0.115, 0);
  rig.add(neck);
  const headGeo = own(new THREE.SphereGeometry(0.014, 10, 8));
  const head = new THREE.Mesh(headGeo, brass);
  head.position.set(-0.04, 0.145, 0);
  rig.add(head);

  const hit = hitTarget(0.17, 0.12);
  hit.position.y = 0.06;
  group.add(hit);

  const body = {
    species: 'the undertow',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.17,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      } else {
        rig.scale.set(1, 1, 1);
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      const slack = body.pose === 'slackened' ? -0.012 : 0;
      hull.position.y = 0.06 + slack;
      legs.forEach((leg, i) => { leg.position.y = 0.022 + (body.still ? 0 : Math.sin(t * 2 + body.phase + i) * 0.002); });
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE TIPPER
   A beam pump: a trestle, a beam on a pivot and a shallow pan hung from each end. It sits level, rocks a little when idle and tips to the
   side the planner says (`foes.js` `the tipper`: `plan.lean`, -1 to 1).
   ------------------------------------------------------------------ */

export function buildTipper(foe) {
  const group = new THREE.Group();
  group.name = `tipper:${foe.id}`;

  const shadow = contactShadow(0.16);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const iron = boilerMaterial();
  const brass = brassMaterial();

  // The trestle: two legs under a cross-piece, on a foot.
  const footGeo = own(new THREE.BoxGeometry(0.1, 0.012, 0.05));
  const foot = new THREE.Mesh(footGeo, iron);
  foot.position.set(0, 0.006, 0);
  rig.add(foot);
  const legGeo = own(new THREE.BoxGeometry(0.009, 0.1, 0.009));
  for (const lz of [-0.016, 0.016]) {
    const leg = new THREE.Mesh(legGeo, iron);
    leg.position.set(0, 0.062, lz);
    rig.add(leg);
  }
  const PIVOT_Y = 0.105;

  // The beam, on a pivot pin; the pans hang from its ends and are held level by their own hangers.
  const beam = new THREE.Group();
  beam.position.set(0, PIVOT_Y, 0);
  rig.add(beam);
  const beamGeo = own(new THREE.BoxGeometry(0.2, 0.008, 0.012));
  enableAO(beamGeo);
  const beamMesh = new THREE.Mesh(beamGeo, iron);
  beamMesh.castShadow = true;
  beam.add(beamMesh);
  const pinGeo = own(new THREE.CylinderGeometry(0.008, 0.008, 0.044, 10));
  const pin = new THREE.Mesh(pinGeo, brass);
  pin.rotation.x = Math.PI / 2;
  beam.add(pin);

  const hangers = [];
  const panGeo = own(new THREE.CylinderGeometry(0.03, 0.026, 0.008, 14));
  const chainGeo = own(new THREE.BoxGeometry(0.002, 0.03, 0.002));
  for (const ex of [-0.09, 0.09]) {
    const hanger = new THREE.Group();
    hanger.position.set(ex, 0, 0);
    beam.add(hanger);
    for (const cz of [-0.01, 0.01]) {
      const chain = new THREE.Mesh(chainGeo, brass);
      chain.position.set(0, -0.016, cz);
      hanger.add(chain);
    }
    const dish = new THREE.Mesh(panGeo, iron);
    dish.position.set(0, -0.034, 0);
    hanger.add(dish);
    hangers.push(hanger);
  }

  const hit = hitTarget(0.14, 0.14);
  hit.position.y = 0.07;
  group.add(hit);

  const body = {
    species: 'the tipper',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.14,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      } else {
        rig.scale.set(1, 1, 1);
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      // Level at rest (with a slow rock when idle), tipped by the planner's lean; a tipped beam without a lean tips to the right.
      const lean = body.pose === 'tipped' ? (typeof body.plan?.lean === 'number' && body.plan.lean !== 0 ? Math.max(-1, Math.min(1, body.plan.lean)) : 1) : 0;
      const rock = !body.still && (body.pose === 'idle' || body.pose === 'unmoved') ? Math.sin(t * 0.9 + body.phase) * 0.035 : 0;
      const tilt = -lean * 0.34 + rock;
      beam.rotation.z = tilt;
      for (const h of hangers) h.rotation.z = -tilt;
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE LEACH
   A sump pump: a squat casing on a sled, five small intake vats ringed behind it and two hoses. It sways when idle; the vats stand
   high and the hoses lift on `acid`, sit level on `neutral`, and sag with the vats low on `base` (`foes.js` `the leach`).
   ------------------------------------------------------------------ */

export function buildLeach(foe) {
  const group = new THREE.Group();
  group.name = `leach:${foe.id}`;
  group.scale.setScalar(0.6);
  const shadow = contactShadow(0.16);
  group.add(shadow);
  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);
  const iron = boilerMaterial();
  const brass = brassMaterial();

  const sledGeo = own(new THREE.BoxGeometry(0.15, 0.012, 0.09));
  const sled = new THREE.Mesh(sledGeo, iron); sled.position.set(0, 0.006, 0); rig.add(sled);
  const casingGeo = own(new THREE.SphereGeometry(0.036, 14, 10));
  const casing = new THREE.Mesh(casingGeo, iron); casing.scale.set(1, 0.85, 1); casing.position.set(0, 0.05, 0.01); rig.add(casing);
  const colGeo = own(new THREE.CylinderGeometry(0.016, 0.018, 0.04, 12));
  const col = new THREE.Mesh(colGeo, brass); col.position.set(0, 0.095, 0.01); rig.add(col);

  const vatGeo = own(new THREE.CylinderGeometry(0.012, 0.013, 0.03, 10));
  const levelGeo = own(new THREE.CylinderGeometry(0.0105, 0.0105, 0.004, 10));
  const levels = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.15 + i * 0.175);
    const vat = new THREE.Mesh(vatGeo, iron);
    vat.position.set(Math.cos(a) * 0.058, 0.027, -0.02 - Math.sin(a) * 0.022);
    rig.add(vat);
    const lv = new THREE.Mesh(levelGeo, brass);
    lv.position.set(vat.position.x, 0.04, vat.position.z);
    rig.add(lv); levels.push(lv);
  }
  const hoseGeo = own(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8));
  const hoses = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.03, 0.075, 0.03); rig.add(piv);
    const h = new THREE.Mesh(hoseGeo, iron); h.position.set(0, -0.035, 0); piv.add(h);
    return { piv, sx };
  });

  const hit = hitTarget(0.14, 0.14);
  hit.position.y = 0.07;
  group.add(hit);

  const body = {
    species: 'the leach',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.14, look: 0, baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose; body.since = 0; body.gone = false; group.visible = true;
      if (instant) body.snap();
    },
    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },
    update(dt, reduced, bearing = 0) {
      body.t += dt; body.since += dt; body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      } else rig.scale.set(1, 1, 1);
      body.write(reduced ? 0 : body.t);
    },
    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      const idle = !body.still && (body.pose === 'idle' || body.pose === 'unmoved');
      const lift = body.pose === 'acid' ? 1 : body.pose === 'base' ? -1 : 0;
      hoses.forEach((h, i) => { h.piv.rotation.z = h.sx * (0.35 + 0.35 * lift) + (idle ? Math.sin(t * 0.8 + i) * 0.05 : 0); });
      levels.forEach((l, i) => { l.position.y = 0.04 + lift * 0.008 + (idle ? Math.sin(t * 2 + i) * 0.0015 : 0); });
      casing.position.x = idle ? Math.sin(t * 34) * 0.0004 : 0;
    },
    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE CLAMP
   A drain clamp: a lattice mast on a sled, five small cells ringed behind it and two arms ending in jaws. It hums when idle; the arms and
   the cells stand high on `live`, the jaws hang open and the arms level on `flat`, and the arms drop with the cells low on `reversed`
   (`foes.js` `the clamp`).
   ------------------------------------------------------------------ */

export function buildClamp(foe) {
  const group = new THREE.Group();
  group.name = `clamp:${foe.id}`;
  group.scale.setScalar(0.6);
  const shadow = contactShadow(0.16);
  group.add(shadow);
  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);
  const iron = boilerMaterial();
  const brass = brassMaterial();

  const sledGeo = own(new THREE.BoxGeometry(0.15, 0.012, 0.09));
  const sled = new THREE.Mesh(sledGeo, iron); sled.position.set(0, 0.006, 0); rig.add(sled);
  const legGeo = own(new THREE.CylinderGeometry(0.003, 0.004, 0.11, 6));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, iron); leg.position.set(sx * 0.014, 0.06, sz * 0.01); leg.rotation.z = -sx * 0.06; rig.add(leg);
  }
  const headGeo = own(new THREE.BoxGeometry(0.045, 0.022, 0.03));
  const head = new THREE.Mesh(headGeo, brass); head.position.set(0, 0.125, 0); rig.add(head);

  const cellGeo = own(new THREE.CylinderGeometry(0.012, 0.013, 0.03, 10));
  const levelGeo = own(new THREE.CylinderGeometry(0.0105, 0.0105, 0.004, 10));
  const levels = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.15 + i * 0.175);
    const cell = new THREE.Mesh(cellGeo, iron);
    cell.position.set(Math.cos(a) * 0.058, 0.027, -0.02 - Math.sin(a) * 0.022);
    rig.add(cell);
    const lv = new THREE.Mesh(levelGeo, brass);
    lv.position.set(cell.position.x, 0.04, cell.position.z);
    rig.add(lv); levels.push(lv);
  }
  const armGeo = own(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8));
  const jawGeo = own(new THREE.BoxGeometry(0.004, 0.018, 0.01));
  const arms = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.024, 0.115, 0.012); rig.add(piv);
    const a = new THREE.Mesh(armGeo, iron); a.position.set(0, -0.035, 0); piv.add(a);
    const jaws = [-1, 1].map(js => {
      const j = new THREE.Mesh(jawGeo, brass); j.position.set(js * 0.005, -0.075, 0); piv.add(j);
      return { j, js };
    });
    return { piv, sx, jaws };
  });

  const hit = hitTarget(0.14, 0.14);
  hit.position.y = 0.07;
  group.add(hit);

  const body = {
    species: 'the clamp',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.14, look: 0, baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose; body.since = 0; body.gone = false; group.visible = true;
      if (instant) body.snap();
    },
    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },
    update(dt, reduced, bearing = 0) {
      body.t += dt; body.since += dt; body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      } else rig.scale.set(1, 1, 1);
      body.write(reduced ? 0 : body.t);
    },
    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      const idle = !body.still && (body.pose === 'idle' || body.pose === 'unmoved');
      const lift = body.pose === 'live' ? 1 : body.pose === 'reversed' ? -1 : 0;
      const open = body.pose === 'flat' ? 0.5 : 0.18;
      arms.forEach((a, i) => {
        a.piv.rotation.z = a.sx * (0.35 + 0.35 * lift) + (idle ? Math.sin(t * 0.8 + i) * 0.05 : 0);
        a.jaws.forEach(({ j, js }) => { j.position.x = js * (0.004 + open * 0.008) + (idle ? Math.sin(t * 1.3 + i) * 0.0012 : 0); });
      });
      levels.forEach((l, i) => { l.position.y = 0.04 + lift * 0.008 + (idle ? Math.sin(t * 2 + i) * 0.0015 : 0); });
      head.position.x = idle ? Math.sin(t * 34) * 0.0004 : 0;
      rig.rotation.z = body.pose === 'reversed' ? -0.06 : 0;
    },
    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

export function buildFlare(foe) {
  const group = new THREE.Group();
  group.name = `flare:${foe.id}`;
  const dark = new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.72, metalness: 0.55 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x9b5a2e, roughness: 0.48, metalness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xff9b38, emissive: 0xff6a1a, emissiveIntensity: 1.5, roughness: 0.3 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.025, 10), dark);
  base.position.y = 0.0125;
  group.add(base);

  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 0.11, 10), dark);
  stack.position.y = 0.075;
  group.add(stack);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.004, 6, 18), copper);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.042, 8), glow);
  flame.position.y = 0.145;
  group.add(flame);

  const hit = hitTarget(0.14, 0.14);
  hit.position.y = 0.07;
  group.add(hit);

  const body = {
    species: 'the flare',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.14, look: 0, baseX: 0, baseY: 0, baseZ: 0,
    setPose(pose, plan = null, instant = false) {
      this.plan = plan;
      if (pose === this.pose) return;
      this.pose = pose;
      this.since = 0;
      this.gone = false;
      group.visible = true;
      if (instant) this.snap();
    },
    hitPlayer() { this.lunge = 1; },
    snap() {
      group.visible = !this.gone;
      group.scale.set(1, 1, 1);
      this.write(0);
    },
    update(dt, reduced, bearing = 0) {
      this.t += dt;
      this.since += dt;
      this.still = reduced;
      this.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - this.look) * (1 - Math.exp(-3 * dt));
      this.lunge = Math.max(0, this.lunge - dt * 2.5);
      if (this.pose === 'dispersed') {
        const f = Math.min(1, this.since / 2.2);
        group.position.y = this.baseY - f * 0.01;
        group.scale.set(1 + f * 0.35, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.35);
        if (f >= 0.99) { this.gone = true; group.visible = false; }
      }
      this.write(reduced ? 0 : this.t);
    },
    write(t) {
      group.position.z = this.baseZ + this.lunge * 0.05;
      group.rotation.y = this.look * 0.3;
      ring.rotation.z = t * 0.8;
      const p = this.pose === 'live' ? 1.25 : this.pose === 'flat' ? 0.6 : 1.0;
      const pulse = p + (!this.still ? 0.12 * Math.sin(t * 4.5 + this.phase) : 0);
      flame.scale.set(pulse, pulse, pulse);
    },
    dispose() {
      for (const m of [base, stack, ring, flame, hit]) {
        m.geometry?.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mat => mat.dispose());
      }
    }
  };
  body.snap();
  return body;
}

/** The species this kit builds a body for. */
export const BODY_SPECIES = ['basalt warden', 'recipe golem', 'the compressor', 'the hopper', 'the lantern-eater', 'the crucible', 'the undertow', 'the tipper', 'the leach', 'the clamp', 'the flare'];

/**
 * Species that fight on the PLATE only at T4, and why.
 */
export const PLATE_ONLY = {};

/** The body for a species, or null for one that has none. */
export function buildFoeBody(species, foe) {
  if (species === 'basalt warden') return buildBasaltWarden(foe);
  if (species === 'recipe golem') return buildRecipeGolem(foe);
  if (species === 'the compressor') return buildCompressor(foe);
  if (species === 'the hopper') return buildHopper(foe);
  if (species === 'the lantern-eater') return buildLanternEater(foe);
  if (species === 'the crucible') return buildCrucible(foe);
  if (species === 'the undertow') return buildUndertow(foe);
  if (species === 'the tipper') return buildTipper(foe);
  if (species === 'the leach') return buildLeach(foe);
  if (species === 'the clamp') return buildClamp(foe);
  if (species === 'the flare') return buildFlare(foe);
  return null;
}

