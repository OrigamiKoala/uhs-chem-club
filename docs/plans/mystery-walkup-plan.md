# Quest questions, opening scenes and world troubles — plan

Started 2026-11-20. Feedback: Vess debriefs ended on a Case Pin that answered a question the player was never asked
("lower absorbance means the water is polluted" when nobody said the water was polluted).

## Decisions (user, 2026-11-20)

| Question | Answer |
|---|---|
| Where the question lives | `mystery` on each non-Toolkit entry of `src/story/quest-story.js`; the Case Pin is its answer (pins may be edited to fit; benches may not). |
| How it is asked | 3D On, and the question has something to see: an opening scene in the world. Otherwise (3D Off, nothing to see, a boss): the question card. Stage 1 leads with it; the debrief shows it again above the Case Pin. |
| Wording | Clear and simple: what is visibly wrong, then the question, fitted to what the bench already shows. No terms the player has not met. |
| Opening scenes | Fully scripted, controls off (like the voyage); the player never roams to the problem. Ends with a fade, the player back at the bench, the bench opening. Every time the bench is opened. |
| Variety | Each world opens its benches its own way, from a mix of shapes: a hooded Fifth figure seen and followed until it slips away, something going wrong in view, a crew member walking up and leading the way, crew found arguing, someone calling the player over, a radio voice guiding, a trail on the ground, an alarm with a crew member running to it. No two worlds share the same set (held by `verify:intros`). |
| Problem props | Whatever suits the question: a kit prop, with an effect where something is visibly wrong. |
| Quest symptom | On until the bench is cleared; held off then on during a replayed scene that has a "something happens" moment. |
| World symptom | Each world's arrival trouble shows until its boss is beaten (Lanternfall's lamps sputter, Brinewire's grid browns out, hot cylinders, frosted pipes, frozen boats, nodding pumps, acid pools, sparking clamps, flaring vents, warm drums...). |
| Scope | All 14 Learn worlds in one pass. |

## Per world

| World | Opening |
|---|---|
| Tallow | Crew arguing at the raided bin and drums; boot prints in the salt to a scraped tank |
| Lanternfall | Things fail in the dark in front of you; the crew call out from out of sight |
| Ligar | Rescue crew fetch you and lead the way at a fast walk |
| Bellows | Alarms: the view snaps round, a deck hand runs to it, you follow |
| Ember Reach | Shelter crew arguing over the frost; the fitter fetches you to a pipe |
| Mirrowen | A hooded figure on the ice, gone as you approach; ice cutter and chemist arguing |
| Kettle | Arguments over crates and a pond; the weighmaster calls you over to an impossible stack |
| Teeter | A hooded figure tending dead ponds and a pump at dusk; old hands arguing over crusted pipes |
| Verdigris | Talked in over the radio by fort crew who can see the damage |
| Brinewire | A hooded figure caught at the pylons, sparks after it runs; a battery bank dies in front of you |
| Quicklight | A vent flares, the view whips round, tower crew come running |
| Lodestone | Tally crew arguing over drums; the magnet grabs a drum by itself |
| Thornmere | Tar drag marks followed from the bench; outpost crew walk you to drums and armor |
| Cinder Halo | Hooded figures at the drums and slag; the radiation monitor leads you by his counter |

## Progress

- [x] Question per quest, pin as its answer, question card, stage 1 lead, debrief and Case Board show the question
- [x] Prop kit (`three/mystery/props.js`), effect kit (`effects.js`), cloaked figure (`cloak.js`)
- [x] Scene director (`director.js`) and stage hook (`stage.playIntro`, `screens/learn-world.js`)
- [x] Problems in the world (`site.js`), built by `attachCrew` before the crew's walk grid
- [x] Spot picker (`tools/npc/pick-spots.mjs`, two rounds) and `verify:intros` (data, spots, variety, headless playthrough)
- [x] 44 scenes and 24 world-trouble props across 14 worlds; questions rewritten to fit the benches
- [x] `npm run verify` (41 checks + build) passes
- [ ] In-browser test by the user (look, pacing, camera, the hooded figure, lamp sputter, touch)
- [ ] User review of every scene's lines and every question
