/**
 * combat-monster-3d.js — 3D Combat Monsters for Learn quest encounters.
 *
 * Stands an actual 3D monster in front of the player in the 3D world,
 * facing them across the arena with menacing presence, idle breathing,
 * weapon stagger reactions, violent lunge counters, and explosive dispersal.
 */

import * as THREE from 'three';

const AMBER = 0xe59b24;
const PHOSPHOR = 0x6f8f3f;
const MAGMA = 0xff4818;
const CYAN = 0x38bdf8;

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
    this.isBoss = Boolean(
      this.species === 'the hopper' ||
      this.species === 'the lantern-eater' ||
      this.species === 'the compressor' ||
      this.species === 'basalt warden' && foe.id?.includes('warden')
    );

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

    // Base position in front of player
    this.baseX = opts.x || 0;
    this.baseY = opts.y || 1.15;
    this.baseZ = opts.z || -2.2;
    this.scale = opts.scale || (this.isBoss ? 1.45 : 1.1);

    this.group.position.set(this.baseX, this.baseY, this.baseZ);
    this.group.scale.setScalar(this.scale);

    this.buildMesh();
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

  buildMesh() {
    switch (this.species) {
      case 'salt husk':
        this.buildSaltHusk();
        break;
      case 'the hopper':
        this.buildTheHopper();
        break;
      case 'lamp moth':
        this.buildLampMoth();
        break;
      case 'the lantern-eater':
        this.buildTheLanternEater();
        break;
      case 'basalt warden':
        this.buildBasaltWarden();
        break;
      case 'slag crawler':
        this.buildSlagCrawler();
        break;
      case 'gas bladder':
        this.buildGasBladder();
        break;
      case 'the compressor':
        this.buildTheCompressor();
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
     2. THE HOPPER — Massive Armored Mantis-Stalker Boss
     ------------------------------------------------------------- */
  buildTheHopper() {
    const chitinMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x48423b,
      roughness: 0.35,
      metalness: 0.65,
      flatShading: true
    }));
    const bladeMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0xc8c3b7,
      roughness: 0.18,
      metalness: 0.85
    }));
    const eyeMat = this.mat(new THREE.MeshBasicMaterial({ color: AMBER }));

    const body = new THREE.Group();
    body.position.y = 0.85;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.06, speed: 3.2 });

    // Segmented Thorax
    const thorax = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.48, 1.1, 7)),
      chitinMat
    );
    thorax.rotation.x = 0.35;
    body.add(thorax);

    // Abdomen extending backwards
    const abdomen = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.25, 0.45, 1.2, 6)),
      chitinMat
    );
    abdomen.position.set(0, -0.2, -0.55);
    abdomen.rotation.x = -0.65;
    body.add(abdomen);

    // Angular Head
    const head = new THREE.Group();
    head.position.set(0, 0.72, 0.32);
    body.add(head);

    const skull = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.32, 0.6, 5)),
      chitinMat
    );
    skull.rotation.x = -0.7;
    head.add(skull);

    // Dual Glowing Compound Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        this.own(new THREE.SphereGeometry(0.1, 8, 8)),
        eyeMat
      );
      eye.position.set(side * 0.22, 0.12, 0.22);
      head.add(eye);
    }

    // Antennae
    for (const side of [-1, 1]) {
      const ant = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.015, 0.005, 0.8, 4)),
        bladeMat
      );
      ant.position.set(side * 0.18, 0.45, 0.25);
      ant.rotation.set(0.35, 0, side * 0.45);
      head.add(ant);
    }

    // Menacing Folded Scythe Blades
    this.scythes = [];
    for (const side of [-1, 1]) {
      const armRoot = new THREE.Group();
      armRoot.position.set(side * 0.45, 0.45, 0.25);
      body.add(armRoot);

      const upperArm = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.12, 0.65, 0.15)),
        chitinMat
      );
      upperArm.position.set(0, 0.3, 0);
      upperArm.rotation.set(0.5, 0, -side * 0.4);
      armRoot.add(upperArm);

      // Curved Scythe Blade
      const blade = new THREE.Mesh(
        this.own(new THREE.ConeGeometry(0.14, 1.35, 4)),
        bladeMat
      );
      blade.position.set(side * 0.22, -0.25, 0.4);
      blade.rotation.set(-1.1, 0, side * 0.25);
      armRoot.add(blade);
      this.scythes.push(armRoot);

      this.animatedParts.push({ obj: armRoot, type: 'scytheTwitch', side, speed: 2.8 });
    }

    // Heavy Raptorial Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.1, 0.16, 1.4, 5)),
        chitinMat
      );
      leg.position.set(side * 0.65, 0.25, -0.4);
      leg.rotation.set(-0.45, 0, side * 0.35);
      this.group.add(leg);
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
     4. THE LANTERN-EATER — Colossal Shadow Void Leviathan Boss
     ------------------------------------------------------------- */
  buildTheLanternEater() {
    const shadowMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x16151a,
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true
    }));
    const cyanMat = this.mat(new THREE.MeshBasicMaterial({ color: CYAN }));
    const abyssMat = this.mat(new THREE.MeshBasicMaterial({ color: 0x07060a }));

    const body = new THREE.Group();
    body.position.y = 1.35;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'hover', amp: 0.08, speed: 1.8 });

    // Skeletal Ribcage
    const chest = new THREE.Mesh(
      this.own(new THREE.DodecahedronGeometry(0.7, 1)),
      shadowMat
    );
    chest.scale.set(1.2, 1.4, 0.85);
    body.add(chest);

    // Abyss Siphon Vortex (swirling black maw)
    const vortex = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.35, 0.08, 8, 24)),
      cyanMat
    );
    vortex.position.set(0, 0.15, 0.4);
    body.add(vortex);
    this.animatedParts.push({ obj: vortex, type: 'spinZ', speed: 3.5 });

    const voidCore = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.28, 12, 12)),
      abyssMat
    );
    voidCore.position.set(0, 0.15, 0.35);
    body.add(voidCore);

    // Horned Skull
    const skull = new THREE.Group();
    skull.position.set(0, 0.95, 0.3);
    body.add(skull);

    const headMesh = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.35, 0.75, 4)),
      shadowMat
    );
    headMesh.rotation.x = -0.55;
    skull.add(headMesh);

    // 4 Cyan Slit Eyes
    for (const [x, y] of [[-0.15, 0.1], [0.15, 0.1], [-0.08, 0.22], [0.08, 0.22]]) {
      const eye = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.06, 0.02, 0.04)),
        cyanMat
      );
      eye.position.set(x, y, 0.22);
      skull.add(eye);
    }

    // Horns
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        this.own(new THREE.ConeGeometry(0.09, 0.85, 4)),
        shadowMat
      );
      horn.position.set(side * 0.28, 0.5, -0.1);
      horn.rotation.set(-0.3, 0, side * 0.55);
      skull.add(horn);
    }

    // Sweeping Void Wings (large span)
    this.wings = [];
    for (const side of [-1, 1]) {
      const wingArm = new THREE.Group();
      wingArm.position.set(side * 0.5, 0.4, 0);
      body.add(wingArm);

      const wingMesh = new THREE.Mesh(
        this.own(new THREE.PlaneGeometry(1.6, 1.1, 4, 3)),
        shadowMat
      );
      wingMesh.position.set(side * 0.95, 0.2, 0);
      wingMesh.rotation.set(0.1, side * 0.2, side * 0.15);
      wingArm.add(wingMesh);

      this.wings.push({ fore: wingArm, side, amp: 0.35 });
    }
  }

  /* -------------------------------------------------------------
     5. BASALT WARDEN — Volcanic Basalt Titan with Magma Fissures
     ------------------------------------------------------------- */
  buildBasaltWarden() {
    const basaltMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x242224,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true
    }));
    const magmaMat = this.mat(new THREE.MeshBasicMaterial({ color: MAGMA }));

    const body = new THREE.Group();
    body.position.y = 1.0;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.04, speed: 1.6 });

    // Hexagonal Columns Torso
    const torso = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.65, 0.55, 1.15, 6)),
      basaltMat
    );
    body.add(torso);

    // Glowing Magma Fissure Lines
    const magmaRing = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.58, 0.04, 6, 12)),
      magmaMat
    );
    magmaRing.rotation.x = Math.PI / 2;
    torso.add(magmaRing);

    const light = this.own(new THREE.PointLight(MAGMA, 1.6, 3.2));
    light.position.set(0, 0.1, 0.4);
    torso.add(light);
    this.coreLight = light;

    // Helm Head
    const head = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.42, 0.48, 0.42)),
      basaltMat
    );
    head.position.set(0, 0.85, 0.05);
    body.add(head);

    // Magma Visor
    const visor = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.32, 0.06, 0.08)),
      magmaMat
    );
    visor.position.set(0, 0.85, 0.25);
    body.add(visor);

    // Heavy Stone Arms & Fists
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.85, 0.55, 0);
      body.add(arm);

      const upper = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.22, 0.25, 0.7, 6)),
        basaltMat
      );
      upper.position.y = -0.3;
      arm.add(upper);

      const fist = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.42, 0.42, 0.45)),
        basaltMat
      );
      fist.position.set(side * 0.05, -0.85, 0.2);
      arm.add(fist);

      this.animatedParts.push({ obj: arm, type: 'sway', side, speed: 1.6, amp: 0.1 });
    }

    // Heavy Pillar Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.28, 0.35, 0.9, 6)),
        basaltMat
      );
      leg.position.set(side * 0.4, -0.55, 0);
      body.add(leg);
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
     8. THE COMPRESSOR — Industrial Pneumatic Juggernaut Boss
     ------------------------------------------------------------- */
  buildTheCompressor() {
    const boilerMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0x3e3a36,
      roughness: 0.65,
      metalness: 0.65,
      flatShading: true
    }));
    const brassMat = this.mat(new THREE.MeshStandardMaterial({
      color: 0xb89542,
      roughness: 0.35,
      metalness: 0.8
    }));
    const fireMat = this.mat(new THREE.MeshBasicMaterial({ color: AMBER }));

    const body = new THREE.Group();
    body.position.y = 1.05;
    this.group.add(body);
    this.animatedParts.push({ obj: body, type: 'breathe', amp: 0.04, speed: 2.2 });

    // Main Boiler Chassis
    const boiler = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.65, 0.65, 1.35, 12)),
      boilerMat
    );
    boiler.rotation.x = Math.PI / 2;
    body.add(boiler);

    // Furnace Hatch with glowing fire
    const hatch = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.45, 0.45, 0.12)),
      fireMat
    );
    hatch.position.set(0, 0, 0.72);
    body.add(hatch);

    // Twin Exhaust Smokestacks
    for (const side of [-1, 1]) {
      const stack = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.12, 0.15, 0.95, 8)),
        boilerMat
      );
      stack.position.set(side * 0.45, 0.9, -0.2);
      body.add(stack);
    }

    // Spinning Brass Flywheel
    const flywheel = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.45, 0.06, 8, 20)),
      brassMat
    );
    flywheel.position.set(0.75, 0.2, 0);
    flywheel.rotation.y = Math.PI / 2;
    body.add(flywheel);
    this.animatedParts.push({ obj: flywheel, type: 'spinZ', speed: 6.0 });

    // Dual Crushing Hydraulic Rams
    this.rams = [];
    for (const side of [-1, 1]) {
      const ram = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.35, 0.55, 0.65)),
        brassMat
      );
      ram.position.set(side * 0.95, 0.1, 0.4);
      body.add(ram);
      this.rams.push({ mesh: ram, side });
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
     ANIMATION & COMBAT ACTIONS
     ------------------------------------------------------------- */

  /** Player landed a hit: monster recoils back, flashes damage */
  triggerHitReact() {
    this.staggerT = 1.0;
    this.damageFlash = 1.0;
  }

  /** Foe lunges forward to attack the player */
  triggerLunge() {
    this.lungeT = 1.0;
  }

  /** Foe is defeated: disintegrates / disperses */
  triggerDisperse() {
    this.alive = false;
    this.disperseT = 0.001;
  }

  update(dt, reduced = false, eyePos = null) {
    if (!this.group.visible) return;
    this.elapsed += dt;

    // Face player
    if (eyePos) {
      const dx = eyePos.x - this.group.position.x;
      const dz = eyePos.z - this.group.position.z;
      this.group.rotation.y = Math.atan2(dx, dz);
    }

    // Damage Flash Decay
    if (this.damageFlash > 0) {
      this.damageFlash = Math.max(0, this.damageFlash - dt * 3.5);
      const intensity = this.damageFlash;
      for (const m of this.materials) {
        if (m.emissive) {
          m.emissive.setHex(0xffffff);
          m.emissiveIntensity = intensity * 1.5;
        }
      }
      if (this.damageFlash === 0) {
        for (const m of this.materials) {
          if (m.emissive) {
            m.emissive.setHex(0x000000);
            m.emissiveIntensity = 0;
          }
        }
      }
    }

    // Stagger Recoil (Player Strike Impact)
    let recoilZ = 0;
    if (this.staggerT > 0) {
      this.staggerT = Math.max(0, this.staggerT - dt * 2.5);
      recoilZ = -0.45 * Math.sin(this.staggerT * Math.PI);
    }

    // Lunge Forward Attack (Foe counter)
    let lungeZ = 0;
    if (this.lungeT > 0) {
      this.lungeT = Math.max(0, this.lungeT - dt * 1.8);
      // Surges forward towards the camera (closer in +Z)
      lungeZ = 1.25 * Math.sin(this.lungeT * Math.PI);
    }

    // Dispersal Collapse / Fade
    if (this.disperseT > 0) {
      this.disperseT += dt * 1.5;
      const s = Math.max(0.01, 1.0 - this.disperseT * 0.7);
      this.group.scale.setScalar(this.scale * s);
      this.group.position.y = this.baseY - this.disperseT * 0.35;
      for (const m of this.materials) {
        m.transparent = true;
        m.opacity = Math.max(0, 1.0 - this.disperseT);
      }
      if (this.disperseT >= 1.5) {
        this.group.visible = false;
      }
      return;
    }

    // Position combine
    this.group.position.z = this.baseZ + recoilZ + lungeZ;

    if (reduced) return;

    // Orbiting crystal shards (salt husk)
    if (this.orbitShards) {
      for (const s of this.orbitShards) {
        const a = s.angle + this.elapsed * 1.4;
        s.mesh.position.set(
          Math.cos(a) * s.radius,
          s.y + Math.sin(this.elapsed * 2.5) * 0.08,
          Math.sin(a) * s.radius
        );
        s.mesh.rotation.y += dt * 2.0;
      }
    }

    // Wing flapping (lamp moth, lantern-eater)
    if (this.wings) {
      const flap = Math.sin(this.elapsed * 12.0) * (this.isBoss ? 0.35 : 0.65);
      for (const w of this.wings) {
        if (w.fore) w.fore.rotation.y = w.side * flap;
        if (w.hind) w.hind.rotation.y = w.side * flap * 0.75;
      }
    }

    // Standard part animations (breathing, hover, sway)
    const t = this.elapsed;
    for (const p of this.animatedParts) {
      if (p.type === 'breathe') {
        p.obj.position.y = (p.obj.userData.baseY || p.obj.position.y) + Math.sin(t * p.speed) * p.amp;
        if (!p.obj.userData.baseY) p.obj.userData.baseY = p.obj.position.y;
      } else if (p.type === 'hover') {
        p.obj.position.y = (p.obj.userData.baseY || p.obj.position.y) + Math.sin(t * p.speed) * p.amp;
        p.obj.rotation.z = Math.sin(t * p.speed * 0.5) * 0.05;
        if (!p.obj.userData.baseY) p.obj.userData.baseY = p.obj.position.y;
      } else if (p.type === 'sway') {
        p.obj.rotation.z = p.side * (0.15 + Math.sin(t * p.speed) * p.amp);
      } else if (p.type === 'spinZ') {
        p.obj.rotation.z += dt * p.speed;
      } else if (p.type === 'scytheTwitch') {
        p.obj.rotation.z = -p.side * (0.35 + Math.sin(t * p.speed) * 0.12);
      } else if (p.type === 'legStep') {
        p.obj.rotation.x = Math.sin(t * p.speed + p.index * 1.2) * 0.22;
      }
    }
  }

  dispose() {
    this.group.parent?.remove(this.group);
    for (const d of this.disposables) {
      d.dispose?.();
    }
    this.disposables = [];
    this.materials = [];
    this.animatedParts = [];
  }
}
