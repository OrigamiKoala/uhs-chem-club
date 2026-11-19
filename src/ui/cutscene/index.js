/**
 * cutscene/index.js — every lore cutscene, by id: 'intro' for the campaign opening, and a world id ('erebus', 'unit01'...)
 * for that world's arrival. The lines are the story's own (`CAMPAIGN_STORY`, and each episode's `arrival` and `objective`
 * in `story/saga.js`), so the words never drift from the Case Board.
 *
 * A cutscene is `{ id, beats: [{ dur, say?, speaker? }], duration, paint(ctx, T, clock) }`, painted at 1280 x 720.
 */

import { CAMPAIGN_STORY, EPISODES } from '../../story/saga.js';
import { arrivalScene } from './arrival.js';
import { introScene } from './intro.js';
import { WORLDS_A } from './worlds-a.js';
import { WORLDS_B } from './worlds-b.js';
import { WORLDS_C } from './worlds-c.js';

const SPECS = { ...WORLDS_A, ...WORLDS_B, ...WORLDS_C };

const built = new Map();

/** The cutscene for `id`, or null. */
export function cutsceneFor(id) {
  if (built.has(id)) return built.get(id);
  let scene = null;
  if (id === 'intro') {
    scene = introScene(CAMPAIGN_STORY.map(s => s.text));
  } else if (SPECS[id] && EPISODES[id]) {
    const ep = EPISODES[id];
    scene = arrivalScene(SPECS[id], [ep.arrival, ep.objective]);
  }
  built.set(id, scene);
  return scene;
}

/** Every id that has a cutscene. */
export function cutsceneIds() {
  return ['intro', ...Object.keys(SPECS).filter(id => EPISODES[id])];
}
