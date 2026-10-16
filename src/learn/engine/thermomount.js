/**
 * thermomount.js — The stage loop every Ember Reach bench shares.
 *
 * Eight modules play the calorimeter and thermodynamic bench (`q1-flow` to
 * `q7-gibbs` and `boss-crucible`). Built on `createRunner` (`./stagerunner.js`)
 * and `Calorimeter` (`./instruments.js`), mirroring `gasmount.js` so every stage
 * works identically on the drawn 2D canvas and the T4 3D built bench.
 */

import { Calorimeter } from './instruments.js';
import { createRunner, blankAnswer } from './stagerunner.js';
import {
  SPECIFIC_HEAT_WATER,
  equilibriumTemp,
  bondEnthalpySum,
  hessStackEnthalpy,
  microstateWays,
  gibbsFreeEnergy,
  benchCfg,
} from './thermodata.js';
import { esc } from '../../ui/layout.js';

export function thermoState(stage) {
  const cardState = {};
  for (const r of stage.rigs || []) {
    for (const c of r.cards || []) {
      cardState[c.id] = {
        flip: Boolean(c.flip),
        mult: c.mult ?? 1,
      };
    }
  }
  return {
    dial: stage.dial?.start || 1,
    toggled: Boolean(stage.defaultToggled),
    cardState,
  };
}

