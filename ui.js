/*
 * UI object ...
 * 8 or so years later, I'm not really sure what it represents :)
 * It'll probably make sense after I work on it a bit longer
 * 
 * I think probably a lot of the stuff in main.js should go in here
 */
class UI {
  constructor() {
    this.pending_action = null;
    this.pending_command = null;
    this.direction = null;
    this.char_handler = null;
  }
  handle_char(ch) {
    if (this.char_handler) {
      if (this.char_handler(ch)) {
        this.execute_pending_command();
      }
      return true;
    }
    return false;
  }
  clear_char_handler() {
    this.char_handler = null;
  }
  set_pending_command(command) {
    this.pending_command = command;
  }
  set_pending_action(action) {
    this.pending_action = action;
  }
  get_card_dir() {
    message('Direction? [hjkl]');
    G.draw_sets.draw();
    this.char_handler = function (ch) {
      switch (ch) {
        case 'h': case 'j': case 'k': case 'l':
          this.direction = ch;
          this.clear_char_handler();
          return true;
      }
      return false;
    };
  }
  get_eight_dir() {
    message('Direction? [hjklyubn]');
    G.draw_sets.draw();
    this.char_handler = function(ch) {
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
  execute_pending_command() {
    let cmd = this.pending_command;
    if (cmd == null) { return; }
    this.pending_command = null;
    switch (cmd) {
      case 'z': {
        let [dx, dy] = dir_2_coord(this.direction);
        zap(U.x, U.y, dx, dy);
        this.mon_move();
        U.use_turn();
        return;
      }
    }
  }

  // Call once per completed player action to advance the game clock:
  // monsters move, turn counter increments, status lines update.
  // TBD: will return an interrupt flag when repeat-move logic is added
  // Returns [dx, dy] if ch is one of the 8 movement keys, null otherwise.
  ch_to_delta(ch) {
    let [dx, dy] = dir_2_coord(ch);
    return dx !== null ? [dx, dy] : null;
  }

  // Flush the current draw set and push the map to screen.
  // anim_delay (ms) is passed to new_set() to pace animations.
  update_display(anim_delay) {
    G.draw_sets.new_set(anim_delay);
    G.map.update_map_to_screen_backing();
    G.screen.update_screen();
  }

  // Signal that any in-progress repeated action should stop after the current iteration.
  // Called from anywhere that detects a mid-repeat event worth interrupting for
  // (monster revealed, item underfoot, damage taken, etc.).
  set_interrupt_repeated_action(v = true) {
    G.interrupt_repeated_action = v;
  }

  player_turn_complete() {
    this.mon_move();
    U.use_turn();
    do_status_line();
    temp_update_status1();
    temp_update_status2();
  }

  mon_move() {
    G.monsters.forEach((m) => {
      if (!m.dead) {
        m.moved += 24;
      }
    });
    //  for each (let m in monsters) 
    for (; ;) {
      let move_left = false;
      G.monsters.forEach((m) => {
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
  
}