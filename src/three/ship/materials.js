/**
 * ship/materials.js — Every surface the Avalon is built from.
 *
 * One palette for the whole ship, so a bolt in the engine room is the same
 * bolt as a bolt on the bridge. The ship is a used freighter: grey painted
 * panels chalked by forty years of hands, gunmetal frames worn bright where a
 * shoulder brushes them, dark treadplate, and light that comes from inside
 * things — troughs, lamps, screens. Nothing blooms.
 *
 * WORLD-SPACE TEXTURE SCALE. A panel material declares `userData.worldUV`
 * (metres per texture tile) and `applyWorldUVs` in `kit.js` re-maps every
 * mesh that wears it from its world position, box-projected on the dominant
 * normal. Without it a 0.2 m bracket and a 9 m bulkhead both carry exactly
 * one copy of the texture, which is the single loudest tell of a scene built
 * from primitives: the rivets are the size of the object instead of the size
 * of rivets.
 *
 * SEAMS AND FASTENERS ARE PARTS, NOT PAINT. The lining is assembled from
 * modelled panels, ribs and plates, and a seam grid or a rivet row drawn in a
 * world-scale texture cannot line up with them: it crosses a locker door at
 * whatever height the tile happens to fall. So every lining material is one
 * unbroken sheet (`panels: 0`) that carries grain, wear and staining only, and
 * the parts supply the joints. Only the hull plating, laid in runs many tiles
 * long, wears a plate pattern.
 */

import * as THREE from "three";
import {
  platedMetal, treadPlate, buildMaterial, texSize,
  dressMaterialFromAlbedo, sedimentaryRock
} from "../materials/pbr-kit.js";
import {
  createHazardStripesTexture,
  createCrtScreenTexture,
  createControlPanelTexture,
  createKeyboardTexture,
  createFootlockerTexture,
  createBlastDoorTexture,
  createRackPanelTexture,
  createDialGaugeTexture,
  createContainerStencilTexture,
  createVacuumTubeTexture
} from "../materials/textures.js";

/** Tag a material with the size, in metres, of one texture tile. */
function worldUV(mat, metres) {
  mat.userData.worldUV = metres;
  return mat;
}

/** Painted sheet, chipped back to metal at its worn spots. */
function worn(opts, metres) {
  return worldUV(buildMaterial(
    platedMetal({ panels: 0, rivets: false, size: texSize(256), ...opts }),
    { repeat: 1, roughness: 1.0 }
  ), metres);
}

/**
 * Bare metal: metallic all over, its wear carried by the roughness map
 * (scaled by `roughScale`) and the albedo's mottle.
 */
function bare(opts, metres, metalness, roughScale) {
  const mat = worn(opts, metres);
  mat.metalnessMap = null;
  mat.metalness = metalness;
  mat.roughness = roughScale;
  return mat;
}