export function plateSummary(it, cfg = {}) {
  const head = it.head || 'cup';
  if (head === 'contact') {
    const l = it.left || { label: 'Block A', T: 80, m: 100, c: 0.45 };
    const r = it.right || { label: 'Block B', T: 20, m: 100, c: 0.45 };
    const Tf = equilibriumTemp(l.m || 100, l.c || 1, l.T, r.m || 100, r.c || 1, r.T);
    return `${it.label}: ${l.label} (${l.T.toFixed(1)} °C) and ${r.label} (${r.T.toFixed(1)} °C) settle at ${Tf.toFixed(1)} °C.`;
  }
  if (head === 'diagram') {
    const rev = Boolean(it.reversed) ^ Boolean(cfg.toggled && it.allowReverse);
    const dH = (rev ? -1 : 1) * (it.dH ?? -285.8);
    const signStr = `${dH >= 0 ? '+' : ''}${dH.toFixed(1)} kJ/mol`;
    if (it.hideVerdict && it.hideValue) return `${it.label}: ${it.reactantsLabel || 'reactants'} to ${it.productsLabel || 'products'}.`;
    return `${it.label}: ${it.hideValue ? (dH < 0 ? 'enthalpy drops (ΔH < 0)' : 'enthalpy climbs (ΔH > 0)') : `ΔH = ${signStr}`}.`;
  }
  if (head === 'bonds') {
    if (it.submode === 'crank') {
      return `${it.label}: ${it.forming ? 'forming' : 'breaking'} ${it.bond || 'H–H'} bond.`;
    }
    const sums = bondEnthalpySum(it.broken || [], it.formed || []);
    return `${it.label}: breaking costs +${sums.broken} kJ/mol, forming releases −${sums.formed} kJ/mol.`;
  }
  if (head === 'hess') {
    if (it.submode === 'formation') {
      return `${it.label}: ${it.targetEq || 'Formation table'} relative to elements at 0 kJ/mol.`;
    }
    const cardState = cfg.cardState || {};
    const steps = (it.cards || []).map(c => ({
      dH: c.dH,
      flip: cardState[c.id]?.flip ?? Boolean(c.flip),
      mult: cardState[c.id]?.mult ?? (c.mult ?? 1),
    }));
    const sum = hessStackEnthalpy(steps);
    return `${it.label}: stack net ΔH = ${sum >= 0 ? '+' : ''}${sum.toFixed(1)} kJ/mol.`;
  }
  if (head === 'box') {
    if (it.submode === 'phases') {
      return `${it.label}: ${it.sublabel || it.phaseState}.`;
    }
    const open = it.open !== undefined ? it.open : Boolean(cfg.toggled);
    const totalCells = (cfg.dialKey === 'cells' && cfg.dialValue != null) ? cfg.dialValue : (it.cells ?? (open ? 8 : 4));
    const activeCells = open ? totalCells : (it.leftCells ?? Math.min(4, totalCells));
    const ways = microstateWays(activeCells, it.particles ?? 2, Boolean(it.distinguishable));
    if (it.hideWays) return `${it.label}: ${it.particles ?? 2} particles across ${activeCells} cells.`;
    return `${it.label}: ${it.particles ?? 2} particles across ${activeCells} cells give W = ${ways} arrangements.`;
  }
  if (head === 'gibbs') {
    const T = (cfg.dialKey === 'temp' && cfg.dialValue != null) ? cfg.dialValue : (it.T ?? 298);
    const coupledOn = it.coupled && (it.coupled.active || cfg.toggled);
    const dG = gibbsFreeEnergy(it.dH ?? 6.01, it.dS ?? 22.0, T) + (coupledOn ? (it.coupled.dG2 ?? 0) : 0);
    return `${it.label}: at T = ${T} K, ${it.hideDG ? `ΔH = ${it.dH} kJ/mol, ΔS = ${it.dS} J/(mol·K)` : `ΔG = ${dG >= 0 ? '+' : ''}${dG.toFixed(1)} kJ/mol`}.`;
  }
  // 'cup'
  const mWater = (cfg.dialKey === 'mass' && cfg.dialValue != null) ? cfg.dialValue : (it.waterMass ?? 100);
  const cFluid = it.cFluid ?? SPECIFIC_HEAT_WATER;
  const TInit = it.waterTInit ?? 22.0;
  const joules = (cfg.dialKey === 'joules' && cfg.dialValue != null) ? cfg.dialValue : (it.joules ?? 0);
  const lidOff = it.lidOff !== undefined ? it.lidOff : (cfg.toggled && it.allowLidToggle);
  const loss = lidOff ? 0.72 : 1.0;
  let TFinal = it.TFinal ?? TInit;
  if (it.block) {
    const rawTf = equilibriumTemp(mWater, cFluid, TInit, it.block.mass ?? 50, it.block.c, it.block.TInit);
    TFinal = TInit + (rawTf - TInit) * loss;
  } else if (it.reaction) {
    const scale = (cfg.dialKey === 'moles' && cfg.dialValue != null && it.reaction.moles) ? (cfg.dialValue / it.reaction.moles) : 1;
    const moles = (it.reaction.moles ?? 0.05) * scale;
    const qRxnJ = it.reaction.q != null ? it.reaction.q * scale : -(moles * (it.reaction.dH ?? -50) * 1000);
    TFinal = TInit + (qRxnJ * loss) / (mWater * cFluid);
  } else if (joules !== 0) {
    TFinal = TInit + (joules * loss) / (mWater * cFluid);
  }
  const dT = TFinal - TInit;
  return `${it.label}: bath moves from ${TInit.toFixed(1)} °C to ${TFinal.toFixed(2)} °C (ΔT = ${dT >= 0 ? '+' : ''}${dT.toFixed(2)} °C).`;
}

/**
 * A number or decimal answer starts on `widget.start` when the stage names one,
 * else on its minimum, like every other bench. Shared by the mount and `stateFor`
 * so the untouched bench is the same bench the check sees.
 */
export function startState(stage) {
  const w = stage.widget || {};
  const out = {};
  if (w.type === 'number' && w.start != null) out.number = w.start;
  if (w.type === 'decimal' && w.start != null) out.decimal = w.start;
  return out;
}

/** The `stateFor(i, overrides)` every Ember Reach quest exports for `verify:learn`. */
export function makeStateFor(STAGES) {
  return (i, overrides) => ({ ...blankAnswer(STAGES[i]), ...thermoState(STAGES[i]), ...startState(STAGES[i]), ...overrides });
}

