/**
 * story-scenes-thornmere.js — Vess's debrief painters for Thornmere (unit13), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Each scene replays the bench's own reactions from `thorndata.js` with the bench's own painter (`thorn-mol.js`), so
 * what Vess talks over is the picture the player worked on. Each bench adds its painter to `THORNMERE_SCENES` under its own marker.
 */

import { C, text, ground, win, ease } from './story-kit.js';
import { playOf, sceneOf } from '../learn/engine/thorndata.js';
import { fitScenes, drawScene } from '../learn/table/kits/thorn-draw.js';
import { drawPlay } from '../learn/table/kits/thorn-mol.js';

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
  'thorn-unsat': unsat
  // q1-chains
  // q3-isomers
  // q4-groups
  // q5-reactions
  // q6-polymers
  // boss-carapace
};
