
//
// The Level object (WIP TBD currently a singleton but ultimately probably
// not) is the representation of the game map's terrain, along with
// methods dealing with other objects associated with the map, such as
// creatures (Cr) and objects (Obj) that are placed on the map.
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
// ------------------------------------------------- obj_at (WIP - to be removed)
// ------------------------------------------------- inv_at (WIP - a list)
// ------------------------------------------------- trap_at (? TBD)
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
    //
    // WIP ...
    // let's see if I can just "slide in" proper inventory
    // This will be the list of objects present at this location
    //
    this.inv = new_2d(this.x_dim, this.y_dim, null);
    this.rooms = [];
    this.room_cells = new_2d(this.x_dim, this.y_dim, false);
    this.create_terrain();
  }

  /*
   * Create a blank new map with a walled border.
   */
  create_new_terrain() {
    this.terrain = new_2d(this.x_dim, this.y_dim, K.TILE_FLOOR);
    for (let x = 0; x < this.x_dim; x++) {
      this.terrain[x][0] = K.TILE_WALL;
      this.terrain[x][this.y_dim - 1] = K.TILE_WALL;
    }
    for (let y = 0; y < this.y_dim; y++) {
      this.terrain[0][y] = K.TILE_WALL;
      this.terrain[this.x_dim - 1][y] = K.TILE_WALL;
    }
  }

  /*
   * Create a new map filled with wall.
   */
  create_filled_terrain() {
    this.terrain = new_2d(this.x_dim, this.y_dim, K.TILE_WALL);
  }

  carve_room(room) {
    for (let x = room.x0; x <= room.x1; x++) {
      for (let y = room.y0; y <= room.y1; y++) {
        this.terrain[x][y] = K.TILE_FLOOR;
        this.room_cells[x][y] = true;
      }
    }
  }

  rooms_overlap(r1, r2, margin) {
    if (margin === undefined) margin = 1;
    return r1.x0 - margin <= r2.x1 &&
           r1.x1 + margin >= r2.x0 &&
           r1.y0 - margin <= r2.y1 &&
           r1.y1 + margin >= r2.y0;
  }

  room_distance(r1, r2) {
    let cx1 = (r1.x0 + r1.x1) / 2;
    let cy1 = (r1.y0 + r1.y1) / 2;
    let cx2 = (r2.x0 + r2.x1) / 2;
    let cy2 = (r2.y0 + r2.y1) / 2;
    let dx = cx1 - cx2;
    let dy = cy1 - cy2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  create_terrain() {
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

  //
  // WIP TBD
  // 
  // Maintain empty tile inventory lists as null. This will also return null
  // for an empty tile inventory. In case an undefined slips in there somehow,
  // use a non-strict comparison, noted as // NS
  //
  inv_at(x, y) {
    if (this.inv[x][y] == null) { // NS
      return null;
    } else {
      return this.inv[x][y];
    }
  }
  
  /*
   * Put an object on the floor, on the top of the inventory.
   * Tile inventory is null if empty, so create a new Array if
   * needed.
   */
  push_inv_at(x, y, obj) {
    /*
     * Noop if for some reason called with null obj
     */
    if (obj == null) { // NS
      return this.inv[x][y];
    }

    /*
     * Remove object from wherever it might still be
     */
    obj.move_to_limbo();

    /*
     * Push onto existing list, or create one first if necessary
     */
    if (this.inv[x][y] == null) { // NS
      let inv = new Array(obj);
      this.inv[x][y] = inv;
    } else {
      this.inv[x][y].push(obj);
    }
    obj.set_parent(this);
    // TBD WIP need to update the map symbol
    return this.inv[x][y];
  }


  
  /*
   * Top object in tile inventory. Used to determine what
   * to display on the map, that is, the topmost item.
   */
  peek_inv_at(x, y) {
    if (this.inv[x][y] == null) { // NS
      return null;
    } else {
      return this.inv[x][y][0];
    }
  }

  /*
   * Remove object from tile inventory
   * Does not update the object or map
   */
  remove_from_inv_at(x, y, obj) {
    level.inv[x][y] = level.inv[x][y].filter((o) => o === obj);
  }


  /*
   * The whole tile inventory
   *
   * TBD I feel like this should be a shallow copy, and restrict all
   * changes to a tile inventory to methods. For now it's just the
   * actual list.
   */
  get_inv_at(x, y, flags) {
    //
    // TBD flags will be for some kind of filtering, NIY
    //
    if (this.inv[x][y] == null) { // NS
      return null;
    } else {
      return this.inv[x][y];
    }
  }

  /*
   * terrain_sym_at returns the symbol corresponding to
   * terrain at a particular tile. This currently includes
   * only the map terrain, but TBD should this include
   * things like traps, when they are implemented?
   */
  terrain_sym_at(x, y) {
    return this.terrain[x][y].ch;
  }

  /*
   * known_sym_at returns the symbol to be displayed if
   * the tile is "known" (previously seen) but not currently
   * seen. Right now, this is whatever is there, minus
   * a creature.
   * 
   * TBD however, this needs to be different -- it needs to
   * be what was last actually seen.
   */
  known_sym_at(x, y) {
    if (this.obj[x][y] != null) {
      return this.obj[x][y].ch;
    }
    // WIP adding tile inventories
    let o = this.peek_inv_at(x, y);
    if (o !== null) {
      return o.ch;
    }
    return this.terrain[x][y].ch;
  }

  /*
   * sym_at returns the symbol to be displayed if the tile
   * is currently visible.
   */
  sym_at(x, y) {
    if (this.cr[x][y] != null) {
      return this.cr[x][y].ch;
    }
    if (this.obj[x][y] != null) {
      return this.obj[x][y].ch;
    }
    // WIP adding tile inventories
    let o = this.peek_inv_at(x, y);
    if (o !== null) {
      return o.ch;
    }
    return this.terrain[x][y].ch;
  }

  /*
   *
   */
  attr_at(x, y) {
    if (this.cr[x][y] != null) {
      return this.cr[x][y].attr;
    } else if (this.obj[x][y] != null) {
      return this.obj[x][y].attr;
    }
    return null;
  }
}

