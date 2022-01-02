
function DrawSets() {
  this.sets = new Array();
  g_draw_set = this.new_set();
}

DrawSets.prototype.new_set = function(time) {
  let set = new DrawSet(time);
  g_draw_set = set;
  this.sets.push(set);
  return set;
}

function _DrawSets_wait_for_space(e) {
  let ch = String.fromCharCode(e.charCode);
  if (ch == ' ') {
    document.onkeypress = null;
    g_draw_sets.draw_next();
  }
}

DrawSets.prototype.draw_next = function() {
  if (this.sets.length == 0) {
    /*
     * Drawing is finished. Start a new drawing set and return to the
     * normal keypress handler.
     */
    document.onkeypress = handle_keypress;
    g_draw_set = this.new_set();
    return; 
  }
  let t = this;
  let set = t.sets.shift();
  set.do_draw();
  /*
   * If the current set has "wait for space" set, then set a
   * keypress handler that waits for a space before resuming
   * drawing. Otherwise, start another drawing task.
   */
  if (set.wait_for_space) {
    document.onkeypress = _DrawSets_wait_for_space;
    return;
  } else {
    setTimeout(function() { t.draw_next(); }, set.time);
  }
}

DrawSets.prototype.draw = function() {
  let t = this;
  document.onkeypress = null;
  setTimeout(function() {
    t.draw_next();
  }, 0);
}

function DrawSet(time) {
  this.action = new Array();
  if (time == null) { time = 0; }
  this.time = time;
  this.wait_for_space = false;
}

DrawSet.prototype.set_wait_for_space = function() {
  this.wait_for_space = true;
}

DrawSet.prototype.add_action = function(action) {
  this.action.push(action);
}

DrawSet.prototype.do_draw = function() {
  this.action.forEach((a) => {
//  for each (let a in this.action) {
    g_screen_table[a[0]][a[1]].nodeValue = a[2];
    a[3].style.color = a[4];
  })
};
