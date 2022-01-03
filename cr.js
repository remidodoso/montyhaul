class Cr {
  constructor(ch, name, attr) {
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
  pick_up() {
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
  move_to_raw(x, y) {
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
  vaporize(cr) {
    more(this.name + ' is vaporized!');
    let o = G.level.obj_at(this.x, this.y);
    if (o == null) {
      new Ash().place_at(this.x, this.y);
    }
    this.move_to_raw(-1, -1);
    this.dead = true;
  }
  move_into(cr) {
    if (this == U) {
      if (U.are_armed()) {
        more("You kill " + cr.name + ".");
        let x = cr.x;
        let y = cr.y;
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
  move_to(x, y) {
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
  move_delta(x_delta, y_delta) {
    this.move_to(this.x + x_delta, this.y + y_delta);
  }
  can_move_to(x, y) {
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
}

