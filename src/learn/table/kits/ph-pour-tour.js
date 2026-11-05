/** Tour words for the pour window (Verdigris, q1-handover). Three beats; none of the words the bench is about to earn. */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phpour': {
    title: 'Pour window', dials: false,
    text: 'The window is a magnified square of 8 cells. Each cell holds one piece of what is being poured, next to the water molecule it touches. Big spheres are the heavy atoms and small spheres are hydrogens, and the colours are named under the window. Press "Pour" and watch which cells change. The Mark dial paints chosen atoms white, or the lone pairs gold, so you can follow where they end up. Marking before or after a pour shows the same atoms.'
  }
}, {
  phchip: ['Formula chips', 'Each chip names one substance by its formula. Drag it into a place, or tap it and then tap the place. What you leave in the places is your answer.']
});
