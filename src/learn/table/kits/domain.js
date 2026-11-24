/**
 * kits/domain.js — The domain kit: hubs and their arms, molecules between charged plates, orbitals mixed and overlapped.
 *
 * LIGAR'S LAST THREE BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T3b): `q6-shape` (a hub that arms are
 * clipped to and push apart on, a protractor, a frame of sockets for a lone pair), `q7-polarity` (molecules put between
 * charged plates, an arrows tool, a charged rod brought to streams) and `q8-hybrid` (s, p and d orbitals dropped in a
 * mixing bowl, orbitals overlapped into bonds, the end of a bond turned). It is a thin wrapper over `vsepr.js`
 * (`planDomains`, `angleBetween`, `domainStrain`, `planDipole`, `planBlend`, `planTwist`), the planners the old domain rig
 * shared, and it authors nothing: what an arm settles at, whether a molecule turns, what a bowl makes and whether a bond
 * turns are the planner's answers, shown as the picture.
 *
 * The three families live in `domain-hub.js`, `domain-field.js` and `domain-orbitals.js`; this file puts them into one kit
 * (one id, `domain`) the way a table declares it.
 */

import * as THREE from 'three';
import { registerKit } from './registry.js';
import {
  planHubJoin, hubPairable, paintHubKind, printedHub, faceKeyHub, paintHubLink, hubLinkRods, paintHubFixture, settleHubs,
  HUB_R, ARM_R, turnOf, tiltOf, flipHubPiece, openingView, hubRead, pickedAngle, pickedSequence
} from './domain-hub.js';
import {
  planFieldJoin, fieldPairable, runPlates, paintFieldKind, printedField, faceKeyField, paintFieldFixture, fieldTapZones, MOL_RECT, STREAM_RECT,
  molRead, dmolPose, restVectors, viewFor, isFieldMol, arrowsOn
} from './domain-field.js';
import { buildMolModel } from '../../engine/ligar-mol3d.js';
import { YAW0 } from './domain-draw.js';
import {
  planOrbJoin, settleSeated, seatedOrb, paintOrbKind, printedOrb, faceKeyOrb, paintOrbLink, orbLinkRods, paintOrbFixture, ORB_R,
  runMixbowl, settleMixbowls
} from './domain-orbitals.js';
import { piecesIn } from './atoms.js';
import {
  LIGAR_SKIN, buildHubBall, buildArmBall, buildBalloonLobe, buildProtractor, buildEnamelTile, buildProbe, buildToolCap, ligarDeck
} from '../../engine/ligar-props.js';
import { buildOrbitalPiece3D, buildMixer3D, SEAT_FLOAT } from '../../engine/orbital-props.js';

export const DOMAIN_KIT_ID = 'domain';

/** A domain table is 150 x 64 units: a hub plate and a tray, two plates and a row of cards, or a bowl and an atom's orbitals. */
export const DOMAIN_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a table that never prints on it. */
export const DOMAIN_RECORDER = Object.freeze({ at: { x: 147.4, y: 61.6 }, size: { w: 5, h: 3.4 } });

function planJoin(a, b, state) {
  return planHubJoin(a, b, state) || planFieldJoin(a, b, state) || planOrbJoin(a, b, state)
    || { holds: false, reason: 'Those two do not join.' };
}

/** Which pairs have anything to do with each other: an arm with a hub, a tool with what it is laid on, an orbital with an orbital. */
function pairable(me, o, state) {
  for (const f of [hubPairable, fieldPairable]) {
    const v = f(me, o, state);
    if (v !== undefined) return v;
  }
  if (me.kind === 'orb') return o.kind === 'orb';
  return false;
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (f?.kind === 'plates') return runPlates(state, f);
  if (f?.kind === 'mixbowl') return runMixbowl(state, f);
  return null;
}

function settle(s) {
  settleHubs(s);
  settleSeated(s);
  settleMixbowls(s);
}

function paintPiece(ctx, p, state, o) {
  return paintHubKind(ctx, p, state, o) || paintFieldKind(ctx, p, state, o) || paintOrbKind(ctx, p, state, o);
}

function pick(...fns) {
  return (...args) => {
    for (const f of fns) { const v = f(...args); if (v !== undefined) return v; }
    return undefined;
  };
}

const printed = (p, state) => pick(printedHub, printedField, printedOrb)(p, state) ?? p.label;
const faceKey = (p, state) => pick(faceKeyHub, faceKeyField, faceKeyOrb)(p, state) ?? '';

