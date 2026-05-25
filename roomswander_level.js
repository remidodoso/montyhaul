
//
// ===========================================================
// RoomsWanderLevel
// ===========================================================
//
// Standard room size: 3d6 wide x 3d4 tall (interior floor dimensions)
//
// Generation overview:
//   1. Roll desired room count (1d5+3)
//   2. Place seed room near map center
//   3. BFS outward: for each room, dig wander corridors, attempt to place
//      rooms at endpoints, enqueue successes
//   4. Stop when desired count reached or queue empties (wedged)
//
// TBD: wander corridors (p_turn > 0 but wander style not yet fully tuned)
// TBD: doors at room entrances
// TBD: special room types (vault, shop, etc.)
//
class RoomsWanderLevel extends Level {

  // Maximum generation attempts before accepting whatever the last try yielded
  static MAX_REROLL = 10;

  // Probability that each additional wall (beyond the first) gets an exit
  static p_more  = 0.50;
  // Probability of attempting an extra exit from the same wall after one is dug
  static p_multi = 0.20;
  // Probability that a wander corridor stops to mark a future room site
  static p_room  = 0.10;
  // Probability that a wander corridor turns 90 degrees at each step
  static p_turn  = 0.10;

  create_terrain() {
    let placed = 0;
    let rerolls = 0;

    do {
      // Reset all terrain state for a fresh attempt
      this.rooms = [];
      this.room_cells = new_2d(this.x_dim, this.y_dim, false);
      this.pending_rooms = [];
      this.create_filled_terrain();

      let desired = roll('1d5') + 3;  // target number of rooms for this level

      // Place the seed room near the center and begin the queue with it
      let seed = this.make_standard_room();
      this.carve_room(seed);
      this.rooms.push(seed);

      let queue = [seed];  // rooms whose walls still need corridors dug
      placed = 1;          // seed counts as the first placed room

      // BFS outward from the seed: each room's corridors are dug, rooms are placed
      // at the endpoints, and those rooms are enqueued for the next round.
      // Stops when the target is reached or the queue empties (wedged).
      while (queue.length > 0 && placed < desired) {
        let room = queue.shift();

        // Fresh corridor run for this room only
        this.pending_rooms = [];
        this.wander_from_room(room);

        // Attempt to place a room at each corridor endpoint.
        // Each endpoint gets up to 3 tries with a fresh random size each time.
        for (let pending of this.pending_rooms) {
          if (placed >= desired) break;
          for (let attempt = 0; attempt < 3; attempt++) {
            let new_room = this.try_place_room_at(pending);
            if (new_room !== null) {
              queue.push(new_room);
              placed++;
              break;
            }
          }
        }
      }

      rerolls++;
    } while (placed < 4 && rerolls < RoomsWanderLevel.MAX_REROLL);
    // Accept whatever the last attempt yielded if MAX_REROLL is exhausted
  }

  make_standard_room() {
    let rw = roll('3d6');
    let rh = roll('3d4');
    // Place the seed room within the center third of the map.
    // If the room is too large to fit in the center third on a given axis,
    // fall back to centering it on that axis ("best effort").
    let x_lo = Math.floor(this.x_dim / 3);
    let x_hi = Math.floor(2 * this.x_dim / 3) - rw + 1;
    let y_lo = Math.floor(this.y_dim / 3);
    let y_hi = Math.floor(2 * this.y_dim / 3) - rh + 1;
    let x0 = x_lo <= x_hi
      ? x_lo + Math.floor(Math.random() * (x_hi - x_lo + 1))
      : Math.floor((this.x_dim - rw) / 2);  // centered fallback
    let y0 = y_lo <= y_hi
      ? y_lo + Math.floor(Math.random() * (y_hi - y_lo + 1))
      : Math.floor((this.y_dim - rh) / 2);  // centered fallback
    return { x0, y0, x1: x0 + rw - 1, y1: y0 + rh - 1 };
  }

