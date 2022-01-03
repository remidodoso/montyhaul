/*
 * UI object ...
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
    g_draw_sets.draw();
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
    g_draw_sets.draw();
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
        use_turn();
        return;
      }
    }
  }
  
  
}

