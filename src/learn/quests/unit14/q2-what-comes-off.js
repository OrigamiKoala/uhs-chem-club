/**
 * Unit 14 · Bench 2 — What Comes Off (q2-what-comes-off)
 *
 * The shield cell in Cinder Halo's second crater, on the nuke kit. Eight stages and ONE click: the belief that the biggest, heaviest
 * particle punches through the most. The shields answer it: the heavy alpha particle stops in paper and gamma, with no mass, goes
 * furthest, because a charged particle pulls electrons off every atom it passes (the trail of ions in the window) and spends its energy
 * doing it. Charged plates sort the three radiations first; the names are earned one stage at a time.
 *
 *   1  three sources between charged plates                           -> R runs straight: no charge, a gamma ray
 *   2  the same three                                                  -> Q bends to the positive plate: beta particles
 *   3  three new sources, after a briefing on what an alpha particle is -> the one bent a little toward negative: alpha
 *   4  PREDICT: which passes paper and aluminium most easily?
 *   5  TEST: shields of paper, aluminium and lead                       -> gamma; the dense trail of ions stops alpha
 *   6  a swallowed source in a strip of cells                          -> alpha does most harm beside it
 *   7  a source of two radiations, by shields alone                    -> alpha and gamma
 *   8  SEALED: three sealed sources sorted by shields alone
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, ncountFixture, keptCount, nsrc, nshield, ntissueFixture, nchoiceFixture, chosenIndex, note, plaqueFixture } from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bgamma rays?\b/i, introducedAt: 1 },
  { term: /\bbeta particles?\b/i, introducedAt: 1 },
  { term: /\balpha particles?\b/i, introducedAt: 2 },
  { term: /\bionizing\b/i, introducedAt: 4 }
];

/** Radiation, counts and the counter (bench 1); ions (Tallow `q4-ledger`). */
export const BUILDS_ON = ['unit14/q1-still-warm', 'unit01/q4-ledger'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q2-what-comes-off';
const GUESS = { 'g-alpha': 'alpha', 'g-beta': 'beta', 'g-gamma': 'gamma' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const seen = card => Boolean(card.props.seen);
const PLATES_AT = { x: 98, y: 28 };

/** Which way a source's tracks go between the plates, said as the table shows it. */
const BEND = {
  po210: 'tracks bend slightly toward the negative plate, so it is positive',
  po210b: 'tracks bend slightly toward the negative plate, so it is positive',
  sr90: 'tracks bend sharply toward the positive plate, so it is negative',
  co60s: 'tracks go straight between the plates, so it has no charge'
};
const platesMiss = (card, ask) => (seen(card) ? `${card.label}'s ${BEND[card.props.src]}.` : `${card.label} has not been run between the plates yet; ${ask}`);

const SHIELD_ROW = (y = 56.5) => [nshield('sh-paper', 'paper', { x: 66, y }), nshield('sh-al', 'aluminium', { x: 90, y }), nshield('sh-pb', 'lead', { x: 114, y })];

export const STAGES = [
  /* ---------------------------------------------------------------- 1: Gamma and Beta (merged) */
  (() => {
    const R = ncountFixture('rig', { x: 98, y: 24 }, { plates: true, h: 42, title: 'Counter, with charged plates' });
    return {
      id: 's1-plates',
      title: 'Between the Plates',
      briefing: { speaker: SPEAKER, body: 'Two charged plates sit above and below the beam: positive on top, negative on the bottom. Opposite charges attract, and like charges repel.' },
      prompt: 'Which source gives off uncharged radiation, and which gives off negatively charged particles?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-p', 'po210', { x: 12, y: 9 }, { text: 'Source P' }),
          nsrc('src-q', 'sr90', { x: 12, y: 24 }, { text: 'Source Q' }),
          nsrc('src-r', 'co60s', { x: 12, y: 39 }, { text: 'Source R' })
        ],
        fixtures: [R.fixture],
        zones: {
          slots: [
            R.slot,
            { id: 'gamma', label: 'No charge', at: { x: 38, y: 52 }, size: { w: 22, h: 11 } },
            { id: 'beta', label: 'Negative', at: { x: 66, y: 52 }, size: { w: 22, h: 11 } }
          ]
        }
      }),
      hints: [
        'Drag each source into the Sample slot and press "Run" to watch its tracks.',
        'Notice which way each source\'s tracks bend between the positive and negative plates.',
        'An uncharged ray goes straight, while a negative particle bends toward the positive plate.'
      ],
      check(state) {
        const g = inSlot(state, 'gamma');
        const b = inSlot(state, 'beta');
        if (!g && !b) return { ok: false, notYet: true, msg: 'Place a source card in each answer slot.' };
        if (g && g.props.src !== 'co60s') return { ok: false, msg: platesMiss(g, 'run it to see where its tracks go.') };
        if (b && b.props.src !== 'sr90') return { ok: false, msg: platesMiss(b, 'run it to see where its tracks go.') };
        if (!g || !b) return { ok: false, notYet: true, msg: 'Fill both answer slots before submitting.' };
        return { ok: true };
      },
      reward: {
        log: 'R: gamma ray (no charge); Q: beta particle (negative).',
        title: 'Gamma Rays and Beta Particles',
        body: 'Source R gives off gamma rays, high-energy light with no charge. Source Q gives off beta particles, negatively charged electrons ejected when a neutron changes.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2: Alpha */
  (() => {
    const R = ncountFixture('rig', PLATES_AT, { plates: true, title: 'Counter, with charged plates' });
    return {
      id: 's2-alpha',
      title: 'Heavy and Positive',
      prompt: 'Which of these three new sources gives off positively charged alpha particles?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-s', 'sr90', { x: 12, y: 10 }, { text: 'Source S' }),
          nsrc('src-t', 'po210b', { x: 12, y: 26 }, { text: 'Source T' }),
          nsrc('src-u', 'co60s', { x: 12, y: 42 }, { text: 'Source U' })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'ans', label: 'Alpha', at: { x: 38, y: 51 }, size: { w: 22, h: 12 } }] }
      }),
      hints: [
        'Run each of the three new sources between the charged plates.',
        'Watch which plate each beam bends toward and how sharply it turns.',
        'A positively charged particle bends toward the negative plate.'
      ],
      check(state) {
        const card = inSlot(state, 'ans');
        if (!card) return { ok: false, notYet: true, msg: 'Place a source card in the answer slot.' };
        if (card.props.src === 'po210b') return { ok: true };
        return { ok: false, msg: platesMiss(card, 'run it to see where its tracks go.') };
      },
      reward: {
        log: 'Source T: positive and bent only a little, alpha particles.',
        title: 'Alpha Particles',
        body: 'Source T bends slightly toward the negative plate because it is positive and heavy. Each alpha particle consists of 2 protons and 2 neutrons bound together.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3: Predict shields */
  {
    id: 's3-predict',
    title: 'Through or Not',
    predict: true,
    prompt: 'Which radiation do you expect to pass most easily through paper and aluminium?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-alpha', 'Alpha: heavy, charge +2', { x: 34, y: 12 }),
        note('g-beta', 'Beta: light electron, charge −1', { x: 34, y: 31 }),
        note('g-gamma', 'Gamma: no mass, no charge', { x: 34, y: 50 }),
        { ...nshield('ref-p', 'paper', { x: 96, y: 52 }), fixed: true },
        { ...nshield('ref-a', 'aluminium', { x: 122, y: 52 }), fixed: true }
      ],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 24 }, size: { w: 46, h: 15 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'Paper and metal are made of atoms surrounded by electrons.',
      'Think about how strongly a charged particle interacts with the electrons it passes.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Test your prediction with the shields next.' }
  },

  /* ---------------------------------------------------------------- 4: Test shields (with lead too) */
  (() => {
    const R = ncountFixture('rig', { x: 100, y: 24 }, { shields: true, h: 42, title: 'Counter, with a shield slot' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-shields',
      title: 'Paper, Aluminium, Lead',
      briefing: { speaker: SPEAKER, body: 'Ions are atoms that have lost electrons. Test alpha, beta, and gamma behind paper, aluminium, and lead to see what stops each one.' },
      get prompt() { const g = guess(); return `Which radiation passes through 5 mm of aluminium?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-a', 'po210', { x: 12, y: 8 }, { text: 'Alpha source' }),
          nsrc('src-b', 'sr90', { x: 12, y: 23 }, { text: 'Beta source' }),
          nsrc('src-g', 'co60s', { x: 12, y: 38 }, { text: 'Gamma source' }),
          ...SHIELD_ROW()
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, R.shieldSlot, { id: 'ans', label: 'Passes aluminium', at: { x: 36, y: 53 }, size: { w: 22, h: 11 } }] }
      }),
      hints: [
        'Place a source in the Sample slot and a shield in the Shield slot, then press "Count".',
        'Watch how many ions each track leaves behind and where each beam stops.',
        'Each ion a charged particle creates drains its energy, so ask which radiation creates the fewest ions.'
      ],
      check(state) {
        const card = inSlot(state, 'ans');
        if (!card) return { ok: false, notYet: true, msg: 'Place a source card in the answer slot.' };
        if (card.props.src === 'co60s') {
          const testedPb = keptCount(state.table, 'src-g', { shield: 'lead' }) != null;
          if (!testedPb) return { ok: false, notYet: true, msg: 'Test the gamma source behind lead too to see what slows it down.' };
          return { ok: true };
        }
        const c = keptCount(state.table, card.id, { shield: 'aluminium' });
        return { ok: false, msg: c != null ? `Behind aluminium, the ${card.label.toLowerCase()} counted ${commas(c)}, about the same as background.` : `Count the ${card.label.toLowerCase()} behind aluminium first.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Gamma passed aluminium; only thick lead slowed it.',
          title: 'Ionizing Radiation',
          body: `${g ? `You predicted ${g}. ` : ''}Gamma passed through aluminium and only thick lead slowed it, while alpha and beta lost energy tearing electrons off atoms (ionizing radiation).`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5: Tissue strip */
  {
    id: 's5-inside',
    title: 'Inside the Body',
    prompt: 'Which radiation harms cells right beside a source inside the body the most?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ntissueFixture('cells', { x: 54, y: 31 }, { w: 102, h: 48 }),
        nchoiceFixture('ans', 'Most harmful inside', { x: 128, y: 32 }, { options: ['Beta', 'Alpha', 'Gamma'], w: 38 })
      ]
    }),
    hints: [
      'Tap Alpha, Beta, and Gamma on the strip to compare their trails.',
      'Compare how many molecules each trail breaks in the first two cells beside the source.',
      'Cell damage depends on how many molecules break inside a cell, so look for the densest trail.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
      if (pick === 2) return { ok: true };
      if (pick === 3) return { ok: false, msg: 'The gamma ray broke only 1 molecule across the whole strip.' };
      return { ok: false, msg: 'The beta particle broke 5 molecules spread across many cells.' };
    },
    reward: { log: 'Alpha breaks 26 molecules in the first 2 cells.', title: 'Close and Dense', body: 'Alpha: inside the body, it dumps all its energy into the first two cells, breaking 26 molecules in one spot.' }
  },

  /* ---------------------------------------------------------------- 6: Mixed source (replaces redundant s8) */
  (() => {
    const R = ncountFixture('rig', { x: 78, y: 23 }, { shields: true, w: 68, h: 40, title: 'Counter, with a shield slot' });
    return {
      id: 's6-mixed',
      title: 'The Mixed Source',
      prompt: 'Which types of radiation does sealed drum source M give off?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-m', 'am241', { x: 12, y: 8 }, { text: 'Source M', hideLast: true }),
          nshield('sh-paper', 'paper', { x: 12, y: 24 }), nshield('sh-al', 'aluminium', { x: 12, y: 40 }), nshield('sh-pb', 'lead', { x: 12, y: 56 })
        ],
        fixtures: [
          R.fixture,
          plaqueFixture('bg', 'Reference', { x: 131, y: 12 }, ['Background: ~25/min'], { w: 30 }),
          nchoiceFixture('ans', 'Source M gives off', { x: 131, y: 44 }, { options: ['Alpha only', 'Beta and gamma', 'Alpha and gamma', 'Alpha and beta'], w: 30 })
        ],
        zones: { slots: [R.slot, R.shieldSlot] }
      }),
      hints: [
        'Count Source M with no shield, then behind paper, aluminium, and lead.',
        'Compare each count with background (~25/min) to see what each shield blocked.',
        'Paper stops alpha, aluminium stops beta, and only thick lead reduces gamma near background.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the four choices.' };
        const t = state.table;
        const cnt = sh => keptCount(t, 'src-m', { shield: sh });
        const open = cnt('open'); const paper = cnt('paper'); const al = cnt('aluminium'); const pb = cnt('lead');
        if (pick === 3) {
          if (pb == null) return { ok: false, notYet: true, msg: 'Test Source M behind lead too to see if lead blocks what passed aluminium.' };
          return { ok: true };
        }
        if (pick === 1) return { ok: false, msg: paper != null ? `Behind paper, Source M still counted ${commas(paper)}, far above background (25), so something passes paper.` : 'Count Source M behind paper first.' };
        if (pick === 2) return { ok: false, msg: open != null && paper != null ? `Paper dropped Source M from ${commas(open)} to ${commas(paper)}, so alpha was blocked.` : 'Count Source M both open and behind paper first.' };
        return { ok: false, msg: al != null && paper != null ? `Behind aluminium, Source M still counted ${commas(al)} (far above 25), nearly the same as behind paper (${commas(paper)}).` : 'Count Source M behind paper and aluminium first.' };
      },
      reward: { log: 'Sample M: alpha and gamma.', title: 'Two at Once', body: 'Alpha and gamma: paper blocked most of the count (alpha), aluminium changed almost nothing, and lead dropped the rest (gamma) to background.' }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Three types of radiation leave unstable nuclei: heavy positive alpha, light negative beta, and uncharged gamma. Charged particles tear electrons off atoms and stop quickly, while uncharged gamma travels furthest.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const S = 'slot:rig.sample'; const SH = 'slot:rig.shield';
