class DrawSets {
  constructor() {
    this.sets = new Array();
    this.new_set();
  }
  new_set(time) {
    let set = new DrawSet(time);
    this.sets.push(set);
    G.draw_set = set;
    return set;
  }
  _DrawSets_wait_for_space(e) {
    let ch = String.fromCharCode(e.charCode);
    if (ch == ' ') {
      document.onkeypress = null;
      G.draw_sets.draw_next();
    }
  }
  draw_next() {
    if (this.sets.length == 0) {
      /*
       * Drawing is finished. Start a new drawing set and return to the
       * normal keypress handler.
       */
      document.onkeypress = handle_keypress;
      G.draw_set = this.new_set();
      return;
    }
    let set = this.sets.shift();
    set.do_draw();
    /*
     * If the current set has "wait for space" set, then set a
     * keypress handler that waits for a space before resuming
     * drawing. Otherwise, start another drawing task.
     */
    if (set.wait_for_space) {
      document.onkeypress = this._DrawSets_wait_for_space;
      return;
    } else {
      let t = this;
      setTimeout(function () { t.draw_next(); }, set.time);
    }
  }
  draw() {
    let t = this;
    document.onkeypress = null;
    setTimeout(function () {
      t.draw_next();
    }, 0);
  }
}

class DrawSet {
  constructor(time) {
    this.action = new Array();
    if (time == null) { time = 0; }
    this.time = time;
    this.wait_for_space = false;
  }
  set_wait_for_space() {
    this.wait_for_space = true;
  }
  add_action(action) {
    this.action.push(action);
  }
  do_draw() {
    this.action.forEach((a) => {
      G.screen.screen_table[a[0]][a[1]].nodeValue = a[2];
      a[3].style.color = a[4];
    });
  }
}