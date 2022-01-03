class You extends Cr {
  constructor() {
    super('@', 'You', 'cyan');
  }
  compute_los() {
    if (!G.map.is_on(this.x, this.y)) { return; }
    for (let x = this.x - 8; x < this.x + 8; x++) {
      for (let y = this.y - 8; y < this.y + 8; y++) {
        if (!G.map.is_on(x, y)) { continue; }
        if (los(this.x, this.y, x, y, this.sight_radius)) {
          G.map.set_visible(x, y);
        }
      }
    }
  }
  are_armed() {
    return (U.weapon != null);
  }
  dspl_invent() {
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
    if (this.potion) {
      G.pager.writeln('      Potion: ' + this.potion.name);
    }
    G.pager.show();
  }
  died() {
    G.pager.writeln("You were unarmed and died while attempting a melee attack.");
    G.pager.writeln("Unarmed combat training is not available; unarmed death works though.");
    G.pager.writeln("You may want to pick up -- ',' key -- the sword -- ')' symbol -- next time.");
    G.pager.writeln("So long and thanks for playing.");
    G.pager.show();
    G.dead = true;
  }
}

