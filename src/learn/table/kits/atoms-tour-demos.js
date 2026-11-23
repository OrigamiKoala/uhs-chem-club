/**
 * kits/atoms-tour-demos.js — the loose Lewis board's Tour shows a hand doing it (`table/tour-demo.js`, `stageDemo`): a real stage of
 * Ligar's `q4-dots` and its own solution, played on the Tour card. Water: a hydrogen dragged onto the oxygen, then the other, and two
 * Electron pairs dropped on the oxygen, with the board arranging itself after each move exactly as the bench does.
 */
import { addTourDemo, stageDemo } from '../tour-demo.js';

const Q4 = () => import('../../quests/unit03/q4-dots.js');

/** Stage 4 builds water; stage 10 places a single electron on nitric oxide. */
addTourDemo('atoms:fx_slateloose', () => stageDemo(Q4, 3, { max: 4 }));
addTourDemo('atoms:pc_pairsloose', () => stageDemo(Q4, 3, { max: 4 }));
addTourDemo('atoms:pc_singleloose', () => stageDemo(Q4, 9, { max: 5 }));
