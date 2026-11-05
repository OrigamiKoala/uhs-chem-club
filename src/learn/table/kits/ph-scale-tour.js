/** Tour words for the scale flask and the two meters (Verdigris, q2-scale). Three beats a step. */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phscale': {
    title: 'Flask with a window', dials: false,
    text: 'A flask holds one solution, named at the top with its strength in mol/L. The window is a magnified square holding 200 pieces of what was put in, and the colours are named under it. A piece that has come apart shows as the two or three spheres it made. Where the flask has a seat, the box under the window, lay a meter there to read the flask; the seat keeps the last reading each meter gave. Where the flask prints two lines for H₃O⁺ and OH⁻, those are the measured amounts in mol/L.'
  }
}, {
  phmeter2: ['Meters', 'A meter has a probe and a display, and its name says what it reads. Drag it onto a flask\'s seat, or tap it and then tap the seat. The display then shows that reading for that flask, and a dash when the meter is not on a flask.']
});
