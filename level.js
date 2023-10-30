

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

  create_connected_rooms_terrain() {
//    this.create_new_terrain();
    this.create_filled_terrain();
    this.create_connected_rooms();
  }

  make_a_room(x0, y0, x1, y1, connection) {
    //
    // it's assumed that x0, y0, x1, y1 are safely surrounded by walls
    // width/height is the width/height of the partition
    // dimensions here are *interior*, not including room walls
    // connection is 'left', 'right', 'top', 'bottom'
    // an extra cell is allocated there for a corridor
    //
    let width = x1 - x0;
    let height = y1 - y0;
    switch (connection) {
      case 'left':
      case 'right':
        width  -= 1;
        break;
      case 'top':
      case 'bottom':
        height -= 1;
        break;
    }
    // the room is a minimum size of 2x2 to maximum of width x height
    let room_width = Math.floor(2 + (width - 2) * Math.random());
    let room_height = Math.floor(2 + (height - 2) * Math.random());
    // divvy up the leftover
    let border_left = Math.floor((width - room_width) * Math.random());
    let border_right = width - room_width - border_left;
    let border_top = Math.floor((height - room_height) * Math.random());
    let border_bottom = height - room_height - border_top;
    // scoot for the 1 cell border and as appropriate for location of connection
    border_left += 1;
    border_top += 1;
    switch(connection) {
      case 'left':
        border_left += 1;
        break;
      case 'right':
        border_right -= 1;
        break;
      case 'top':
        border_top += 1;
        break;
      case 'bottom':
        border_bottom -= 1;
        break;
    }
    // return the result
    return {
      x0: x0 + border_left,
      y0: y0 + border_top,
      x1: x1 - border_right,
      y1: y1 - border_bottom,
    };
  }

  //                        x_partition
  //    ######################################################
  //    #                    |                               #
  //    #                    |                               #
  //    #    ##########      |                               #
  //    #    #        #      |                               #
  //    #    #        #      |                               #
  //    #    #        ##########    ###################      #
  //    #    #        #      | #    #                 #      #
  //    #    ##########      | #    #                 #      #
  //    #                    | ######                 #      #
  //    #                    |      ###################      #
  //    #                    |                               #
  //    #                    |                               #
  //    ######################################################
  //
  // 川 ≈
  // ⎔ 𝑓
  // 𝑓 
  // φ a b 
  // φ a b 𝑓 bar
  //
  connect_vertical_walls(x0, y00, y01, x1, y10, y11, mode) {
    // for now mode is "zigzag" regardless
    mode = 'zigzag';
    // connect them
    let y_connect_left = Math.floor((y01 - y00) * Math.random()) + y00;
    let y_connect_right = Math.floor((y11 - y10) * Math.random()) + y10;
    let x_corridor_middle = Math.floor((x1 - x0 - 1) * Math.random()) + x0;
    for (let x = x0 + 1; x < x_corridor_middle; x++) {
      this.terrain[x][y_connect_left] = K.TILE_FLOOR;
    }
    for (let x = x_corridor_middle; x < x1; x++) {
      this.terrain[x][y_connect_right] = K.TILE_FLOOR;
    }
    if (y_connect_left < y_connect_right) {
      for (let y = y_connect_left; y <= y_connect_right; y++) {
        this.terrain[x_corridor_middle][y] = K.TILE_FLOOR;
      }
    } else {
      for (let y = y_connect_right; y <= y_connect_left; y++) {
        this.terrain[x_corridor_middle][y] = K.TILE_FLOOR;
      }  
    }
  }
  connect_horizontal_walls(y0, x00, x01, y1, x10, x11, mode) {
    // for now mode is "zigzag" regardless
    mode = 'zigzag';
    // connect them
    let x_connect_top = Math.floor((x01 - x00) * Math.random()) + x00;
    let x_connect_bottom = Math.floor((x11 - x10) * Math.random()) + x10;
    let y_corridor_middle = Math.floor((y1 - y0 - 1) * Math.random()) + y0;
    for (let y = y0 + 1; y < y_corridor_middle; y++) {
      this.terrain[x_connect_top][y] = K.TILE_FLOOR;
    }
    for (let y = y_corridor_middle; y < y1; y++) {
      this.terrain[x_connect_bottom][y] = K.TILE_FLOOR;
    }
    if (x_connect_top < x_connect_bottom) {
      for (let x = x_connect_top; x <= x_connect_bottom; x++) {
        this.terrain[x][y_corridor_middle] = K.TILE_FLOOR;
      }
    } else {
      for (let x = x_connect_bottom; x <= x_connect_top; x++) {
        this.terrain[x][y_corridor_middle] = K.TILE_FLOOR;
      }  
    }
  }
  create_connected_rooms(orientation, rooms) {
    if (orientation == 'horizontal') {
      let x_partition = Math.floor((0.5 + Math.random() * 0.3 - 0.15) * this.x_dim);
      // add rooms
      // The address of the upper left corner is 0,0.
      // The address of the lower right corner is x_dim - 1, y_dim - 1
      // pass in an area within the rectangle defined by the partition
      let room_1 = this.make_a_room(1, 1, x_partition - 1, this.y_dim - 1, 'right');
      let room_2 = this.make_a_room(x_partition + 1, 0, this.x_dim - 1, this.y_dim - 1, 'left');
      // place them
      for (let x = room_1.x0; x <= room_1.x1; x++) {
        for (let y = room_1.y0; y < room_1.y1; y++) {
          this.terrain[x][y] = K.TILE_FLOOR;
        }
      }
      for (let x = room_2.x0; x <= room_2.x1; x++) {
        for (let y = room_2.y0; y < room_2.y1; y++) {
          this.terrain[x][y] = K.TILE_FLOOR;
        }
      }
      this.connect_vertical_walls(
        room_1.x1, room_1.y0, room_1.y1, 
        room_2.x0, room_2.y0, room_2.y1, 'zigzag'
      );
    } else {
      let y_partition = Math.floor((0.5 + Math.random() * 0.3 - 0.15) * this.y_dim);

      let room_1 = this.make_a_room(1, 1, this.x_dim - 1, 'bottom', y_partition - 1);
      let room_2 = this.make_a_room(this.x_dim - 1, y_partition + 1, this.x_dim - 1, 0, 'top');
      for (let x = room_1.x0; x <= room_1.x1; x++) {
        for (let y = room_1.y0; y < room_1.y1; y++) {
          this.terrain[x][y] = K.TILE_FLOOR;
        }
      }
      for (let x = room_2.x0; x <= room_2.x1; x++) {
        for (let y = room_2.y0; y < room_2.y1; y++) {
          this.terrain[x][y] = K.TILE_FLOOR;
        }
      }
      this.connect_vertical_walls(
        room_1.x1, room_1.y0, room_1.y1, 
        room_2.x0, room_2.y0, room_2.y1, 'zigzag'
      );
    }
  }

  create_terrain() {
    //
    // The "rooms" code is broken so it's go back to the "big room with pillars"
    // and have this be at least playable
    //

    //    this.create_connected_rooms_terrain();

    this.create_new_terrain();

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
  
  push_inv_at(x, y, obj) {
    if (obj == null) { // NS
      return this.inv[x][y];
    }
    if (this.inv[x][y] == null) { // NS
      let inv = new Array(obj);
      this.inv[x][y] = inv;
    } else {
      this.inv[x][y].push(obj);
    }
    obj.set_parent(this.inv[x][y]);
    return this.inv[x][y];
  }


  
  /*
   * Top object in tile inventory
   */
  peek_inv_at(x, y) {
    if (this.inv[x][y] == null) { // NS
      return null;
    } else {
      return this.inv[x][y][0];
    }
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

