/**
 * arrow.js — Single curved arrow interaction handler
 */

export class ArrowInteraction {
  constructor(arrowController, picker) {
    this.arrowController = arrowController;
    this.picker = picker;
    this.currentArrow = null;
    this.selectedSource = null;
    this.onChange = null;
  }

  handlePointerDown(e) {
    const picked = this.picker.pick(e);
    if (!picked) return;

    if (!this.selectedSource) {
      // Step 1: Select source
      this.selectedSource = picked;
      this.arrowController.startFrom(picked);
    } else {
      // Step 2: Select destination (Tap-Tap flow)
      if (picked.id !== this.selectedSource.id) {
        const completed = this.arrowController.finishAt(picked);
        this.currentArrow = completed;
        this.selectedSource = null;
        if (this.onChange) this.onChange(this.getPayload());
      } else {
        this.clear();
      }
    }
  }

  getPayload() {
    if (!this.currentArrow) return null;
    return { from: this.currentArrow.from, to: this.currentArrow.to };
  }

  clear() {
    this.currentArrow = null;
    this.selectedSource = null;
    this.arrowController.clear();
  }
}
