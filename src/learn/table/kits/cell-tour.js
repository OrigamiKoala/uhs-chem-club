/**
 * kits/cell-tour.js — the cell kit's shared Tour setup (Brinewire). The heat kit's cards, number marker, plate and answer dial keep their
 * words (`heat-tour.js`) and are re-registered under `cell:`. Each instrument adds its own `cell-<name>-tour.js` beside this one.
 */
import { aliasTourKit } from '../tour.js';
import './heat-tour.js';

aliasTourKit('heat', 'cell');
