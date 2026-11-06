/**
 * kits/cell-tour-demos.js — the Brinewire Tour shows each tool being used: a real stage's table and its own solution, played on the Tour card
 * (`table/tour-demo.js`, `stageDemo`). The moving model beside the bench moves in the clip too, because the clip is drawn by the same painters.
 */
import { addTourDemo, stageDemo } from '../tour-demo.js';

const Q1 = () => import('../../quests/unit10/q1-halves.js');
const Q2 = () => import('../../quests/unit10/q2-activity.js');
const Q3 = () => import('../../quests/unit10/q3-galvanic.js');
const Q4 = () => import('../../quests/unit10/q4-potential.js');
const Q5 = () => import('../../quests/unit10/q5-load.js');
const Q6 = () => import('../../quests/unit10/q6-electrolysis.js');

const reg = (key, load, i, o) => addTourDemo(`cell:${key}`, () => stageDemo(load, i, o));

reg('fx_cellledger', Q1, 2); reg('fx_celltally', Q1, 3); reg('fx_cellscene', Q1, 2);
reg('fx_cellredox', Q1, 0); reg('fx_cellprobe', Q1, 4);
reg('fx_celldip', Q2, 1); reg('pc_celldipstrip', Q2, 1); reg('fx_celldipnails', Q2, 5);
reg('fx_cellgalv', Q3, 1); reg('pc_cellgalvtube', Q3, 1); reg('pc_cellgalvrod', Q3, 1); reg('pc_cellgalvwire', Q3, 1);
reg('fx_cellgalvplot', Q3, 1); reg('fx_cellgalvbal', Q3, 5); reg('pc_cellgalvstrip', Q3, 5);
reg('fx_cellboard', Q4, 0); reg('pc_cellelectrode', Q4, 0); reg('fx_cellrig', Q4, 4);
reg('fx_cellloadrun', Q5, 1); reg('fx_cellloadread', Q5, 2); reg('fx_cellloadcc', Q5, 4);
reg('fx_selector', Q2, 3); reg('pc_cellgas', Q2, 4); reg('pc_cellcan', Q5, 6);
reg('fx_cellsupply', Q6, 0); reg('pc_cellsupplypack', Q6, 5); reg('pc_cellsupplyplate', Q6, 7);
