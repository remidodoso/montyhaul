

function shuffle(a) {
  if (a.length == 1) { return; }
  for (let i = 0; i < a.length - 1; i++) {
    let n = Math.floor(Math.random() * (a.length - i)) + i;
    let t = a[i];
    a[i] = a[n];
    a[n] = t;
  }
  return a;
};



//
//
// LAYERS and FLAGS
//
// ================================================= pager_overlay
// ================================================= effects_overlay
//
// ------------------------------------------------- known
// ------------------------------------------------- lit
// ------------------------------------------------- visible 
//
// ------------------------------------------------- cr_at
// ------------------------------------------------- obj_at
// ------------------------------------------------- trap_at (?)
// ================================================= terrain
//
//


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


var UI;

var monsters;

var g_screen_backing_dirty_a;

var g_map_needs_update = false;

var g_draw_set;
var g_draw_sets;

var g_messages;

function more(msg) {
  g_draw_sets.new_set();
  g_draw_set.set_wait_for_space();
  message(msg + ' -more-');
  g_draw_sets.new_set();
  do_status_line();
}

function do_more() {
  if (g_messages.length == 0) {
    G.more_waiting_for_space = false;
    return false;
  }
  g_message = g_messages.pop() + ' -more-';
  for (var i = 0; i < g_message_buffer.length; i++) {
    if (i < g_message.length) {
      g_message_buffer[i] = g_message.charAt(i);
    } else {
      g_message_buffer[i] = ' ';
    }
  }
  update_message_on_screen_backing();
  update_screen();
  G.more_waiting_for_space = true;
  return true;
}

function tile_solid(tile) {
  switch (tile) {
    case K.TILE_FLOOR: return false;
    case K.TILE_WALL: return true;
  };
}

function new_1d(x, init) {
  var a = new Array(x);
  for (var i = 0; i < x; i++) {
    a[i] = init;
  }
  return a;
}

function new_2d(x, y, init) {
  var a = new Array(x);
  for (var i = 0; i < x; i++) {
    a[i] = new Array(y);
    for (var j = 0; j < y; j++) {
      a[i][j] = init;
    }
  }
  return a;
}



//
// ===========================================================
// Pager
// ===========================================================
//
function Pager(x_dim, y_dim) {
  this.overlay = new_2d(this.x_dim, this.y_dim, null);
  this.attr = new_2d(this.x_dim, this.y_dim, null);
  this.text = new String();
}

Pager.prototype.write = function (text) {
  this.text += text;
  return;
}

Pager.prototype.writeln = function (text) {
  this.text += text + "\n";
}

Pager.prototype.show = function () {
  let max_width = 0;
  let lines = this.text.split("\n");
  if (lines[lines.length - 1] == '') {
    lines.pop();
  }
  lines.push("-- end --");
  lines.forEach((line) => {
    if (line.length > max_width) { max_width = line.length; }
  });
  max_width++;
  for (let y = 0; y < lines.length; y++) {
    let line = lines[y];
    line += ' ';
    let x;
    for (x = 0; x < line.length; x++) {
      if (x >= this.x_dim) { break; }
      G.map.write_cell(x, y, line.charAt(x), 'yellow');
      G.map.set_overlay(x, y);
    }
    for (; x < max_width; x++) {
      G.map.write_cell(x, y, ' ', 'yellow');
      G.map.set_overlay(x, y);
    }
  }
  this.text = new String();
  G.pager_last = true;
  G.pager_waiting_for_space = true;
  update_map_to_screen_backing();
  update_screen();
}



//
// ===========================================================
// Level
// ===========================================================
//

function Level(x_dim, y_dim) {
  this.x_dim = x_dim;
  this.y_dim = y_dim;
  this.cr = new_2d(this.x_dim, this.y_dim, null);
  this.obj = new_2d(this.x_dim, this.y_dim, null);
  this.create_terrain();
}

Level.prototype.create_terrain = function () {
  this.terrain = new_2d(this.x_dim, this.y_dim, K.TILE_FLOOR);
  for (let x = 0; x < this.x_dim; x++) {
    this.terrain[x][0] = K.TILE_WALL;
    this.terrain[x][this.y_dim - 1] = K.TILE_WALL;
  }
  for (let y = 0; y < this.y_dim; y++) {
    this.terrain[0][y] = K.TILE_WALL;
    this.terrain[this.x_dim - 1][y] = K.TILE_WALL;
  }
  //
  // Add some random "pillars"
  //
  let pillars = Math.floor(Math.random() * 4) + 2;
  for (var n = 0; n < pillars; n++) {
    let x_size = Math.floor(Math.random() * 3) + 2;
    let y_size = Math.floor(Math.random() * 3) + 2;
    let x_org = Math.floor(Math.random() * (this.x_dim - 20)) + 10;
    let y_org = Math.floor(Math.random() * (this.y_dim - 15)) + 7;
    for (let x = x_org; x < x_org + x_size; x++) {
      for (let y = y_org; y < y_org + y_size; y++) {
        this.terrain[x][y] = K.TILE_WALL;
      }
    }
  }
  return;
}

