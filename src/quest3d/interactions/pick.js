/**
 * pick.js — Interactive anchor selection handler for 'pick' and 'pick_multi'
 */

export class PickInteraction {
  constructor(picker, isMulti = false) {
    this.picker = picker;
    this.isMulti = isMulti;
    this.selected = []; // array of anchorIds
    this.onChange = null;
  }

  handlePointerDown(e) {
    const picked = this.picker.pick(e);
    if (!picked) return null;

    if (!this.isMulti) {
      this.selected = [picked.id];
    } else {
      const idx = this.selected.indexOf(picked.id);
      if (idx !== -1) {
        this.selected.splice(idx, 1);
      } else {
        this.selected.push(picked.id);
      }
    }

    if (this.onChange) this.onChange(this.getPayload());
    return picked;
  }

  getPayload() {
    return { anchors: [...this.selected] };
  }

  clear() {
    this.selected = [];
  }
}