export function createShipMaterials() {
  const M = {};

  /*
   * STRUCTURE.
   *
   * `/art/durasteel_plate.jpg` is the authority for the hull itself — the
   * outer plating, the aft blast wall, the heavy structural members — and its
   * normal, roughness and occlusion are derived from the picture so the light
   * agrees with it. A procedural plate stands in until the image arrives.
   */
  M.durasteelMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#3b3c3e', metal: '#63605c', rust: '#6c4326',
      panels: 2, seed: 5, weather: 0.34, size: texSize(512)
    }),
    { repeat: 1, roughness: 1.0 }
  ), 1.6);
  M.durasteelMat.color.setHex(0xb9b6b2);
  M.durasteelMat.normalScale.set(0.95, 0.95);
  M.durasteelMat.aoMapIntensity = 0.8;
  dressMaterialFromAlbedo(M.durasteelMat, "/art/durasteel_plate.jpg", {
    repeat: 1, size: texSize(512), strength: 2.6, normalScale: 1.1,
    onReady: mat => { mat.color.setHex(0xffffff); }
  });

  // The bulkhead cores between compartments: dark, rarely seen except as the
  // shadowed seam between two panels, which is exactly what it is for.
  M.bulkheadMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#2a2b2d', metal: '#4a4843', rust: '#5a3822',
      panels: 0, seed: 61, weather: 0.4, size: texSize(256)
    }),
    { repeat: 1, roughness: 1.0 }
  ), 2.0);
  M.bulkheadMat.color.setHex(0x8a8884);

  /*
   * WALL PANELS. The skin every compartment is lined with: a pale warm grey,
   * pressed in a fine grid, worn at the edges. Two tones so a wall is never
   * one flat field — the darker one is for insets, lower courses and the
   * recessed centres of raised panels.
   */
  M.panelMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#6a6a66', metal: '#8a867d', rust: '#6c4a30',
      panels: 0, seed: 71, weather: 0.26, size: texSize(512), grain: 0.7
    }),
    { repeat: 1, roughness: 1.0 }
  ), 2.6);
  M.panelMat.normalScale.set(0.8, 0.8);
  M.panelMat.aoMapIntensity = 0.7;

  M.panelDarkMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#3a3b3c', metal: '#5f5c56', rust: '#5d3b24',
      panels: 0, seed: 83, weather: 0.34, size: texSize(512)
    }),
    { repeat: 1, roughness: 1.0 }
  ), 2.4);
  M.panelDarkMat.aoMapIntensity = 0.8;

  // Structural frames, portals and ribs: gunmetal, oiled, bright on the edges.
  M.ribMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#43454a', metal: '#7d7a73', rust: '#5b3a24',
      panels: 0, seed: 97, weather: 0.45, size: texSize(256)
    }),
    { repeat: 1, roughness: 1.0, metalness: 0.55 }
  ), 1.8);
  /*
   * SMALL PARTS. Brackets, housings, frames, handrails and fittings make up
   * most of what the eye lands on, so none of them is a flat colour: each is
   * painted sheet with its edges chipped back to metal, mottled by hands and
   * dulled by grime, on a fine world-scale tile so the wear is part-sized.
   * Bare steel and brass keep their metal everywhere and take their wear as
   * roughness: polished where handled, dull and filmed everywhere else.
   */
  M.trimMat = worn({ paint: '#3d3f43', metal: '#87847c', rust: '#5b3a24', seed: 151, weather: 0.55 }, 1.1);
  M.gunmetalMat = worn({ paint: '#2a2c2f', metal: '#6b6963', rust: '#4f3421', seed: 163, weather: 0.5 }, 1.0);
  M.steelMat = bare({ paint: '#7f7d78', metal: '#9b988f', rust: '#5f4a36', seed: 177, weather: 0.6 }, 0.9, 0.8, 0.72);
  M.greebleMat = worn({ paint: '#535458', metal: '#8a877f', rust: '#5d3b24', seed: 181, weather: 0.6 }, 1.0);
  M.ventMat = new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.86, metalness: 0.35 });
  M.rubberMat = new THREE.MeshStandardMaterial({ color: 0x151413, roughness: 0.96, metalness: 0.0 });
  M.cableMat = new THREE.MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.84, metalness: 0.05 });
  // Faded livery paint: the rust-orange band a freighter's owners striped on
  // the frames decades ago and nobody has touched up since.
  M.liveryMat = worn({ paint: '#72432a', metal: '#6e6a62', rust: '#5a3520', seed: 191, weather: 0.75 }, 1.4);
  M.paintWhiteMat = worn({ paint: '#a29d91', metal: '#77746d', rust: '#6a4a30', seed: 197, weather: 0.65 }, 1.4);

  // Deckhead: darker, busier plate, seen from below.
  M.ceilingMat = worldUV(buildMaterial(
    platedMetal({
      paint: '#2f3033', metal: '#55524c', rust: '#4f3421',
      panels: 0, seed: 113, weather: 0.32, size: texSize(256)
    }),
    { repeat: 1, roughness: 1.0 }
  ), 2.0);

  // Pressure vessels (the furnace drum, the engine casing): dark rolled sheet
  // wrapped round the barrel on the cylinder's own UVs, twice about and once
  // along, so it closes on itself with no projection seam.
  M.vesselMat = buildMaterial(
    platedMetal({
      paint: '#333436', metal: '#5c5953', rust: '#5a3822',
      panels: 0, seed: 131, weather: 0.42, size: texSize(512)
    }),
    { repeat: [2, 1], roughness: 1.0 }
  );

  /*
   * THE DECK. Treadplate ground flat along the line people take; deck tiles
   * lifted in a grid over it, and grating over the lit service channels.
   */
  M.floorMat = worldUV(buildMaterial(
    treadPlate({ base: '#3f4247', seed: 21, weather: 0.7, size: texSize(512) }),
    { repeat: 1, roughness: 1.0 }
  ), 1.4);
  M.floorMat.normalScale.set(1.4, 1.4);
  M.floorMat.aoMapIntensity = 0.9;

  M.deckTileMat = worldUV(buildMaterial(
    treadPlate({ base: '#46484b', seed: 37, weather: 0.8, size: texSize(512) }),
    { repeat: 1, roughness: 1.0 }
  ), 1.2);
  M.deckTileMat.normalScale.set(1.2, 1.2);
  M.grateMat = new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.7, metalness: 0.65 });

  // The engine room's floor plate: scorched, and never repainted.
  M.ashMat = buildMaterial(
    sedimentaryRock({ warm: '#5a4a3a', cool: '#3b332c', seed: 44, size: texSize(256) }),
    { repeat: [3, 1], roughness: 1.0, metalness: 0.0 }
  );

  // Legacy names the room builders still ask for.
  M.brassMat = bare({ paint: '#7a6233', metal: '#9a7c42', rust: '#4a4a32', seed: 211, weather: 0.6 }, 0.8, 0.85, 0.82);
  M.ironMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.9, metalness: 0.4 });
  M.fireboxMat = new THREE.MeshStandardMaterial({ color: 0x2a211c, roughness: 0.95, metalness: 0.45 });

  M.hazardTex = createHazardStripesTexture(256, 64);
  M.hazardMat = new THREE.MeshStandardMaterial({ map: M.hazardTex, roughness: 0.72, metalness: 0.22 });

  /*
   * GLASS. The canopy and the viewports. Mostly clear, faintly smoked, with
   * a hard specular so the room reflects in it at a grazing angle — which is
   * what tells the eye there is glass there at all.
   */
  M.glassMat = new THREE.MeshStandardMaterial({
    color: 0x1b2127, roughness: 0.05, metalness: 0.9,
    transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide
  });
  M.screenGlassMat = new THREE.MeshStandardMaterial({ color: 0x0b0d0f, roughness: 0.18, metalness: 0.3 });

  /*
   * LIGHT. The only unlit-shader surfaces aboard are things that are lamps.
   */
  M.halogenMat = new THREE.MeshBasicMaterial({ color: 0xd99423 });
  M.luminaireMat = new THREE.MeshBasicMaterial({ color: 0xffe6b0 });
  M.luminaireWarmMat = new THREE.MeshBasicMaterial({ color: 0xffcaa0 });
  M.troughMat = new THREE.MeshBasicMaterial({ color: 0xf3dcb4 });
  M.stripAmberMat = new THREE.MeshBasicMaterial({ color: 0xc98a2e });
  M.stripDimMat = new THREE.MeshBasicMaterial({ color: 0x5a3f1c });
  M.underglowMat = new THREE.MeshBasicMaterial({ color: 0x8a5a1e });
  M.emberMat = new THREE.MeshBasicMaterial({ color: 0xe0762a });
  M.amberLampMat = new THREE.MeshBasicMaterial({ color: 0xd99423 });
  M.greenLampMat = new THREE.MeshBasicMaterial({ color: 0x6f9a3a });
  M.redLampMat = new THREE.MeshBasicMaterial({ color: 0xb8382c });

  /* SCREENS AND INSTRUMENTS. */
  M.crtAmberTex = createCrtScreenTexture("TELEMETRY", "amber");
  M.crtGreenTex = createCrtScreenTexture("ANALYSIS RF", "green");
  M.crtRadarTex = createCrtScreenTexture("RADAR", "green");
  M.crtReactorTex = createCrtScreenTexture("REACTOR", "amber");
  M.crtAmberMat = new THREE.MeshBasicMaterial({ map: M.crtAmberTex });
  M.crtGreenMat = new THREE.MeshBasicMaterial({ map: M.crtGreenTex });
  M.crtRadarMat = new THREE.MeshBasicMaterial({ map: M.crtRadarTex });
  M.crtReactorMat = new THREE.MeshBasicMaterial({ map: M.crtReactorTex });
  M.crtTelemetryMat = M.crtAmberMat;

  M.controlPanelTex = createControlPanelTexture(512, 256);
  M.controlPanelMat = new THREE.MeshStandardMaterial({ map: M.controlPanelTex, roughness: 0.75, metalness: 0.28 });
  M.keyboardTex = createKeyboardTexture(512, 256);
  M.keyboardMat = new THREE.MeshStandardMaterial({ map: M.keyboardTex, roughness: 0.72, metalness: 0.25 });

  M.fabricMat = new THREE.MeshStandardMaterial({ color: 0x3d3930, roughness: 0.95, metalness: 0.05 });
  M.leatherMat = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.72, metalness: 0.05 });
  M.paddingMat = new THREE.MeshStandardMaterial({ color: 0x4a463e, roughness: 0.9, metalness: 0.0 });

  M.footlockerOrtegaTex = createFootlockerTexture(512, 256, "CREW 12 // J. ORTEGA");
  M.footlockerOrtegaMat = new THREE.MeshStandardMaterial({ map: M.footlockerOrtegaTex, roughness: 0.85, metalness: 0.35 });
  M.footlockerCadetTex = createFootlockerTexture(512, 256, "CREW 14 // CADET ISSUE");
  M.footlockerCadetMat = new THREE.MeshStandardMaterial({ map: M.footlockerCadetTex, roughness: 0.85, metalness: 0.35 });

  M.blastDoorTex = createBlastDoorTexture(512, 512);
  M.blastDoorMat = new THREE.MeshStandardMaterial({ map: M.blastDoorTex, roughness: 0.82, metalness: 0.52 });

  M.rackPanelTex = createRackPanelTexture(512, 512);
  M.rackPanelMat = new THREE.MeshStandardMaterial({ map: M.rackPanelTex, roughness: 0.8, metalness: 0.45 });

  M.dialGaugePsiTex = createDialGaugeTexture(256, 256, "PSI");
  M.dialGaugeBarTex = createDialGaugeTexture(256, 256, "BAR");
  M.dialGaugePsiMat = new THREE.MeshStandardMaterial({ map: M.dialGaugePsiTex, roughness: 0.4, metalness: 0.5 });
  M.dialGaugeBarMat = new THREE.MeshStandardMaterial({ map: M.dialGaugeBarTex, roughness: 0.4, metalness: 0.5 });

  M.containerMat = new THREE.MeshStandardMaterial({
    map: createContainerStencilTexture(512, 512, "MM", "44-B"), roughness: 0.88, metalness: 0.3
  });

  M.vacuumTubeTex = createVacuumTubeTexture(128, 256);
  M.vacuumTubeMat = new THREE.MeshBasicMaterial({ map: M.vacuumTubeTex, transparent: true, opacity: 0.92 });

  return M;
}
