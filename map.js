//
//
//
//
//  SCREEN ==================== html ==================
//
//
//  DISPLAY BACKING (same size), dirty = cell needing to be copied
//
//
//  MAP (map size) terrain combined w/ obj, cr, etc
//
//
//  LEVEL (terrain, obj, cr, independently)
//
//
//
//
//
//  map.copy_to_backing
//  map.update_to_backing
//
//  backing.copy_to_screen
//  backing.update_to_screen
//
//
//

//
// ===========================================================
// Map
// ===========================================================
//
class Map {
  constructor(x_dim, y_dim) {
    this.x_dim = x_dim;
    this.y_dim = y_dim;
    this.create_map();
  }
  create_map() {
    this.sym = new_2d(this.x_dim, this.y_dim, '_');
    this.attr = new_2d(this.x_dim, this.y_dim, null);
    this.dirty = new_2d(this.x_dim, this.y_dim, true);
    this.dirty_vec = new Array();
    for (let x = 0; x < this.x_dim; x++) {
      for (let y = 0; y < this.y_dim; y++) {
        this.dirty_vec.push([x, y]);
      }
    }
    this.known = new_2d(this.x_dim, this.y_dim, false);
    this.overlay = new_2d(this.x_dim, this.y_dim, false);
    this.overlay_vec = new Array();
    this.visible = new_2d(this.x_dim, this.y_dim, false);
    this.visible_vec = new Array();
  }
  sym_at(x, y) { return this.sym[x][y]; }
  dirty_at(x, y) { return this.dirty[x][y]; }
  attr_at(x, y) { return this.attr[x][y]; }
  get_dirty_vec() { return this.dirty_vec; }
  clear_dirty() {
    this.dirty_vec.forEach((c) => {
      let [x, y] = c;
      this.dirty[x][y] = false;
    });
    this.dirty_vec = new Array();
  }
  is_on(x, y) {
    return (x >= 0 && x < this.x_dim && y >= 0 && y < this.y_dim);
  }
  set_dirty(x, y) {
    if (!this.dirty[x][y]) {
      this.dirty[x][y] = true;
      this.dirty_vec.push([x, y]);
    }
    return;
  }
  has_overlay() {
    return this.overlay_vec.length > 0;
  }
  set_overlay(x, y) {
    if (!this.overlay[x][y]) {
      this.overlay[x][y] = true;
      this.overlay_vec.push([x, y]);
      this.set_dirty(x, y);
    }
  }
  reset_overlay(x, y) {
    this.overlay_vec.forEach((c) => {
      //  for each (let c in this.overlay_vec) {
      let [x, y] = c;
      this.overlay[x][y] = false;
      this.set_dirty(x, y);
    });
    this.overlay_vec = new Array;
  }
  set_all_map_known() {
    for (let x = 0; x < this.x_dim; x++) {
      for (let y = 0; y < this.y_dim; y++) {
        this.set_known(x, y);
      }
    }
  }
  set_known(x, y) {
    if (!this.known[x][y]) {
      this.known[x][y] = true;
      this.set_dirty(x, y);
    }
  }
  clear_known(x, y) {
    if (this.known[x][y]) {
      this.known[x][y] = false;
      this.set_dirty(x, y);
    }
  }
  set_visible(x, y) {
    if (!this.visible[x][y]) {
      this.visible[x][y] = true;
      this.visible_vec.push([x, y]);
      this.known[x][y] = true;
      this.set_dirty(x, y);
    }
  }
  reset_visibility() {
    this.visible_vec.forEach((c) => {
      //  for each (let c in this.visible_vec) {
      let [x, y] = c;
      this.visible[x][y] = false;
      this.set_dirty(x, y);
    });
    this.visible_vec = new Array;
  }
  write_cell(x, y, sym, attr) {
    this.sym[x][y] = sym;
    this.attr[x][y] = attr;
    this.set_dirty(x, y);
    return;
  }
  update_cell(x, y) {
    let sym = G.level.sym_at(x, y);
    let attr = G.level.attr_at(x, y);
    if (sym != this.sym[x][y] || attr != this.attr[x][y]) {
      this.sym[x][y] = sym;
      this.attr[x][y] = attr;
      this.set_dirty(x, y);
    }
  }
  update() {
    this.dirty_vec = new Array();
    for (let x = 0; x < this.x_dim; x++) {
      for (let y = 0; y < this.y_dim; y++) {
        if (this.sym[x][y] != G.level.sym_at(x, y) ||
          this.attr[x][y] != G.level.attr_at(x, y)) {
          this.sym[x][y] = G.level.sym_at(x, y);
          this.attr[x][y] = G.level.attr_at(x, y);
          this.set_dirty(x, y);
        }
      }
    }
  }
  update_map_to_screen_backing() {
    let x_offset = 0;
    let y_offset = 1;
    let map = G.map;
    let screen = G.screen;
    map.get_dirty_vec().forEach((c) => {
      //  for each (let c in map.get_dirty_vec()) {
      let [x, y] = c;
      if (map.sym_at(x, y) != G.screen.screen_backing[x + x_offset][y + y_offset] ||
        map.attr_at(x, y) !=  G.screen.screen_backing_attr[x + x_offset][y + y_offset] ||
        !map.visible[x][y]) {
        if (map.visible[x][y]) {
          screen.screen_backing[x + x_offset][y + y_offset] = map.sym_at(x, y);
          screen.screen_backing_attr[x + x_offset][y + y_offset] = map.attr_at(x, y);
        } else if (map.known[x][y]) {
          screen.screen_backing[x + x_offset][y + y_offset] = G.level.known_sym_at(x, y);
          screen.screen_backing_attr[x + x_offset][y + y_offset] = '#666';
        } else {
          screen.screen_backing[x + x_offset][y + y_offset] = '~';
          screen.screen_backing_attr[x + x_offset][y + y_offset] = '#000';
        }
        screen.set_screen_backing_dirty(x + x_offset, y + y_offset);
      }
    });
    if (map.has_overlay()) {
      map.overlay_vec.forEach((c) => {
        let [x, y] = c;
        let [x0, y0] = [x + x_offset, y + y_offset];
        screen.screen_backing[x0][y0] = map.sym_at(x, y);
        screen.screen_backing_attr[x0][y0] = map.attr_at(x, y);
        screen.set_screen_backing_dirty(x0, y0);
      });
      map.reset_overlay();
    }
    map.clear_dirty();
  }
  
}

