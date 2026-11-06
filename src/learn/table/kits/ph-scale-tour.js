/** Tour words for the scale flask and the two meters (Verdigris, q2-scale). Three beats a step. */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phscale': {
    title: 'Flask with a window', dials: false,
    text: 'Lay a meter on the seat. Dilute adds water.'
  }
}, {
  phmeter2: ['Meters', 'Drag it onto a flask to read it.']
});