  // Attempts to place a standard-sized room at a corridor endpoint.
  // The room is oriented so the corridor enters perpendicular to one wall —
  // the entry wall is one step past the endpoint, room floor one step past that.
  // Returns the placed room on success, null on failure.
  try_place_room_at(pending) {
    let { x, y, dx, dy } = pending;
    let rw = roll('3d6');
    let rh = roll('3d4');

    // Wall tile is one step past the corridor endpoint in the dig direction
    let wx = x + dx;
    let wy = y + dy;

    // Wall tile must be in the map interior and still solid
    if (wx <= 0 || wx >= this.x_dim - 1 || wy <= 0 || wy >= this.y_dim - 1) return null;
    if (this.terrain[wx][wy] !== K.TILE_WALL) return null;

    // Compute room rectangle. The room must include the corridor's entry point
    // on the wall face, so the perpendicular offset is randomised within [0, rh-1]
    // (or [0, rw-1] for vertical corridors).
    let room;
    if (dx === 1) {
      // Heading right: room is to the right, corridor enters left wall at y
      let x0 = wx + 1;
      let y0 = (y - rh + 1) + Math.floor(Math.random() * rh);
      room = { x0, y0, x1: x0 + rw - 1, y1: y0 + rh - 1 };
    } else if (dx === -1) {
      // Heading left: room is to the left, corridor enters right wall at y
      let x1 = wx - 1;
      let y0 = (y - rh + 1) + Math.floor(Math.random() * rh);
      room = { x0: x1 - rw + 1, y0, x1, y1: y0 + rh - 1 };
    } else if (dy === 1) {
      // Heading down: room is below, corridor enters top wall at x
      let y0 = wy + 1;
      let x0 = (x - rw + 1) + Math.floor(Math.random() * rw);
      room = { x0, y0, x1: x0 + rw - 1, y1: y0 + rh - 1 };
    } else {
      // Heading up: room is above, corridor enters bottom wall at x
      let y1 = wy - 1;
      let x0 = (x - rw + 1) + Math.floor(Math.random() * rw);
      room = { x0, y0: y1 - rh + 1, x1: x0 + rw - 1, y1 };
    }

    // Room must sit within the map interior
    if (room.x0 < 1 || room.x1 > this.x_dim - 2 ||
        room.y0 < 1 || room.y1 > this.y_dim - 2) return null;

    // Room must not overlap any existing room (1-cell margin keeps walls distinct)
    if (this.rooms.some((r) => this.rooms_overlap(room, r, 1))) return null;

    // All checks passed: carve room, punch the entry wall, register
    this.carve_room(room);
    this.terrain[wx][wy] = K.TILE_FLOOR_ALT1;  // entry hole through the wall
    this.rooms.push(room);
    return room;
  }

  // Returns the list of valid sides for a room: sides whose wall tiles do not
  // sit on the map border (so there is room to dig outward).
  // Each side: { dx, dy, positions[], coord_of(pos) }
  // positions[] is an array of [wx, wy] wall tile coordinates.
  // coord_of extracts the axis-along-wall value used for separation checks.
  build_sides(room) {
    let sides = [];

    // Top wall, dig direction up
    if (room.y0 - 1 >= 1) {
      let positions = [];
      for (let x = room.x0; x <= room.x1; x++) positions.push([x, room.y0 - 1]);
      sides.push({ dx: 0, dy: -1, positions, coord_of: (p) => p[0] });
    }
    // Bottom wall, dig direction down
    if (room.y1 + 1 <= this.y_dim - 2) {
      let positions = [];
      for (let x = room.x0; x <= room.x1; x++) positions.push([x, room.y1 + 1]);
      sides.push({ dx: 0, dy: 1, positions, coord_of: (p) => p[0] });
    }
    // Left wall, dig direction left
    if (room.x0 - 1 >= 1) {
      let positions = [];
      for (let y = room.y0; y <= room.y1; y++) positions.push([room.x0 - 1, y]);
      sides.push({ dx: -1, dy: 0, positions, coord_of: (p) => p[1] });
    }
    // Right wall, dig direction right
    if (room.x1 + 1 <= this.x_dim - 2) {
      let positions = [];
      for (let y = room.y0; y <= room.y1; y++) positions.push([room.x1 + 1, y]);
      sides.push({ dx: 1, dy: 0, positions, coord_of: (p) => p[1] });
    }

    return sides;
  }

