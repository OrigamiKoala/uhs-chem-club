/**
 * cutscene/story.js — a world's arrival told as its own short story: a run of shots, each with its own camera, light
 * and action, cut together.
 *
 * A world spec with `shots` is played through `storyScene`; each shot is `{ dur, say?, cut?, paint(ctx, t, clock) }`,
 * where `t` runs from 0 inside the shot. `say: 'arrival'` puts the world's arrival line over it, `say: 'objective'` its
 * objective (the last shot must carry one). Shots open with a short fade from black unless `cut: 'hard'`. The player
 * holds on a spoken shot's last frame, so a spoken shot never fades out, and the frame on a boundary belongs to the
 * shot that is ending.
 */

import { win, frame, placeCard } from './kit.js';

/**
 * @param {{ id: string, name: string, sub?: string, shots: Array<{ dur: number, say?: 'arrival' | 'objective', cut?: 'hard', paint: Function }> }} spec
 * @param {[string, string]} lines  [arrival, objective]
 */
export function storyScene(spec, lines) {
  const shots = spec.shots;
  const ends = [];
  let total = 0;
  for (const s of shots) { total += s.dur; ends.push(total); }

  const paint = (ctx, T, clock) => {
    let i = 0;
    while (i < shots.length - 1 && T > ends[i]) i++;
    const s = shots[i];
    const t = T - (ends[i] - s.dur);
    s.paint(ctx, t, clock);
    const fadeIn = i === 0 ? 1 - win(t, 0, 0.6) : s.cut === 'hard' ? 0 : 1 - win(t, 0, 0.35);
    const next = shots[i + 1];
    const fadeOut = next && !s.say && next.cut !== 'hard' ? win(t, s.dur - 0.3, s.dur) : 0;
    frame(ctx, Math.max(fadeIn, fadeOut), clock);
    if (i === 0) placeCard(ctx, spec.name, spec.sub || '', win(t, 0.4, 1.2) * (1 - win(t, 3.6, 4.4)));
  };

  return {
    id: spec.id,
    beats: shots.map(s => ({ dur: s.dur, say: s.say === 'arrival' ? lines[0] : s.say === 'objective' ? lines[1] : (typeof s.say === 'string' ? s.say : undefined) })),
    duration: total,
    paint
  };
}
