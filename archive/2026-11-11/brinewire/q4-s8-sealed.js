// Archived from src/learn/quests/unit10/q4-potential.js (stage 8: Two Sealed Metals)
// Cut reason: repeated stage 2 (A Cell Nobody Wired) with no new idea.

const S8 = { a: 'fe', b: 'au' };

export const s8Sealed = {
  id: 's8-sealed',
  title: 'Two Sealed Metals',
  prompt: 'Find the voltage, in volts, of a cell made from the two sealed metals.',
  entry: { id: 'e', label: 'Cell voltage', unit: 'V' },
  hints: [
    'Read both sealed electrodes on the board and type the voltage in the field.',
    'Compare the two readings on the strip, one negative and one positive.',
    'Take the lower reading away from the higher one.'
  ]
};
