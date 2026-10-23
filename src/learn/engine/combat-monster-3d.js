/**
 * combat-monster-3d.js — 3D Combat Monsters for Learn quest encounters.
 *
 * Stands an actual 3D monster in front of the player in the 3D world,
 * facing them across the arena with menacing presence, idle breathing,
 * weapon stagger reactions, violent lunge counters, and explosive dispersal.
 */

import * as THREE from 'three';
import { buildBossRig, BOSS_SPECIES } from './boss-models.js';

const AMBER = 0xe59b24;
const PHOSPHOR = 0x6f8f3f;
const MAGMA = 0xff4818;
const CYAN = 0x38bdf8;
const CHAR = new THREE.Color(0x1a1613);

function makeRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class CombatMonster3D {
  /**
   * @param {string} species
   * @param {object} foe
   * @param {object} [opts]
   */
  constructor(species, foe, opts = {}) {
    this.species = species || 'salt husk';
    this.foe = foe || { id: 'foe' };
    this.opts = opts;
    this.isBoss = BOSS_SPECIES.includes(this.species);

    this.group = new THREE.Group();
    this.group.name = `monster:${this.foe.id}`;

    this.disposables = [];
    this.materials = [];
    this.animatedParts = [];
    this.particles = null;

    this.pose = 'idle';
    this.alive = true;
    this.elapsed = 0;
    this.lungeT = 0;
    this.staggerT = 0;
    this.damageFlash = 0;
    this.disperseT = 0;
    this.damage = 0;
    this.damageTarget = 0;
    this.advance = 0;
    this.seed = 1.7;
    this.lights = [];
    this.heightOffset = 0;
    this.onEvent = null;     // the arena listens: 'landed', 'strike', 'slam', 'roar', 'shattered', 'plate'
    this.rig = null;         // a boss's articulated body (`boss-models.js`)
    this.muzzle = null;      // where a bolt leaves from, when the body has a maw, a spout or a fist
    this.armourPlates = [];  // plates that are struck off as it is hurt
    this.flying = [];        // plates in the air

    // Base position in front of player
    this.baseX = opts.x ?? 0;
    this.baseY = opts.y ?? 1.15;
    this.baseZ = opts.z ?? -2.2;
    this.scale = opts.scale || (this.isBoss ? 1.45 : 1.1);

    this.group.position.set(this.baseX, this.baseY, this.baseZ);
    this.group.scale.setScalar(this.scale);

    this.buildMesh();
    this.finalize();
    this.buildHitTarget();
  }

  own(obj) {
    if (obj) this.disposables.push(obj);
    return obj;
  }

  mat(material) {
    if (material) {
      this.materials.push(material);
      this.disposables.push(material);
    }
    return material;
  }

  buildHitTarget() {
    const geo = this.own(new THREE.BoxGeometry(1.6, 2.2, 1.2));
    const mat = this.mat(new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
    this.hitBox = new THREE.Mesh(geo, mat);
    this.hitBox.position.y = 1.0;
    this.hitBox.userData.combatMonster = this;
    this.group.add(this.hitBox);
  }

  /**
   * Mark a mesh as armour: it is struck off the body once the wound level reaches `at` (0..1), and falls. A fight resumed
   * mid-way (`setDamage(level, true)`) finds the plates already gone.
   */
  armour(mesh, at) {
    this.armourPlates.push({ mesh, at, off: false });
    return mesh;
  }

  popPlate(p, quiet = false) {
    if (p.off) return;
    p.off = true;
    const scene = this.group.parent;
    if (quiet || !scene || !p.mesh.parent) { p.mesh.visible = false; return; }
    this.group.updateMatrixWorld(true);
    scene.attach(p.mesh);
    const at = p.mesh.getWorldPosition(new THREE.Vector3());
    const out = at.clone().sub(this.getCenterWorld(new THREE.Vector3()));
    out.y = Math.max(out.y, 0.4);
    out.normalize();
    const sp = 3 + Math.random() * 3;
    this.flying.push({
      mesh: p.mesh,
      vel: out.multiplyScalar(sp).add(new THREE.Vector3((Math.random() - 0.5) * 2, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 2)),
      spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9),
      scale0: p.mesh.scale.clone(), life: 0, bounces: 0
    });
    this.onEvent?.('plate', at);
  }

  stepFlying(dt) {
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i];
      const m = f.mesh;
      f.life += dt;
      f.vel.y -= 15 * dt;
      m.position.addScaledVector(f.vel, dt);
      m.rotation.x += f.spin.x * dt;
      m.rotation.y += f.spin.y * dt;
      m.rotation.z += f.spin.z * dt;
      const floor = this.groundAt(m.position.x, m.position.z) + 0.2;
      if (m.position.y < floor) {
        m.position.y = floor;
        if (f.vel.y < 0 && f.bounces < 2) {
          f.vel.y *= -0.35;
          f.vel.x *= 0.6; f.vel.z *= 0.6;
          f.spin.multiplyScalar(0.5);
          f.bounces++;
        } else { f.vel.set(0, 0, 0); f.spin.set(0, 0, 0); }
      }
      if (f.life > 1.6) {
        const k = 1 - (f.life - 1.6) / 0.7;
        if (k <= 0) { m.parent?.remove(m); m.visible = false; this.flying.splice(i, 1); continue; }
        m.scale.copy(f.scale0).multiplyScalar(k);
      }
    }
  }

  buildMesh() {
    // The six bosses are articulated bodies of their own (`boss-models.js`).
    if (BOSS_SPECIES.includes(this.species)) {
      this.rig = buildBossRig(this.species, this);
      if (this.rig) return;
    }
    switch (this.species) {
      case 'salt husk':
        this.buildSaltHusk();
        break;
      case 'lamp moth':
        this.buildLampMoth();
        break;
      case 'slag crawler':
        this.buildSlagCrawler();
        break;
      case 'gas bladder':
        this.buildGasBladder();
        break;
      case 'recipe golem':
        this.buildRecipeGolem();
        break;
      default:
        this.buildDefaultAutomaton();
        break;
    }
  }

  /* -------------------------------------------------------------
     1. SALT HUSK — Jagged crystalline golem with glowing amber core
     ------------------------------------------------------------- */
  buildSaltHusk() {
    const crystalMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0xdfd8ca,
      roughness: 0.28,
      metalness: 0.12,
      flatShading: true
    }));
    const darkCrystalMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x9e9587,
      roughness: 0.45,
      metalness: 0.15,
      flatShading: true
    }));
    const coreMat = this.mat(new THREE.MeshBasicMaterial({
      color: AMBER,
      wireframe: false
    }));

    // Torso — multifaceted halite crystal cluster
    const torso = new THREE.Group();
    torso.position.y = 0.9;
    this.group.add(torso);
    this.animatedParts.push({ obj: torso, type: 'breathe', amp: 0.05, speed: 2.2 });

    const mainBody = new THREE.Mesh(
      this.own(new THREE.DodecahedronGeometry(0.55, 1)),
      crystalMat
    );
    mainBody.scale.set(1.0, 1.35, 0.85);
    torso.add(mainBody);

    // Glowing Geode Heart
    const heart = new THREE.Mesh(
      this.own(new THREE.OctahedronGeometry(0.24, 0)),
      coreMat
    );
    heart.position.set(0, 0.1, 0.22);
    torso.add(heart);
    this.coreMesh = heart;

    // Glowing core light
    const light = this.own(new THREE.PointLight(AMBER, 1.8, 3.5));
    light.position.set(0, 0.1, 0.3);
    torso.add(light);
    this.coreLight = light;

    // Head — jagged crystal crown
    const head = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.3, 0.55, 5)),
      darkCrystalMat
    );
    head.position.set(0, 0.85, 0.05);
    head.rotation.x = -0.2;
    torso.add(head);

    // Eye slits
    const eye = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.22, 0.04, 0.08)),
      coreMat
    );
    eye.position.set(0, 0.82, 0.18);
    torso.add(eye);

    // Arms & Heavy Crystal Fists
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.72, 0.7, 0);
      torso.add(arm);

      const bicep = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.26, 0.52, 0.26)),
        crystalMat
      );
      bicep.position.y = -0.25;
      bicep.rotation.z = side * 0.25;
      arm.add(bicep);

      const fist = new THREE.Mesh(
        this.own(new THREE.DodecahedronGeometry(0.32, 0)),
        darkCrystalMat
      );
      fist.position.set(side * 0.12, -0.65, 0.18);
      arm.add(fist);

      this.animatedParts.push({ obj: arm, type: 'sway', side, speed: 2.2, amp: 0.12 });
    }

    // Legs / Crystal Base
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.18, 0.32, 0.75, 5)),
        darkCrystalMat
      );
      leg.position.set(side * 0.38, 0.35, -0.05);
      this.group.add(leg);
    }

    // Orbiting crystal motes
    this.orbitShards = [];
    for (let i = 0; i < 6; i++) {
      const shard = new THREE.Mesh(
        this.own(new THREE.TetrahedronGeometry(0.08 + (i % 3) * 0.03)),
        crystalMat
      );
      this.group.add(shard);
      this.orbitShards.push({ mesh: shard, angle: (i / 6) * Math.PI * 2, radius: 0.85 + (i % 2) * 0.25, y: 0.7 + i * 0.18 });
    }
  }

  /* -------------------------------------------------------------
     3. LAMP MOTH — Radiant Biomechanical Phosphor Moth
     ------------------------------------------------------------- */
  buildLampMoth() {
    const bronzeMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x5a4f3b,
      roughness: 0.4,
      metalness: 0.75
    }));
    const wingMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0xbed68a,
      emissive: 0x3d5a22,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      side: THREE.DoubleSide
    }));
    const phosphorMat = this.mat(new THREE.MeshBasicMaterial({ color: PHOSPHOR }));

    const body = new THREE.Group();
    body.position.y = 1.25;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'hover', amp: 0.08, speed: 2.6 });

    // Segmented bronze carapace
    const thorax = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.35, 12, 10)),
      bronzeMat
    );
    thorax.scale.set(0.85, 1.2, 0.85);
    body.add(thorax);

    const abdomen = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.28, 0.95, 8)),
      bronzeMat
    );
    abdomen.position.set(0, -0.65, -0.15);
    abdomen.rotation.x = -0.3;
    body.add(abdomen);

    // Glowing Phosphor Core
    const core = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.22, 10, 10)),
      phosphorMat
    );
    core.position.set(0, 0, 0.18);
    body.add(core);

    const light = this.own(new THREE.PointLight(PHOSPHOR, 2.2, 4.0));
    light.position.set(0, 0, 0.28);
    body.add(light);
    this.coreLight = light;

    // Glowing Feathered Antennae
    for (const side of [-1, 1]) {
      const ant = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.015, 0.005, 0.75, 4)),
        phosphorMat
      );
      ant.position.set(side * 0.18, 0.45, 0.15);
      ant.rotation.set(0.4, 0, side * 0.6);
      body.add(ant);
    }

    // 4 Large Beating Wings
    this.wings = [];
    for (const side of [-1, 1]) {
      // Forewing
      const fore = new THREE.Group();
      fore.position.set(side * 0.22, 0.2, 0);
      body.add(fore);

      const foreMesh = new THREE.Mesh(
        this.own(new THREE.CircleGeometry(0.85, 5, 0, Math.PI * 0.75)),
        wingMat
      );
      foreMesh.position.set(side * 0.6, 0.35, 0);
      foreMesh.rotation.set(0.2, 0, side * 0.3);
      fore.add(foreMesh);

      // Hindwing
      const hind = new THREE.Group();
      hind.position.set(side * 0.18, -0.1, -0.05);
      body.add(hind);

      const hindMesh = new THREE.Mesh(
        this.own(new THREE.CircleGeometry(0.55, 5, 0, Math.PI * 0.65)),
        wingMat
      );
      hindMesh.position.set(side * 0.45, -0.15, 0);
      hindMesh.rotation.set(-0.2, 0, side * 0.5);
      hind.add(hindMesh);

      this.wings.push({ fore, hind, side });
    }
  }

  /* -------------------------------------------------------------
     6. SLAG CRAWLER — Six-Legged Molten Slag Arachnid Construct
     ------------------------------------------------------------- */
  buildSlagCrawler() {
    const metalMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x3d3835,
      roughness: 0.5,
      metalness: 0.75,
      flatShading: true
    }));
    const moltenMat = this.mat(new THREE.MeshBasicMaterial({ color: MAGMA }));

    const body = new THREE.Group();
    body.position.y = 0.65;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.04, speed: 2.8 });

    // Heavy Armored Thorax
    const thorax = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.85, 0.45, 1.1)),
      metalMat
    );
    body.add(thorax);

    // Glowing Molten Slag Core
    const core = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.25, 8, 8)),
      moltenMat
    );
    core.position.set(0, 0.1, 0.35);
    body.add(core);

    // Clacking Pincer Mandibles
    for (const side of [-1, 1]) {
      const pincer = new THREE.Mesh(
        this.own(new THREE.ConeGeometry(0.12, 0.75, 4)),
        metalMat
      );
      pincer.position.set(side * 0.28, 0, 0.85);
      pincer.rotation.set(Math.PI / 2, 0, -side * 0.4);
      body.add(pincer);
    }

    // 6 Articulated Spiked Hydraulic Legs
    for (let i = 0; i < 3; i++) {
      const zOffset = 0.4 - i * 0.4;
      for (const side of [-1, 1]) {
        const legGroup = new THREE.Group();
        legGroup.position.set(side * 0.45, 0, zOffset);
        body.add(legGroup);

        const legUpper = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 5)),
          metalMat
        );
        legUpper.position.set(side * 0.4, 0.25, 0);
        legUpper.rotation.set(0, 0, side * 0.85);
        legGroup.add(legUpper);

        const legLower = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.05, 0.02, 0.95, 5)),
          metalMat
        );
        legLower.position.set(side * 0.85, -0.25, 0);
        legLower.rotation.set(0, 0, -side * 0.45);
        legGroup.add(legLower);

        this.animatedParts.push({ obj: legGroup, type: 'legStep', side, index: i, speed: 3.2 });
      }
    }
  }

  /* -------------------------------------------------------------
     7. GAS BLADDER — Floating Bio-Mechanical Pneumatic Leviathan
     ------------------------------------------------------------- */
  buildGasBladder() {
    const membraneMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.25,
      metalness: 0.2,
      transparent: true,
      opacity: 0.82
    }));
    const gasMat = this.mat(new THREE.MeshBasicMaterial({ color: 0x81c784 }));
    const metalMat = this.mat(new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.5, metalness: 0.7 }));

    const body = new THREE.Group();
    body.position.y = 1.35;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'hover', amp: 0.12, speed: 1.8 });

    // Translucent Pressure Bell
    const bell = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.75, 16, 12)),
      membraneMat
    );
    bell.scale.set(1.15, 0.9, 1.15);
    body.add(bell);

    // Inner Glowing Gas Sacs
    const innerSac = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.48, 10, 8)),
      gasMat
    );
    bell.add(innerSac);

    // Pressure rim & nozzle collar
    const collar = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.65, 0.06, 8, 16)),
      metalMat
    );
    collar.position.y = -0.4;
    collar.rotation.x = Math.PI / 2;
    body.add(collar);

    // Trailing tendrils / intake hoses
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tentacle = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.025, 0.01, 1.35, 4)),
        metalMat
      );
      tentacle.position.set(Math.cos(angle) * 0.45, -1.0, Math.sin(angle) * 0.45);
      tentacle.rotation.set(0.15 * Math.sin(angle), 0, 0.15 * Math.cos(angle));
      body.add(tentacle);
      this.animatedParts.push({ obj: tentacle, type: 'swayWave', index: i, speed: 2.0 });
    }
  }

  /* -------------------------------------------------------------
     9. RECIPE GOLEM — Alchemical Crucible Monolith
     ------------------------------------------------------------- */
  buildRecipeGolem() {
    const ceramicMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x6d5345,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    }));
    const fireMat = this.mat(new THREE.MeshBasicMaterial({ color: 0xff7043 }));

    const body = new THREE.Group();
    body.position.y = 0.95;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.04, speed: 1.8 });

    // Cauldron Vessel Body
    const cauldron = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.72, 0.55, 1.1, 10)),
      ceramicMat
    );
    body.add(cauldron);

    // Glowing Alchemical Fire inside rim
    const fire = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.65, 10)),
      fireMat
    );
    fire.position.y = 0.56;
    fire.rotation.x = -Math.PI / 2;
    body.add(fire);

    // Massive Earthen Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.35, 0.85, 0.35)),
        ceramicMat
      );
      arm.position.set(side * 0.9, 0.2, 0.1);
      body.add(arm);
      this.animatedParts.push({ obj: arm, type: 'sway', side, speed: 1.8, amp: 0.08 });
    }
  }

  /* -------------------------------------------------------------
     10. Universal Fallback Construct
     ------------------------------------------------------------- */
  buildDefaultAutomaton() {
    const metalMat = this.mat(new THREE.MeshStandardMaterial({ color: 0x4a4845, roughness: 0.4, metalness: 0.8 }));
    const eyeMat = this.mat(new THREE.MeshBasicMaterial({ color: AMBER }));

    const body = new THREE.Group();
    body.position.y = 1.0;
    this.group.add(body);

    const torso = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.65, 0.9, 0.45)), metalMat);
    body.add(torso);

    const eye = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.3, 0.08, 0.05)), eyeMat);
    eye.position.set(0, 0.65, 0.25);
    body.add(eye);

    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.05, speed: 2.0 });
  }

  /* -------------------------------------------------------------
     STANDING IN THE WORLD
     ------------------------------------------------------------- */

  /** Measured once the body is built: its height, reach and middle. */
  finalize() {
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.group);
    const size = box.getSize(new THREE.Vector3());
    const mid = box.getCenter(new THREE.Vector3());
    this.height = size.y;
    this.radius = Math.max(size.x, size.z) * 0.5;
    this.centerLocal = this.group.worldToLocal(mid.clone());
    this.group.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      if (o.isLight) this.lights.push({ light: o, intensity: o.intensity });
    });
  }

  /** The middle of the body in world space — where a shot is aimed. */
  getCenterWorld(out = new THREE.Vector3()) {
    this.group.updateMatrixWorld(true);
    return this.group.localToWorld(out.copy(this.centerLocal));
  }

  /** A point on the side facing `from`, where a bolt actually strikes. */
  getSurfacePoint(from, out = new THREE.Vector3()) {
    this.getCenterWorld(out);
    const toward = from.clone().sub(out).setY(0);
    if (toward.lengthSq() < 1e-6) toward.set(0, 0, 1);
    return out.addScaledVector(toward.normalize(), this.radius * 0.55);
  }

  /** A world-space box round the body, for the smoke that rises off it. */
  getWorldBox(out = new THREE.Box3()) {
    const c = this.getCenterWorld(new THREE.Vector3());
    const r = this.radius * 0.7;
    return out.set(
      new THREE.Vector3(c.x - r, this.group.position.y, c.z - r),
      new THREE.Vector3(c.x + r, this.group.position.y + this.height, c.z + r)
    );
  }

  /** Follow the ground under it, keeping the height it was placed at. */
  setGround(fn) {
    this.groundFn = fn;
    const g = fn?.(this.baseX, this.baseZ);
    this.heightOffset = typeof g === 'number' && !isNaN(g) ? this.baseY - g : 0;
  }

  groundAt(x, z) {
    const g = this.groundFn?.(x, z);
    return typeof g === 'number' && !isNaN(g) ? g : (this.baseY - this.heightOffset);
  }

  /* -------------------------------------------------------------
     ANIMATION & COMBAT ACTIONS
     ------------------------------------------------------------- */

  /** It arrives: rises out of the ground, or drops in if it flies. */
  startEntrance(kind = 'rise', dur = 2.0) {
    this.entrance = { kind, t: 0, dur, landed: false };
  }

  /** Player landed a hit: monster recoils back, flashes damage */
  triggerHitReact(strength = 1) {
    this.staggerT = 1.0;
    this.staggerPower = strength;
    this.damageFlash = 1.0;
  }

  /** How hurt it is, 0..1. It darkens, glows at the wounds, and moves faster. */
  setDamage(level, snap = false) {
    this.damageTarget = THREE.MathUtils.clamp(level, 0, 1);
    if (snap) {
      this.damage = this.damageTarget;
      for (const p of this.armourPlates) if (this.damage >= p.at) this.popPlate(p, true);
    }
  }

  /** It winds up for an attack. `strike` fires on the event hook when it ends. */
  triggerTelegraph(dur = 0.45) {
    this.windup = { t: 0, dur };
  }

  /** Foe lunges forward to attack the player */
  triggerLunge() {
    this.lungeT = 1.0;
  }

  /** A roar: it rears and the ground shakes. Nothing is damaged. */
  triggerRoar() {
    this.roarT = 1.0;
    this.onEvent?.('roar');
  }

  /** Mortal wound: it convulses, then comes apart (see `shatter`). */
  triggerDeathThroes() {
    this.throes = true;
    this.throesT = 0;
    this.alive = false;
  }

  /** Come apart into pieces that fall, bounce and crumble to nothing. */
  shatter() {
    if (this.debris) return;
    this.throes = false;
    this.group.updateMatrixWorld(true);
    const scene = this.group.parent;
    if (!scene) { this.gone = true; return; }
    const centre = this.getCenterWorld(new THREE.Vector3());
    const parts = [];
    this.group.traverse(o => { if (o.isMesh && o !== this.hitBox) parts.push(o); });
    this.debris = [];
    const rng = makeRng(77);
    for (const mesh of parts) {
      scene.attach(mesh);
      mesh.updateMatrixWorld(true);
      const p = mesh.getWorldPosition(new THREE.Vector3());
      const dir = p.clone().sub(centre);
      dir.y = Math.max(dir.y, 0.2);
      dir.normalize();
      const sp = 2.5 + rng() * 5.5;
      this.debris.push({
        mesh,
        vel: dir.multiplyScalar(sp).add(new THREE.Vector3((rng() - 0.5) * 2, 3 + rng() * 5, (rng() - 0.5) * 2)),
        spin: new THREE.Vector3((rng() - 0.5) * 7, (rng() - 0.5) * 7, (rng() - 0.5) * 7),
        scale0: mesh.scale.clone(),
        delay: 1.0 + rng() * 1.3,
        life: 0,
        shrink: 0.7 + rng() * 0.5,
        bounces: 0
      });
    }
    this.debrisT = 0;
    this.onEvent?.('shattered');
  }

  /** Kept for callers that only want it gone. */
  triggerDisperse() {
    this.triggerDeathThroes();
  }

  get isGone() { return Boolean(this.gone); }

  /** Write every emissive channel once: the body's own glow, the wounds, the hit flash, the wind-up. */
  applyTint(wound, flash, tele) {
    const pulse = 0.65 + 0.35 * Math.sin(this.elapsed * 6);
    const ember = wound * 0.55 * pulse;
    for (const m of this.materials) {
      if (!m.emissive) continue;
      const ud = m.userData;
      if (!ud.baseEm) ud.baseEm = { c: m.emissive.clone(), i: m.emissiveIntensity };
      if (!ud.baseColor && m.color) ud.baseColor = m.color.clone();
      const b = ud.baseEm;
      m.emissive.setRGB(
        b.c.r * b.i + ember * 1.0 + flash * 1.4 + tele * 0.9,
        b.c.g * b.i + ember * 0.34 + flash * 1.4 + tele * 0.12,
        b.c.b * b.i + ember * 0.08 + flash * 1.4 + tele * 0.08
      );
      m.emissiveIntensity = 1;
      if (ud.baseColor) m.color.copy(ud.baseColor).lerp(CHAR, wound * 0.5);
    }
  }

  update(dt, reduced = false, eyePos = null) {
    if (this.gone) return;
    this.elapsed += dt;

    // Come apart: pieces fall, bounce, crumble. Nothing else about it runs.
    if (this.debris) {
      this.stepFlying(dt);
      this.debrisT += dt;
      let live = 0;
      for (const d of this.debris) {
        const m = d.mesh;
        if (!m.visible) continue;
        d.life += dt;
        d.vel.y -= 15 * dt;
        m.position.addScaledVector(d.vel, dt);
        m.rotation.x += d.spin.x * dt;
        m.rotation.y += d.spin.y * dt;
        m.rotation.z += d.spin.z * dt;
        const floor = this.groundAt(m.position.x, m.position.z) + 0.15;
        if (m.position.y < floor) {
          m.position.y = floor;
          if (d.vel.y < 0 && d.bounces < 3) {
            d.vel.y *= -0.32;
            d.vel.x *= 0.6; d.vel.z *= 0.6;
            d.spin.multiplyScalar(0.5);
            d.bounces++;
          } else { d.vel.set(0, 0, 0); d.spin.set(0, 0, 0); }
        }
        if (d.life > d.delay) {
          const k = 1 - (d.life - d.delay) / d.shrink;
          if (k <= 0) { m.visible = false; continue; }
          m.scale.copy(d.scale0).multiplyScalar(k);
        }
        live++;
      }
      for (const l of this.lights) l.light.intensity = Math.max(0, l.light.intensity - dt * 4);
      if (!live) this.gone = true;
      return;
    }

    // Arrival
    let entranceY = 0;
    let entranceScale = 1;
    if (this.entrance && !this.entrance.landed) {
      const e = this.entrance;
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      const ease = 1 - Math.pow(1 - k, 3);
      entranceY = e.kind === 'rise'
        ? -(this.height + 0.5) * (1 - ease)
        : 14 * (1 - k * k);
      entranceScale = e.kind === 'rise' ? 1 : 0.9 + 0.1 * ease;
      if (k >= 1) { e.landed = true; this.onEvent?.('landed'); }
    }

    const fx = eyePos ? eyePos.x - this.baseX : 0;
    const fz = eyePos ? eyePos.z - this.baseZ : 1;
    const fl = Math.hypot(fx, fz) || 1;
    const fwdX = fx / fl, fwdZ = fz / fl;       // towards the player
    const sideX = fwdZ, sideZ = -fwdX;

    // Damage creeps in and drives the rest.
    const dmgRate = (this.damageTarget - this.damage);
    this.damage += Math.abs(dmgRate) < 0.001 ? dmgRate : dmgRate * Math.min(1, dt * 3);
    const wound = this.damage;
    const pace = 1 + wound * 0.55;

    // Hit flash
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 3.2);

    // Wind-up for an attack: crouch back, glow, then it fires.
    let windBack = 0;
    let crouch = 0;
    let tele = 0;
    let windK = 0;
    if (this.windup) {
      const w = this.windup;
      w.t += dt;
      const k = Math.min(1, w.t / w.dur);
      windK = k;
      tele = k * k;
      windBack = -0.9 * k;
      crouch = 0.1 * k;
      if (k >= 1) {
        this.windup = null;
        this.lungeT = 1.0;
        this.onEvent?.('strike');
      }
    }

    // Stagger recoil
    let recoil = 0;
    if (this.staggerT > 0) {
      this.staggerT = Math.max(0, this.staggerT - dt * 2.2);
      recoil = -1.1 * (this.staggerPower || 1) * Math.sin(this.staggerT * Math.PI);
    }

    // Lunge
    let lunge = 0;
    if (this.lungeT > 0) {
      const before = this.lungeT;
      this.lungeT = Math.max(0, this.lungeT - dt * 1.7);
      lunge = 3.0 * Math.sin(this.lungeT * Math.PI);
      if (before > 0.5 && this.lungeT <= 0.5) this.onEvent?.('slam');
    }

    // Roar: rears up
    let roarScale = 1;
    if (this.roarT > 0) {
      this.roarT = Math.max(0, this.roarT - dt * 0.9);
      roarScale = 1 + 0.12 * Math.sin((1 - this.roarT) * Math.PI);
    }

    // Idle: it paces across the arena and closes in as it is hurt.
    const idle = !this.entrance || this.entrance.landed;
    const strafe = idle ? Math.sin(this.elapsed * 0.45 * pace + this.seed) * (1.8 + wound * 1.6) : 0;
    this.advance += (wound * 3.2 - this.advance) * Math.min(1, dt * 1.2);

    // Death throes: it convulses and sinks before it comes apart.
    let shakeX = 0, shakeZ = 0, sink = 0;
    if (this.throes) {
      this.throesT += dt;
      const amp = Math.min(1, this.throesT * 1.5) * 0.35;
      shakeX = (Math.sin(this.elapsed * 63) + Math.sin(this.elapsed * 41)) * amp;
      shakeZ = (Math.cos(this.elapsed * 57) + Math.sin(this.elapsed * 37)) * amp;
      sink = Math.min(0.9, this.throesT * 0.4);
    }

    const along = this.advance + lunge + recoil + windBack;
    const x = this.baseX + fwdX * along + sideX * (strafe + shakeX) + fwdX * shakeZ;
    const z = this.baseZ + fwdZ * along + sideZ * (strafe + shakeX) + fwdZ * shakeZ;
    const flying = this.heightOffset > 0.5;
    const bob = flying ? Math.sin(this.elapsed * 1.6) * 0.35 : 0;
    this.group.position.set(x, this.groundAt(x, z) + this.heightOffset + entranceY + bob - sink, z);

    if (eyePos) {
      this.group.rotation.y = Math.atan2(eyePos.x - x, eyePos.z - z);
    }
    const s = this.scale * entranceScale * roarScale;
    this.group.scale.set(s * (1 + crouch * 0.6), s * (1 - crouch), s * (1 + crouch * 0.6));

    // Light and colour
    this.applyTint(wound, this.damageFlash, tele);

    // Plates come off as it is hurt, and the ones already off keep falling.
    for (const p of this.armourPlates) if (!p.off && wound >= p.at) this.popPlate(p);
    this.stepFlying(dt);

    if (this.rig) {
      this.rig.update({
        t: this.elapsed * pace, dt, pace, calm: reduced, wound,
        wind: windK,
        lunge: this.lungeT > 0 ? 1 - this.lungeT : 0,
        hurt: this.staggerT > 0 ? Math.min(1, Math.sin(this.staggerT * Math.PI) * (this.staggerPower || 1)) : 0,
        roar: this.roarT > 0 ? Math.sin((1 - this.roarT) * Math.PI) : 0,
        throes: this.throes ? Math.min(1, this.throesT * 1.5) : 0,
        flash: this.damageFlash
      });
    }

    if (this.throes) {
      for (const l of this.lights) l.light.intensity = l.intensity * (0.6 + 0.4 * Math.sin(this.elapsed * 40));
    }

    if (reduced) return;

    // Orbiting crystal shards (salt husk)
    if (this.orbitShards) {
      for (const sh of this.orbitShards) {
        const a = sh.angle + this.elapsed * 1.4 * pace;
        sh.mesh.position.set(
          Math.cos(a) * sh.radius,
          sh.y + Math.sin(this.elapsed * 2.5) * 0.08,
          Math.sin(a) * sh.radius
        );
        sh.mesh.rotation.y += dt * 2.0;
      }
    }

    // Wing flapping (lamp moth, lantern-eater)
    if (this.wings) {
      const flap = Math.sin(this.elapsed * 12.0 * pace) * (this.isBoss ? 0.35 : 0.65);
      for (const w of this.wings) {
        if (w.fore) w.fore.rotation.y = w.side * flap;
        if (w.hind) w.hind.rotation.y = w.side * flap * 0.75;
      }
    }

    // Standard part animations (breathing, hover, sway)
    const t = this.elapsed * pace;
    for (const p of this.animatedParts) {
      if (p.type === 'breathe' || p.type === 'hover') {
        if (p.obj.userData.baseY === undefined) p.obj.userData.baseY = p.obj.position.y;
        p.obj.position.y = p.obj.userData.baseY + Math.sin(t * p.speed) * p.amp;
        if (p.type === 'hover') p.obj.rotation.z = Math.sin(t * p.speed * 0.5) * 0.05;
      } else if (p.type === 'sway') {
        p.obj.rotation.z = p.side * (0.15 + Math.sin(t * p.speed) * p.amp);
      } else if (p.type === 'spinZ') {
        p.obj.rotation.z += dt * p.speed * pace;
      } else if (p.type === 'scytheTwitch') {
        // A wound-up foe holds its blades high.
        p.obj.rotation.z = -p.side * (0.35 + Math.sin(t * p.speed) * 0.12 + tele * 0.5);
      } else if (p.type === 'legStep') {
        p.obj.rotation.x = Math.sin(t * p.speed + p.index * 1.2) * 0.22;
      }
    }
  }

  dispose() {
    this.group.parent?.remove(this.group);
    if (this.debris) {
      for (const d of this.debris) d.mesh.parent?.remove(d.mesh);
      this.debris = null;
    }
    for (const d of this.disposables) {
      d.dispose?.();
    }
    for (const f of this.flying) f.mesh.parent?.remove(f.mesh);
    this.flying = [];
    this.disposables = [];
    this.materials = [];
    this.animatedParts = [];
    this.lights = [];
  }
}
