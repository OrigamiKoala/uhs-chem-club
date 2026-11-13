# AP Chemistry Gap Implementation Plan

This plan implements the remaining flagged gaps from [AP-coverage-audit.md](file:///Users/carlliu/chem-3d/docs/AP-coverage-audit.md) that require new or updated quest stages (no quest/stage code was modified during the audit). All beyond-AP content in existing worlds (`unit02/q5-numbers`, `unit02/q10-wavefunctions`, `unit03/q9-orbitals`, `unit04/q5-speed` extras, `unit06/q5-crossing` phase diagrams, `unit06/q7-separate` boiling-point elevation, `unit07/q9-hsab`, `unit12`, `unit13`, `unit14`) stays untouched.

---

## Workstream 1 — High Priority (Completed — Restored Cut Stages)

### 1.1 CED 3.11: Electromagnetic Spectrum & Molecular Transitions (`unit02/q9-absorb.js`) — **Done**
- Restored `What Each Light Does` (microwave → spins/rotational, infrared → stretches/vibrational, UV-Vis → electronic) and `Three Readings` (wavelength classification) as Stages 6–7 of `unit02/q9-absorb.js`.

### 1.2 CED 8.11: pH and Solubility (`unit09/q8-capacity.js`) — **Done**
- Restored `pH and Solubility` (`Mg(OH)₂` vs `AgCl` with `solidFixture` from `ph-solid.js`) as Stage 8 of `unit09/q8-capacity.js`.

---

## Workstream 2 — Medium Priority (Completed)

### 2.1 CED 9.3 (`9.3.A.3`): Standard Free Energy from `ΔG°f` (`unit05/q7-gibbs.js`) — **Done**
- **Gap:** `ΔG°rxn = ΣΔGf°(products) − ΣΔGf°(reactants)` has only one MCQ (`q7-gibbs#5`) and no bench stage.
- **Target files:**
  - `src/learn/quests/unit05/q7-gibbs.js` (added Stage 6 `s6-formation` with `FORMATION_TABLE` including `O₂(g)` standard state `ΔGf° = 0`)
- **Verification:** `npm run verify:ember && npm run verify:teaching && npm run verify:learn`

### 2.2 CED 8.4 (`8.4.A.2`, `8.4.A.4`): Weak Acid + Strong Base Reaction Regimes (`unit09/q7-buffer.js`) — **Done**
- **Gap:** `q5-salts#w` and `q6-titrate#w` only work strong acid + strong base (`HCl + NaOH`). There is no stage calculating post-reaction species/pH when mixing a weak acid with a limiting amount of strong base (buffer formation) vs excess strong base.
- **Target files:**
  - `src/learn/quests/unit09/q7-buffer.js` (added Stage 8 `s8-half-equiv` mixing `CH₃COOH` + `NaOH` in 2:1 mole ratio)
  - `src/learn/bank/unit09.json` (added `q7-buffer#e2` `end` practice item)
- **Verification:** `npm run verify:verdigris && npm run verify:teaching && npm run verify:learn`

### 2.3 CED 3.1.A.5 & 3.2.A.7: Biomolecules and Polymers (`unit06/q2-grip.js`, `unit06/q4-solids.js`) — **Done**
- **Gap:** Noncovalent interactions in large biomolecules (DNA base-pair H-bonding, protein folding, hydrophobic/hydrophilic domains) and polymers (chain-length dispersion, cross-linking) are not represented.
- **Target files:**
  - `src/learn/quests/unit06/q2-grip.js` (added Stage 9 `s9-biomolecules`)
  - `src/learn/quests/unit06/q4-solids.js` (added Stage 6 `s6-polymers`)
  - `src/learn/bank/unit06.json` (added `q2-grip#e1`, `q4-solids#e1` `end` practice items)
- **Verification:** `npm run verify:mirrowen && npm run verify:teaching && npm run verify:learn`

---

## Workstream 3 — Low Priority (Completed)

### 3.1 CED 1.7 (`1.7.A.1`, `1.7.A.3`): Successive Ionization Energies & Periodic Estimation (`unit02/q7-pes.js`, `unit01/q3-catalogue.js`) — **Done**
- **Gap:** Successive IE jumps are now patched in `unit02/boss-eater#w` and taught in `unit12/q2-charges`, but `unit02/q8-trends.js` is already at the 9-stage bench limit.
- **Target files:**
  - `src/learn/quests/unit02/q7-pes.js` (added Stage 7 `s7-ie-group` reading an `IE₁–IE₄` table to identify Group 13)
  - `src/learn/quests/unit01/q3-catalogue.js` (added Stage 7 estimating potassium atomic radius from group neighbours `Li` and `Na`)
- **Verification:** `npm run verify:lanternfall && npm run verify:tallow && npm run verify:learn`

### 3.2 CED 1.4 (`1.4.A.2`): Purity from Elemental Analysis (`unit07/q6-stoich.js`) — **Done**
- **Gap:** Gravimetric precipitation purity is covered (`unit07/q5-ionic#w`), but purity from elemental mass % (comparing measured % C or % Ca of an impure sample against the pure compound's % composition) has no stage.
- **Target files:**
  - `src/learn/quests/unit07/q6-stoich.js` (added Stage 9 `s9-purity` for `% Ca` in impure `CaCO₃`)
  - `src/learn/bank/unit07.json` (added `q6-stoich#e1` `end` practice item)
- **Verification:** `npm run verify:kettle && npm run verify:learn`

---

## Acceptance Criteria

1. All 91 AP Chemistry CED topics and all 28 `EQN:` lines have **Covered** status in `docs/AP-coverage-audit.md`.
2. Every modified quest passes its world-specific verifier, teaching verifier, `npm run verify:learn`, `npm run verify:docs`, and `npm run build`.
3. `docs/AP-coverage-audit.md` and `CLAUDE.md` are updated once all workstreams are complete.
