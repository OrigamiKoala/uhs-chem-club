/**
 * gasmount.js — The stage loop every Bellows bench shares.
 *
 * Seven modules play the gas rig (`q1-knocks` to `q6-real` and the Compressor).
 * Each supplies its stage table, its answers and whatever keys are its own; this
 * file supplies what is the same on every one of them: building the rig, the
 * dials (volume, temperature, time) and the keys that move the gas (add, remove,
 * reset, clear), the readout line, and the foes' reactions.
 *
 * WHAT A STAGE DECLARES (read here and, purely, by `gasdata.benchCfg`):
 *   rigs         the plates (`gasrig.js` heads)
 *   volumes, temps, times     detents for the three dials, with `volumeStart`,
 *                `tempStart`, `timeStart` (1-based); `tempList` is the unit the
 *                temps are written in, `tempUnit` the one the thermometer prints
 *   step, nMin, nMax          what Add Gas and Remove Gas add and the bounds
 *   labels, show, scale, units, vmax, gaugeMax, thermoLo, thermoHi,
 *   inset, trace, bar, speedMax        how the plates are drawn
 *   controls     which dials and keys the stage offers
 *   keys         extra keys: `{ id: 'Label' }` handled by the quest's `tools`
 *   reference    lines "on the plate", worked values a stage lets the player read
 *
 * WHAT IT NEVER DOES: read an answer. `stage.check(state)` is the quest's. The
 * state it hands `check` is `volume`, `temp` and `time` (1-based dial indices),
 * `amounts` (moles on each cylinder), `parts` (each mixture's gases) and
 * whatever the quest adds.
 */

import { GasRig } from './instruments.js';
import { createRunner, blankAnswer } from './stagerunner.js';
import { readPlate, gaugeText } from './gasrig.js';
import { GASES, sig, litres, toCelsius } from './gasdata.js';
import { esc } from '../../ui/layout.js';

/** The keys the rig knows how to answer by itself. */
const BUILT_IN_KEYS = {
  add: { group: 'Gas', label: 'Add Gas' },
  remove: { group: 'Gas', label: 'Remove Gas' },
  reset: { group: 'Rig', label: 'Reset Rig' },
  clear: { group: 'Rig', label: 'Clear Trace' }
};
const DIALS = { volume: 'Volume', temp: 'Temperature', time: 'Time' };

/** Temperatures as the thermometer prints them. */
export function tempWords(T, unit) {
  const c = Math.round(toCelsius(T));
  return unit === 'K' ? `${Math.round(T)} K` : unit === 'both' ? `${c} °C, ${Math.round(T)} K` : `${c} °C`;
}

/** The blank state a gas stage builds into. */
export function gasState(stage) {
  const amounts = {};
  const parts = {};
  for (const r of stage.rigs || []) {
    if (r.head === 'cylinder') amounts[r.id] = r.n ?? 1;
    if (r.head === 'mixture') parts[r.id] = (r.parts || []).map(p => ({ ...p }));
  }
  return {
    volume: stage.volumeStart || 1,
    temp: stage.tempStart || 1,
    time: stage.timeStart || 1,
    amounts, parts
  };
}

/**
 * @param {HTMLElement} container
 * @param {object} ctx
 * @param {{
 *   STAGES: object[], DEBRIEF: object, toolNoteFor?: Function,
 *   blankState?: (stage: object) => object,
 *   tools?: Record<string, (h: object) => void>,   // the quest's own keys, by tool id
 *   readout?: (h: object) => string|null,           // replaces the default readout line
 *   onProbe?: (hit: object, h: object) => void
 * }} cfg
 */
