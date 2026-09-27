/**
 * world.js — Erebus, the Charge Gardens: the world a player walks at T4.
 *
 * A dry basin on a desert moon under a ringed gas giant, at low sun. The
 * twenty pylons stand on the rim of an old lakebed; outside the rim a dune sea
 * climbs toward buttes on the horizon; the wreck of something enormous lies in
 * the haze to the west.
 *
 * This file is the orchestrator and the public face the rest of the app knows:
 * `scene`, `data`, `colliders`, `pylonMeshes`, `terrainMesh`,
 * `getTerrainHeight`, `setClearedStages`, `update` and `getAimTargets` are the
 * same contract they always were. What the world is MADE of lives beside it in
 * `erebus/`:
 *
 *   terrain.js    the height function (analytic, so the walk and the Node
 *                 checks stand on the drawn ground), one mesh to the horizon,
 *                 and the sand / lakebed / bedrock surface
 *   atmosphere.js the sky, the sun, aerial perspective on every material, the
 *                 gas giant and its moon behind the air
 *   rocks.js      one geology for every stone: strata by altitude, fractured
 *                 boulders, buttes and spires, the arch
 *   landmarks.js  what stands in the walk: outcrops with their scree, the arch,
 *                 the bones, the derelict
 *   vista.js      what stands beyond it: the buttes on the horizon and the wreck
 *   lander.js     SANDSTALKER
 *   effects.js    the air moving: dust at the eye, sand streaming over the
 *                 ground, dust devils walking the far flats
 */

import * as THREE from "three";
import {
  saltHardpan, sedimentaryRock,
  buildMaterial, texSize, heightField, asDataTexture, fbm,
  boltRing, cableRun, placard, hazardStripe, mergeStatic
} from "./materials/pbr-kit.js";
import erebusData from "./world-data/erebus.json" with { type: "json" };
import { tierAtLeast } from "./tier.js";
import { aimBox } from "./aim-target.js";
import { makeHeightField, buildTerrainGeometry, createTerrainMaterial, buildShadowCaster } from "./erebus/terrain.js";
import {
  createSkyDome, createCelestials, createLights, followShadow, createSkyEnvironment,
  applyAtmosphereToScene, skyUniforms, SKY
} from "./erebus/atmosphere.js";
import { createRockMaterial, createStrataTexture } from "./erebus/rocks.js";
import { buildLander } from "./erebus/lander.js";
import { duneSand, hullMaterial, addDustCover } from "./erebus/surfaces.js";
import { buildLandmark } from "./erebus/landmarks.js";
import { buildVista } from "./erebus/vista.js";
import { createEffects } from "./erebus/effects.js";

