/**
 * cutscene/index.js — every lore cutscene, by id: 'intro' for the campaign opening, and a world id ('erebus', 'unit01'...)
 * for that world's arrival. The lines are the story's own (`CAMPAIGN_STORY`, and each episode's `arrival` and `objective`
 * in `story/saga.js`), so the words never drift from the Case Board.
 *
 * A cutscene is `{ id, beats: [{ dur, say?, speaker? }], duration, paint(ctx, T, clock) }`, painted at 1280 x 720.
 */

import { CAMPAIGN_STORY, EPISODES } from '../../story/saga.js';
import { arrivalScene } from './arrival.js';
import { storyScene } from './story.js';
import { PLOTS_A } from './plots-a.js';
import { PLOTS_B } from './plots-b.js';
import { PLOTS_C } from './plots-c.js';
import { introScene } from './intro.js';
import { WORLDS_A } from './worlds-a.js';
import { WORLDS_B } from './worlds-b.js';
import { WORLDS_C } from './worlds-c.js';

const SPECS = { ...WORLDS_A, ...WORLDS_B, ...WORLDS_C };
/** What happens after each world's opening incident: its own story, shot by shot (`plots-*.js`). */
const PLOTS = { ...PLOTS_A, ...PLOTS_B, ...PLOTS_C };

const built = new Map();

/** The cutscene for `id`, or null. */
export function cutsceneFor(id) {
  if (built.has(id)) return built.get(id);
  let scene = null;
  if (id === 'intro') {
    scene = introScene(CAMPAIGN_STORY.map(s => s.text));
  } else if (SPECS[id] && EPISODES[id]) {
    const ep = EPISODES[id];
    const spec = SPECS[id];
    const lines = [ep.arrival, ep.objective];
    scene = PLOTS[id]
      ? storyScene({ ...spec, shots: [{ dur: spec.incidentDur || 5.2, say: 'arrival', paint: spec.incident }, ...PLOTS[id]] }, lines)
      : arrivalScene(spec, lines);
  }
  built.set(id, scene);
  return scene;
}

/** Every id that has a cutscene. */
export function cutsceneIds() {
  return ['intro', ...Object.keys(SPECS).filter(id => EPISODES[id])];
}