export function mountGas(container, ctx, cfg) {
  const { STAGES, DEBRIEF } = cfg;
  let bench = null;
  let runner = null;
  let rest = {};          // the push each plate read as the stage loaded, for the foes

  const userState = stage => (cfg.blankState ? cfg.blankState(stage) : {});
  const blank = stage => ({ ...gasState(stage), ...userState(stage) });

  /* ---------------- what the bench says ---------------- */

  /** The helpers the quest's own tools and readout are handed. */
  function helpers() {
    return { runner, bench, stage: runner.stage, state: runner.state, refresh, sync };
  }

  /** Copy the bench's live amounts back into the state `check` reads. */
  function sync() {
    const st = runner.state;
    for (const it of bench.items) {
      if (it.head === 'cylinder') st.amounts[it.id] = it.n;
      if (it.head === 'mixture') st.parts[it.id] = it.parts.map(p => ({ ...p }));
    }
  }

  function line(it) {
    const r = readPlate(it, bench.cfg);
    const stage = runner.stage;
    if (it.head === 'mixture') {
      const gases = it.sealed ? null : it.parts.length
        ? it.parts.map(p => `${GASES[p.gas].sym} ${sig(p.n, 3)} mol`).join(', ')
        : 'empty';
      return `${it.label}: gauge ${gaugeText(r.P, bench.cfg.scale)}${gases ? `, ${gases}` : ''}.`;
    }
    if (it.head === 'leak') return `${it.label}: ${Math.round(r.left * 100)} % left after ${sig(bench.seconds, 3)} s.`;
    if (it.head === 'cylinder') {
      const scale = it.scale || bench.cfg.scale;
      const gauge = scale === 'all' ? `${r.atm.toFixed(2)} on the inner ring, ${sig(r.P, 4)} on the middle ring, ${Math.round(r.mmHg)} on the outer ring` : gaugeText(r.P, scale);
      // A sealed cylinder never says how much it holds; it may say what it weighs.
      const amount = it.sealed ? (runner.stage.show?.mass ? `${sig(r.mass, 3)} g` : null) : `${sig(r.n, 3)} mol`;
      return `${it.label}: gauge ${gauge}, ${litres(r.V)} L${amount ? `, ${amount}` : ''}, ${tempWords(r.T, bench.cfg.tempUnit)}.`;
    }
    void stage;
    return '';
  }

  function readNow() {
    const h = helpers();
    const custom = cfg.readout?.(h);
    if (custom) { runner.readout('Rig // reading', custom); return; }
    const lines = bench.items.filter(it => it.head === 'cylinder' || it.head === 'mixture' || it.head === 'leak').map(line).filter(Boolean);
    if (lines.length) runner.readout('Rig // reading', lines.join(' '));
  }

  /** Tell every foe what its plate reads now. */
  function reactAll(quiet = false) {
    for (const it of bench.items) {
      let probe = null;
      if (it.head === 'cylinder' || it.head === 'mixture') probe = { kind: 'gas', item: it, cfg: bench.cfg, rest: rest[it.id] };
      else if (it.head === 'leak') probe = { kind: 'leak', gas: it.gas, seconds: bench.seconds };
      else if (it.head === 'tube') probe = { kind: 'tube', gas: it.gas, seconds: bench.seconds, length: it.length || 8 };
      else if (it.head === 'path') probe = { kind: 'path', hits: Math.round(bench.seconds * (it.stepsPerSecond || 6)) };
      if (probe) runner.frame.foeReact(it.id, probe, quiet);
    }
  }

  function paintDials() {
    const stage = runner.stage;
    const st = runner.state;
    if (stage.volumes?.length) runner.paintDial('volume', st.volume, { min: 1, max: stage.volumes.length, text: stage.volumeNames ? stage.volumeNames[st.volume - 1] : `${litres(stage.volumes[st.volume - 1])} L` });
    if (stage.temps?.length) {
      const T = stage.temps[st.temp - 1];
      const K = (stage.tempList || 'C') === 'K' ? T : T + 273.15;
      runner.paintDial('temp', st.temp, { min: 1, max: stage.temps.length, text: tempWords(K, stage.tempUnit || 'C') });
    }
    if (stage.times?.length) runner.paintDial('time', st.time, { min: 1, max: stage.times.length, text: `${sig(stage.times[st.time - 1], 3)} s` });
  }

  function refresh(quiet = false) {
    sync();
    paintDials();
    readNow();
    reactAll(quiet);
  }

  /* ---------------- the dials ---------------- */

  const setVolume = v => { runner.state.volume = v; bench.setVolume(v); refresh(); };
  const setTemp = v => { runner.state.temp = v; bench.setTemp(v); refresh(); };
  const setTime = v => { runner.state.time = v; bench.setTime(v); refresh(); };

  /* ---------------- the keys ---------------- */

  function onTool(tool) {
    const h = helpers();
    if (tool === 'add') bench.addGas(bench.cfg.step);
    else if (tool === 'remove') bench.addGas(-bench.cfg.step);
    else if (tool === 'reset') { bench.reset(); runner.state.amounts = gasState(runner.stage).amounts; runner.state.parts = gasState(runner.stage).parts; }
    else if (tool === 'clear') bench.clearTrace();
    else if (cfg.tools?.[tool]) cfg.tools[tool](h);
    else return;
    refresh();
  }

  function onProbe(hit) {
    const h = helpers();
    if (cfg.onProbe) cfg.onProbe(hit, h);
    if (hit.kind === 'cylinder' || hit.kind === 'mixture') {
      const it = bench.itemFor(hit.plateId);
      if (it) runner.readout(`Plate // ${it.label}`, line(it));
    } else if (hit.kind === 'leak') {
      runner.readout(`Plate // ${hit.plateId.toUpperCase()}`, `${Math.round(hit.left * 100)} % left in the chamber after ${sig(hit.seconds, 3)} s.`);
    } else if (hit.kind === 'tube') {
      runner.readout(`Plate // ${hit.plateId.toUpperCase()}`, `The gas has reached ${hit.cm.toFixed(1)} cm after ${sig(hit.seconds, 3)} s.`);
    } else if (hit.kind === 'path') {
      runner.readout(`Plate // ${hit.plateId.toUpperCase()}`, `The particle has run ${Math.round(hit.length)} and ended ${Math.round(hit.net)} from where it started.`);
    }
    reactAll();
  }

  /* ---------------- the stage ---------------- */

  function keysFor(stage) {
    const parts = [];
    const groups = new Map();
    for (const id of stage.controls || []) {
      if (DIALS[id]) continue;
      const k = BUILT_IN_KEYS[id] || (stage.keys?.[id] ? { group: stage.keyGroups?.[id] || 'Rig', label: stage.keys[id] } : null);
      if (!k) continue;
      if (!groups.has(k.group)) groups.set(k.group, []);
      groups.get(k.group).push(`<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="${esc(id)}">${esc(k.label)}</button>`);
    }
    for (const [group, keys] of groups) {
      parts.push(`<div class="cb-field" role="group" aria-label="${esc(group)}">${keys.join('')}</div>`);
    }
    return parts;
  }

  function onLoad(stage, i, r) {
    bench.setRigs(stage.rigs, {
      volumes: stage.volumes || [], volume: r.state.volume,
      temps: stage.temps || [], temp: r.state.temp,
      tempList: stage.tempList || 'C', tempUnit: stage.tempUnit || 'C',
      times: stage.times || [], time: r.state.time,
      step: stage.step ?? 1, nMin: stage.nMin ?? 0.5, nMax: stage.nMax ?? 4,
      labels: stage.labels || {}, show: stage.show || {}, scale: stage.scale || 'plain', units: Boolean(stage.units),
      volumeNames: stage.volumeNames || null, volumeLabel: stage.volumeLabel || null,
      vmax: stage.vmax || 0, gaugeMax: stage.gaugeMax || 400,
      thermoLo: stage.thermoLo ?? -50, thermoHi: stage.thermoHi ?? 450,
      trace: stage.trace || null, inset: stage.inset || null, bar: stage.bar ?? null, speedMax: stage.speedMax || 2400
    });
    bench.setSelectable(stage.widget?.type === 'pick');
    rest = {};
    for (const it of bench.items) {
      if (it.head === 'cylinder' || it.head === 'mixture') {
        const r = readPlate(it, bench.cfg);
        rest[it.id] = { P: r.P, V: r.V };
      }
    }

    const parts = [];
    const dials = {};
    const has = id => (stage.controls || []).includes(id);
    if (has('volume') && stage.volumes?.length) {
      parts.push(r.dialHtml('volume', { label: stage.volumeLabel || DIALS.volume, min: 1, max: stage.volumes.length, value: r.state.volume }));
      dials.volume = { min: 1, max: stage.volumes.length, onChange: v => setVolume(v) };
    }
    if (has('temp') && stage.temps?.length) {
      parts.push(r.dialHtml('temp', { label: DIALS.temp, min: 1, max: stage.temps.length, value: r.state.temp }));
      dials.temp = { min: 1, max: stage.temps.length, onChange: v => setTemp(v) };
    }
    if (has('time') && stage.times?.length) {
      parts.push(r.dialHtml('time', { label: DIALS.time, min: 1, max: stage.times.length, value: r.state.time }));
      dials.time = { min: 1, max: stage.times.length, onChange: v => setTime(v) };
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
    if (stage.idle) r.readout(null, null, { idleHead: 'Rig // standby', idle: stage.idle });
    else refresh(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState: blank, toolNoteFor: cfg.toolNoteFor,
    setup: r => {
      bench = GasRig(r.frame.instrumentHost, {
        onProbe,
        onSelect: id => r.pick(id),
        onVolume: v => setVolume(v),
        onTemp: v => setTemp(v),
        onTime: v => setTime(v)
      });
    },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { blankAnswer };
