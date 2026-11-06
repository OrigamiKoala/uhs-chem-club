/**
 * kits/pans-cards-tour.js — Tour words for the card board of `q4-properties`. Three beats a step; earned words only.
 */

import { addTourText } from '../tour.js';

const FIXTURES = {
  'pans:kcheck': {
    title: 'Vessel check', dials: false,
    text: 'A sealed mixture that has stopped changing, drawn as one bar for each substance with the amount above it. Lay a reaction card in the tray beside it and press "Read K". The check reads that reaction\'s K from the amounts in the bars and writes it, with the reaction, in the list beside the bars. Lay a different card, or the same card turned, and read again to compare.'
  },
  'pans:kstack': {
    title: 'Stack', dials: false,
    text: 'The stack adds up the reaction cards that lie in its tray. Under the reaction you want, in grey, it prints the one the cards add up to, with the substances that appear on both sides cancelled out.'
  }
};

const PIECES = {
  rxn: ['Reaction card', 'A card with a reaction written on it, and the K it was printed with. Pick it up and press "Flip" to write the reaction the other way round, or "Larger" to write every amount again, twice, three times and so on. The equation on the card changes to match what you did, and a card that has been changed does not print a new K.'],
  ktile: ['K card', 'A card with a number on it. Drag it into the answer slot; the card in the slot when you press Submit is your answer.']
};

addTourText(FIXTURES, PIECES);
