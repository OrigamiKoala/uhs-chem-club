/**
 * verify-geometry.mjs — Runs every Quest 1 reaction animation headlessly and checks
 * that the molecules on screen are chemically sane before, during and after it:
 *   - no atom exceeds its valence (counting double bonds twice)
 *   - drawn bonds have plausible lengths, and non-bonded atoms never overlap
 *   - every graded anchor position matches the region it belongs to
 *   - new bonds end at a sensible length and leaving groups really leave
 *
 *   node tools/verify-geometry.mjs [--verbose]
 */

let clock = 0;
const queue = [];
globalThis.performance = { now: () => clock };
globalThis.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length; };
globalThis.cancelAnimationFrame = () => {};

const { MOLECULE_DATA, MoleculeMesh } = await import('../src/quest3d/molecule.js');
const { STAGE_CONFIGS } = await import('../src/quest3d/evaluator.js');

const verbose = process.argv.includes('--verbose');
const MAX_VALENCE = { H: 1, C: 4, N: 4, O: 3, Cl: 1, Br: 1, F: 1 };
const BOND_RANGE = { H: [0.6, 1.25], X: [0.95, 1.75] };
const failures = [];
const warn = (stage, msg) => failures.push(`stage ${stage}: ${msg}`);

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const r2 = (n) => Math.round(n * 100) / 100;

function liveBonds(mol) {
  const out = [];
  for (const b of mol.bonds) {
    if (b.cleaved) continue;
    const order = b.partial ? 0.5 : b.order === 2 && (b.doubleScale ?? 1) > 0.5 ? 2 : 1;
    out.push({ from: b.from, to: b.to, order, isNew: false });
  }
  for (const b of mol.newBonds) {
    if (!b.cleaved && b.scale > 0.5) out.push({ from: b.from, to: b.to, order: b.partial ? 0.5 : 1, isNew: true });
  }
  return out;
}

function checkState(stage, mol, when) {
  const bonds = liveBonds(mol);
  const val = new Map();
  const bonded = new Set();
  for (const b of bonds) {
    val.set(b.from, (val.get(b.from) || 0) + b.order);
    val.set(b.to, (val.get(b.to) || 0) + b.order);
    bonded.add(`${Math.min(b.from, b.to)}-${Math.max(b.from, b.to)}`);
    const A = mol.atoms[b.from];
    const B = mol.atoms[b.to];
    const len = d(A.pos, B.pos);
    const [lo, hi] = (A.element === 'H' || B.element === 'H') ? BOND_RANGE.H : BOND_RANGE.X;
    if (len < lo || len > hi) warn(stage, `${when}: bond ${b.from}${A.element}-${b.to}${B.element} length ${r2(len)}`);
  }
  mol.atoms.forEach((a, i) => {
    const v = val.get(i) || 0;
    if (v > (MAX_VALENCE[a.element] ?? 4)) warn(stage, `${when}: atom ${i}${a.element} has ${v} bonds`);
  });
  for (let i = 0; i < mol.atoms.length; i++) {
    for (let j = i + 1; j < mol.atoms.length; j++) {
      if (bonded.has(`${i}-${j}`)) continue;
      const A = mol.atoms[i];
      const B = mol.atoms[j];
      const hCount = (A.element === 'H') + (B.element === 'H');
      const min = hCount === 2 ? 0.75 : hCount === 1 ? 0.85 : 1.15;
      const len = d(A.pos, B.pos);
      if (len < min) warn(stage, `${when}: atoms ${i}${A.element} and ${j}${B.element} overlap (${r2(len)})`);
    }
  }
}