Level.prototype.is_opaque = function (x, y) {
  return this.terrain[x][y].ch == '#';
}

Level.prototype.is_solid = function (x, y) {
  return tile_solid(this.terrain[x][y]);
}

Level.prototype.terrain_at = function (x, y) {
  return this.terrain[x][y];
}

Level.prototype.cr_at = function (x, y) {
  return this.cr[x][y];
}

Level.prototype.set_cr_at = function (x, y, cr) {
  this.cr[x][y] = cr;
  return cr;
}

Level.prototype.obj_at = function (x, y) {
  return this.obj[x][y];
}

Level.prototype.set_obj_at = function (x, y, obj) {
  this.obj[x][y] = obj;
  return obj;
}

Level.prototype.terrain_sym_at = function (x, y) {
  return this.terrain[x][y].ch;
}

Level.prototype.known_sym_at = function (x, y) {
  if (this.obj[x][y] != null) {
    return this.obj[x][y].ch;
  }
  return this.terrain[x][y].ch;
}

Level.prototype.sym_at = function (x, y) {
  if (this.cr[x][y] != null) {
    return this.cr[x][y].ch;
  }
  if (this.obj[x][y] != null) {
    return this.obj[x][y].ch;
  }
  return this.terrain[x][y].ch;
}

Level.prototype.attr_at = function (x, y) {
  if (this.cr[x][y] != null) {
    return this.cr[x][y].attr;
  }
  return null;
}



//
// ===========================================================
// Map
// ===========================================================
//

function Map(x_dim, y_dim) {
  this.x_dim = x_dim;
  this.y_dim = y_dim;
  this.create_map();
}

Map.prototype.create_map = function () {
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
  return;
}

Map.prototype.sym_at = function (x, y) { return this.sym[x][y]; }
Map.prototype.dirty_at = function (x, y) { return this.dirty[x][y]; }
Map.prototype.attr_at = function (x, y) { return this.attr[x][y]; }
Map.prototype.get_dirty_vec = function () { return this.dirty_vec; }

Map.prototype.clear_dirty = function () {
  this.dirty_vec.forEach((c) => {
    let [x, y] = c;
    this.dirty[x][y] = false;
  });
  this.dirty_vec = new Array();
}



function update_map_to_screen_backing() {
  let x_offset = 0;
  let y_offset = 1;
  let map = G.map;
  map.get_dirty_vec().forEach((c) => {
    //  for each (let c in map.get_dirty_vec()) {
    let [x, y] = c;
    if (map.sym_at(x, y) != g_screen_backing[x + x_offset][y + y_offset] ||
      map.attr_at(x, y) != g_screen_backing_attr[x + x_offset][y + y_offset] ||
      !map.visible[x][y]) {
      if (map.visible[x][y]) {
        g_screen_backing[x + x_offset][y + y_offset] = map.sym_at(x, y);
        g_screen_backing_attr[x + x_offset][y + y_offset] = map.attr_at(x, y);
      } else if (map.known[x][y]) {
        g_screen_backing[x + x_offset][y + y_offset] = G.level.known_sym_at(x, y);
        g_screen_backing_attr[x + x_offset][y + y_offset] = '#666';
      } else {
        g_screen_backing[x + x_offset][y + y_offset] = '~';
        g_screen_backing_attr[x + x_offset][y + y_offset] = '#000';
      }
      set_screen_backing_dirty(x + x_offset, y + y_offset);
    }
  });
  if (map.has_overlay()) {
    map.overlay_vec.forEach((c) => {
      //   for each (let c in map.overlay_vec) {
      let [x, y] = c;
      let [x0, y0] = [x + x_offset, y + y_offset];
      g_screen_backing[x0][y0] = map.sym_at(x, y);
      g_screen_backing_attr[x0][y0] = map.attr_at(x, y);
      set_screen_backing_dirty(x0, y0);
    });
    map.reset_overlay();
  }
  G.map.clear_dirty();
}

Map.prototype.is_on = function (x, y) {
  return (x >= 0 && x < this.x_dim && y >= 0 && y < this.y_dim);
}

