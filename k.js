function Tile(ch) {
  this.ch = ch;
}

Tile.prototype.is_solid = function() {
  switch (this.ch) {
    case '.': return false;
    case '#': return true;
  }
}

Tile.prototype.is_transparent = function() {
  switch (this.ch) {
    case '.': return false;
    case '#': return true;
  }
}

function K() {
  this.TILE_FLOOR = new Tile('.');
  this.TILE_WALL = new Tile('#');
}



