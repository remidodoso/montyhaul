var U = null;

var g_map_needs_update = false;

function message(msg) {
  G.message = msg;
  for (var i = 0; i < G.message_buffer.length; i++) {
    if (i < G.message.length) {
      G.message_buffer[i] = G.message.charAt(i);
    } else {
      G.message_buffer[i] = '\u2007';
    }
  }
  G.screen.update_message_on_screen_backing();
  G.screen.update_screen();
}

function more(msg) {
  G.draw_sets.new_set();
  G.draw_set.set_wait_for_space();
  message(msg + ' -more-');
  G.draw_sets.new_set();
  do_status_line();
}

function do_more() {
  if (G.messages.length == 0) {
    G.more_waiting_for_space = false;
    return false;
  }
  G.message = G.messages.pop() + ' -more-';
  for (var i = 0; i < G.message_buffer.length; i++) {
    if (i < G.message.length) {
      G.message_buffer[i] = G.message.charAt(i);
    } else {
      G.message_buffer[i] = ' ';
    }
  }
  G.screen.update_message_on_screen_backing();
  G.screen.update_screen();
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
      // TBD show the symbol for the creature briefly in the animation
      cr.vaporize();
    }
    /*
     * The argument to new_set is a delay in msec. This makes the
     * animation leisurely enough that it will be seen.
     */
    if (i % 4 == 0) { G.draw_sets.new_set(25) };
    G.map.update_map_to_screen_backing();
    G.screen.update_screen();
    x += xinc;
    y += yinc;
  }
  G.draw_sets.new_set(25);
  save_cell.forEach((c) => {
    G.map.set_known(c[0], c[1]);
    G.map.update_cell(c[0], c[1]);
    G.map.update_map_to_screen_backing();
    G.screen.update_screen();
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
  G.draw_sets.draw();
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
      G.screen.update_screen_backing();
      G.screen.update_screen();
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
//  message("Welcome to Montyhaul. Press '?' for help.");
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

  G.screen = new Screen();

  g_more_mode = false;
  g_messages = new Array();
  g_map_needs_update = false;
  g_message_buffer = new_1d(G.DSPL_X, '\u2007');
  g_message = 'Welcome to MontyHaul';

  G.message_buffer = new_1d(G.DSPL_X, '\u2007');
  G.message = 'Welcome to MontyHaul';

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
  G.screen.update_screen_backing();
  G.screen.update_screen();
  // TBD this is a hack to make sure the first line (status line) is displayed at
  // startup ... but really this is just wrong; the first line should be used for
  // short messages and the status line(s) should be below the map.
//  message("_");
  welcome();
  G.draw_sets.draw();
  // document.onkeypress = handle_keypress;
}

/*
 * Here is how it should look ... 
 *   message line
 *   21 rows of map
 *   status line #1
 *   status line #2
 * 24 lines total
 * 
 * ----top of screen----
 * You swap places with Slinky.
 * 
 * 
 * 
 *                                       -----
 *                                       #.<..|
 *                                       #|...|
 *                                       #-----
 *                                     ###
 *                         ------   ####
 *                         |....-#######
 *                         |....|
 *                         |....|           ###
 *                         |.....###########  #
 *                         .....|          #  ##
 *                         ------              ###
 *                                           ----.-
 *                                          #|.@..|
 *                                          #-....|
 *                                           |....|
 *                                           ------
 * 
 * Joseph the Hatamoto    St:18 Dx:16 Co:17 In:10 Wi:8 Ch:6  Lawful
 * Dlvl:1  $:58 HP:15(15) Pw:2(2) AC:4  Exp:1
 * ----bottom of screen----
 */