Map.prototype.set_dirty = function (x, y) {
  if (!this.dirty[x][y]) {
    this.dirty[x][y] = true;
    this.dirty_vec.push([x, y]);
  }
  return;
}

Map.prototype.has_overlay = function () {
  return this.overlay_vec.length > 0;
}

Map.prototype.set_overlay = function (x, y) {
  if (!this.overlay[x][y]) {
    this.overlay[x][y] = true;
    this.overlay_vec.push([x, y]);
    this.set_dirty(x, y);
  }
}

Map.prototype.reset_overlay = function (x, y) {
  this.overlay_vec.forEach((c) => {
    //  for each (let c in this.overlay_vec) {
    let [x, y] = c;
    this.overlay[x][y] = false;
    this.set_dirty(x, y);
  });
  this.overlay_vec = new Array;
}

Map.prototype.set_known = function (x, y) {
  if (!this.known[x][y]) {
    this.known[x][y] = true;
    this.set_dirty(x, y);
  }
}

Map.prototype.clear_known = function (x, y) {
  if (this.known[x][y]) {
    this.known[x][y] = false;
    this.set_dirty(x, y);
  }
}

Map.prototype.set_visible = function (x, y) {
  if (!this.visible[x][y]) {
    this.visible[x][y] = true;
    this.visible_vec.push([x, y]);
    this.known[x][y] = true;
    this.set_dirty(x, y);
  }
}

Map.prototype.reset_visibility = function () {
  this.visible_vec.forEach((c) => {
    //  for each (let c in this.visible_vec) {
    let [x, y] = c;
    this.visible[x][y] = false;
    this.set_dirty(x, y);
  });
  this.visible_vec = new Array;
}

Map.prototype.write_cell = function (x, y, sym, attr) {
  this.sym[x][y] = sym;
  this.attr[x][y] = attr;
  this.set_dirty(x, y);
  return;
}

Map.prototype.update_cell = function (x, y) {
  let sym = G.level.sym_at(x, y);
  let attr = G.level.attr_at(x, y);
  if (sym != this.sym[x][y] || attr != this.attr[x][y]) {
    this.sym[x][y] = sym;
    this.attr[x][y] = attr;
    this.set_dirty(x, y);
  }
  return;
}

Map.prototype.update = function () {
  this.dirty_vec = new Array();
  for (x = 0; x < this.x_dim; x++) {
    for (y = 0; y < this.y_dim; y++) {
      if (this.sym[x][y] != G.level.sym_at(x, y) ||
        this.attr[x][y] != G.level.attr_at(x, y)) {
        this.sym[x][y] = G.level.sym_at(x, y);
        this.attr[x][y] = G.level.attr_at(x, y);
        this.set_dirty(x, y);
      }
    }
  }
  return;
}


function create_screen_table() {
  g_screen_table = new_2d(G.DSPL_X, G.DSPL_Y, null);
  g_screen_table_el = document.createElement('table');
  for (var col = 0; col < G.DSPL_X; col++) {
    var col_el = document.createElement('col');
    col_el.setAttribute('width', '5px');
    g_screen_table_el.appendChild(col_el);
  }
  for (var row = 0; row < G.DSPL_Y; row++) {
    var tr = document.createElement('tr');
    for (var col = 0; col < G.DSPL_X; col++) {
      var td = document.createElement('td');
      var text = document.createTextNode("\u2007");
      g_screen_table[col][row] = text;
      td.appendChild(text);
      tr.appendChild(td);
    }
    g_screen_table_el.appendChild(tr);
  }
  var map = document.getElementById('map');
  map.parentNode.replaceChild(g_screen_table_el, map);
}

function create_screen_backing() {
  g_screen_backing = new_2d(G.DSPL_X, G.DSPL_Y, '*');
  g_screen_backing_dirty = new_2d(G.DSPL_X, G.DSPL_Y, 1);
  g_screen_backing_attr = new_2d(G.DSPL_X, G.DSPL_Y, null);
  g_screen_backing_dirty_a = new Array();
  for (var x = 0; x < G.DSPL_X; x++) {
    for (var y = 0; y < G.DSPL_Y; y++) {
      g_screen_backing_dirty_a.push([x, y]);
    }
  }
}

function set_screen_backing_dirty(x, y) {
  if (g_screen_backing_dirty[x][y] == 0) {
    g_screen_backing_dirty[x][y] = 1;
    g_screen_backing_dirty_a.push([x, y]);
  }
}



