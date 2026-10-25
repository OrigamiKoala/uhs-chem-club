# Archived 2026-10-25

The quest story animation was reworked so that it **is** Vess's debrief: three to five lines of Vess, each said over the picture that shows
it, ending on the line filed to the case (see `src/story/quest-story.js`, `src/ui/story-anim.js`, `src/ui/story-kit.js`, and principle 22
in `PRODUCT.md`). What it replaced:

- `src/ui/story-scenes.js`: the seven Tallow painters as first drawn (flat discs, one sweep of `t`, no phases), and the scene registry before it
  spread the other worlds' painters.
- `src/ui/story-anim.js`: the player that ran after the debrief card, once, on a timer, with the captions read in a single pass.
- `src/story/quest-story.js`: the data as two to four `captions` per quest, for every world.
- `src/styles/story-anim-old.css`: the styles of that player.
- `src/ui/story-scenes-replaced.js`: six painters redrawn in `src/ui/story-scenes-finales.js` (`beam-dim`, `eater-lens`, `magnet-pull`,
  `warden-cut`, `warm-cylinder`, `crucible-open`), cut out of the world files they lived in.

The debrief card itself (`LearnFrame.showDebrief`, and each quest's `DEBRIEF`) is **not** retired: a quest with no animation still ends on it.
