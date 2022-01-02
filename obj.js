let isa = {};

class Obj {
  constructor() {
    this.x = -1;
    this.y = -1;
  }
  isa(what) {
    if (this.class instanceof what) { return true }
    return false;
  }
  
  place_at(x, y) {
    if (this.x == x && this.y == y) {
      return;
    }
    if (G.map.is_on(this.x, this.y)) {
      G.level.set_obj_at(this.x, this.y, null);
      G.map.set_dirty(this.x, this.y);
    }
    if (G.map.is_on(x, y)) {
      G.level.set_obj_at(x, y, this);
      G.map.set_dirty(x, y);
      this.x = x;
      this.y = y;
    }
   // update_map();
    update_screen_backing();
    update_screen();
  }
  pick_up(cr) {
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
  }
  drop(x, y) {
    var cr;
    if (!(cr = G.level.cr_at(x, y))) {
      more("For some reason, there's nothing here to drop this object.");
      return;
    }
    if (G.level.obj_at(x, y)) {
      more("Something's already here.");
      return;
    }
    cr.invent.pop();
    G.level.set_obj_at(x, y, this);
    this.x = x;
    this.y = y;
    G.map.update_cell(x, y);
    more("You dropped " + this.name + ".");
  }
  
   
  
}


class Weapon extends Obj {
}
class Armor extends Obj {
}
class Magic_Drink extends Obj {
}
class Magic_Stick extends Obj {
}
class Edible extends Obj {
}
class Misc extends Obj {
}

class Sword extends Weapon {
  constructor() {
      super();
      this.ch = ')';
      this.name = 'a sword';
  }
}
class Shield extends Armor {
  constructor() {
      super();
      this.ch = ')';
      this.name = 'a shield';
  }
}
class Wand extends Magic_Stick {
  constructor() {
      super();
      this.ch = '/';
      this.name = 'a wand';
  }
}
class Potion extends Magic_Drink {
  constructor() {
      super();
      this.ch = '!';
      this.name = 'a potion';
  }
}
class Food extends Edible {
  constructor() {
      super();
      this.ch = '%';
      this.name = 'a food unit';
  }
}
class Ash extends Misc {
  constructor() {
      super();
      this.ch = '~';
      this.name = 'a pile of ash';
  }
}