function update_screen() {
  for (let i in g_screen_backing_dirty_a) {
    let [x, y] = g_screen_backing_dirty_a[i];
    let parent = g_screen_table[x][y].parentNode;
    g_draw_set.add_action([x, y, g_screen_backing[x][y], parent, g_screen_backing_attr[x][y]]);
    g_screen_backing_dirty[x][y] = 0;
  }
  g_screen_backing_dirty_a = new Array();
}

function update_message_on_screen_backing() {
  for (let x = 0; x < g_message_buffer.length; x++) {
    if (g_message_buffer[x] != g_screen_backing[x][0]) {
      g_screen_backing[x][0] = g_message_buffer[x];
      set_screen_backing_dirty(x, 0);
    }
  }
}

//
// Update the screen backing -
// The main elements here are the map dspl and the status
// line (and whatever else TBD), all of which are handled 
// separately.
//
function update_screen_backing() {
  update_map_to_screen_backing();
  update_message_on_screen_backing();
  update_screen();
}

function message(msg) {
  g_message = msg;
  for (var i = 0; i < g_message_buffer.length; i++) {
    if (i < g_message.length) {
      g_message_buffer[i] = g_message.charAt(i);
    } else {
      g_message_buffer[i] = ' ';
    }
  }
  update_message_on_screen_backing();
  update_screen();
}

Cr.prototype.pick_up = function () {
  if (!G.map.is_on(this.x, this.y)) {
    return;
  }
  let o = G.level.obj_at(this.x, this.y);
  if (o == null) {
    return;
  }
  if (o instanceof Weapon) {
    if (this.weapon != null) {
      if (this == U) { more('You are already carrying a weapon'); }
    } else {
      if (G.map.is_on(o.x, o.y)) {
        G.level.set_obj_at(o.x, o.y, null);
        o.x = o.y = -1;
        this.weapon = o;
      }
      if (this == U) {
        more('You picked up ' + o.name);
        more('Your foes seem apprehensive.');
      }
    }
  } else if (o instanceof Armor) {
  } else if (o instanceof Magic_Stick) {
    if (this.magic != null) {
      if (this == U) { more('You are already carrying a magic item'); }
    } else {
      if (G.map.is_on(o.x, o.y)) {
        G.level.set_obj_at(o.x, o.y, null);
        o.x = o.y = -1;
        this.magic = o;
      }
      if (this == U) { more('You picked up ' + o.name); }
    }
  } else if (o instanceof Misc) {
  } else {
    more("It's super heavy at this time.");
  }
}

Cr.prototype.move_to_raw = function (x, y) {
  if (this.x == x && this.y == y) {
    return;
  }
  if (this == U) {
    G.map.reset_visibility();
  }
  if (G.map.is_on(this.x, this.y)) {
    G.level.set_cr_at(this.x, this.y, null);
    G.map.update_cell(this.x, this.y);
  }
  if (G.map.is_on(x, y)) {
    G.level.set_cr_at(x, y, this);
    G.map.update_cell(x, y);
  }
  this.x = x;
  this.y = y;
  if (this == U) {
    U.compute_los();
  }
  update_map_to_screen_backing();
  update_screen();
}

Cr.prototype.vaporize = function (cr) {
  more(this.name + ' is vaporized!');
  let o = G.level.obj_at(this.x, this.y);
  if (o == null) {
    new Ash().place_at(this.x, this.y);
  }
  this.move_to_raw(-1, -1);
  this.dead = true;
}

Cr.prototype.move_into = function (cr) {
  if (this == U) {
    if (U.are_armed()) {
      more("You kill " + cr.name + ".");
      x = cr.x;
      y = cr.y;
      cr.move_to_raw(-1, -1);
      cr.dead = true;
      this.move_to_raw(x, y);
    } else {
      U.died();
    }
  } else {
    if (cr == U) {
      if (!U.are_armed()) {
        U.died();
      } else {
        more("You kill " + cr.name + ".");
        this.move_to_raw(-1, -1);
      }
    }
  }
}

Cr.prototype.move_to = function (x, y) {
  if (!G.map.is_on(x, y)) {
    return;
  }
  let tile = G.level.terrain_at(x, y);
  if (tile.is_solid()) {
    return;
  }
  let cr = G.level.cr_at(x, y);
  if (cr != null) {
    this.move_into(cr);
    return;
  }
  this.move_to_raw(x, y);
}

Cr.prototype.move_delta = function (x_delta, y_delta) {
  this.move_to(this.x + x_delta, this.y + y_delta);
}

