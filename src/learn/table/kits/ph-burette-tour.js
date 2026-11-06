/**
 * kits/ph-burette-tour.js — what the Tour says about the burette (Verdigris, `q6-titrate`). Three beats: what it is, what to do, what it
 * tells you. Plain words, none the bench has not earned. It says how the tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phburette': {
    title: 'Burette and flask', dials: false,
    text: 'Pour adds base. Amber dots are H₃O⁺, blue dots are OH⁻.'
  }
}, {});
