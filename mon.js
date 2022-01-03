class Mon extends Cr {
  constructor(ch, name, attr) {
    super(ch, name, attr);
  }
  pick_up(obj) {
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
  possible_moves() {
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
  move_away_from(x, y) {
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
  move_toward(x, y) {
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
  move_into() {
    // NIY
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
  do_move() {
    if (this.moved < 0) {
      return;
    }
    if (Math.random() < .002) {
      if (!this.is_banzai()) {
        this.go_banzai(true);
        this.yells('Banzai!');
      }
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
    let banzai = false;
    if (this instanceof Gnome || this instanceof SuperGnome) {
      banzai = this.is_banzai();
    }
    if (U.are_armed() && r < 6 && !banzai) {
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
}

class SuperGnome extends Mon {
  constructor() {
    super('G', 'Ted the Gnome', 'red');
    this.speed = 18;
    this.banzai = false;
  }
  is_banzai() {
    return this.banzai;
  }
  go_banzai(yn) {
    this.banzai = yn;
    if (yn == true) {
      this.attr = 'orange';
    } else {
      this.attr = 'red';
    }
  }
}

class Gnome extends Mon {
  constructor() {
    super('G', 'Bill the Gnome', '#ddd');
    this.speed = 36;
    this.banzai = false;
  }
  is_banzai() {
    return this.banzai;
  }
  go_banzai(yn) {
    this.banzai = yn;
    if (yn == true) {
      this.attr = 'yellow';
    } else {
      this.attr = '#ddd';
    }
  }
}