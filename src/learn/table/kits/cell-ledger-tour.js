/**
 * kits/cell-ledger-tour.js — what the Tour says about the half-reaction ledger and the electron tally (Brinewire, `q1-halves`). Plain words,
 * none the bench has not earned. It says how a tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellledger': {
    title: 'Ledger card', dials: false,
    text: 'A ledger card holds one half of a reaction, with an arrow between its left and right sides. Its dials add electrons, hydrogen ions or water to one side, or write the whole half out several times over. The "Left" and "Right" lines show what the card now holds. Under them, each row counts one kind of atom, or the electric charge, on the left and on the right of the arrow. The card prints these counts and does not mark any row right or wrong.'
  },
  'cell:celltally': {
    title: 'Electron tally', dials: false,
    text: 'The tally adds up the electrons the cards now give away (electrons on the right of an arrow) and the electrons they take in (electrons on the left). It changes as the cards\' dials change.'
  }
}, {});