function Cr(ch, name, attr) {
  this.x = -1;
  this.y = -1;
  this.on_map = false;
  this.invent = new Array();
  this.ch = ch;
  this.name = name;
  this.attr = attr;
  this.isa = new Array();
  this.isa['Cr'] = true;
  this.dead = false;
  this.speed = 24;
  this.moved = 0;

  this.weapon = null;
  this.armor = null;
  this.magic = null;
  this.misc = null;
}


Mon.prototype = new Cr(this.ch, this.name, this.attr);
function Mon(ch, name, attr) {
  this.ch = ch;
  this.name = name;
  this.attr = attr;
  this.isa['Mon'] = true;
}

Cr.prototype.can_move_to = function (x, y) {
  if (!G.map.is_on(x, y)) {
    return false;
  }
  var tile = G.level.terrain_at(x, y);
  if (tile.is_solid()) {
    return false;
  }
  if (G.level.cr_at(x, y) != null) {
    return false;
  }
  return true;
}

function sign(x) {
  if (x < 0) { return -1; }
  if (x > 0) { return 1; }
  return 0;
}

function distance(x, y) {
  return Math.sqrt(x * x + y * y);
}

Mon.prototype.pick_up = function (obj) {
  // assuming its okay to pick up obj ...

  /*
    if (cr.invent.length > 0) {
      more("You're already carrying something.");
      return;
    }
    if (G.map.is_on(this.x, this.y)) {
      G.level.set_obj_at(this.x, this.y, null);
      cr.invent.push(this);
      more('You picked up ' + this.name + '.');
      this.x = -1;
      this.y = -1;
    }
  //  update_map();
    update_screen_backing();
    update_screen();
  */
}

Mon.prototype.possible_moves = function () {
  let m = new Array();
  if (this.can_move_to(this.x - 1, this.y - 1)) { m.push([-1, -1]); }
  if (this.can_move_to(this.x - 1, this.y)) { m.push([-1, 0]); }
  if (this.can_move_to(this.x - 1, this.y + 1)) { m.push([-1, 1]); }
  if (this.can_move_to(this.x, this.y - 1)) { m.push([0, -1]); }
  if (this.can_move_to(this.x - 1, this.y + 1)) { m.push([0, 1]); }
  if (this.can_move_to(this.x + 1, this.y - 1)) { m.push([1, -1]); }
  if (this.can_move_to(this.x + 1, this.y)) { m.push([1, 0]); }
  if (this.can_move_to(this.x + 1, this.y + 1)) { m.push([1, 1]); }
  return m;
}

Mon.prototype.move_away_from = function (x, y) {
  let p = shuffle(this.possible_moves());
  if (p == undefined) { return; }
  let d = distance(this.x - x, this.y - y);
  if (Math.random() < .2) {
    p.forEach((m) => {
      //    for each (let m in p) {
      if (distance(this.x + m[0] - x, this.y + m[1] - y) > d - .7) {
        this.move_to(this.x + m[0], this.y + m[1]);
        return;
      }
    });
  }
  p.forEach((m) => {
    //  for each (let m in p) {
    if (distance(this.x + m[0] - x, this.y + m[1] - y) >= d) {
      this.move_to(this.x + m[0], this.y + m[1]);
      return;
    }
  });
  return;
}

Mon.prototype.move_toward = function (x, y) {
  let p = shuffle(this.possible_moves());
  if (p == undefined) { return; }
  let d = distance(this.x - x, this.y - y);
  p.forEach((m) => {
    //  for each (let m in p) {
    if (distance(this.x + m[0] - x, this.y + m[1] - y) <= d) {
      this.move_to(this.x + m[0], this.y + m[1]);
      return;
    }
  });
  if (Math.random() < .2) {
    p.forEach((m) => {
      //    for each (let m in p) {
      if (distance(this.x + m[0] - x, this.y + m[1] - y) < d + 1.5) {
        this.move_to(this.x + m[0], this.y + m[1]);
        return;
      }
    });
  }
  return;
}


function zap(x, y, xinc, yinc) {
  let save_cell = new Array();
  let i = 0;
  x += xinc;
  y += yinc;
  //more("You let loose a zap!");
  while (G.map.is_on(x, y) && i++ < 20 && !G.level.is_solid(x, y)) {
    let save_sym = G.map.sym_at(x, y);
    let save_attr = G.map.attr_at(x, y);
    save_cell.push([x, y, G.map.sym_at(x, y), G.map.attr_at(x, y)]);
    G.map.set_overlay(x, y);
    G.map.write_cell(x, y, '*', '#fa0');
    let cr = G.level.cr_at(x, y);
    if (cr != null) {
      cr.vaporize();
    }
    if (i % 4 == 0) { g_draw_sets.new_set() };
    update_map_to_screen_backing();
    update_screen();
    x += xinc;
    y += yinc;
  }
  g_draw_sets.new_set(20);
  save_cell.forEach((c) => {
    //  for each (let c in save_cell) {
    G.map.set_known(c[0], c[1]);
    G.map.update_cell(c[0], c[1]);
    // G.map.write_cell(c[0], c[1], c[2], c[3]);
    update_map_to_screen_backing();
    update_screen();
  });
  return;
}

