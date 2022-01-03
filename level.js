

//
//
// LAYERS and FLAGS
//
// ================================================= pager_overlay
// ================================================= effects_overlay
//
// ------------------------------------------------- known
// ------------------------------------------------- lit
// ------------------------------------------------- visible 
//
// ------------------------------------------------- cr_at
// ------------------------------------------------- obj_at
// ------------------------------------------------- trap_at (?)
// ================================================= terrain
//
//

//
// ===========================================================
// Level
// ===========================================================
//
class Level {
  constructor(x_dim, y_dim) {
    this.x_dim = x_dim;
    this.y_dim = y_dim;
    this.cr = new_2d(this.x_dim, this.y_dim, null);
    this.obj = new_2d(this.x_dim, this.y_dim, null);
    this.create_terrain();
  }

  /*
  create_terrain_rooms() {
    this.terrain = new_2d(this.x_dim, this.y_dim, K.TILE_WALL);
    // divide it
    let x_partition = 0.5 * this.x_dim + 0.4 * Math.random() - 0.2;
    let 
    // add rooms
    // connect them
  }
*/
  create_terrain() {
    this.terrain = new_2d(this.x_dim, this.y_dim, K.TILE_FLOOR);
    for (let x = 0; x < this.x_dim; x++) {
      this.terrain[x][0] = K.TILE_WALL;
      this.terrain[x][this.y_dim - 1] = K.TILE_WALL;
    }
    for (let y = 0; y < this.y_dim; y++) {
      this.terrain[0][y] = K.TILE_WALL;
      this.terrain[this.x_dim - 1][y] = K.TILE_WALL;
    }
    //
    // Add some random "pillars"
    //
    let pillars = Math.floor(Math.random() * 4) + 2;
    for (var n = 0; n < pillars; n++) {
      let x_size = Math.floor(Math.random() * 3) + 2;
      let y_size = Math.floor(Math.random() * 3) + 2;
      let x_org = Math.floor(Math.random() * (this.x_dim - 20)) + 10;
      let y_org = Math.floor(Math.random() * (this.y_dim - 15)) + 7;
      for (let x = x_org; x < x_org + x_size; x++) {
        for (let y = y_org; y < y_org + y_size; y++) {
          this.terrain[x][y] = K.TILE_WALL;
        }
      }
    }
    return;
  }
  is_opaque(x, y) {
    return this.terrain[x][y].ch == '#';
  }
  is_solid(x, y) {
    return tile_solid(this.terrain[x][y]);
  }
  terrain_at(x, y) {
    return this.terrain[x][y];
  }
  cr_at(x, y) {
    return this.cr[x][y];
  }
  set_cr_at(x, y, cr) {
    this.cr[x][y] = cr;
    return cr;
  }
  obj_at(x, y) {
    return this.obj[x][y];
  }
  set_obj_at(x, y, obj) {
    this.obj[x][y] = obj;
    return obj;
  }
  terrain_sym_at(x, y) {
    return this.terrain[x][y].ch;
  }
  known_sym_at(x, y) {
    if (this.obj[x][y] != null) {
      return this.obj[x][y].ch;
    }
    return this.terrain[x][y].ch;
  }
  sym_at(x, y) {
    if (this.cr[x][y] != null) {
      return this.cr[x][y].ch;
    }
    if (this.obj[x][y] != null) {
      return this.obj[x][y].ch;
    }
    return this.terrain[x][y].ch;
  }
  attr_at(x, y) {
    if (this.cr[x][y] != null) {
      return this.cr[x][y].attr;
    }
    return null;
  }
}