function paintLink(ctx, link, o) {
  if (link?.tool) return true;
  return paintHubLink(ctx, link, o) || paintOrbLink(ctx, link, o);
}

const linkRods = link => (link?.tool ? 0 : hubLinkRods(link) ?? orbLinkRods(link) ?? 1);

function paintFixture(ctx, f, state, b) {
  return paintHubFixture(ctx, f, state, b) || paintFieldFixture(ctx, f, state, b) || paintOrbFixture(ctx, f, state, b);
}

/** A piece as the solid thing it is (`ligar-props.js`): a hub is a cast ball, an arm a ball on a stem, a molecule an enamelled tile. */
function piece3d(p, state, c) {
  if (c.skin !== LIGAR_SKIN) return null;
  switch (p.kind) {
    case 'hub': { const f = c.faceInfo({ physical: true }); return buildHubBall(c, { face: f.mat, body: f.body }); }
    case 'arm': { const f = c.faceInfo({ physical: true }); return buildArmBall(c, { face: f.mat, body: f.body, mult: p.props.mult || 1 }); }
    case 'balloon': return buildBalloonLobe(c);
    case 'protractor': return buildProtractor(c, { face: c.face() });
    case 'mol': case 'dmol': case 'tmol': {
      // The card is a tile with the molecule standing on it, built from the vectors the flat picture projects.
      const tile = buildEnamelTile(c, {});
      const read = molRead(p);
      const pose = isFieldMol(p) ? dmolPose(p, state) : { vectors: restVectors(p, read), view: viewFor(read), turned: false };
      const net = read.polar ? read.dip.net.map(x => x / read.dip.mag) : null;
      const model = buildMolModel(c, {
        hub: read.hub,
        vectors: pose.vectors,
        // The flat picture seen from its own turn; a molecule swung by the field lies true to the plates.
        yaw: pose.turned ? 0 : (read.plan.n === 1 ? pose.view.yaw : YAW0),
        arrows: arrowsOn(state, p) ? read.dip.arrows : null,
        net: arrowsOn(state, p) && net ? (pose.turned ? [-1, 0, 0] : (p.props.flipped ? [-net[0], net[1], -net[2]] : net)) : null,
        orbitals: p.props.orbitals || null
      }, tile.userData.height);
      tile.add(model);
      return tile;
    }
    case 'stream': return buildEnamelTile(c, {});
    case 'arrows': return buildProbe(c, { text: p.label });
    case 'rod': return buildProbe(c, { text: p.label, rod: true });
    case 'swapper': return buildToolCap(c, { face: c.face() });
    case 'orb': return buildOrbitalPiece3D(c, p, state);
    default: return null;
  }
}

/** Helper: rotate a VSEPR unit vector by the hub's current yaw and tilt. */
function rotatedDir(v, yaw, tilt) {
  const x1 = v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw);
  const y1 = v[1];
  const z1 = -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
  const wx = x1;
  const wy = y1 * Math.cos(tilt) - z1 * Math.sin(tilt);
  const wz = y1 * Math.sin(tilt) + z1 * Math.cos(tilt);
  return new THREE.Vector3(wx, wy, wz).normalize();
}

/** Paint a crisp amber angle badge onto a small canvas for a floating 3D Sprite. */
function drawAngleBadgeCanvas(canvas, text) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(14, 13, 10, 0.92)';
  ctx.fillRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#e59b24';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = '#f2b84b';
  ctx.font = '700 42px "Quantico", "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
}

