/**
 * story-scenes-thornmere.js — Vess's debrief painters for Thornmere (unit13), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Each scene replays the bench's own reactions from `thorndata.js` with the bench's own painter (`thorn-mol.js`), so
 * what Vess talks over is the picture the player worked on. Each bench adds its painter to `THORNMERE_SCENES` under its own marker.
 */

import { C, text, ground, win, ease } from './story-kit.js';
import { playOf, sceneOf, substance } from '../learn/engine/thorndata.js';
import { fitScenes, drawScene } from '../learn/table/kits/thorn-draw.js';
import { drawPlay } from '../learn/table/kits/thorn-mol.js';
import '../learn/engine/thorn-scenes/q1-chains.js';
import '../learn/engine/thorn-scenes/q3-isomers.js';
import '../learn/engine/thorn-scenes/q4-groups.js';
import '../learn/engine/thorn-scenes/q5-reactions.js';
import '../learn/engine/thorn-scenes/q6-polymers.js';
import { drawTwist, drawMirrorPair } from '../learn/table/kits/thorn-space.js';

/** The bench painters draw in a fixture's frame; on the story plate one unit is one pixel. */
export const PX = Object.freeze({ x: d => d, y: d => d, len: d => d, size: (k, min = 6.5) => Math.max(min, k) });

/** Play a `thorndata` reaction inside `rect` ({x, y, w, h} px), `k` running 0 to 1 over the whole of it. */
export function playIn(ctx, playId, rect, k, { pairs = true, unit = 110 } = {}) {
  const P = playOf(playId);
  const G = fitScenes(P.scenes.map(sceneOf), rect, unit);
  drawPlay(ctx, PX, G, P, Math.max(0, Math.min(1, k)) * (P.scenes.length - 1), { pairs });
}
/** Draw one scene inside `rect`. */
export function sceneIn(ctx, sceneId, rect, o = {}) {
  const S = sceneOf(sceneId);
  drawScene(ctx, PX, fitScenes([S], rect, o.unit || 110), S, o);
}

/* ---- q1-chains: ethane, propane, cyclohexane, each counted on the plate ---- */
function chains(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 230, y: 100, w: 500, h: 320 };
  const show = (id, head, a) => {
    text(ctx, head, 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    ctx.globalAlpha = ease(a); sceneIn(ctx, id, rect); ctx.globalAlpha = 1;
  };
  if (t < 0.33) show('ethane', 'Ethane: two carbons, six hydrogens', win(t, 0.02, 0.12));
  else if (t < 0.67) show('propane', 'Propane: three carbons, eight hydrogens', win(t, 0.35, 0.45));
  else show('cyclohexane', 'Cyclohexane: six carbons, twelve hydrogens', win(t, 0.69, 0.79));
}

