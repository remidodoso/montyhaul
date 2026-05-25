
//
// ===========================================================
// RoomsSprinkleLevel
// ===========================================================
//
// Level subclass: two large BSP-partitioned rooms connected by
// a zigzag corridor, plus a handful of smaller rooms sprinkled
// randomly across the map, each connected to its nearest
// existing room.
//
class RoomsSprinkleLevel extends Level {

  create_terrain() {
    this.create_filled_terrain();
    let orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    this.create_connected_rooms(orientation);
    this.sprinkle_rooms(5);
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
    // clamp to target ranges: 2-20 wide, 2-8 tall
    let max_w = Math.min(20, Math.max(2, width));
    let max_h = Math.min(8, Math.max(2, height));
    let room_width  = 2 + Math.floor((max_w - 1) * Math.random());
    let room_height = 2 + Math.floor((max_h - 1) * Math.random());
    room_width  = Math.min(room_width,  width);
    room_height = Math.min(room_height, height);
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
  connect_vertical_walls(x0, y00, y01, x1, y10, y11, mode) {
    // for now mode is "zigzag" regardless
    mode = 'zigzag';
    let y_connect_left  = Math.floor((y01 - y00) * Math.random()) + y00;
    let y_connect_right = Math.floor((y11 - y10) * Math.random()) + y10;
    let x_corridor_middle = Math.floor((x1 - x0 - 1) * Math.random()) + x0 + 1;
    for (let x = x0 + 1; x < x_corridor_middle; x++) {
      if (this.room_cells[x][y_connect_left]) break;
      this.terrain[x][y_connect_left] = K.TILE_FLOOR_ALT1;
    }
    for (let x = x_corridor_middle; x < x1; x++) {
      if (this.room_cells[x][y_connect_right]) break;
      this.terrain[x][y_connect_right] = K.TILE_FLOOR_ALT1;
    }
    if (y_connect_left < y_connect_right) {
      for (let y = y_connect_left; y <= y_connect_right; y++) {
        if (this.room_cells[x_corridor_middle][y]) break;
        this.terrain[x_corridor_middle][y] = K.TILE_FLOOR_ALT1;
      }
    } else {
      for (let y = y_connect_right; y <= y_connect_left; y++) {
        if (this.room_cells[x_corridor_middle][y]) break;
        this.terrain[x_corridor_middle][y] = K.TILE_FLOOR_ALT1;
      }
    }
  }

  connect_horizontal_walls(y0, x00, x01, y1, x10, x11, mode) {
    // for now mode is "zigzag" regardless
    mode = 'zigzag';
    let x_connect_top    = Math.floor((x01 - x00) * Math.random()) + x00;
    let x_connect_bottom = Math.floor((x11 - x10) * Math.random()) + x10;
    let y_corridor_middle = Math.floor((y1 - y0 - 1) * Math.random()) + y0 + 1;
    for (let y = y0 + 1; y < y_corridor_middle; y++) {
      if (this.room_cells[x_connect_top][y]) break;
      this.terrain[x_connect_top][y] = K.TILE_FLOOR_ALT1;
    }
    for (let y = y_corridor_middle; y < y1; y++) {
      if (this.room_cells[x_connect_bottom][y]) break;
      this.terrain[x_connect_bottom][y] = K.TILE_FLOOR_ALT1;
    }
    if (x_connect_top < x_connect_bottom) {
      for (let x = x_connect_top; x <= x_connect_bottom; x++) {
        if (this.room_cells[x][y_corridor_middle]) break;
        this.terrain[x][y_corridor_middle] = K.TILE_FLOOR_ALT1;
      }
    } else {
      for (let x = x_connect_bottom; x <= x_connect_top; x++) {
        if (this.room_cells[x][y_corridor_middle]) break;
        this.terrain[x][y_corridor_middle] = K.TILE_FLOOR_ALT1;
      }
    }
  }

  create_connected_rooms(orientation) {
    if (orientation == 'horizontal') {
      let x_partition = Math.floor((0.5 + Math.random() * 0.3 - 0.15) * this.x_dim);
      // The address of the upper left corner is 0,0.
      // The address of the lower right corner is x_dim - 1, y_dim - 1
      // pass in an area within the rectangle defined by the partition
      let room_1 = this.make_a_room(1, 1, x_partition - 1, this.y_dim - 1, 'right');
      let room_2 = this.make_a_room(x_partition + 1, 0, this.x_dim - 1, this.y_dim - 1, 'left');
      this.carve_room(room_1);
      this.carve_room(room_2);
      this.rooms.push(room_1, room_2);
      this.connect_vertical_walls(
        room_1.x1, room_1.y0, room_1.y1,
        room_2.x0, room_2.y0, room_2.y1, 'zigzag'
      );
    } else {
      let y_partition = Math.floor((0.5 + Math.random() * 0.3 - 0.15) * this.y_dim);
      let room_1 = this.make_a_room(1, 1, this.x_dim - 1, y_partition - 1, 'bottom');
      let room_2 = this.make_a_room(1, y_partition + 1, this.x_dim - 1, this.y_dim - 1, 'top');
      this.carve_room(room_1);
      this.carve_room(room_2);
      this.rooms.push(room_1, room_2);
      this.connect_horizontal_walls(
        room_1.y1, room_1.x0, room_1.x1,
        room_2.y0, room_2.x0, room_2.x1, 'zigzag'
      );
    }
  }

  connect_rooms(room_a, room_b) {
    let cx_a = (room_a.x0 + room_a.x1) / 2;
    let cx_b = (room_b.x0 + room_b.x1) / 2;
    let cy_a = (room_a.y0 + room_a.y1) / 2;
    let cy_b = (room_b.y0 + room_b.y1) / 2;
    if (Math.abs(cx_a - cx_b) >= Math.abs(cy_a - cy_b)) {
      let left  = cx_a <= cx_b ? room_a : room_b;
      let right = cx_a <= cx_b ? room_b : room_a;
      this.connect_vertical_walls(left.x1, left.y0, left.y1, right.x0, right.y0, right.y1, 'zigzag');
    } else {
      let top = cy_a <= cy_b ? room_a : room_b;
      let bot = cy_a <= cy_b ? room_b : room_a;
      this.connect_horizontal_walls(top.y1, top.x0, top.x1, bot.y0, bot.x0, bot.x1, 'zigzag');
    }
  }

  try_sprinkle_room() {
    let max_w = 10;
    let max_h = 6;
    for (let attempt = 0; attempt < 50; attempt++) {
      let rw = 2 + Math.floor((max_w - 1) * Math.random());
      let rh = 2 + Math.floor((max_h - 1) * Math.random());
      let x0 = 1 + Math.floor(Math.random() * (this.x_dim - rw - 1));
      let y0 = 1 + Math.floor(Math.random() * (this.y_dim - rh - 1));
      let room = { x0, y0, x1: x0 + rw - 1, y1: y0 + rh - 1 };
      if (!this.rooms.some((r) => this.rooms_overlap(room, r, 1))) {
        this.carve_room(room);
        this.rooms.push(room);
        return room;
      }
    }
    return null;
  }

  sprinkle_rooms(n) {
    for (let i = 0; i < n; i++) {
      let new_room = this.try_sprinkle_room();
      if (new_room == null) continue;
      let nearest = null;
      let min_dist = Infinity;
      for (let r of this.rooms) {
        if (r === new_room) continue;
        let d = this.room_distance(r, new_room);
        if (d < min_dist) { min_dist = d; nearest = r; }
      }
      if (nearest != null) {
        this.connect_rooms(nearest, new_room);
      }
    }
  }
}