Mon.prototype.do_move = function () {
  if (this.moved < 0) {
    return;
  }
  this.moved -= this.speed;
  var x_delta = this.x - U.x;
  var y_delta = this.y - U.y;
  let norm;
  if (Math.abs(x_delta) > Math.abs(y_delta)) {
    norm = Math.abs(x_delta);
  } else {
    norm = Math.abs(y_delta);
  }
  let r = Math.sqrt(x_delta * x_delta + y_delta * y_delta);
  x_delta = Math.floor(x_delta / norm + .5);
  y_delta = Math.floor(y_delta / norm + .5);
  if (U.are_armed() && r < 6) {
    if (this.can_move_to(this.x + x_delta, this.y + y_delta) && Math.random > .2) {
      this.move_delta(x_delta, y_delta);
    } else {
      this.move_away_from(U.x, U.y);
    }
  } else {
    if (this.can_move_to(this.x - x_delta, this.y - y_delta)) {
      this.move_delta(-x_delta, -y_delta);
    } else {
      this.move_toward(U.x, U.y);
    }
  }
}

Mon.prototype.move_into = function (mon) {
  return;
  if (cr == U) {
    if (U.armed) {
      more("You kill " + cr.name + ".");
      cr.move_to_raw(-1, -1);
    } else {
      U.died();
    }
  }
}

SuperGnome.prototype = new Mon('G', 'Ted the Gnome', 'red');

function SuperGnome() {
  this.isa['SuperGnome'] = true;
  this.speed = 18;
}

Gnome.prototype = new Mon('G', 'Bill the Gnome', '#ddd');

function Gnome() {
  this.isa['Gnome'] = true;
  this.speed = 36;
}

You.prototype = new Cr('@', 'You', 'cyan');

function You() {
  this.isa['You'] = true;
}

You.prototype.compute_los = function () {
  if (!G.map.is_on(this.x, this.y)) { return; }
  for (let x = this.x - 8; x < this.x + 8; x++) {
    for (let y = this.y - 8; y < this.y + 8; y++) {
      if (!G.map.is_on(x, y)) { continue; }
      if (los(this.x, this.y, x, y, 8)) {
        G.map.set_visible(x, y);
      }
    }
  }
}

You.prototype.are_armed = function () {
  return (U.weapon != null);
}

You.prototype.dspl_invent = function () {
  if (this.weapon == null) {
    G.pager.writeln('You are unarmed.');
  }
  if (this.weapon == null && this.armor == null &&
    this.magic == null && this.misc == null) {
    G.pager.writeln("You aren't carrying anything.");
    G.pager.show();
    return;
  }
  G.pager.writeln('Your inventory --');
  if (this.weapon) {
    G.pager.writeln('      Weapon: ' + this.weapon.name);
  }
  if (this.magic) {
    G.pager.writeln('  Magic Item: ' + this.magic.name);
  }
  G.pager.show();
}

You.prototype.died = function () {
  G.pager.writeln("You were unarmed and died while attempting a melee attack.");
  G.pager.writeln("Unarmed combat training is not available; unarmed death works though.")
  G.pager.writeln("You may want to pick up -- ',' key -- the sword -- ')' symbol -- next time.");
  G.pager.writeln("So long and thanks for playing.");
  G.pager.show();
  G.dead = true;
}

function print_help() {
  more("hjklyubn=move ,=pickup d=drop i=inventory ?=help");
}

/*
 * UI object ...
 */
function UI() {
  this.pending_action = null;
  this.pending_command = null;
  this.direction = null;
  this.char_handler = null;
}

UI.prototype.handle_char = function (ch) {
  if (this.char_handler) {
    if (this.char_handler(ch)) {
      this.execute_pending_command();
    }
    return true;
  }
  return false;
}

UI.prototype.clear_char_handler = function () {
  this.char_handler = null;
}

UI.prototype.set_pending_action = function (action) {
  this.pending_action = action;
}

UI.prototype.get_card_dir = function () {
  message('Direction? [hjkl]');
  g_draw_sets.draw();
  UI.char_handler = function (ch) {
    switch (ch) {
      case 'h': case 'j': case 'k': case 'l':
        this.direction = ch;
        this.clear_char_handler();
        return true;
    }
    return false;
  };
}

