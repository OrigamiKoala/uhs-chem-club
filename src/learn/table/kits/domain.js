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

import { registerKit } from './registry.js';
import {
  planHubJoin, hubPairable, paintHubKind, printedHub, faceKeyHub, paintHubLink, hubLinkRods, paintHubFixture, settleHubs,
  HUB_R, ARM_R
} from './domain-hub.js';
import {
  planFieldJoin, fieldPairable, runPlates, paintFieldKind, printedField, faceKeyField, paintFieldFixture, MOL_RECT, STREAM_RECT
} from './domain-field.js';
import {
  planOrbJoin, paintOrbKind, printedOrb, faceKeyOrb, paintOrbLink, orbLinkRods, paintOrbFixture, ORB_R
} from './domain-orbitals.js';
import { piecesIn } from './atoms.js';
import {
  LIGAR_SKIN, buildHubBall, buildArmBall, buildBalloonLobe, buildProtractor, buildEnamelTile, buildProbe, buildToolCap, ligarDeck
} from '../../engine/ligar-props.js';

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
    case 'mol': case 'dmol': case 'tmol': case 'stream': return buildEnamelTile(c, {});
    case 'arrows': return buildProbe(c, { text: p.label });
    case 'rod': return buildProbe(c, { text: p.label, rod: true });
    case 'swapper': case 'orb': return buildToolCap(c, { face: c.face() });
    default: return null;
  }
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
