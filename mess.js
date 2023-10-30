/*
 * Messages and status
 */

class Announce {
  constructor() {
    this.bufsize = G_DSPL_X;
    this.buffer = new_1d(this.bufsize, '\u2007');
    this.attr = new_1d(this.bufsize, '');
    this.announcement = '';
  }

  get_bufsize() { return this.bufsize; }
  get_buffer() { return this.buffer; }

  /*
   * Overwrite buffer with a new string and pad with blanks
   */
  _write(s) {
    for (var i = 0; i < this.bufsize; i++) {
      if (i < s.length) {
        this.buffer[i] = s.charAt(i);
      } else {
        this.buffer[i] = '\u2007';
      }
    }
  }

}

class Message extends Announce {
  constructor() {
    super();
  }
}

class Status extends Announce {
  constructor() {
    super();
  }
  
  /*
   * Write to buffer then push to screen backing
   *
   * y is the screen row to be used
   */
  update(s, y) {
    this._write(s);
    let buffer = G.status2.get_buffer();
    let bufsize = G.status2.get_bufsize();
    let screen = G.screen;
    for (let x = 0; x < bufsize; x++) {
      if (buffer[x] != screen.screen_backing[x][y]) {
        screen.screen_backing[x][y] = buffer[x];
        screen.set_screen_backing_dirty(x, y);
      }
    }
    screen.update_from_dirty();
  }

}

class Status1 extends Status {
  constructor() {
    super();
  }
  write(s) {
    this.update(s, G.STATUS1_Y);
  }
}

class Status2 extends Status {
  constructor() {
    super();
  }
  write(s) {
    this.update(s, G.STATUS2_Y);
  }
}