const look = id => [put(id, S), run('rig')];

export const SOLUTIONS = [
  [...look('src-p'), ...look('src-q'), ...look('src-r'), put('src-r', 'slot:gamma'), put('src-q', 'slot:beta')],
  [...look('src-s'), ...look('src-t'), ...look('src-u'), put('src-t', 'slot:ans')],
  [put('g-alpha', 'slot:guess')],
  [put('sh-al', SH), ...look('src-a'), ...look('src-b'), ...look('src-g'), put('sh-pb', SH), run('rig'), put('src-g', 'slot:ans')],
  [{ setDial: { fixture: 'cells', dial: 'kind', value: 1 } }, { setDial: { fixture: 'cells', dial: 'kind', value: 2 } }, choose(2)],
  [...look('src-m'), put('sh-paper', SH), run('rig'), put('sh-al', SH), run('rig'), put('sh-pb', SH), run('rig'), choose(3)]
];

export const MISSES = [
  [...look('src-p'), put('src-p', 'slot:gamma')],
  [...look('src-u'), put('src-u', 'slot:ans')],
  [],
  [put('sh-al', SH), ...look('src-b'), put('src-b', 'slot:ans')],
  [choose(3)],
  [...look('src-m'), put('sh-paper', SH), run('rig'), choose(1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