/* ---- q3-isomers: two skeletons of C₄H₁₀; a double bond that springs back; a mirror image that never matches ---- */
function isomers(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.33) {
    text(ctx, 'C₄H₁₀, connected two ways', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    ctx.globalAlpha = ease(win(t, 0.02, 0.12));
    sceneIn(ctx, 'skel-butane', { x: 110, y: 160, w: 320, h: 220 }, { skeletal: true });
    sceneIn(ctx, 'skel-2-methylpropane', { x: 530, y: 160, w: 320, h: 220 }, { skeletal: true });
    ctx.globalAlpha = 1;
  } else if (t < 0.67) {
    text(ctx, '1,2-Dichloroethene: cis and trans forms', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    const k = win(t, 0.36, 0.64);
    const a = (Math.PI / 2) * Math.sin(Math.PI * Math.min(1, k * 1.2));
    drawTwist(ctx, PX, 290, 290, 96, substance('dichloroethene12').ends, Math.max(0, a));
    drawTwist(ctx, PX, 670, 290, 96, substance('dichloroethene12').ends, Math.PI, { remade: true });
    text(ctx, 'cis (same side)', 290, 440, { size: 18, color: C.dust, align: 'center', weight: 600 });
    text(ctx, 'trans (opposite sides)', 670, 440, { size: 18, color: C.dust, align: 'center', weight: 600 });
  } else {
    text(ctx, 'CHFClBr and its mirror image', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    const turn = Math.min(11, Math.floor(win(t, 0.7, 0.95) * 12));
    drawMirrorPair(ctx, PX, { x: 120, y: 110, w: 720, h: 360 }, substance('bromochlorofluoromethane').groups, turn, { from: turn, k: 1 });
  }
}

/* ---- q4-groups: the –OH group; the ethanoate's shared charge; the amine's pair ---- */
function groups(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 230, y: 100, w: 500, h: 330 };
  if (t < 0.33) {
    text(ctx, 'Ethanol: the –OH group', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    ctx.globalAlpha = ease(win(t, 0.02, 0.12)); sceneIn(ctx, 'ethanol', rect, { pairs: true, lit: ['a:o', 'a:ho'] }); ctx.globalAlpha = 1;
  } else if (t < 0.67) {
    text(ctx, 'Ethanoate: the charge moves between oxygens', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'ethanoate-shift', rect, ease(win(t, 0.36, 0.62)));
  } else {
    text(ctx, 'Methylamine takes a proton from water', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'amine-water', rect, ease(win(t, 0.7, 0.93)));
  }
}

/* ---- q5-reactions: substitution; an ester made; an ester broken ---- */
function reactions(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 200, y: 100, w: 560, h: 330 };
  if (t < 0.33) {
    text(ctx, 'Hydroxide and bromoethane', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'sub-oh', rect, ease(win(t, 0.03, 0.3)));
  } else if (t < 0.67) {
    text(ctx, 'Ethanoic acid and ethanol make an ester', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'ester-make', rect, ease(win(t, 0.36, 0.64)));
  } else {
    text(ctx, 'Hydroxide breaks the ester link', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'ester-break', rect, ease(win(t, 0.7, 0.93)));
  }
}

/* ---- q6-polymers: the chain grows; water falls at each link; glycine joins glycine ---- */
function polymers(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 120, y: 100, w: 720, h: 330 };
  if (t < 0.33) {
    text(ctx, '2-Methylpropene joins into a chain', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'chain-grow', rect, ease(win(t, 0.03, 0.3)), { pairs: false, unit: 70 });
  } else if (t < 0.67) {
    text(ctx, 'One water molecule at every link', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'cond-chain', rect, ease(win(t, 0.36, 0.64)), { pairs: false, unit: 90 });
  } else {
    text(ctx, 'Two glycines join by an amide link', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'gly-join', rect, ease(win(t, 0.7, 0.93)), { unit: 80 });
  }
}

/* ---- boss-carapace: the wax counted, the link's poor carbon, the chain cut ---- */
function carapace(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 120, y: 110, w: 720, h: 320 };
  if (t < 0.33) {
    text(ctx, 'Wax: C₃₀H₆₂', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    ctx.globalAlpha = ease(win(t, 0.02, 0.12)); sceneIn(ctx, 'skel-pentane', { x: 280, y: 160, w: 400, h: 200 }, { skeletal: true }); ctx.globalAlpha = 1;
  } else if (t < 0.67) {
    text(ctx, 'One link of the armor', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    ctx.globalAlpha = ease(win(t, 0.35, 0.45)); sceneIn(ctx, 'amide', { x: 250, y: 120, w: 460, h: 300 }, { pairs: true, lit: ['a:c'] }); ctx.globalAlpha = 1;
  } else {
    text(ctx, 'The chain, cut at its amide links', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    const cut = win(t, 0.72, 0.9);
    sceneIn(ctx, 'polyamide', rect, { pairs: false, lit: cut > 0.5 ? ['b:c1-n1', 'b:n2-c2'] : [] });
  }
}

/* ---- q2-unsat: bromine reaches the second pair; H–Br adds in two steps ---- */
function unsat(ctx, w, h, t) {
  ground(ctx, w, h);
  const rect = { x: 250, y: 90, w: 460, h: 330 };
  if (t < 0.33) {
    text(ctx, 'Bromine and a double bond', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'br2-ene', rect, ease(win(t, 0.03, 0.3)));
  } else if (t < 0.67) {
    text(ctx, 'Ethene and H–Br: the first pair moves', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'hbr-step1', rect, ease(win(t, 0.36, 0.62)));
  } else {
    text(ctx, 'The bromide ion\'s pair moves', 480, 60, { size: 26, color: C.text, align: 'center', weight: 700 });
    playIn(ctx, 'hbr-step2', rect, ease(win(t, 0.7, 0.93)));
  }
}

export const THORNMERE_SCENES = {
  'thorn-chains': chains,
  'thorn-unsat': unsat,
  'thorn-isomers': isomers,
  'thorn-groups': groups,
  'thorn-reactions': reactions,
  'thorn-polymers': polymers,
  'thorn-carapace': carapace
  // q4-groups
  // q5-reactions
  // q6-polymers
  // boss-carapace
};
