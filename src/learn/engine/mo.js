/**
 * mo.js — The molecular-orbital boxes the rack's `molecular` layout holds.
 *
 * PURE. A diatomic molecule has the two atoms' boxes in two columns and, between
 * them, the combined boxes: each pair of atomic boxes that combine makes one that
 * sits lower (bonding) and one that sits higher (antibonding). The rack lays them
 * on an energy ladder like the atomic one and takes electrons the same way, two
 * taps, at most one of each spin to a box.
 *
 * TWO ORDERS. Below nitrogen the side-to-side pair of 2p boxes sits LOWER than the
 * end-on one; from oxygen up it is the other way round. The declaration chooses
 * (`order: 'b2n2' | 'o2f2'`), and the order switch is itself a stage.
 *
 * The magnet measures the REAL molecule (`MEASURED_UNPAIRED`), never the player's
 * arrangement, as it does on the atomic rack.
 */

/** Rows from lowest energy to highest, per order. `boxes` is how many boxes each row has. */
const ROWS = {
  '1s': [
    { id: 'g1s', label: 'σ1s', boxes: 1, anti: false },
    { id: 'u1s', label: 'σ*1s', boxes: 1, anti: true }
  ],
  o2f2: [
    { id: 'g2s', label: 'σ2s', boxes: 1, anti: false },
    { id: 'u2s', label: 'σ*2s', boxes: 1, anti: true },
    { id: 'g2p', label: 'σ2p', boxes: 1, anti: false },
    { id: 'p2p', label: 'π2p', boxes: 2, anti: false },
    { id: 'q2p', label: 'π*2p', boxes: 2, anti: true },
    { id: 'u2p', label: 'σ*2p', boxes: 1, anti: true }
  ],
  b2n2: [
    { id: 'g2s', label: 'σ2s', boxes: 1, anti: false },
    { id: 'u2s', label: 'σ*2s', boxes: 1, anti: true },
    { id: 'p2p', label: 'π2p', boxes: 2, anti: false },
    { id: 'g2p', label: 'σ2p', boxes: 1, anti: false },
    { id: 'q2p', label: 'π*2p', boxes: 2, anti: true },
    { id: 'u2p', label: 'σ*2p', boxes: 1, anti: true }
  ]
};

export function rowsMO(order) { return ROWS[order] || ROWS.o2f2; }

export function rowMO(order, id) { return rowsMO(order).find(r => r.id === id) || null; }

export const boxKeyMO = (rowId, idx) => `${rowId}:${idx}`;

/** Place one electron: a box takes at most one of each spin. */
export function placeMO(order, rack, rowId, idx, spin) {
  const row = rowMO(order, rowId);
  if (!row || idx < 0 || idx >= row.boxes) return { refused: 'That is not a box on this rack.' };
  const key = boxKeyMO(rowId, idx);
  const here = rack[key] || '';
  if (here.includes(spin)) return { refused: 'A box takes one arrow of each direction and no more.' };
  const next = { ...rack, [key]: [...new Set((here + spin).split(''))].sort().reverse().join('') };
  return { rack: next };
}

export function removeMO(order, rack, rowId, idx) {
  const key = boxKeyMO(rowId, idx);
  const here = rack[key] || '';
  if (!here) return { refused: 'There is no electron in that box.' };
  const next = { ...rack };
  // Lift the down arrow first, as a hand would take the top one off a pair.
  const left = here.length > 1 ? here.replace('d', '') : '';
  if (left) next[key] = left; else delete next[key];
  return { rack: next };
}

/** What a rack of MO boxes reads: the electrons, the bond order and the unpaired count. */
export function readMO(order, rack) {
  let total = 0; let bonding = 0; let anti = 0; let unpaired = 0;
  const parts = [];
  for (const row of rowsMO(order)) {
    let inRow = 0;
    for (let i = 0; i < row.boxes; i++) {
      const here = rack[boxKeyMO(row.id, i)] || '';
      inRow += here.length;
      if (here.length === 1) unpaired += 1;
    }
    total += inRow;
    if (row.anti) anti += inRow; else bonding += inRow;
    if (inRow) parts.push(`${row.label}${sup(inRow)}`);
  }
  const bondOrder = (bonding - anti) / 2;
  return {
    total, bonding, anti, unpaired,
    bondOrder, config: parts.join(' '),
    pull: unpaired
  };
}

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function sup(n) { return String(n).split('').map(c => SUP[c]).join(''); }

/** Fill electrons in energy order, one to each box in a row before pairing (Hund). */
export function fillMO(order, electrons) {
  const rack = {};
  let left = electrons;
  for (const row of rowsMO(order)) {
    // First arrow in every box, then the second.
    for (const pass of ['u', 'd']) {
      for (let i = 0; i < row.boxes && left > 0; i++) {
        const key = boxKeyMO(row.id, i);
        rack[key] = (rack[key] || '') + pass;
        left -= 1;
      }
    }
    if (left <= 0) break;
  }
  return rack;
}

/** The diatomics the rack holds. `e` is valence electrons; `measured` are real figures. */
export const DIATOMICS = {
  H2: { id: 'H2', label: 'H₂', order: '1s', e: 2, unpaired: 0, length: 74, energy: 436 },
  He2: { id: 'He2', label: 'He₂', order: '1s', e: 4, unpaired: 0, length: null, energy: 0 },
  B2: { id: 'B2', label: 'B₂', order: 'b2n2', e: 6, unpaired: 2, length: 159, energy: 290 },
  C2: { id: 'C2', label: 'C₂', order: 'b2n2', e: 8, unpaired: 0, length: 124, energy: 599 },
  N2: { id: 'N2', label: 'N₂', order: 'b2n2', e: 10, unpaired: 0, length: 110, energy: 945 },
  O2: { id: 'O2', label: 'O₂', order: 'o2f2', e: 12, unpaired: 2, length: 121, energy: 498 },
  O2p: { id: 'O2p', label: 'O₂⁺', order: 'o2f2', e: 11, unpaired: 1, length: 112, energy: 643 },
  O2m: { id: 'O2m', label: 'O₂⁻', order: 'o2f2', e: 13, unpaired: 1, length: 133, energy: 395 },
  F2: { id: 'F2', label: 'F₂', order: 'o2f2', e: 14, unpaired: 0, length: 143, energy: 159 }
};

/** The bond order the electrons of a diatomic fill to. */
export function bondOrderOf(id) {
  const d = DIATOMICS[id];
  return readMO(d.order, fillMO(d.order, d.e)).bondOrder;
}
