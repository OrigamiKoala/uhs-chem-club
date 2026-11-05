/**
 * kits/ph-burette-tour.js — what the Tour says about the burette (Verdigris, `q6-titrate`). Three beats: what it is, what to do, what it
 * tells you. Plain words, none the bench has not earned. It says how the tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phburette': {
    title: 'Burette and flask', dials: false,
    text: 'A tall graduated tube stands over each flask: sodium hydroxide over a flask that holds an acid, and over a flask that holds a base the acid named under that flask. The dial "Pour size" picks how much one press lets in: 5 mL, 1 mL or 0.1 mL. Press "Pour" and every flask gets that much; the volume poured so far is printed at the bottom. A flask with a display shows its pH, and a row of tubes shows the colour a dye takes in the flask. A press cannot be taken back except with Undo.'
  }
}, {});