/** 3D floating angle arc, midair degree label, and selection rings for a VSEPR hub. */
function buildHubAngle3D(f, state, c) {
  const { toPlate, ground, scale: s } = c;
  const root = new THREE.Group();
  const arcMat = c.own(new THREE.MeshBasicMaterial({ color: 0xf2a629 }));
  const ringMat = c.own(new THREE.MeshBasicMaterial({ color: 0xf2a629, side: THREE.DoubleSide }));

  let arcMesh = null;
  const selRings = [];
  for (let i = 0; i < 3; i++) {
    const rMesh = new THREE.Mesh(new THREE.RingGeometry(ARM_R * s * 0.95, ARM_R * s * 1.15, 24), ringMat);
    rMesh.visible = false;
    root.add(rMesh);
    selRings.push(rMesh);
  }

  // Floating billboard label
  let sprite = null;
  let spriteCanvas = null;
  let spriteTex = null;
  let lastText = '';
  if (typeof document !== 'undefined') {
    spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 200;
    spriteCanvas.height = 84;
    spriteTex = new THREE.CanvasTexture(spriteCanvas);
    spriteTex.colorSpace = THREE.SRGBColorSpace;
    const spMat = c.own(new THREE.SpriteMaterial({ map: spriteTex, transparent: true, depthTest: false, depthWrite: false }));
    sprite = new THREE.Sprite(spMat);
    sprite.renderOrder = 20;
    sprite.visible = false;
    root.add(sprite);
  }

  function sync(_f, st) {
    const hubId = _f.props?.hub;
    const hub = st.pieces?.[hubId];
    if (arcMesh) { root.remove(arcMesh); arcMesh.geometry.dispose(); arcMesh = null; }
    for (const r of selRings) r.visible = false;
    if (sprite) sprite.visible = false;
    if (!hub) return;

    const r = hubRead(st, hub.id);
    if (!r.n) return;
    const view = openingView(r.plan.vectors);
    const yaw = view.yaw + turnOf(st, hub);
    const tilt = tiltOf(st, hub);

    const plHub = toPlate(hub.at);
    const hubCenter = new THREE.Vector3(plHub.x, ground + HUB_R * s * 2.4, plHub.z);
    const bondDist = 18.0 * s;

    // Position helper for any piece in the 3-atom sequence
    const posOf = id => {
      if (id === hub.id) return hubCenter.clone();
      const idx = r.index(id);
      if (idx < 0 || !r.plan.vectors[idx]) return null;
      const dir = rotatedDir(r.plan.vectors[idx].v, yaw, tilt);
      const dist = r.arms[idx]?.kind === 'balloon' ? 13.0 * s : bondDist;
      return hubCenter.clone().addScaledVector(dir, dist);
    };

    const seq = pickedSequence(st, hub.id);
    seq.forEach((id, k) => {
      const pos = posOf(id);
      if (!pos || !selRings[k]) return;
      selRings[k].position.copy(pos);
      selRings[k].rotation.x = -Math.PI / 2;
      selRings[k].visible = true;
    });

    const read = pickedAngle(st, hub.id);
    if (!read) return;
    const ia = r.index(read.a);
    const ib = r.index(read.b);
    if (ia < 0 || ib < 0) return;

    const dirA = rotatedDir(r.plan.vectors[ia].v, yaw, tilt);
    const dirB = rotatedDir(r.plan.vectors[ib].v, yaw, tilt);
    const dot = Math.max(-1, Math.min(1, dirA.dot(dirB)));
    const omega = Math.acos(dot);
    const arcRad = 9.5 * s;
    const steps = 24;
    const pts = [];
    let midDir;

    if (omega > Math.PI - 0.04) {
      const perp = Math.abs(dirA.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      midDir = new THREE.Vector3().crossVectors(dirA, perp).normalize();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        pts.push(hubCenter.clone().addScaledVector(dirA, Math.cos(a) * arcRad).addScaledVector(midDir, Math.sin(a) * arcRad));
      }
    } else {
      const sinO = Math.sin(omega) || 1;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const d = dirA.clone().multiplyScalar(Math.sin((1 - t) * omega) / sinO)
          .addScaledVector(dirB, Math.sin(t * omega) / sinO)
          .normalize();
        pts.push(hubCenter.clone().addScaledVector(d, arcRad));
      }
      midDir = dirA.clone().add(dirB).normalize();
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.48 * s, 8, false);
    arcMesh = new THREE.Mesh(tubeGeo, arcMat);
    root.add(arcMesh);

    if (sprite && spriteCanvas && spriteTex) {
      const text = `${read.angle}°`;
      if (text !== lastText) {
        drawAngleBadgeCanvas(spriteCanvas, text);
        spriteTex.needsUpdate = true;
        lastText = text;
      }
      const labelPos = hubCenter.clone().addScaledVector(midDir, arcRad + 5.8 * s);
      // Keep label cleanly above the plate
      labelPos.y = Math.max(ground + 4.5 * s, labelPos.y);
      sprite.position.copy(labelPos);
      sprite.scale.set(13.5 * s, 5.7 * s, 1);
      sprite.visible = true;
    }
  }

  sync(f, state);
  root.userData.sync = sync;
  return root;
}

/** 3D fixture dressing: physical mixing vortex and blossoming 3D hybrid orbitals for the mixer, and floating 3D angle arc/label on hubs. */
function dress3d(f, state, c) {
  if (f.kind === 'mixbowl') {
    return buildMixer3D(f, state, c);
  }
  if (f.kind === 'hubplate') {
    return buildHubAngle3D(f, state, c);
  }
  return null;
}

