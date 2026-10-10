/** The words the magnet readout uses, shared so both its keys say the same thing. */
export function pullWords(strength) {
  return strength > 0
    ? `Pulled toward the magnet, with a strength of ${strength}.`
    : 'Pushed very slightly away from the magnet.';
}