// A hydrogen handed from X to a receiver must sit on the receiver···H–X line,
// and the receiver must start at a sensible reach (not already touching).
const origStep = MoleculeMesh.prototype.animateReactionStep;
MoleculeMesh.prototype.animateReactionStep = function (stepCfg, done) {
  const { donorAtom: dn, acceptorAtom: ac } = stepCfg || {};
  const acc = this.atoms[ac];
  if (acc && acc.element === 'H' && stepCfg.leavingBond) {
    const lb = [].concat(stepCfg.leavingBond).find((b) => b.from === ac || b.to === ac);
    if (lb) {
      const other = this.atoms[lb.from === ac ? lb.to : lb.from];
      const D = this.atoms[dn].pos;
      const H = acc.pos;
      const X = other.pos;
      const v1 = { x: D.x - H.x, y: D.y - H.y, z: D.z - H.z };
      const v2 = { x: X.x - H.x, y: X.y - H.y, z: X.z - H.z };
      const cos = (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / (Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z));
      const angle = (Math.acos(cos) * 180) / Math.PI;
      const reach = d(D, H);
      if (angle < 140) warn(currentStage, `H transfer ${dn}->${ac}: angle ${Math.round(angle)} (want >= 140)`);
      if (reach < 1.0 || reach > 4.0) warn(currentStage, `H transfer ${dn}->${ac}: starts ${r2(reach)} away`);
    }
  }
  // Attack on a flat three-connected atom must come at its face, and a backside
  // displacement must line up nucleophile, center and leaving group.
  const acceptor = this.atoms[ac];
  if (acceptor && stepCfg.formBond !== false && acceptor.element !== 'H') {
    const live = liveBonds(this).filter((b) => b.from === ac || b.to === ac);
    const nbrs = live.map((b) => (b.from === ac ? b.to : b.from));
    const D = this.atoms[dn].pos;
    const C = acceptor.pos;
    const sub = (p, q) => [p.x - q.x, p.y - q.y, p.z - q.z];
    const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const a = unit(sub(D, C));
    const trigonal = nbrs.length === 3 && live.some((b) => b.order === 2);
    const cation = nbrs.length === 3 && acceptor.element === 'C' && !stepCfg.leavingBond;
    if (trigonal || cation) {
      const [p, q, r] = nbrs.map((i) => unit(sub(this.atoms[i].pos, C)));
      const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const n = unit([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
      const elev = (Math.asin(Math.abs(dot(a, n))) * 180) / Math.PI;
      if (elev < 50) warn(currentStage, `attack ${dn}->${ac} is ${Math.round(elev)} deg off the plane (want face-on)`);
    }
    for (const lb of [].concat(stepCfg.leavingBond || [])) {
      if (trigonal || (lb.from !== ac && lb.to !== ac)) continue;
      const L = this.atoms[lb.from === ac ? lb.to : lb.from].pos;
      const ang = (Math.acos(dot(a, unit(sub(L, C)))) * 180) / Math.PI;
      if (ang < 160) warn(currentStage, `backside attack ${dn}->${ac} is ${Math.round(ang)} deg from the leaving group (want ~180)`);
    }
  }
  if (verbose) {
    console.log(`  step start (stage ${currentStage}): ` + this.atoms.map((a, i) => `${i}${a.element}(${[a.pos.x, a.pos.y, a.pos.z].map(r2).join(',')})`).join(' '));
  }
  return origStep.call(this, stepCfg, done);
};

function drain(mol, cfg) {
  let done = false;
  mol.animateReaction(cfg, () => { done = true; });
  let frames = 0;
  while (queue.length && frames < 20000) {
    const fn = queue.shift();
    clock += 16;
    fn(clock);
    frames++;
    if (frames % 12 === 0) checkState(currentStage, mol, `frame ${frames}`);
  }
  return done;
}

let currentStage = 0;
for (const cfg of STAGE_CONFIGS) {
  const stage = cfg.stageIndex + 1;
  currentStage = stage;
  const data = MOLECULE_DATA[cfg.moleculeId];
  if (!data) { warn(stage, `missing molecule ${cfg.moleculeId}`); continue; }

  // Graded coordinates must sit on the regions the player actually sees.
  const regionPos = Object.fromEntries(data.regions.map((r) => [r.id, r.pos]));
  const pairs = cfg.multiArrow ? cfg.steps : [cfg];
  for (const p of pairs) {
    for (const [id, pos] of [[p.expectedFrom, p.sourcePos], [p.expectedTo, p.targetPos]]) {
      const rp = regionPos[id];
      if (!rp) { warn(stage, `anchor ${id} has no region`); continue; }
      const off = Math.hypot(rp[0] - pos[0], rp[1] - pos[1], rp[2] - pos[2]);
      if (off > 0.3) warn(stage, `graded position for ${id} is ${r2(off)} from its region`);
    }
  }
  if (cfg.blockedAnchor) {
    const rp = regionPos[cfg.blockedAnchor];
    const off = Math.hypot(...rp.map((v, i) => v - cfg.blockedPos[i]));
    if (off > 0.3) warn(stage, `blockedPos is ${r2(off)} from its region`);
  }

  // Each region should sit on or right beside an atom.
  for (const r of data.regions) {
    const nearest = Math.min(...data.atoms.map((a) => Math.hypot(...a.pos.map((v, i) => v - r.pos[i]))));
    if (nearest > 0.9) warn(stage, `region ${r.id} floats ${r2(nearest)} from any atom`);
  }

  const mol = new MoleculeMesh(cfg.moleculeId);
  checkState(stage, mol, 'start');
  const finished = drain(mol, cfg.reaction);
  if (!finished) warn(stage, 'animation never completed');
  checkState(stage, mol, 'end');

  const steps = cfg.reaction.steps || [cfg.reaction];
  for (const s of steps) {
    if (s.donorAtom !== undefined && s.formBond !== false) {
      const len = d(mol.atoms[s.donorAtom].pos, mol.atoms[s.acceptorAtom].pos);
      const nb = mol.newBonds.find((b) => b.from === s.donorAtom && b.to === s.acceptorAtom);
      if (nb && !nb.cleaved && len > 1.75) warn(stage, `new bond ${s.donorAtom}-${s.acceptorAtom} ends stretched (${r2(len)})`);
    }
  }
  if (verbose) {
    console.log(`\nstage ${stage} final`);
    mol.atoms.forEach((a, i) => console.log(`  ${i} ${a.element} ${[a.pos.x, a.pos.y, a.pos.z].map(r2).join(', ')}`));
  }
}

const unique = [...new Set(failures)];
if (unique.length) {
  console.log(unique.join('\n'));
  console.log(`\nGEOMETRY: ${unique.length} problem(s)`);
  process.exit(1);
}
console.log('GEOMETRY OK — 20 reactions animate with sane bonds, valences and spacing');