/**
 * Solid positioning for domain pieces on the bench: the hub ball floats above its emitter base,
 * and attached arms/balloons spread out around it in true 3D space according to their VSEPR vectors.
 */
function piecePose3d(p, state, c) {
  // A seated orbital stands in the atom's own plane, above the plate, wherever it is carried.
  if (seatedOrb(p)) return { x: c.pl.x, y: c.ground + SEAT_FLOAT * c.s + (c.lift || 0), z: c.pl.z, hideBase: true };
  if (c.isDragging) return null;
  if (p.kind === 'hub') {
    return { x: c.pl.x, y: c.ground, z: c.pl.z };
  }
  if (p.kind === 'arm' || p.kind === 'balloon') {
    const hubId = p.joinedTo?.find(id => state.pieces[id]?.kind === 'hub');
    if (!hubId) return null;
    const hub = state.pieces[hubId];
    if (!hub) return null;
    const r = hubRead(state, hub.id);
    const idx = r.index(p.id);
    if (idx < 0 || !r.plan?.vectors?.[idx]) return null;

    const v = r.plan.vectors[idx].v;
    const view = openingView(r.plan.vectors);
    const yaw = view.yaw + turnOf(state, hub);
    const tilt = tiltOf(state, hub);

    // Rotate unit vector around vertical Y axis (yaw), then around X axis (tilt) for smooth 3D joystick orbiting
    const x1 = v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw);
    const y1 = v[1];
    const z1 = -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
    const wx = x1;
    const wy = y1 * Math.cos(tilt) - z1 * Math.sin(tilt);
    const wz = y1 * Math.sin(tilt) + z1 * Math.cos(tilt);
    const dir = new THREE.Vector3(wx, wy, wz).normalize();

    const plHub = c.toPlate(hub.at);
    const floatY = HUB_R * c.s * 2.4;
    const hubCenterX = plHub.x;
    const hubCenterY = c.ground + floatY;
    const hubCenterZ = plHub.z;

    if (p.kind === 'balloon') {
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const lobeDist = 13.0 * c.s;
      const targetX = hubCenterX + lobeDist * wx;
      const targetY = hubCenterY + lobeDist * wy;
      const targetZ = hubCenterZ + lobeDist * wz;
      return {
        x: targetX,
        y: targetY,
        z: targetZ,
        quaternion: quat,
        hideBase: true,
        centerLobe: true
      };
    }

    const bondDist = 18.0 * c.s;
    const targetX = hubCenterX + bondDist * wx;
    const targetY = hubCenterY + bondDist * wy;
    const targetZ = hubCenterZ + bondDist * wz;

    const cy = ARM_R * c.s * 0.82 * (0.2 + 0.88);

    return {
      x: targetX,
      y: targetY - cy,
      z: targetZ,
      hideBase: true
    };
  }
  return null;
}

export const DOMAIN_KIT = {
  id: DOMAIN_KIT_ID,
  joinGap: 1.25,
  kinds: {
    hub: { r: HUB_R },
    arm: { r: ARM_R, tool: true, target: true },
    balloon: { r: ARM_R, tool: true, target: true },
    protractor: { r: 6.5, tool: true, onTop: true },
    mol: { r: 9, rect: MOL_RECT, nojoin: true },
    dmol: { r: 9, rect: MOL_RECT },
    tmol: { r: 9, rect: MOL_RECT, flip: true },
    stream: { r: 9, rect: STREAM_RECT },
    arrows: { r: 8.5, tool: true, onTop: true },
    rod: { r: 6.5, tool: true, onTop: true },
    swapper: { r: 6.5, tool: true, onTop: true },
    orb: { r: ORB_R }
  },
  planJoin,
  pairable,
  flip: flipHubPiece,
  run,
  settle,
  piece3d,
  piecePose3d,
  dress3d,
  deck3d: ligarDeck,
  paintPiece,
  printed,
  faceKey,
  paintLink,
  linkRods,
  paintFixture,
  tapZones: fieldTapZones
};

registerKit(DOMAIN_KIT);

/** A stage's declaration with the domain kit's defaults: the kit, the bounds, a parked recorder strip. */
export function domainTable(spec) {
  return { kit: DOMAIN_KIT_ID, bounds: { ...DOMAIN_BOUNDS }, tools: [], recorder: DOMAIN_RECORDER, ...spec };
}

export { piecesIn };
export * from './domain-hub.js';
export * from './domain-field.js';
export * from './domain-orbitals.js';
