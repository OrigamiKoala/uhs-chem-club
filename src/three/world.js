/**
 * world.js — Erebus 3D World Scene (The Charge Gardens)
 * High-fidelity PBR planetary environment matching 3d-conversion-prompts.md §3.1 & §4.4
 * and concept art hero_desert_outpost.jpg.
 *
 * Supports unconstrained WASD navigation, procedural terrain heightmap, instanced pylons,
 * survey lander ("SANDSTALKER"), wind-carved sedimentary rock formations, celestial gas giant vista,
 * and atmospheric sand particles.
 */

import * as THREE from "three";
import {
  desertSand, sedimentaryRock, platedMetal,
  buildMaterial, enableAO, addDetailNormal, addMacroVariation,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, cableRun, placard, hazardStripe, mergeStatic
} from "./materials/pbr-kit.js";
import erebusData from "./world-data/erebus.json" with { type: "json" };
import { tierManager, tierAtLeast } from "./tier.js";
import { aimBox } from "./aim-target.js";

export class WorldScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = erebusData;
    this.scene = new THREE.Scene();

    this.pylonMeshes = [];
    this.pylonIndicators = [];
    this.dustParticles = null;
    this.terrainMesh = null;
    this.colliders = []; // Radial obstacles { x, z, radius } and AABBs

    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initSurveyLander();
    this.initRockLandmarks();
    this.initPylons();
    this.initAtmosphericDust();
  }

  initLighting() {
    const amb = this.data.ambience;

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(amb.fillLight, 1.2);
    this.scene.add(ambientLight);

    // Warm sodium key light from low sun
    this.sunLight = new THREE.DirectionalLight(amb.keyLight, 2.6);
    this.sunLight.position.set(60, 35, 75);
    this.sunLight.castShadow = tierAtLeast("T4");
    this.scene.add(this.sunLight);

    // Deep starlight back-fill
    const fillLight = new THREE.DirectionalLight(amb.fillLight, 0.8);
    fillLight.position.set(-50, 20, -60);
    this.scene.add(fillLight);

    // Distance fog matching amber desert haze
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = new THREE.Color(amb.fogColor);
  }

  initSky() {
    // 360 celestial hemisphere
    const skyGeo = new THREE.SphereGeometry(300, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a0f08) },
        bottomColor: { value: new THREE.Color(0x9a5b1f) },
        horizonColor: { value: new THREE.Color(0xd99423) },
        offset: { value: 15 },
        exponent: { value: 0.7 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          vec3 col = mix(horizonColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
          if (h < 0.0) {
            col = mix(horizonColor, bottomColor, min(-h * 1.5, 1.0));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    // `phys` tells the physics check what kind of thing this is. A sky encloses
    // the world by definition and is not an object standing in it; neither are
    // the bodies hanging in it, which are two hundred metres out and drawn
    // without fog so they read as distance.
    skyMesh.userData.phys = 'ambient';
    this.scene.add(skyMesh);

    // Low-horizon banded Gas Giant with edge-on rings
    const giantGroup = new THREE.Group();
    giantGroup.position.set(160, 45, -220);
    giantGroup.rotation.z = 0.25;

    const giantGeo = new THREE.SphereGeometry(38, 32, 32);
    const giantMat = new THREE.MeshStandardMaterial({
      color: 0x9c7442,
      roughness: 0.95,
      metalness: 0.1,
      fog: false
    });
    const giantMesh = new THREE.Mesh(giantGeo, giantMat);
    giantGroup.add(giantMesh);

    // Edge-on ring system
    const ringGeo = new THREE.RingGeometry(48, 85, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6e5232,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      fog: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    giantGroup.add(ringMesh);

    // Small pale moon
    const moonGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.9, fog: false });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-65, 15, 20);
    giantGroup.add(moonMesh);

    giantGroup.userData.phys = 'ambient';   // a planet, not a prop on the basin
    this.scene.add(giantGroup);
  }

  getTerrainHeight(x, z) {
    const r = Math.hypot(x, z);
    const basinRadius = 45.0;

    // Rim ridge around basin
    const rimDist = Math.abs(r - basinRadius);
    const rimH = Math.max(0, 3.2 * Math.exp(-(rimDist * rimDist) / 120));

    // Outer slopes and desert dunes
    const dune1 = Math.sin(x * 0.06 + z * 0.04) * 1.4;
    const dune2 = Math.cos(x * 0.1 - z * 0.08) * 0.8;

    let base = 0;
    if (r < basinRadius) {
      const bowl = Math.cos((r / basinRadius) * (Math.PI / 2));
      base = -2.5 * bowl;
    } else {
      base = Math.min(10.0, (r - basinRadius) * 0.12);
    }

    return base + rimH + (r > 30 ? (dune1 + dune2) : 0);
  }

  initTerrain() {
    const size = this.data.terrain.size[0];
    const segs = tierAtLeast("T4") ? 140 : 80;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();

    /*
     * THE BASIN FLOOR.
     *
     * This used to be forty thousand random two-pixel squares on a brown
     * rectangle, with no normal, no roughness and no occlusion — which meant
     * the ground had no shape at all and every light fell on it flat.
     *
     * It is now a real wind-worked ripple field: asymmetric crests with a long
     * windward slope and a short slip face, coarse pale sand stranded on the
     * crests and fines in the troughs, lag gravel the wind could not lift, and
     * albedo, normal, roughness and ambient occlusion all taken off the one
     * height field so a ripple's shadow belongs to that ripple.
     *
     * The same two anti-repeat layers Tallow uses: grit below the tile, and a
     * drift across the whole basin above it. Sixteen repeats over 240 m is a
     * tile every fifteen metres, which is exactly the range the eye is best at
     * spotting, so neither layer is optional.
     */
    const sand = desertSand({ size: texSize(512), seed: 9 });
    const mat = buildMaterial(sand, { repeat: 16, roughness: 1.0, metalness: 0.0 });
    mat.normalScale.set(1.25, 1.25);
    mat.aoMapIntensity = 0.85;

    const gritHeight = heightField(texSize(256), (u, v) =>
      0.5 + (fbm(u * 40, v * 40, { octaves: 4, period: 40, seed: 0x5c2 }) - 0.5) * 0.9
    );
    this.gritNormal = asDataTexture(heightToNormal(gritHeight, 1.4), 1);
    addDetailNormal(mat, this.gritNormal, { scale: 8, strength: 0.38 });

    const macroHeight = heightField(texSize(256), (u, v) =>
      fbm(u * 3, v * 3, { octaves: 5, period: 3, seed: 0x811 })
    );
    this.macroMap = asDataTexture(macroHeight, 1);
    this.macroMap.wrapS = this.macroMap.wrapT = THREE.ClampToEdgeWrapping;
    addMacroVariation(mat, this.macroMap, { strength: 0.12, roughShift: 0.1 });

    enableAO(geo);
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.userData.phys = 'ground';   // everything is bedded into it
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  initSurveyLander() {
    // Survey Lander ("SANDSTALKER") matching hero_desert_outpost.jpg
    const lander = this.data.landmarks.find(l => l.asset === "lander");
    if (!lander) return;

    const landerGroup = new THREE.Group();
    const gy = this.getTerrainHeight(lander.pos[0], lander.pos[2]);
    landerGroup.position.set(lander.pos[0], gy, lander.pos[2]);
    landerGroup.rotation.y = lander.rotY;

    // Materials
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x5a4d3f,
      roughness: 0.80,
      metalness: 0.58
    });
    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b17,
      roughness: 0.92,
      metalness: 0.35
    });
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x2e2924,
      roughness: 0.86,
      metalness: 0.65
    });

    // 1. Aerodynamic Wedge Fuselage (length 8m, width 4.2m)
    const hull = new THREE.Mesh(new THREE.ConeGeometry(3.6, 7.5, 5), hullMat);
    hull.rotation.x = Math.PI / 2;
    hull.position.set(0, 2.2, 0);
    landerGroup.add(hull);

    // Scorched Heat Shield Underbelly
    const underbelly = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 6.8), heatShieldMat);
    underbelly.position.set(0, 0.9, 0);
    landerGroup.add(underbelly);

    // 2. Dual Side Cylindrical Thruster Nacelles
    for (let s of [-1, 1]) {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 4.2, 12), hullMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(s * 2.5, 1.8, -0.6);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.8, 12), heatShieldMat);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(s * 2.5, 1.8, -3.1);

      landerGroup.add(nacelle, nozzle);
    }

    // 3. Deployed Boarding Ramp leading down to the sand
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 3.8), hullMat);
    ramp.position.set(0, 0.55, 4.4);
    ramp.rotation.x = 0.28;
    landerGroup.add(ramp);

    // 4. Articulated Landing Struts with wide circular footpads
    for (let s of [-1, 1]) {
      for (let f of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 6), strutMat);
        leg.position.set(s * 2.4, 1.1, f * 2.4);
        leg.rotation.z = s * 0.35;
        leg.rotation.x = f * 0.25;

        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 8), strutMat);
        pad.position.set(s * 3.0, 0.06, f * 2.8);
        landerGroup.add(leg, pad);
      }
    }

    this.scene.add(landerGroup);

    // Lander obstacle collider
    this.colliders.push({
      x: lander.pos[0],
      z: lander.pos[2],
      radius: 4.5
    });
  }

  initRockLandmarks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x4e4235,
      roughness: 0.94,
      metalness: 0.12
    });

    for (const lm of this.data.landmarks) {
      if (!lm.asset.startsWith("rock")) continue;
      if (lm.minTier === "T4" && !tierAtLeast("T4")) continue;

      const rockGroup = new THREE.Group();
      const gy = this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      rockGroup.position.set(lm.pos[0], gy, lm.pos[2]);
      rockGroup.rotation.y = lm.rotY;
      rockGroup.scale.setScalar(lm.scale);

      // Stacked chamfered slab strata
      const slabCount = tierAtLeast("T4") ? 5 : 3;
      for (let i = 0; i < slabCount; i++) {
        const slabW = 3.6 - i * 0.45 + (i % 2 === 0 ? 0.3 : -0.2);
        const slabH = 0.85 + i * 0.2;
        const slabD = 3.0 - i * 0.35;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(slabW, slabH, slabD), rockMat);
        slab.position.set(Math.sin(i * 1.5) * 0.2, (i * 0.65) + 0.4, Math.cos(i * 1.1) * 0.2);
        slab.rotation.y = i * 0.22;
        rockGroup.add(slab);
      }

      this.scene.add(rockGroup);
      this.colliders.push({
        x: lm.pos[0],
        z: lm.pos[2],
        radius: 2.5 * lm.scale
      });
    }
  }

  initPylons() {
    /*
     * A pylon is the object in this world the player walks up to twenty times,
     * stands in front of, and studies. It is the one prop that has to survive
     * being looked at from half a metre, so it is built like hardware: rolled
     * and painted plate, a bolted base, a guyed mast, an insulator stack, a
     * cable feed that goes somewhere, a service hatch with hinges, and a
     * stencilled number. Everything below is something the real object needs
     * in order to work.
     */
    const mastMat = buildMaterial(
      platedMetal({
        paint: '#4a423a', metal: '#6a6055', rust: '#7d4726',
        // A pylon is walked up to and studied, so this one keeps full size.
        panels: 2, seed: 17, weather: 0.72, size: texSize(512)
      }),
      { repeat: [2, 3], roughness: 1.0 }
    );
    mastMat.normalScale.set(1.3, 1.3);
    mastMat.aoMapIntensity = 0.85;

    // The crown is fired ceramic, not metal: matte, non-conductive, crazed.
    const ceramicMat = buildMaterial(
      sedimentaryRock({ warm: '#7a6f5f', cool: '#544c42', seed: 61, size: texSize(256) }),
      { repeat: [3, 1], roughness: 1.0, metalness: 0.0 }
    );
    ceramicMat.normalScale.set(0.9, 0.9);

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x221f1c,
      roughness: 0.92,
      metalness: 0.4
    });
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x1c1916, roughness: 0.96, metalness: 0.15
    });

    for (const site of this.data.sites) {
      const pylonGroup = new THREE.Group();
      const gy = this.getTerrainHeight(site.pos[0], site.pos[2]);
      pylonGroup.position.set(site.pos[0], gy, site.pos[2]);

      // 1. Splayed 3-footed base sitting in desert sand
      for (let a = 0; a < 3; a++) {
        const angle = a * (Math.PI * 2 / 3);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 1.4), ironMat);
        foot.position.set(Math.sin(angle) * 0.8, 0.15, Math.cos(angle) * 0.8);
        foot.rotation.y = angle;
        pylonGroup.add(foot);
      }

      // 2. 4-metre tapered mast
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.45, 4.0, 8), mastMat);
      mast.position.set(0, 2.0, 0);
      pylonGroup.add(mast);

      // 3. Banded cooling fin collar at 2/3 height (~2.8m)
      for (let f = 0; f < 3; f++) {
        const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), ironMat);
        fin.position.set(0, 2.6 + f * 0.18, 0);
        pylonGroup.add(fin);
      }

      // 4. Cracked ceramic dish crown at top
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.28, 0.35, 8), ceramicMat);
      crown.position.set(0, 4.15, 0);
      pylonGroup.add(crown);

      // 5. Inspection recess with amber filament indicator (#d99423)
      const recess = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.2), ironMat);
      recess.position.set(0, 1.4, 0.35);
      pylonGroup.add(recess);

      /* ---- the small parts ---- */

      // Base plates, bolted through into the footings. A four-tonne mast does
      // not simply rest on the sand, and showing how it is held down is most of
      // what makes it read as heavy.
      for (let a = 0; a < 3; a++) {
        const angle = a * (Math.PI * 2 / 3);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.56), ironMat);
        plate.position.set(Math.sin(angle) * 0.8, 0.31, Math.cos(angle) * 0.8);
        plate.rotation.y = angle;
        pylonGroup.add(plate);
        const bolts = boltRing(0.19, 4, ironMat, { size: 0.035 });
        bolts.position.set(Math.sin(angle) * 0.8, 0.35, Math.cos(angle) * 0.8);
        pylonGroup.add(bolts);
      }

      // The ring of bolts holding the mast down onto its own base flange.
      const baseFlange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.09, 16), ironMat
      );
      baseFlange.position.y = 0.09;
      pylonGroup.add(baseFlange);
      const flangeBolts = boltRing(0.52, 10, ironMat, { size: 0.04 });
      flangeBolts.position.y = 0.15;
      pylonGroup.add(flangeBolts);

      // Insulator stack under the crown: stacked ceramic sheds, the part that
      // says this thing carries something it must not leak.
      for (let i = 0; i < 4; i++) {
        const shed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2 - i * 0.012, 0.23 - i * 0.012, 0.055, 12),
          ceramicMat
        );
        shed.position.y = 3.72 + i * 0.09;
        pylonGroup.add(shed);
      }

      // Service hatch on the mast, with hinges and a quarter-turn latch.
      const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.03), mastMat);
      hatch.position.set(0, 0.95, 0.4);
      pylonGroup.add(hatch);
      for (const hy of [1.11, 0.79]) {
        const hinge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.09, 6), ironMat
        );
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(-0.15, hy, 0.41);
        pylonGroup.add(hinge);
      }
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.03), ironMat);
      latch.position.set(0.12, 0.95, 0.43);
      latch.rotation.z = 0.5;
      pylonGroup.add(latch);

      // The feed: armoured cable out of a gland at the foot, sagging away
      // across the sand to the next pylon in the line. The gardens are a
      // circuit, and a circuit that is never shown is only a claim.
      const gland = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.16, 10), ironMat
      );
      gland.rotation.x = Math.PI / 2;
      gland.position.set(0, 0.42, 0.44);
      pylonGroup.add(gland);
      const feed = cableRun([0, 0.42, 0.5], [0.15, 0.08, 2.4], cableMat,
        { sag: 0.3, radius: 0.035, segments: 12 });
      pylonGroup.add(feed);

      // Guy wires out to three anchor stakes.
      for (let a = 0; a < 3; a++) {
        const angle = a * (Math.PI * 2 / 3) + 0.5;
        const anchor = new THREE.Vector3(Math.sin(angle) * 2.6, 0.1, Math.cos(angle) * 2.6);
        const top = new THREE.Vector3(Math.sin(angle) * 0.3, 3.3, Math.cos(angle) * 0.3);
        const len = anchor.distanceTo(top);
        const wire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, len, 4), ironMat
        );
        wire.position.copy(anchor.clone().add(top).multiplyScalar(0.5));
        wire.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), top.clone().sub(anchor).normalize()
        );
        pylonGroup.add(wire);

        const stake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), ironMat);
        stake.position.copy(anchor).setY(0.1);
        pylonGroup.add(stake);
      }

      // The pylon's own number, stencilled on plate at eye level. `site.stage`
      // is the pylon's position in the line, which is the number painted on it.
      const tag = placard(String(site.stage).padStart(2, '0'), { w: 0.22, h: 0.16 });
      tag.position.set(-0.22, 1.72, 0.385);
      tag.rotation.y = 0.16;
      pylonGroup.add(tag);

      // Hazard striping round the base: the paint you walk into in the dark.
      const stripe = hazardStripe(1.1, 0.16);
      stripe.position.set(0, 0.22, 0.63);
      pylonGroup.add(stripe);

      const lampGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x35200c }); // dormant
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0, 1.4, 0.44);
      // Held out of the static bake: this is the one part of a pylon that
      // changes, and a baked lamp could never be lit.
      lamp.userData.noMerge = true;
      pylonGroup.add(lamp);

      const pylonLight = new THREE.PointLight(0xd99423, 0, 4);
      pylonLight.position.set(0, 1.4, 0.6);
      pylonGroup.add(pylonLight);

      pylonGroup.userData = {
        siteId: site.id,
        stage: site.stage,
        label: site.label,
        lampMat,
        pylonLight
      };

      // Bake the mast, the base, the guys, the hatch and every bolt into one
      // mesh per material. Forty meshes become four, twenty times over, and the
      // pylon the player walks up to is the same pylon it was.
      mergeStatic(pylonGroup);

      this.pylonMeshes.push(pylonGroup);
      this.scene.add(pylonGroup);

      // Add radial collider for pylon mast
      this.colliders.push({
        x: site.pos[0],
        z: site.pos[2],
        radius: 1.2
      });
    }
  }

  initAtmosphericDust() {
    const count = tierAtLeast("T4") ? 1800 : 700;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = 0.5 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xd99423,
      size: 0.06,
      transparent: true,
      opacity: 0.25,
      blending: THREE.NormalBlending
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  setClearedStages(clearedSet) {
    for (const p of this.pylonMeshes) {
      const isCleared = clearedSet.has(p.userData.stage);
      if (isCleared) {
        p.userData.lampMat.color.setHex(0xd99423); // Lit amber
        p.userData.pylonLight.intensity = 0.8;
      } else {
        p.userData.lampMat.color.setHex(0x35200c); // Dormant
        p.userData.pylonLight.intensity = 0;
      }
    }
  }

  update(delta, cameraPosition) {
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + delta * 3.5;
        let z = pos.getZ(i) - delta * 1.5;
        if (x > 80) x = -80;
        if (z < -80) z = 80;
        pos.setX(i, x);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }
  }

  /**
   * What [E] can act on here, as `pickAimTarget` candidates: each pylon's
   * mast and the lander's hull. The one the player is looking at wins.
   */
  getAimTargets() {
    if (!this._aimTargets) {
      this._aimTargets = this.pylonMeshes.map(p => ({
        kind: 'pylon', site: p.userData, reach: 3.4,
        boxes: [aimBox([p.position.x, p.position.y + 2.0, p.position.z], [0.9, 2.0, 0.9])]
      }));
      const lander = this.data.landmarks.find(l => l.asset === "lander");
      if (lander) {
        const gy = this.getTerrainHeight(lander.pos[0], lander.pos[2]);
        this._aimTargets.push({
          kind: 'lander', reach: 3.5,
          boxes: [aimBox([lander.pos[0], gy + 2.2, lander.pos[2]], [2.4, 2.2, 4.0], lander.rotY)]
        });
      }
    }
    return this._aimTargets;
  }
}
