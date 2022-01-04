class Tile {
  constructor(ch) {
    this.ch = ch;
  }
  is_solid() {
    switch (this.ch) {
      case '.': return false;
      case '#': return true;
    }
    return true;
  }
  is_transparent() {
    switch (this.ch) {
      case '.': return false;
      case '#': return true;
    }
  }
}

class K {
  constructor() {
    this.TILE_FLOOR = new Tile('.');
    this.TILE_WALL = new Tile('#');
    this.TILE_DEBUG_A = new Tile('€');
    this.TILE_DEBUG_B = new Tile('₴');
    this.TILE_DEBUG_C = new Tile('₹');
  }
}