UI.prototype.get_eight_dir = function () {
  message('Direction? [hjklyubn]');
  g_draw_sets.draw();
  UI.char_handler = function (ch) {
    switch (ch) {
      case 'h': case 'j': case 'k': case 'l':
      case 'y': case 'u': case 'b': case 'n':
        this.direction = ch;
        this.clear_char_handler();
        return true;
    }
    return false;
  };
}

function mon_move() {
  monsters.forEach((m) => {
    if (!m.dead) {
      m.moved += 24;
    }
  });
  //  for each (let m in monsters) 
  for (; ;) {
    let move_left = false;
    monsters.forEach((m) => {
      //    for each(let m in monsters) {
      if (!m.dead) {
        m.do_move();
        if (m.moved >= 0) { move_left = true; }
      }
    });
    if (!move_left) {
      return;
    }
  }
}

function use_turn() {
  G.u_turn++;
  mon_move();
}

UI.prototype.execute_pending_command = function () {
  let cmd = this.pending_command;
  if (cmd == null) { return; }
  this.pending_command = null;
  switch (cmd) {
    case 'z': {
      let [dx, dy] = dir_2_coord(UI.direction);
      zap(U.x, U.y, dx, dy);
      use_turn();
      return;
    }
  }
}

function do_status_line() {
  let o = G.level.obj_at(U.x, U.y);
  if (o != null) {
    message('You see ' + o.name + ' here.');
  } else {
    let msg = '[';
    if (U.x < 10) { msg += ' '; }
    msg += U.x + ', ';
    if (U.y < 10) { msg += ' '; }
    msg += U.y + ']';
    message(msg);
  }
  //g_draw_sets.draw();
}

function dir_2_coord(dir_ch) {
  switch (dir_ch) {
    case 'h': return [-1, 0];
    case 'j': return [0, 1];
    case 'k': return [0, -1];
    case 'l': return [1, 0];
    case 'y': return [-1, -1];
    case 'u': return [1, -1];
    case 'b': return [-1, 1];
    case 'n': return [1, 1];
    default: return [null, null];
  }
}


function handle_keypress(e) {
  _handle_keypress(e);
  g_draw_sets.draw();
}


function _handle_keypress(e) {
  let ch = String.fromCharCode(e.charCode);

  if (UI.handle_char(ch)) {
    return;
  }

  if (G.pager_waiting_for_space) {
    if (ch == ' ') {
      G.map.update();
      G.map.reset_visibility();
      U.compute_los();
      update_screen_backing();
      update_screen();
      G.pager_waiting_for_space = false;
    }
    return;
  }

  if (G.dead) {
    return;
  }

  if (ch == 'S') {
    let mcount = 0;
    monsters.forEach((mon) => {
      if (!mon.dead) {
        mcount++;
      }
    });
    G.pager.writeln("Status:");
    G.pager.writeln("You have played " + G.u_turn + " of your turns.");
    G.pager.writeln("There are " + mcount + " monsters remaining.");
    if (!U.are_armed()) {
      G.pager.writeln("You are unarmed. (A cause for concern.)");
    }
    G.pager.show();
    return;
    //    for each(let mon in monsters) { if(!mon.dead) { mcount++;
  } else if (ch == 'z') {
    if (U.magic != null && U.magic instanceof Wand) {
      UI.get_eight_dir();
      UI.pending_command = 'z';
    } else {
      more("You aren't carrying a wand.");
    }
    return;
  } else if (ch == 'k') {
    U.move_delta(0, -1);
  } else if (ch == 'j') {
    U.move_delta(0, 1);
  } else if (ch == 'h') {
    U.move_delta(-1, 0);
  } else if (ch == 'l') {
    U.move_delta(1, 0);
  } else if (ch == 'y') {
    U.move_delta(-1, -1);
  } else if (ch == 'u') {
    U.move_delta(1, -1);
  } else if (ch == 'b') {
    U.move_delta(-1, 1);
  } else if (ch == 'n') {
    U.move_delta(1, 1);
  } else if (ch == '?') {
    help();
    return;
  } else if (ch == 'd') {
    more("Sorry, dropping is not working at the moment.");
    //    if (U.invent.length > 0) {
    //      var o = U.invent[0];
    //      o.drop(U.x, U.y);
    //    } else {
    //      more("You don't have anything to drop.");
    //    }
  } else if (ch == ',') {
    var o;
    if ((o = G.level.obj_at(U.x, U.y)) != null) {
      U.pick_up(o);
      //o.pick_up(U);
    } else {
      more("There's nothing here to pick up.");
    }
  } else if (ch == 'i') {
    U.dspl_invent();
    return;
  }
  if (G.dead) {
    return;
  }
  use_turn();
  do_status_line();

  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation();
}

