/**
 * q4-solids — held to the CRC Handbook's melting points and to the standard fixed points of glass, worked independently here.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bweak/i, /\bionic\b/i, /\bions?\b/i, /\bbecause\b/i],
  3: [/\bamorphous\b/i, /\bcrystal/i, /\bpattern\b/i, /\border\b/i, /\bjumbled\b/i, /\bglass\b/i],
  4: [/\bpattern\b/i, /\brepeat/i, /\bregular\b/i, /\brows?\b/i, /\bjumbled\b/i, /\bglass\b/i],
  5: [/\bbecause\b/i, /\bconduct/i, /\bbrittle\b/i, /\bmalleable\b/i, /\bmetals?\b/i],
  6: [/\bbecause\b/i, /\bconduct/i, /\bbrittle\b/i, /\bmalleable\b/i, /\bno pattern\b/i, /\bglass\b/i]
};

export async function check({ q, mod, MD, near, same, holds, start, done }) {
  const T = await import('../../../src/learn/engine/matterdata-tester.js');
  const S = T.SOLIDS;
  // CRC (melting points, °C) and the standard glass fixed points (Corning 7980 fused silica, 0080 soda-lime), as worked here by hand.
  const CRC = { ice: 0, naphthalene: 80.26, iodine: 113.7, salt: 800.7, potassium: 770, copper: 1084.6, iron: 1538, quartz: 1713 };
  for (const [id, v] of Object.entries(CRC)) {
    near(S[id].melt.lo, v, 0.6, `${q}: ${id} melting point`);
    holds(S[id].melt.lo === S[id].melt.hi, `${q}: ${id} is a crystal and must fall at one temperature`);
  }
  near(S.silica.melt.lo, 1042, 5, `${q}: fused silica annealing point`); near(S.silica.melt.hi, 1585, 5, `${q}: fused silica softening point`);
  near(S.glass.melt.lo, 510, 5, `${q}: soda-lime annealing point`); near(S.glass.melt.hi, 696, 6, `${q}: soda-lime softening point`);
  holds(S.silica.melt.hi < S.quartz.melt.lo, `${q}: fused silica is runny before quartz melts`);

  // The kind of every sample is the CED's: metals flatten and light the lamp cold; salts shatter and light it only molten; the rest do not light it cold.
  for (const id of Object.keys(S)) {
    const s = S[id];
    if (s.kind === 'metallic') holds(s.strike === 'flattens' && s.current.cold && s.current.molten, `${q}: ${id} is a metal`);
    if (s.kind === 'ionic') holds(s.strike === 'shatters' && !s.current.cold && s.current.molten, `${q}: ${id} is a salt`);
    if (s.kind === 'molecular') holds(!s.current.cold && !s.current.molten && S[id].melt.lo < 150, `${q}: ${id} is a molecular solid`);
    if (s.kind === 'network') holds(!s.current.cold && !s.current.molten && s.strike === 'shatters', `${q}: ${id} is a network solid`);
    holds(s.crystalline === (s.melt.lo === s.melt.hi), `${q}: ${id}'s crystalline flag disagrees with its melting range`);
  }

  // The answers each stage grades.
  const C = mod.CHECKS;
  for (const s of C.S1) same(s.tray, S[s.solid].melt.lo < 150 && S[s.solid].kind === 'molecular' ? 'grips' : 'stronger', `${q} stage 1 (${s.id}'s tray)`);
  for (const s of C.S3) same(s.tray, S[s.solid].melt.lo === S[s.solid].melt.hi ? 'one' : 'range', `${q} stage 3 (${s.id}'s tray)`);
  for (const s of C.S4) same(s.tray, S[s.solid].crystalline ? 'crystalline' : 'amorphous', `${q} stage 4 (${s.id}'s tray)`);
  for (const s of [...C.S5, ...C.S6]) same(s.tray, S[s.solid].kind, `${q} sealed (${s.id}'s tray)`);
  holds(new Set(C.S5.map(s => s.tray)).size === 4 && new Set(C.S6.map(s => s.tray)).size === 5, `${q}: a sealed stage has two samples of one kind`);
  // The heater: stage 1 stops at 200 °C, so only the low melters fall; every other stage heats past every sample's last fall.
  holds(C.S1.every(s => (S[s.solid].melt.hi <= 200) === (s.tray === 'grips')), `${q} stage 1: the 200 °C heater does not split the samples`);
  for (const s of [...C.S3, ...C.S5, ...C.S6]) holds(S[s.solid].melt.hi <= 2000, `${q}: ${s.id} never runs inside the 2000 °C heater, so the molten lamp could not be tested`);

  // A sealed sample is not read off its card; the tests are the evidence, and the window must not be on a sealed stage.
  for (const i of [4, 5]) holds(!Object.values(start(mod, i).fixtures).some(f => f.props.view === 'window'), `${q} stage ${i + 1}: the window shows a sealed sample's picture`);
  holds(Object.values(start(mod, 3).fixtures).every(f => f.noRun && f.props.view === 'window'), `${q} stage 4: the picture stage still has a test`);
  // Stage 6's trap: the glass agrees with the salt on the hammer and on both lamps; only the melt trace tells them apart.
  const g = S.glass; const k = S.potassium;
  holds(g.strike === k.strike && g.current.cold === k.current.cold && g.current.molten === k.current.molten && g.melt.lo !== g.melt.hi && k.melt.lo === k.melt.hi, `${q} stage 6: the glass and the salt do not differ only in the trace`);
  // ...and in stage 3 quartz and fused silica are the same atoms.
  same(S.quartz.formula, S.silica.formula, `${q} stage 3: quartz and fused silica are not the same atoms`);
  // The click: the glass is runny before the crystal of the same atoms starts to melt, so "higher" is false, and "alike" is false.
  holds(S.silica.melt.hi < S.quartz.melt.lo && S.silica.melt.lo !== S.silica.melt.hi, `${q} stage 2: the prediction cards are not each wrong or right as written`);

  // The predict stage shows no instrument and no loose tool; no stage is solved by the untouched table.
  holds(!Object.keys(start(mod, 1).fixtures).length, `${q} stage 2: the predict stage shows an instrument`);
  for (const i of [0, 2, 3, 4, 5]) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);

  // What the cards keep after the solution is played on the real table, against the values worked here.
  const want = {
    x1: { melt: [1713, 1713], strike: 'shatters', cold: false, molten: false }, x2: { melt: [1085, 1085], strike: 'flattens', cold: true, molten: true },
    x3: { melt: [80, 80], strike: 'crumbles', cold: false, molten: false }, x4: { melt: [801, 801], strike: 'shatters', cold: false, molten: true }
  };
  const end5 = done(mod, 4);
  for (const [id, w] of Object.entries(want)) {
    const p = end5.pieces[id].props;
    same(`${p.melt.lo},${p.melt.hi}`, w.melt.join(), `${q} stage 5 (${id} melt)`); same(p.strike, w.strike, `${q} stage 5 (${id} strike)`);
    same(`${p.cur.cold},${p.cur.molten}`, `${w.cold},${w.molten}`, `${q} stage 5 (${id} lamps)`);
  }
  const end6 = done(mod, 5);
  const gl = end6.pieces.x1.props;
  same(`${gl.melt.lo},${gl.melt.hi},${gl.strike},${gl.cur.cold},${gl.cur.molten}`, '510,700,shatters,false,true', `${q} stage 6 (the window glass record)`);
  same(`${end6.pieces.x5.props.melt.lo},${end6.pieces.x5.props.strike},${end6.pieces.x5.props.cur.molten}`, '770,shatters,true', `${q} stage 6 (the potassium chloride record)`);
  const end1 = done(mod, 0);
  same(JSON.stringify(end1.pieces.salt.props.melt), JSON.stringify({ held: true, maxT: 200 }), `${q} stage 1 (the salt holds to 200 °C)`);
  same(end1.pieces.ice.props.melt.lo, 0, `${q} stage 1 (ice)`);

  // The pictures, measured here: every silicon of the crystal has the same angle; the glass spreads over many.
  const ang = a => {
    const out = []; const nb = a.atoms.map(() => []);
    for (const [i, j] of a.bonds) { nb[i].push(j); nb[j].push(i); }
    a.atoms.forEach((at, i) => {
      if (at.k !== 'Si' || nb[i].length !== 3) return;
      const v = nb[i].map(j => Math.atan2(a.atoms[j].y - at.y, a.atoms[j].x - at.x));
      v.sort((x, y) => x - y);
      out.push(...[v[1] - v[0], v[2] - v[1], 2 * Math.PI + v[0] - v[2]].map(r => (r * 180) / Math.PI));
    });
    return out;
  };
  const crystal = ang(T.arrangementOf('quartz')); const glassA = ang(T.arrangementOf('silica'));
  holds(crystal.length > 20 && crystal.every(d => Math.abs(d - 120) < 0.5), `${q}: the quartz picture is not a regular network`);
  holds(glassA.length > 20 && new Set(glassA.map(d => Math.floor(d / 10))).size >= 5, `${q}: the glass picture does not spread its angles`);
  holds(T.arrangementOf('quartz').atoms.filter(a => a.k === 'Si').length > 25 && T.arrangementOf('silica').atoms.filter(a => a.k === 'Si').length > 25, `${q}: the pictures hold too few silicons`);

  // The story: every number Vess says is in the table, and the painter draws a finite picture at every moment.
  const { QUEST_STORY } = await import('../../../src/story/quest-story.js');
  const st = QUEST_STORY['unit06/q4-solids'];
  const said = st.beats.map(b => b.say).join(' ');
  for (const v of ['1713', '1040', '1585']) holds(said.includes(v), `${q} story: ${v} is not said`);
  holds(Number(said.match(/below (\d+) °C/)[1]) > S.iodine.melt.lo && S.ice.melt.lo < 115 && S.naphthalene.melt.lo < 115, `${q} story: the molecular solids melt above the figure said`);
  const { Q4_SCENES } = await import('../../../src/ui/story-scenes-mirrowen-q4.js');
  let bad = 0;
  for (let i = 0; i <= 50; i++) {
    const calls = { n: 0 };
    const make = () => new Proxy(function () {}, { get: (_, key) => (key === 'measureText' ? () => ({ width: 80 }) : (...args) => { calls.n++; if (args.some(a => typeof a === 'number' && !Number.isFinite(a))) bad++; return /^create/.test(String(key)) ? make() : undefined; }), set: () => true });
    Q4_SCENES['solid-order'](make(), 960, 540, i / 50, i * 0.13);
    if (!calls.n) bad++;
  }
  holds(bad === 0, `${q} story: the painter draws nothing or a NaN at some moment`);
}
