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
  HUB_R, ARM_R, turnOf, openingView, hubRead
} from './domain-hub.js';
import {
  planFieldJoin, fieldPairable, runPlates, paintFieldKind, printedField, faceKeyField, paintFieldFixture, MOL_RECT, STREAM_RECT,
  molRead, dmolPose, restVectors, viewFor, isFieldMol, arrowsOn
} from './domain-field.js';
import { buildMolModel } from '../../engine/ligar-mol3d.js';
import { YAW0 } from './domain-draw.js';
import {
  planOrbJoin, paintOrbKind, printedOrb, faceKeyOrb, paintOrbLink, orbLinkRods, paintOrbFixture, ORB_R
} from './domain-orbitals.js';
import { piecesIn } from './atoms.js';
import {
  LIGAR_SKIN, buildHubBall, buildArmBall, buildBalloonLobe, buildProtractor, buildEnamelTile, buildProbe, buildToolCap, ligarDeck
} from '../../engine/ligar-props.js';
import { buildOrbitalPiece3D, buildMixer3D } from '../../engine/orbital-props.js';

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
  return null;
}

function settle(s) {
  settleHubs(s);
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
        net: arrowsOn(state, p) && net ? (pose.turned ? [-1, 0, 0] : (p.props.flipped ? [-net[0], net[1], -net[2]] : net)) : null
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

/** 3D fixture dressing: physical mixing vortex and blossoming 3D hybrid orbitals for the mixer. */
function dress3d(f, state, c) {
  if (f.kind === 'mixbowl') {
    return buildMixer3D(f, state, c);
  }
  return null;
}

/**
 * Solid positioning for domain pieces on the bench: the hub ball floats above its emitter base,
 * and attached arms/balloons spread out around it in true 3D space according to their VSEPR vectors.
 */
function piecePose3d(p, state, c) {
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

    // Rotate unit vector around vertical Y axis
    const wx = v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw);
    const wy = v[1];
    const wz = -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
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
    arrows: { r: 6.5, tool: true, onTop: true },
    rod: { r: 6.5, tool: true, onTop: true },
    swapper: { r: 6.5, tool: true, onTop: true },
    orb: { r: ORB_R }
  },
  planJoin,
  pairable,
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
  paintFixture
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
