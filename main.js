var U = null;

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
  return false;
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
    //
    // Right now, in Firefox, the zap animation (a line of asterisks)
    // is sometimes not being displayed. The mod divisor below
    // controls how many asterisks are displayed at a time. This was
    // set to 4, but often the animation wasn't visible. So I set it to
    // 2 here. Still this seems not to work intermittently.
    //
    if (i % 2 == 0) { g_draw_sets.new_set() };
    update_map_to_screen_backing();
    update_screen();
    x += xinc;
    y += yinc;
  }
  /*
   * parameter is delay in ms
   */
  g_draw_sets.new_set(50);
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



function print_help() {
  more("hjklyubn=move ,=pickup d=drop i=inventory ?=help");
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
    msg += ' Tickled: ' + U.how_tickled();
    message(msg);
  }
  //g_draw_sets.draw();
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
    G.monsters.forEach((mon) => {
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
  } else if (ch == 'z') {
    if (U.magic != null && U.magic instanceof Wand) {
      UI.get_eight_dir();
      UI.set_pending_command('z');
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
  } else if (ch == 'M') {
    G.map.set_all_map_known();
  } else if (ch == 'q') {
    U.quaff();
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
    } else {
      more("There's nothing here to pick up.");
    }
  } else if (ch == 'i') {
    U.dspl_invent();
    return;
  } else if (ch == '.') {
    // wait a turn
  } else {
    return;
  }
  if (G.dead) {
    return;
  }
  UI.mon_move();
  U.use_turn();
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
    'q: quaff a magical drink                                             ');
    G.pager.writeln(
    ',: pick up something                                                 ');
  G.pager.writeln(
    'i: see your inventory                                                ');
  G.pager.writeln(
    'z: zap your wand                                                     ');
  G.pager.writeln(
    '.: wait a turn                                                       ');
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
  U.move_to(5, 5);
//  U.move_to_random_within(0, 0, G.MAP_X - 1, G.MAP_Y - 1);



  for (var i = 0; i < 15; i++) {
    var gnome = new Gnome();
    gnome.move_to_random_within(0, 0, G.MAP_X - 1, G.MAP_Y - 1);
    G.monsters.push(gnome);
  }

  for (var i = 0; i < 10; i++) {
    var gnome = new SuperGnome();
    gnome.move_to_random_within(0, 0, G.MAP_X - 1, G.MAP_Y - 1);
    G.monsters.push(gnome);
  }

  for (var i = 0; i < 5; i++) {
    var gnome = new TurboGnome();
    gnome.move_to_random_within(0, 0, G.MAP_X - 1, G.MAP_Y - 1);
    G.monsters.push(gnome);
  }

  var food = new Food().place_at(10, 5);
  var potion = new VitaminDrink().place_at(7, 7);
  var wand = new Wand().place_at(5, 10);
  var weapon = new Sword().place_at(3,3);
  new Gold().place_at(2, 2);
//  U.potion = new ImprovisedExplosivePotion();
//  U.weapon = new Sword();
//  U.magic = new Wand();

  G.map.update();
  update_screen_backing();
  update_screen();
  welcome();
  g_draw_sets.draw();
  // document.onkeypress = handle_keypress;
}
