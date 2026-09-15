/**
 * chain.js — Multi-step reaction arrow cascade handler
 */

export class ChainInteraction {
  constructor(arrowController, picker) {
    this.arrowController = arrowController;
    this.picker = picker;
    this.steps = [];
    this.selectedSource = null;
    this.onChange = null;
  }

  handlePointerDown(e) {
    const picked = this.picker.pick(e);
    if (!picked) return;

    if (!this.selectedSource) {
      this.selectedSource = picked;
      this.arrowController.startFrom(picked);
    } else {
      if (picked.id !== this.selectedSource.id) {
        const completed = this.arrowController.finishAt(picked);
        if (completed) {
          this.steps.push(completed);
          this.selectedSource = null;
          if (this.onChange) this.onChange(this.getPayload());
        }
      } else {
        this.selectedSource = null;
        this.arrowController.cancel();
      }
    }
  }

  getPayload() {
    return { steps: [...this.steps] };
  }

  clear() {
    this.steps = [];
    this.selectedSource = null;
    this.arrowController.clear();
  }
}