export class WorldScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = erebusData;
    this.scene = new THREE.Scene();
    this.scene.name = "erebus";

    this.pylonMeshes = [];
    this.pylonIndicators = [];
    this.terrainMesh = null;
    this.colliders = []; // Radial obstacles { x, z, radius } and AABBs
    // The ground runs to the horizon; the voyage must not lay its own ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast("T4");
    this.time = 0;

    this.field = makeHeightField(this.data);

    this.initSurfaces();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initSurveyLander();
    this.initRockLandmarks();
    this.initVista();
    this.initPylons();
    this.initAtmosphericDust();

    // Every surface in the world takes the air, including the ones built above.
    applyAtmosphereToScene(this.scene);
  }

  /** The ground under (x, z). Pure and analytic: the drawn mesh is built from it. */
  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  /**
   * The textures every surface shares, generated once. Sand, lakebed clay and
   * the bedded-rock detail all come off pbr-kit's height-field generators, so
   * each map set agrees with itself.
   */
  initSurfaces() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const withAniso = (m) => {
      for (const t of [m.map, m.normalMap, m.roughnessMap, m.aoMap]) if (t) t.anisotropy = aniso;
      return m;
    };
    this.sandSet = withAniso(buildMaterial(
      duneSand({ size: texSize(1024), seed: 9 }),
      { repeat: 1 }
    ));
    this.playaSet = withAniso(buildMaterial(
      saltHardpan({ size: texSize(512), seed: 21, pale: '#d2b08a', deep: '#86644a', bloom: '#e6d2b4' }),
      { repeat: 1 }
    ));
    const macro = heightField(texSize(256), (u, v) =>
      fbm(u * 4, v * 4, { octaves: 5, period: 4, seed: 0x811 })
    );
    this.macroMap = asDataTexture(macro, 1);
    this.strataMap = createStrataTexture();
    this.rockDetail = withAniso(buildMaterial(
      sedimentaryRock({ warm: '#a08a72', cool: '#6c5f50', seed: 33, size: texSize(512) }),
      { repeat: 1 }
    ));
    this.rockMat = createRockMaterial({
      detail: this.rockDetail, sand: this.sandSet.map, macro: this.macroMap, strata: this.strataMap
    });
  }

  initLighting() {
    const { sun, hemi } = createLights({ shadows: this.t4 });
    this.sunLight = sun;
    this.scene.add(sun, sun.target, hemi);

    /*
     * The haze. The world's materials read `fogNear` / `fogFar` from this fog,
     * but their fog is aerial perspective toward the sky in the direction they
     * are seen (atmosphere.js), so the colour here is only what the voyage's
     * cloud deck is tinted with on the way down.
     */
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = SKY.haze.clone();

    const env = createSkyEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.55;
    }
  }

  initSky() {
    this.sky = createSkyDome(900);
    this.scene.add(this.sky);
    this.celestials = createCelestials();
    this.scene.add(this.celestials);
  }

  initTerrain() {
    const geo = buildTerrainGeometry(this.field, { step: this.t4 ? 1.25 : 2.0, growth: this.t4 ? 1.085 : 1.12, tile: 5 });
    const mat = createTerrainMaterial({
      sand: this.sandSet, playa: this.playaSet, macro: this.macroMap, strata: this.strataMap
    });
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.name = "erebus-ground";
    this.terrainMesh.userData.phys = 'ground';   // everything is bedded into it
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = false;
    this.scene.add(this.terrainMesh);
    // Dunes shade the troughs behind them, through a coarse copy of the ground
    // that only the sun's shadow camera draws (layer 1).
    if (this.t4) {
      this.scene.add(buildShadowCaster(this.field));
      this.sunLight.shadow.camera.layers.enable(1);
    }
  }

  initSurveyLander() {
    const lander = this.data.landmarks.find(l => l.asset === "lander");
    if (!lander) return;
    const gx = lander.pos[0], gz = lander.pos[2];
    const gy = this.getTerrainHeight(gx, gz);
    const c = Math.cos(lander.rotY), s = Math.sin(lander.rotY);
    // Ground under a point in the lander's own frame, relative to its origin.
    const groundAt = (lx, lz) => this.getTerrainHeight(gx + lx * c + lz * s, gz - lx * s + lz * c) - gy;
    const { group, beaconMat } = buildLander({ groundAt });
    group.position.set(gx, gy, gz);
    group.rotation.y = lander.rotY;
    this.landerBeacon = beaconMat;
    this.scene.add(group);

    this.colliders.push({ x: gx, z: gz, radius: 4.5 });
  }

  initRockLandmarks() {
    const ctx = {
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      rockMat: this.rockMat,
      rockDetail: this.rockDetail,
      sandMap: this.sandSet.map,
      macro: this.macroMap,
      t4: this.t4
    };
    for (const lm of this.data.landmarks) {
      if (lm.asset === "lander") continue;
      if (lm.minTier === "T4" && !this.t4) continue;
      const built = buildLandmark(lm, ctx);
      if (!built) continue;
      this.scene.add(built.group);
      this.colliders.push(...built.colliders);
    }
  }

  initVista() {
    this.vistaRockMat = createRockMaterial({
      detail: this.rockDetail, sand: this.sandSet.map, macro: this.macroMap, strata: this.strataMap
    }, { lite: true });
    this.vista = buildVista({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      rockMat: this.vistaRockMat,
      t4: this.t4
    });
    this.scene.add(this.vista);
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
    // Field-painted plate, bleached and sand-scoured; a pylon is walked up to
    // and studied, so this one keeps full size.
    const mastMat = hullMaterial({ tint: '#8c7864', dust: 0.6 });

    // The crown is fired ceramic, not metal: matte, non-conductive, crazed.
    const ceramicMat = buildMaterial(
      sedimentaryRock({ warm: '#7a6f5f', cool: '#544c42', seed: 61, size: texSize(256) }),
      { repeat: [3, 1], roughness: 1.0, metalness: 0.0 }
    );
    ceramicMat.normalScale.set(0.9, 0.9);

    // Cast iron that has stood in the sand for years: dull, dusty, brown.
    const ironMat = addDustCover(new THREE.MeshStandardMaterial({
      color: 0x5a4d42,
      roughness: 0.84,
      metalness: 0.35
    }), { amount: 0.8, sharp: [0.35, 0.8], film: 0.18 });
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
      pylonGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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
    this.effects = createEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4
    });
    this.scene.add(this.effects.group);
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
    this.time += delta;
    skyUniforms.uTime.value = this.time;
    if (cameraPosition) {
      followShadow(this.sunLight, cameraPosition);
      this.effects?.update(delta, this.time, cameraPosition);
    }
    // The lander's tail beacon: a slow double blink, the one sign it is still powered.
    if (this.landerBeacon) {
      const ph = this.time % 2.6;
      const on = ph < 0.08 || (ph > 0.3 && ph < 0.38);
      this.landerBeacon.color.setHex(on ? 0xff6a30 : 0x3a140a);
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
          boxes: [aimBox([lander.pos[0], gy + 2.6, lander.pos[2]], [2.2, 1.6, 4.4], lander.rotY)]
        });
      }
    }
    return this._aimTargets;
  }
}
