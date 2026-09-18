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
import erebusData from "./world-data/erebus.json";
import { tierManager, tierAtLeast } from "./tier.js";

export class WorldScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = erebusData;
    this.scene = new THREE.Scene();

    this.pylonMeshes = [];
    this.pylonIndicators = [];
    this.dustParticles = null;
    this.terrainMesh = null;
    this.nearbySite = null;
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
    this.scene.add(skyMesh);

    // Low-horizon banded Gas Giant with edge-on rings
    const giantGroup = new THREE.Group();
    giantGroup.position.set(160, 45, -220);
    giantGroup.rotation.z = 0.25;

    const giantGeo = new THREE.SphereGeometry(38, 32, 32);
    const giantMat = new THREE.MeshStandardMaterial({
      color: 0x9c7442,
      roughness: 0.95,
      metalness: 0.1
    });
    const giantMesh = new THREE.Mesh(giantGeo, giantMat);
    giantGroup.add(giantMesh);

    // Edge-on ring system
    const ringGeo = new THREE.RingGeometry(48, 85, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6e5232,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    giantGroup.add(ringMesh);

    // Small pale moon
    const moonGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.9 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-65, 15, 20);
    giantGroup.add(moonMesh);

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

    // Procedural weathered grit texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#6e543c";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const lum = 40 + Math.random() * 45;
      ctx.fillStyle = `rgb(${lum + 40}, ${lum + 20}, ${lum})`;
      ctx.fillRect(x, y, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x8a6e4d,
      roughness: 0.88,
      metalness: 0.15
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
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
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x3d3832,
      roughness: 0.78,
      metalness: 0.6
    });
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0x5c5348,
      roughness: 0.85,
      metalness: 0.2
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x221f1c,
      roughness: 0.92,
      metalness: 0.4
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

      const lampGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x35200c }); // dormant
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0, 1.4, 0.44);
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
      size: 0.18,
      transparent: true,
      opacity: 0.45,
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

    this.nearbySite = null;
    let closestDist = Infinity;

    for (const p of this.pylonMeshes) {
      const dx = cameraPosition.x - p.position.x;
      const dz = cameraPosition.z - p.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 4.5 && dist < closestDist) {
        closestDist = dist;
        this.nearbySite = p.userData;
      }
    }
  }
}
