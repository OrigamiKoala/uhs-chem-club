/**
 * kits/matter-read.js — What the matter kit's probe (and, as the benches arrive, window, flask, curve, flask bench and strip) read.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every figure is `engine/matterdata.js` asked about what the table holds. This file only reads what the
 * table holds: the card seated in a slot, the settings of the dials. A stage declares what stands on the table and what to look for; it
 * never declares what a reading is.
 */

import { gripOf, hydrationOf, SUBSTANCES, HYDRATION } from '../../engine/matterdata.js';
import { seatedIn } from './heat-read.js';

export { seatedIn, fixed, markerRead, dialAt, piecesInTray, whereIs } from './heat-read.js';

/** The reading a card gives in the probe, kJ per mole: a molecule's grip, or the heat an ion gives out in water. */
export function probeValue(card) {
  const pr = card.props;
  if (pr.ion) return hydrationOf(pr.ion);
  return gripOf(pr.substance);
}

/** The probe: the card seated in it, whether it has been pulled, and the reading it keeps. */
export function probeRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const pulled = Boolean(item && item.props.grip != null);
  return { item, pulled, value: pulled ? item.props.grip : null, mode: f.props.mode };
}

export const nameOf = card => (card.props.ion ? HYDRATION[card.props.ion]?.symbol : SUBSTANCES[card.props.substance]?.name);
