/**
 * kits/ph-race-tour.js — the Tour's words for the proton race and its cards (Verdigris q4). Plain words, none the bench has not earned.
 */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phrace': {
    title: 'Proton race', dials: false,
    text: 'Put an acid on the left and a base on the right, then press Race.'
  }
}, {
  phacid: ['Acid cards', 'Drag each acid onto the line from weakest to strongest.']
});