function welcome() {
  G.pager.writeln(
    '                            MontyHaul:                               ');
  G.pager.writeln(
    '                    in the Labyrinths of Skotia                      ');
  G.pager.writeln(
    '                                                                     ');
  G.pager.writeln(
    'MontyHaul is an experimental roguelike game implemented entirely in');
  G.pager.writeln(
    'client-side Javascript. This is still completely true!');
  G.pager.writeln('');
  G.pager.writeln(
    'It is (not, LOL) under continual development for now, so check back ');
  G.pager.writeln(
    "if you're a glutton for disappointment and frustration.")
  G.pager.writeln('');
  G.pager.writeln(
    'MontyHaul is free for you to use but it is NOT free software at this');
  G.pager.writeln(
    'time; you may study the source code but you may not copy it.');
  G.pager.writeln(
    "Or you could copy it because it's a fucking mess as I'm typing this");
  G.pager.writeln(
    "and it's your tech interview, not mine.");
  G.pager.writeln('');
  G.pager.writeln(
    'Anyway, for help during the game, press the "?" key.');
  G.pager.writeln('');
  G.pager.writeln(
    'NO LONGER NEW: Try out the "z" (Zap!) key. It does still zap, though!');
  G.pager.writeln('');
  G.pager.writeln(
    '(Press SPACE to continue.)');
  G.pager.show();
}

function help() {
  G.pager.writeln(
    'Overview:                                                            ');
  G.pager.writeln(
    'Kill gnomes by attacking "G"s. To attack, move onto a creature\'s tile.');
  G.pager.writeln(
    'This always goes better when you are carrying a weapon.');
  G.pager.writeln(
    '                                                                     ');
  G.pager.writeln(
    'Commands:                                                            ');
  G.pager.writeln(
    'h, j, k, l, y, u, b, n: move (like in vi, + diagonal)                ');
  G.pager.writeln(
    'd: drop something                                                    ');
  G.pager.writeln(
    ',: pick up something                                                 ');
  G.pager.writeln(
    'i: see your inventory                                                ');
  G.pager.writeln(
    'z: zap your wand                                                     ');
  G.pager.writeln(
    'S: status                                                            ');
  G.pager.writeln(
    '?: help (this)                                                       ');
  G.pager.writeln('');
  G.pager.writeln(
    'When you see "-- more --" or "-- end --", press SPACE to continue.   ');
  G.pager.show();
}

function init() {
  let loading = document.getElementById('loading');
  loading.removeChild(loading.firstChild);
  K = new K();
  G = new G();
  UI = new UI();
  create_screen_backing();
  create_screen_table();
  g_draw_sets = new DrawSets();
  g_more_mode = false;
  g_messages = new Array();
  g_map_needs_update = false;
  g_message_buffer = new_1d(G.DSPL_X, ' ');
  g_message = 'Welcome to MontyHaul';
  g_cr_at = new_2d(G.MAP_X, G.MAP_Y, null);
  g_obj_at = new_2d(G.MAP_X, G.MAP_Y, null);
  U = new You();
  U.move_to(2, 2);

  monsters = new Array();

  for (var i = 0; i < 20; i++) {
    var gnome = new Gnome();
    for (; ;) {
      var x = Math.floor(Math.random() * (G.MAP_X - 15)) + 10;
      var y = Math.floor(Math.random() * (G.MAP_Y - 10)) + 7;
      if (G.level.cr_at(x, y) == null) {
        break;
      }
    }
    gnome.move_to(x, y);
    monsters.push(gnome);
  }

  for (var i = 0; i < 10; i++) {
    var gnome = new SuperGnome();
    for (; ;) {
      var x = Math.floor(Math.random() * (G.MAP_X - 15)) + 10;
      var y = Math.floor(Math.random() * (G.MAP_Y - 10)) + 7;
      if (G.level.cr_at(x, y) == null) {
        break;
      }
    }
    gnome.move_to(x, y);
    monsters.push(gnome);
  }

  var food = new Food().place_at(5, 5);
  var potion = new Potion().place_at(10, 10);
  var sword = new Sword().place_at(10, 5);
  var wand = new Wand().place_at(7, 7);

  G.map.update();
  update_screen_backing();
  update_screen();
  welcome();
  g_draw_sets.draw();
  // document.onkeypress = handle_keypress;
}
