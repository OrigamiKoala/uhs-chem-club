# Retired 2026-10-22

Code that nothing in `src/` imported any more, moved here instead of deleted (paths mirror the repo).
Nothing here is built, imported or checked: `vite`, `npm run verify` and the tools all ignore `archive/`.

| File | Why it is here |
| --- | --- |
| `src/learn/engine/quest-guide.js` | The Objective & Guide modal copy. No callers; "no modal precedes a stage". |
| `src/learn/engine/bondbench.js`, `pairboard.js`, `paircontrols.js`, `rigcontrols.js` | Ligar's drawn plate benches, replaced by tabletops on the Ligar kit. |
| `src/learn/engine/boxrack.js` | Lanternfall's box rack plate bench, replaced by tabletops. |
| `src/learn/engine/gasrig.js` | Bellows' gas rig (`GasRig`), replaced by the gas kit. `recordCurve` lives in `gasdata.js`. |
| `src/learn/engine/calorimeter.js` | Ember Reach's calorimeter plate bench, replaced by the heat kit. |
| `src/three/materials/fresnel.js` | An unused material. |
| `tools/verify-learn-legacy-plate-blocks.txt` | The `verify:learn` blocks that drew those plate benches (`st.rigs`), cut from `tools/verify-learn.mjs`. No quest declares `rigs` any more. |

To bring a file back, copy it to the same path under the repo root.
