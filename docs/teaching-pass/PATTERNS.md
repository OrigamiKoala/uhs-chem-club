# Teaching pass: redesign patterns

A short catalogue of ways to turn a stage that operates an instrument into a stage that teaches, each with a place in the code to copy from. Read it before planning a bench; name the pattern in the plan row's Change column.

Part A lists engine routes that already exist. Part B is filled by the exemplar sessions (Ember Reach, Lanternfall, Ligar): one entry per redesign they made that another world can copy. Keep every entry to the fault, the fix, and a pointer. Do not paste code here.

## A. Engine routes that exist today

| Route | What it does | Where |
| --- | --- | --- |
| Briefing | Two sentences shown before the stage. `briefing: { speaker, body }` on the stage object; the runner opens it on any stage that has one. Only boss phases use it today. | `src/learn/engine/stagerunner.js` (search `briefing`); example `src/learn/quests/unit04/boss-compressor.js` |
| Lead clip on a predict stage | A short clip of a neighbouring case, played before the student commits a prediction. | `leadFixture(...)` in `src/learn/quests/unit05/q7-gibbs.js`; clips in `src/learn/table/kits/heat-motion.js` (`lead`) and `matter-lead.js` |
| Tap a particle | A tap on a resting particle in the mechanism view sets a dial the stage already grades, so the check and the scripted solution do not change. | `kit.hotspots` in `src/learn/table/gestures.js`; used by the cell kit (`src/learn/table/kits/cell-*.js`) |
| Tap a place on the picture | The answer is a zone on the graph or vessel (above, on or below a line). Zones must use the painter's own scale. | `tapZones` in `src/learn/table/kits/pans-stress.js` and `heat.js` |
| Drag the apparatus | A piston, an atom pair or a ball on a line is dragged; `axis: 'x'` for along-the-bench, `invert` when down means more. | `tapDrag` in `src/learn/table/gestures.js`; `matter.js` (piston), `heat.js` |
| Drag the real object to the rail | Ranking moves the strips or samples themselves, not name cards standing for them. | Brinewire `q2-activity` (`src/learn/table/kits/cell-dip.js`) |
| Live mechanism view | A painter of state and `b.clock`; the kit's `live(state)` keeps the loop running; the 3D crowd is the same painter read through a recording context. | `src/learn/table/kits/heat-motion.js`, `matter-motion.js`, `pans-3d.js` (`dressRecorded`) |
| Miss replays the cause | `kit.onMiss` restarts the glides so the student sees again what their attempt did. | `src/learn/table/kits/matter.js`, `heat.js` |
| Glossary, banned words, recap | `TERMS` (term, gloss, first stage), `BANNED` (stand-in words), `NEEDS` (what a stage assumes, and the primer offered there). | `src/learn/glossary/ember.js`, `glossary/index.js`, `src/learn/engine/primers.js` |
| Worked problem | A guided calculation with the steps shown; lives in the bank and today opens after the bench. | `src/learn/bank/<unit>.json`, `src/ui/worked-problem.js`, `src/learn/worked.js` |
| Safe rename | Rewrites string literals only. Read the diff afterwards. | `tools/lib/rewrite-play-text.py` |

## B. Patterns from the exemplar worlds

Each exemplar session adds entries here in this form, as it finishes a bench:

```
### <fault type>: <short name>
- Before: <world> <quest> stage <n>, one line on what the student did and why it failed the standard.
- After: one line on what the student now does and sees.
- How: the route(s) from Part A, or the new helper, with file and function names.
- Use it when: the kind of stage in other worlds this fits.
- Cost: files touched; any check that had to change.
```

The fault types to cover, so that every kind of weak stage in the other seven worlds has an example:

1. The instrument prints the answer and the student ranks or sorts the readout.
2. The student sets a dial to a number the bench already shows.
3. A typed-number stage with a plate of figures and nothing the number describes.
4. A calculation used before it was taught (worked case placed before the first typed stage).
5. A card sort with no instrument.
6. The idea first appears in the reward card.
7. A predict stage with no model to predict from.
8. A convoluted answer form.
9. A boss phase that introduces a new idea or whose hints give the answer.
10. A world with no glossary: stand-in words replaced by real terms with glosses.

(No entries yet.)