  // Punches a hole through a wall tile and wanders outward in direction (dx, dy),
  // turning and stopping randomly per p_turn and p_room.
  // Records the endpoint in pending_rooms if p_room fires.
  dig_exit(wx, wy, dx, dy) {
    // The wall tile itself becomes floor — this is the exit from the room
    this.terrain[wx][wy] = K.TILE_FLOOR_ALT1;

    let cx = wx;
    let cy = wy;
    let steps = 0;     // steps taken past the wall tile; turning is suppressed until >= 1
    let last_turn = null;  // 'left', 'right', or null — prevents two consecutive same-direction turns

    while (true) {
      // Stop here and mark as a future room site
      if (Math.random() < RoomsWanderLevel.p_room) {
        this.pending_rooms.push({ x: cx, y: cy, dx, dy });
        break;
      }
      // Turning is only allowed once the cursor is clear of the room wall,
      // so corridors always exit perpendicular before they are permitted to veer.
      // Additionally, the same turn direction may not be taken twice in a row.
      if (steps >= 1 && Math.random() < RoomsWanderLevel.p_turn) {
        let can_left  = last_turn !== 'left';
        let can_right = last_turn !== 'right';
        // if both available pick randomly, otherwise take the only option
        let go_left = (can_left && can_right) ? Math.random() < 0.5 : can_left;
        if (go_left) {
          [dx, dy] = [-dy,  dx];
          last_turn = 'left';
        } else {
          [dx, dy] = [ dy, -dx];
          last_turn = 'right';
        }
      } else {
        last_turn = null;  // straight step clears the turn memory
      }
      let nx = cx + dx;
      let ny = cy + dy;
      // Stop at the no-dig border (outermost ring of map cells)
      if (nx <= 0 || nx >= this.x_dim - 1 || ny <= 0 || ny >= this.y_dim - 1) break;
      // Stop if we've reached already-open terrain (another corridor or room)
      if (this.terrain[nx][ny] === K.TILE_FLOOR) break;
      this.terrain[nx][ny] = K.TILE_FLOOR_ALT1;
      // Stop if either perpendicular neighbour is already open — this prevents
      // corridors from grazing room walls or producing double-wide passages
      if (this.terrain[nx - dy][ny + dx] === K.TILE_FLOOR ||
          this.terrain[nx - dy][ny + dx] === K.TILE_FLOOR_ALT1 ||
          this.terrain[nx + dy][ny - dx] === K.TILE_FLOOR ||
          this.terrain[nx + dy][ny - dx] === K.TILE_FLOOR_ALT1) break;
      cx = nx;
      cy = ny;
      steps++;
    }
  }

  // Returns the positions on a side that are not within 1 tile of any used position.
  // 'used' is an array of coord values (x for horizontal walls, y for vertical).
  available_positions(side, used) {
    return side.positions.filter((p) => {
      let c = side.coord_of(p);
      return used.every((u) => Math.abs(c - u) >= 2);
    });
  }

  // Digs exits from the walls of a room.
  //
  // All valid sides are shuffled. The first is always used; each subsequent
  // side is kept with probability p_more. For each kept side, one exit is dug,
  // then additional exits are attempted with probability p_multi as long as
  // there are wall tiles separated by at least 1 tile from existing exits.
  wander_from_room(room) {
    let sides = this.build_sides(room);
    if (sides.length === 0) return;

    shuffle(sides);

    // Filter: always keep index 0, keep the rest with p_more
    let active_sides = sides.filter((s, i) => i === 0 || Math.random() < RoomsWanderLevel.p_more);

    for (let side of active_sides) {
      // 'used' tracks the along-wall coordinate of each exit already dug on this side,
      // so we can enforce the 1-tile minimum separation between exits
      let used = [];

      // Dig the first (guaranteed) exit from this side
      let candidates = this.available_positions(side, used);
      if (candidates.length === 0) continue;
      let pos = candidates[Math.floor(Math.random() * candidates.length)];
      used.push(side.coord_of(pos));
      this.dig_exit(pos[0], pos[1], side.dx, side.dy);

      // Attempt additional exits from this same side
      while (Math.random() < RoomsWanderLevel.p_multi) {
        candidates = this.available_positions(side, used);
        if (candidates.length === 0) break;
        pos = candidates[Math.floor(Math.random() * candidates.length)];
        used.push(side.coord_of(pos));
        this.dig_exit(pos[0], pos[1], side.dx, side.dy);
      }
    }
  }
}
