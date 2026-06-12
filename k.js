class Tile {
  constructor(ch) {
    this.ch = ch;
  }
  is_solid() {
    switch (this.ch) {
      case '.': return false;
      case '□': return false;
      case '#': return true;
    }
    return true;  // unknown tiles are solid by default
  }
  // TBD: is_transparent is NIY — not yet wired into the LOS system (see los.js)
  is_transparent() {
    switch (this.ch) {
      case '.': return true;
      case '□': return true;
      case '#': return false;
    }
    return false;  // unknown tiles are opaque by default
  }
}

class K {
  constructor() {
    this.TILE_FLOOR     = new Tile('.');
    this.TILE_FLOOR_ALT1 = new Tile('□');  // light shade — behaves like floor, useful for debug/design
    this.TILE_WALL      = new Tile('#');
    this.TILE_DEBUG_A   = new Tile('€');
    this.TILE_DEBUG_B = new Tile('₴');
    this.TILE_DEBUG_C = new Tile('₹');
  }
}