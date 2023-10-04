class Cr {
  constructor(ch, name, attr) {
    this.x = -1;
    this.y = -1;
    this.on_map = false;
    this.invent = new Array();
    this.ch = ch;
    this.name = name;
    this.attr = attr;
    this.dead = false;
    this.speed = 24;
    this.moved = 0;
    this.sight_radius = 8;

    this.age = 0;
    this.turns = 0;

    this.weapon = null;
    this.armor = null;
    this.magic = null;
    this.potion = null;
    this.misc = null;

    this.tickled = 0;
  }

  //
  // returns delta if adjacent
  //
  adjacent_to_cr(cr) {
    let x_delta, y_delta;
    if (Math.abs(x_delta = this.x - cr.x) <= 1 &&
        Math.abs(y_delta = this.y - cr.y) <= 1) {
      return { x_delta: x_delta, y_delta: y_delta };
    } else {
      return null;
    }
  }
  can_see(x, y) {
    if (this.x == x && this.y == y) {
      return true;
    }
    let los_to = los(this.x, this.y, x, y, this.sight_radius);
    // deal with lighting when there is lighting
    return los_to;
  }

  //
  // Announcements
  //
  says(msg) {
    if (U.can_see(this.x, this.y)) {
      more(this.name + ' says "' + msg + '"');
    } else {
      more('You hear something say "' + msg + '"');
    }
  }
  yells(msg) {
    if (U.can_see(this.x, this.y)) {
      more(this.name + ' yells "' + msg + '"');
    } else {
      more('You hear something yell "' + msg + '"');
    }
  }

  //
  // Announcements for actions
  //
  drinks(drinkable) {
    if (this === U) {
      more('You drink ' + drinkable.name + '.');
    } else {
      if (U.can_see(this.x, this.y)) {
        more(this.name + ' drinks ' + drinkable.name + '.');
      } else {
        more('You hear drinking.');
      }
    }
  }

  is_healed() {
    if (this.tickled > 0) {
      if (this == U) {
        more('You are healed!');
        this.tickled = 0;
      } else {
        if (U.can_see(this.x, this.y)) {
          more(this.name + ' is healed!');
          this.tickled = 0;
        } else {
          more('You hear pleasant musical chimes.');
          this.tickled = 0;
        }
      }
    }
  }

  //
  // Things that creatures do
  //
  quaff() {
    if (this.potion !== null) {
      this.potion.quaffed_by(this);
    }
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
    } else if (o instanceof Magic_Drink) {
      if (this.potion !== null) {
        if (this == U) {
          more('You are already carrying a magical drink.');
        }
      } else {
        if (G.map.is_on(o.x, o.y)) {
          G.level.set_obj_at(o.x, o.y, null);
          o.x = o.y = -1;
          this.potion = o;
        }
        if (this == U) {
          more('You picked up ' + o.name);
        }
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
        more("You weakly slap " + cr.name + ". Better find a weapon!");
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
  //
  // Move a Cr to a random non-solid, unoccupied place within a rectangle
  // needs to be generalized blah blah
  // I could see how this could be used with an array of things to move ....
  //
  move_to_random_within(x0, y0, x1, y1) {
    let a = new Array();
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        if (!G.level.terrain_at(x, y).is_solid() && G.level.cr_at(x, y) === null) {
          a.push([x, y]);
        }
      }
    }
    a = shuffle(a);
    if (a.length > 0) {
      this.move_to(a[0][0], a[0][1]);
      return true;
    }
    return false;
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
  can_move_to(x, y, can_move_onto_cr) {
    if (!G.map.is_on(x, y)) {
      return false;
    }
    var tile = G.level.terrain_at(x, y);
    if (tile.is_solid()) {
      return false;
    }
    if (!can_move_onto_cr && G.level.cr_at(x, y) != null) {
      return false;
    }
    return true;
  }
}