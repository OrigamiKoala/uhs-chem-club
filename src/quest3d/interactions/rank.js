/**
 * rank.js — Ranking interaction handler
 */

export class RankInteraction {
  constructor(initialOrder = []) {
    this.order = [...initialOrder];
    this.onChange = null;
  }

  move(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.order.length || toIndex < 0 || toIndex >= this.order.length) return;
    const [item] = this.order.splice(fromIndex, 1);
    this.order.splice(toIndex, 0, item);
    if (this.onChange) this.onChange(this.getPayload());
  }

  getPayload() {
    return { order: [...this.order] };
  }
}
