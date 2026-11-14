/**
 * engine/primers.js — short hands-on panels for the maths and the recaps a bench assumes (`glossary/<world>.js` NEEDS says which stage offers which).
 * Each primer is a title, some markup and a `wire(root)` that makes its sliders move the numbers. They use no answers of any stage: powers of ten,
 * a ratio, the unit ladder from amperes to grams, and what it is for an atom to become an ion.
 */

const fmt = (x, d = 2) => (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(2) : x.toFixed(d));
const slider = (id, label, min, max, step, value) => `<label class="lq-primer-row">${label} <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><output id="${id}-o"></output></label>`;
const bind = (root, ids, update) => {
  const run = () => { ids.forEach(i => { const el = root.querySelector(`#${i}`); root.querySelector(`#${i}-o`).textContent = el.value; }); update(i => Number(root.querySelector(`#${i}`).value), (id, html) => { root.querySelector(`#${id}`).innerHTML = html; }); };
  ids.forEach(i => root.querySelector(`#${i}`).addEventListener('input', run));
  run();
};

export const PRIMERS = {
  tens: {
    title: 'Powers of ten',
    html: `<p>Very large and very small numbers are written as a number times a power of ten. 10<sup>3</sup> is 1000; 10<sup>−3</sup> is one thousandth. Slide the power and the first digit.</p>
      ${slider('tn-p', 'Power of ten', -9, 9, 1, 3)}${slider('tn-m', 'First digit', 1, 9, 1, 3)}
      <p id="tn-n"></p><p id="tn-r"></p>`,
    wire(root) {
      bind(root, ['tn-p', 'tn-m'], (v, set) => {
        const p = v('tn-p'); const m = v('tn-m'); const x = m * 10 ** p;
        set('tn-n', `${m} × 10<sup>${p}</sup> = <strong>${p >= 0 ? x.toLocaleString('en-US') : x.toFixed(-p)}</strong>`);
        set('tn-r', 'To multiply two such numbers, multiply the first digits and add the powers; to divide, divide the digits and subtract the powers.');
      });
    }
  },
  log: {
    title: 'Powers of ten and the logarithm',
    html: `<p>A logarithm (log) answers: "10 to what power gives this number?" Slide the power and the first digit.</p>
      ${slider('lg-p', 'Power of ten', -8, 3, 1, -4)}${slider('lg-m', 'First digit', 1, 9, 1, 3)}
      <p id="lg-n"></p><p id="lg-l"></p>`,
    wire(root) {
      bind(root, ['lg-p', 'lg-m'], (v, set) => {
        const p = v('lg-p'); const m = v('lg-m'); const x = m * 10 ** p;
        set('lg-n', `Number: ${m} × 10<sup>${p}</sup> = ${x.toFixed(Math.max(0, -p + 0))}`);
        set('lg-l', `log of it = ${p} + log ${m} = ${p} + ${Math.log10(m).toFixed(2)} = <strong>${(p + Math.log10(m)).toFixed(2)}</strong>`);
      });
    }
  },
  ratio: {
    title: 'A ratio',
    html: `<p>A ratio compares two counts by dividing them. Change either count, then both together.</p>
      ${slider('rt-a', 'Product ions', 1, 20, 1, 6)}${slider('rt-b', 'Reactant ions', 1, 20, 1, 3)}
      <div id="rt-bars"></div><p id="rt-r"></p>`,
    wire(root) {
      bind(root, ['rt-a', 'rt-b'], (v, set) => {
        const a = v('rt-a'); const b = v('rt-b');
        const bar = (n, c) => `<div style="height:10px;margin:3px 0;width:${n * 5}%;background:${c}"></div>`;
        set('rt-bars', bar(a, '#78a142') + bar(b, '#8fb0c8'));
        set('rt-r', `${a} ÷ ${b} = <strong>${(a / b).toFixed(2)}</strong>. Twice as many of each gives ${(2 * a / (2 * b)).toFixed(2)}: the ratio does not change.`);
      });
    }
  },
  amount: {
    title: 'Concentration, volume and amount',
    html: `<p>Concentration (mol/L) is how many moles are in each litre. Multiply it by the volume in litres to get the amount in moles. Move both.</p>
      ${slider('am-c', 'Concentration (mol/L)', 0.05, 1, 0.05, 0.1)}${slider('am-v', 'Volume (mL)', 5, 50, 1, 25)}
      <p id="am-r"></p>`,
    wire(root) {
      bind(root, ['am-c', 'am-v'], (v, set) => {
        const c = v('am-c'); const mL = v('am-v');
        set('am-r', `${c.toFixed(2)} mol/L × ${(mL / 1000).toFixed(3)} L = <strong>${(c * mL / 1000 * 1000).toFixed(2)} mmol</strong> (1 mmol = 0.001 mol). Twice the volume holds twice the amount.`);
      });
    }
  },
  ladder: {
    title: 'From amperes to grams',
    html: `<p>Each step converts one unit to the next. Move the current and the time.</p>
      ${slider('ld-i', 'Current (A)', 0.5, 3, 0.5, 1.5)}${slider('ld-t', 'Time (s)', 60, 600, 60, 300)}
      <p id="ld-1"></p><p id="ld-2"></p><p id="ld-3"></p><p id="ld-4"></p>`,
    wire(root) {
      bind(root, ['ld-i', 'ld-t'], (v, set) => {
        const I = v('ld-i'); const t = v('ld-t'); const q = I * t; const mol = q / 96485;
        set('ld-1', `Charge (C) = current × time = ${I} × ${t} = <strong>${q}</strong> C`);
        set('ld-2', `Moles of electrons = charge ÷ 96 485 = <strong>${fmt(mol, 4)}</strong> mol`);
        set('ld-3', `Moles of silver (1 electron each) = <strong>${fmt(mol, 4)}</strong> mol; copper (2 each) = <strong>${fmt(mol / 2, 4)}</strong> mol`);
        set('ld-4', `Grams = moles × molar mass: silver ${fmt(mol * 107.87, 3)} g, copper ${fmt(mol / 2 * 63.55, 3)} g`);
      });
    }
  },
  ions: {
    title: 'Atoms and ions',
    html: `<p>An atom has as many electrons (negative) as protons (positive), so its charge is 0. Slide how many electrons it loses.</p>
      ${slider('io-n', 'Electrons lost', 0, 3, 1, 2)}<div id="io-v"></div>`,
    wire(root) {
      bind(root, ['io-n'], (v, set) => {
        const n = v('io-n');
        const dots = Array.from({ length: 3 }, (_, i) => `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin:2px;background:${i < 3 - n ? '#e59b24' : 'transparent'};border:1px solid #e59b24"></span>`).join('');
        set('io-v', `<p>Electrons kept: ${dots}</p><p>Charge = protons − electrons = 3 − ${3 - n} = <strong>${n ? '+' + n : '0'}</strong> ${n ? '(an ion)' : '(an atom)'}</p>`);
      });
    }
  },
  /* Thornmere (unit13): the recaps its benches assume, from Ligar and from the Charge Gardens. */
  fourbonds: {
    title: 'Covalent bonds and carbon',
    html: `<p>A covalent bond is a pair of electrons shared by two atoms, drawn as a line. A carbon atom has four valence electrons and forms four bonds; a hydrogen atom forms one. Slide how many of a carbon's bonds go to other carbons.</p>
      ${slider('fb-n', 'Bonds to other carbons', 0, 4, 1, 1)}<p id="fb-v"></p>`,
    wire(root) {
      bind(root, ['fb-n'], (v, set) => {
        const n = v('fb-n');
        set('fb-v', `Bonds left for hydrogen atoms: 4 − ${n} = <strong>${4 - n}</strong>`);
      });
    }
  },
  pairmove: {
    title: 'Electron-rich, electron-poor and the curved arrow',
    html: `<p>Electrons are negative. A place in a molecule with a pair of electrons to spare is electron-rich; an atom whose shared electrons have been pulled away from it is electron-poor. Opposite charges attract, so a pair moves from an electron-rich site to an electron-poor one.</p>
      <p>A curved arrow shows one pair of electrons moving: it starts at the pair and ends at the atom the pair moves to. Slide how strongly the other atom attracts the shared pair.</p>
      ${slider('pm-n', 'Attraction of atom B', 0, 4, 1, 2)}<p id="pm-v"></p>`,
    wire(root) {
      bind(root, ['pm-n'], (v, set) => {
        const n = v('pm-n');
        const left = '&nbsp;'.repeat(2 + n * 3);
        set('pm-v', `A ${left}<strong>:</strong>${'&nbsp;'.repeat(14 - n * 3)} B &nbsp; ${n > 2 ? 'The pair sits near B, so A is electron-poor.' : n < 2 ? 'The pair sits near A, so B is electron-poor.' : 'The pair is shared evenly.'}`);
      });
    }
  }
};