export function mountThermo(container, ctx, cfg) {
  const { STAGES, DEBRIEF } = cfg;
  let bench = null;
  let runner = null;
  let lastLogged = '';

  const userState = stage => (cfg.blankState ? cfg.blankState(stage) : {});
  const blank = stage => ({ ...thermoState(stage), ...startState(stage), ...userState(stage) });

  function helpers() {
    return { runner, bench, stage: runner.stage, state: runner.state, refresh };
  }

  function currentBenchCfg() {
    const stage = runner.stage;
    const st = runner.state;
    const dialSpec = stage.dial || null;
    const dialIdx = (st.dial || 1) - 1;
    const base = benchCfg(stage, {
      dialIdx,
      toggled: st.toggled,
      cardState: st.cardState,
    });
    return {
      ...base,
      dialValues: dialSpec?.values || [],
      dial: st.dial || 1,
      dialKey: dialSpec?.key || null,
      dialLabel: dialSpec?.label || 'SETTING',
      dialUnit: dialSpec?.unit || '',
    };
  }

  function paintDials() {
    const stage = runner.stage;
    const st = runner.state;
    if (stage.dial?.values?.length) {
      const val = stage.dial.values[Math.max(0, Math.min(stage.dial.values.length - 1, (st.dial || 1) - 1))];
      const text = stage.dial.names
        ? stage.dial.names[(st.dial || 1) - 1]
        : `${val}${stage.dial.unit ? ' ' + stage.dial.unit : ''}`;
      runner.paintDial('dial', st.dial, {
        min: 1,
        max: stage.dial.values.length,
        text,
      });
    }
  }

  function readNow() {
    const h = helpers();
    const custom = cfg.readout?.(h);
    if (custom) {
      runner.readout('Calorimeter // reading', custom);
      return;
    }
    const bCfg = currentBenchCfg();
    const lines = (bench.items || []).map(it => plateSummary(it, bCfg)).filter(Boolean);
    if (lines.length) {
      runner.readout('Calorimeter // reading', lines.join(' '));
    }
  }

  function logRow() {
    const stage = runner.stage;
    if (!stage.logRow) return;
    const bCfg = currentBenchCfg();
    const row = stage.logRow(bCfg, runner.state);
    if (!row) return;
    const key = JSON.stringify(row);
    if (key === lastLogged) return;
    lastLogged = key;
    runner.logReading(row);
  }

  function readPair() {
    const stage = runner.stage;
    if (!stage.pairReadout) return false;
    const bCfg = currentBenchCfg();
    const p = stage.pairReadout(bCfg, runner.state);
    if (!p) return false;
    runner.setPairedReadout(p.left, p.right);
    if (stage.trendPlot && p.point) {
      runner.plotPoint(p.point[0], p.point[1]);
    }
    return true;
  }

  function reactAll(quiet = false) {
    const bCfg = currentBenchCfg();
    for (const it of bench.items || []) {
      runner.frame.foeReact(it.id, { kind: 'thermo', item: it, cfg: bCfg }, quiet);
    }
  }

  function refresh(quiet = false) {
    const bCfg = currentBenchCfg();
    bench.cfg = { ...bench.cfg, ...bCfg };
    bench.drawAll();
    paintDials();
    if (!readPair()) readNow();
    logRow();
    reactAll(quiet);
  }

  function setDial(v) {
    runner.state.dial = v;
    bench.setDial(v);
    refresh();
  }

  function onCardAct(cardId) {
    const stage = runner.stage;
    const cc = (stage.cardControls || []).find(c => c.cardId === cardId);
    const cur = runner.state.cardState[cardId] || { flip: false, mult: 1 };
    if (cc) {
      if (cc.allowFlip && !cc.allowMult) cur.flip = !cur.flip;
      else if (cc.allowMult && !cc.allowFlip) {
        const mults = cc.multValues || [1, 2];
        cur.mult = mults[(mults.indexOf(cur.mult) + 1) % mults.length];
      } else {
        if (!cur.flip && cur.mult === 1) cur.flip = true;
        else if (cur.flip && cur.mult === 1) { cur.flip = false; cur.mult = 2; }
        else if (!cur.flip && cur.mult === 2) { cur.flip = true; cur.mult = 2; }
        else { cur.flip = false; cur.mult = 1; }
      }
    } else {
      cur.flip = !cur.flip;
    }
    runner.state.cardState[cardId] = cur;
    refresh();
  }

  function onTool(tool) {
    const h = helpers();
    if (tool === 'toggle') {
      runner.state.toggled = !runner.state.toggled;
    } else if (tool === 'reset') {
      const fresh = thermoState(runner.stage);
      runner.state.dial = fresh.dial;
      runner.state.toggled = fresh.toggled;
      runner.state.cardState = fresh.cardState;
      bench.setDial(fresh.dial);
    } else if (tool.startsWith('flip:')) {
      const cid = tool.slice(5);
      const cur = runner.state.cardState[cid] || { flip: false, mult: 1 };
      cur.flip = !cur.flip;
      runner.state.cardState[cid] = cur;
    } else if (tool.startsWith('mult:')) {
      const cid = tool.slice(5);
      const cur = runner.state.cardState[cid] || { flip: false, mult: 1 };
      cur.mult = cur.mult === 1 ? 2 : 1;
      runner.state.cardState[cid] = cur;
    } else if (cfg.tools?.[tool]) {
      cfg.tools[tool](h);
    } else {
      return;
    }
    refresh();
  }

  function onProbe(hit) {
    const h = helpers();
    if (cfg.onProbe) cfg.onProbe(hit, h);
    if (hit.text) {
      runner.readout(`Plate // ${hit.plateLabel || hit.plateId.toUpperCase()}`, hit.text);
    }
    reactAll();
  }

  function keysFor(stage) {
    const parts = [];
    const groups = new Map();
    const addKey = (group, id, label) => {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(
        `<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="${esc(id)}">${esc(label)}</button>`
      );
    };

    if (stage.toggleAction) {
      addKey(stage.toggleAction.group || 'Bench', 'toggle', stage.toggleAction.label);
    }
    for (const cc of stage.cardControls || []) {
      if (cc.allowFlip) addKey('Hess Stack', `flip:${cc.cardId}`, `Flip ${cc.label || cc.cardId}`);
      if (cc.allowMult) addKey('Hess Stack', `mult:${cc.cardId}`, `Double ${cc.label || cc.cardId}`);
    }
    for (const id of stage.controls || []) {
      if (id === 'dial' || id === 'toggle') continue;
      const label = stage.keys?.[id] || (id === 'reset' ? 'Reset Bench' : null);
      if (!label) continue;
      addKey(stage.keyGroups?.[id] || 'Bench', id, label);
    }

    for (const [group, keys] of groups) {
      parts.push(`<div class="cb-field" role="group" aria-label="${esc(group)}">${keys.join('')}</div>`);
    }
    return parts;
  }

  function onLoad(stage, i, r) {
    lastLogged = '';
    const bCfg = currentBenchCfg();
    bench.setRigs(stage.rigs, bCfg);
    bench.setSelectable(stage.widget?.type === 'pick');

    const parts = [];
    const dials = {};
    if (stage.dial?.values?.length > 1) {
      parts.push(r.dialHtml('dial', {
        label: stage.dial.label || 'Setting',
        min: 1,
        max: stage.dial.values.length,
        value: r.state.dial,
      }));
      dials.dial = {
        min: 1,
        max: stage.dial.values.length,
        onChange: v => setDial(v),
      };
    }
    parts.push(...keysFor(stage));
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">On the plate</span>
          <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      `);
    }
    r.setControls(parts, onTool, { dials });
    cfg.onLoadExtra?.(stage, i, helpers());
    paintDials();
    if (stage.idle) r.readout(null, null, { idleHead: 'Calorimeter // standby', idle: stage.idle });
    else refresh(true);
  }

  runner = createRunner(container, ctx, {
    STAGES,
    DEBRIEF,
    blankState: blank,
    toolNoteFor: cfg.toolNoteFor,
    setup: r => {
      bench = Calorimeter(r.frame.instrumentHost, {
        onProbe,
        onSelect: id => { bench.setSelected(id); r.pick(id); },
        onDial: v => setDial(v),
        onCardAct,
      });
    },
    onLoad,
    onDispose: () => bench?.dispose(),
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { blankAnswer };
