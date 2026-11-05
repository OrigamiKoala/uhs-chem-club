/**
 * kits/ph-race-tour.js — the Tour's words for the proton race and its cards (Verdigris q4). Plain words, none the bench has not earned.
 */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phrace': {
    title: 'Proton race', dials: false,
    text: 'The race has two places. Put an acid card in the first place, and a second card in the other: it stands for the base that acid leaves behind. There are 100 protons and they start on the acid. Press Race and each window shows where they end up: grey spheres hold a proton and green ones hold none. The list on the right keeps every race you have run.'
  }
}, {
  phacid: ['Acid cards', 'Each card is one acid, with facts about its structure printed on it. Drag it into a place on the race, or tap it and then tap the place. In the first place it acts as the acid, in the second as the base it leaves. Drag it back to the rail when the race is done.']
});
