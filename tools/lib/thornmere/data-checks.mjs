/**
 * thornmere/data-checks.mjs — Thornmere's planners against values worked by hand or typed in from the source (CRC Handbook, NIST WebBook,
 * standard isomer counts). Never certified with the code that produced them.
 *
 *   node tools/lib/thornmere/data-checks.mjs      (also run by verify:thornmere)
 */
import * as D from '../../../src/learn/engine/thorndata.js';
import { installDomShim } from '../dom-shim.mjs';
if (typeof document === 'undefined') installDomShim({ tier: 'T1' });
const { heatContacts } = await import('../../../src/learn/table/kits/thorn-test.js');

export function runThornDataChecks({ ok, fail }) {
  const before = { n: 0 };
  const eq = (name, got, want, tol = 0) => {
    const good = typeof want === 'number' ? Math.abs(got - want) <= tol + 1e-9 : got === want;
    if (!good) { before.n++; fail(`thorndata: ${name} is ${got}, expected ${want}`); }
  };

  // Formulas: CnH2n+2 worked by hand.
  eq('alkaneH(1)', D.alkaneH(1), 4); eq('alkaneH(2)', D.alkaneH(2), 6); eq('alkaneH(5)', D.alkaneH(5), 12);
  eq('alkaneH(20)', D.alkaneH(20), 42); eq('alkaneH(30)', D.alkaneH(30), 62);
  eq('cyclohexane H', D.hydrogensFor(6, 1), 12); eq('ethene H', D.hydrogensFor(2, 1), 4); eq('benzene H', D.hydrogensFor(6, 4), 6);
  eq('formula ethane', D.formulaOf({ C: 2, H: 6 }), 'C₂H₆'); eq('formula methane', D.formulaOf({ C: 1, H: 4 }), 'CH₄');
  eq('formula C10H22', D.formulaOf({ C: 10, H: 22 }), 'C₁₀H₂₂');
  eq('links in 4', D.linksIn(4), 3); eq('links in 6', D.linksIn(6), 5); eq('links in 500', D.linksIn(500), 499); eq('links in 1', D.linksIn(1), 0);

  // The board's graph: hydrogens, rings, longest chain, identity.
  const T = D.TARGETS;
  const Hs = { ethane: 6, propane: 8, butane: 10, pentane: 12, hexane: 14, methylpropane: 10, methylbutane: 12, dimethylpropane: 12, methylpentane3: 14, cyclobutane: 8, cyclohexane: 12, ethene: 4, propene: 6 };
  for (const [k, h] of Object.entries(Hs)) eq(`hydrogens of ${k}`, D.hydrogensOf(T[k]), h);
  eq('rings cyclohexane', D.ringsOf(T.cyclohexane), 1); eq('rings pentane', D.ringsOf(T.pentane), 0); eq('doubles propene', D.doublesOf(T.propene), 1);
  eq('longest methylpentane3', D.longestChain(T.methylpentane3), 5); eq('longest dimethylpropane', D.longestChain(T.dimethylpropane), 3);
  eq('longest methylbutane', D.longestChain(T.methylbutane), 4);
  // 3-methylpentane drawn as a four-carbon line with a two-carbon branch on its second carbon is still 3-methylpentane.
  const drawn = D.skeleton([0, 1, 2, 3, 7, 13], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [1, 7, 1], [7, 13, 1]]);
  eq('2-ethylbutane as drawn is 3-methylpentane', D.canonKey(drawn), D.keyOf('methylpentane3'));
  eq('longest chain as drawn', D.longestChain(drawn), 5);
  // Bent butane is butane; 2-methylpropane is not.
  const bent = D.skeleton([0, 1, 7, 8], [[0, 1, 1], [1, 7, 1], [7, 8, 1]]);
  eq('bent butane', D.canonKey(bent), D.keyOf('butane'));
  if (D.keyOf('butane') === D.keyOf('methylpropane')) { before.n++; fail('thorndata: butane and 2-methylpropane share a key'); }
  if (D.keyOf('propene') === D.keyOf('propane')) { before.n++; fail('thorndata: propene and propane share a key'); }
  // Count the isomers of C4H10, C5H12 and C6H14 by building every tree on the lattice the board uses (6 by 3) and collecting keys.
  const W = 6, Hh = 3;
  const nb = i => { const c = i % W, r = (i - c) / W; const o = []; if (c > 0) o.push(i - 1); if (c < W - 1) o.push(i + 1); if (r > 0) o.push(i - W); if (r < Hh - 1) o.push(i + W); return o; };
  const count = n => {
    const keys = new Set(); const seenSets = new Set();
    const grow = (sites, bonds) => {
      if (sites.length === n) {
        const g = D.skeleton(sites, bonds);
        if (g.ids.every(i => D.usedBonds(g, i) <= 4)) keys.add(D.canonKey(g));
        return;
      }
      for (const s of sites) for (const t of nb(s)) {
        if (sites.includes(t)) continue;
        const sig = [...bonds.map(b => `${Math.min(b[0], b[1])}-${Math.max(b[0], b[1])}`), `${Math.min(s, t)}-${Math.max(s, t)}`].sort().join(',');
        if (seenSets.has(sig)) continue;
        seenSets.add(sig);
        grow([...sites, t], [...bonds, [s, t, 1]]);
      }
    };
    for (let s0 = 0; s0 < W * Hh; s0++) grow([s0], []);
    return keys.size;
  };
  eq('isomers of C4H10 on the board', count(4), 2); eq('isomers of C5H12 on the board', count(5), 3); eq('isomers of C6H14 on the board', count(6), 5);
  eq('ISOMER_COUNT[5]', D.ISOMER_COUNT[5], 3);

  // Tests (CRC / NIST values typed here).
  const BP = { pentane: 36.1, methylbutane: 27.9, dimethylpropane: 9.5, butane: -0.5, methylpropane: -11.7, ethanol: 78.4, methoxymethane: -24.8, ethane: -88.6, hexane: 68.7, cyclohexane: 80.7 };
  for (const [k, v] of Object.entries(BP)) eq(`bp ${k}`, D.boilOf(k), v);
  if (!(D.boilOf('pentane') > D.boilOf('methylbutane') && D.boilOf('methylbutane') > D.boilOf('dimethylpropane'))) { before.n++; fail('thorndata: C5H12 boiling points out of order'); }
  if (!(D.SUBSTANCES.pentane.contact > D.SUBSTANCES.methylbutane.contact && D.SUBSTANCES.methylbutane.contact > D.SUBSTANCES.dimethylpropane.contact)) { before.n++; fail('thorndata: contact lengths out of order'); }
  for (const k of ['ethene', 'hexene', 'pentene']) eq(`bromine fades with ${k}`, D.bromineFades(k), true);
  for (const k of ['ethane', 'hexane', 'cyclohexane', 'cyclopentane', 'benzene']) eq(`bromine fades with ${k}`, D.bromineFades(k), false);
  // pH of 0.1 mol/L ethanoic acid: x^2/(0.1 - x) = 1.75e-5 gives x = 1.314e-3, pH 2.88. Methylamine: x = 6.42e-3, pOH 2.19, pH 11.81.
  eq('pH ethanoic acid', D.SUBSTANCES.ethanoic.ph, 2.881, 0.005); eq('printed pH ethanoic acid', D.phOf('ethanoic'), 2.9);
  eq('pH methylamine', D.SUBSTANCES.methylamine.ph, 11.807, 0.005); eq('printed pH methylamine', D.phOf('methylamine'), 11.8);
  eq('pH ethanol', D.phOf('ethanol'), 7.0); eq('pH NaOH', D.phOf('naoh'), 13.0);
  eq('C-C', D.BOND_PM['C-C'], 154); eq('C=C', D.BOND_PM['C=C'], 134); eq('benzene', D.BOND_PM.benzene, 139);
  eq('benzene bond a', D.bondLengthPm('benzene-a', 'c0', 'c1'), 139); eq('benzene bond b', D.bondLengthPm('benzene-a', 'c1', 'c2'), 139);

  // The heat window draws two molecules lying together: the places they touch must fall in the order the boiling points do.
  const touch = k => heatContacts(k).touching.length;
  if (!(touch('pentane') > touch('methylbutane') && touch('methylbutane') > touch('dimethylpropane') && touch('butane') > touch('methylpropane'))) { before.n++; fail('thorndata: the heat window\'s contacts do not follow the boiling points'); }
  eq('ethanol and methoxymethane touch alike', touch('ethanol'), touch('methoxymethane'));

  // Where pairs are drawn: toward the more electronegative atom, in the order of the electronegativity difference.
  const pp = D.pairPlace;
  if (!(pp('C', 'O') > pp('C', 'N') && pp('C', 'N') > pp('C', 'Br') && pp('C', 'Br') > 0.5 && pp('C', 'H') < 0.5 && pp('H', 'Br') > 0.5 && pp('O', 'H') < 0.5)) { before.n++; fail('thorndata: pair places do not follow electronegativity'); }
  eq('pair place symmetric', pp('C', 'O') + pp('O', 'C'), 1, 1e-9); eq('pair place C-C', pp('C', 'C'), 0.5);

  // Mirror images: four different groups never match; two the same do.
  eq('twelve turns', D.TETRA_TURNS.length, 12);
  eq('CHFClBr chiral', D.isChiral(['H', 'F', 'Cl', 'Br']), true);
  eq('CH2ClBr not chiral', D.isChiral(['H', 'H', 'Cl', 'Br']), false);
  eq('2-chloropropane carbon not chiral', D.isChiral(['H', 'Cl', 'CH₃', 'CH₃']), false);
  eq('1-chloroethanol chiral', D.isChiral(['H', 'CH₃', 'OH', 'Cl']), true);
  const best = Math.max(...D.TETRA_TURNS.map((_, t) => D.mirrorMatches(['H', 'F', 'Cl', 'Br'], t)));
  eq('best match of a chiral centre', best, 2);

  // Scenes: every bond joins atoms that exist, every play's scenes exist and keep their atoms, charge is conserved along a play.
  for (const id of D.allSceneIds()) {
    const s = D.sceneOf(id);
    for (const [a, b] of s.bonds) if (!s.atoms[a] || !s.atoms[b]) { before.n++; fail(`thorndata: scene ${id} bonds a missing atom (${a}-${b})`); }
    for (const [a] of s.lone || []) if (!s.atoms[a]) { before.n++; fail(`thorndata: scene ${id} puts a lone pair on a missing atom (${a})`); }
    for (const [aid, A] of Object.entries(s.atoms)) {
      if (!D.EL[A.el]) { before.n++; fail(`thorndata: scene ${id} atom ${aid} has no element`); continue; }
      if (A.label) continue;
      const used = D.bondsOn(s, aid);
      const most = A.el === 'C' ? 4 : A.el === 'H' ? 1 : D.EL[A.el].bonds + Math.max(0, A.q || 0);
      if (used > most) { before.n++; fail(`thorndata: scene ${id} atom ${aid} (${A.el}) holds ${used} bonds`); }
      if (A.el === 'C' && !A.q && used !== 4 && Object.values(s.atoms).every(x => !x.label)) { before.n++; fail(`thorndata: scene ${id} carbon ${aid} holds ${used} bonds with no charge`); }
    }
  }
  for (const id of D.allPlayIds()) {
    const p = D.playOf(id);
    const charge = sid => Object.values(D.sceneOf(sid).atoms).reduce((q, a) => q + (a.q || 0), 0);
    const elems = sid => Object.values(D.sceneOf(sid).atoms).map(a => a.label || a.el).sort().join('');
    if (p.arrows.length !== p.scenes.length - 1) { before.n++; fail(`thorndata: play ${id} needs one arrow list per step`); }
    for (const sid of p.scenes) if (!D.sceneOf(sid)) { before.n++; fail(`thorndata: play ${id} names a missing scene ${sid}`); }
    for (let i = 1; i < p.scenes.length; i++) {
      if (charge(p.scenes[i]) !== charge(p.scenes[0])) { before.n++; fail(`thorndata: play ${id} does not conserve charge at step ${i}`); }
      if (elems(p.scenes[i]) !== elems(p.scenes[0])) { before.n++; fail(`thorndata: play ${id} does not conserve atoms at step ${i}`); }
    }
  }

  // The slice's arrows.
  const s0 = D.sceneOf('hbr-ethene-0');
  const right = { src: 'p:c1-c2', dst: 'hb' };
  eq('right arrow', D.judgeArrow(s0, 'p:c1-c2', 'hb', right).ok, true);
  for (const [src, dst] of [['p:c1-c2', 'br'], ['s:c1-h1', 'hb'], ['l:br:0', 'c1'], ['s:c1-c2', 'hb'], ['p:c1-c2', 'h3']]) {
    const j = D.judgeArrow(s0, src, dst, right);
    if (j.ok || !j.msg) { before.n++; fail(`thorndata: the arrow ${src} -> ${dst} is not refused with a reason`); }
  }
  eq('poorest atom of H-Br and ethene', D.poorestAtom(s0), 'hb');
  eq('poorest atom after step one', D.poorestAtom(D.sceneOf('hbr-ethene-1'), ['c1', 'c2', 'h1', 'h3', 'hb']), 'c2');

  if (!before.n) ok('thorndata: formulas, isomer identity and counts, boiling points, pH, bond lengths, pair places, mirror turns, scenes and arrows agree with hand-worked values');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let bad = 0;
  runThornDataChecks({ ok: m => console.log('ok  ', m), fail: m => { bad++; console.log('FAIL', m); } });
  process.exit(bad ? 1 : 0);
}
