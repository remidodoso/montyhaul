//
// Global singleton
//

g_screen_table = null;
g_screen_table_el = null;

g_screen_backing = null;
g_screen_backing_attr = null;
g_screen_backing_dirty = null;

g_terrain = null;

g_map = null;
g_map_dirty = null;

g_cr_at = null;
g_obj_at = null;

g_message = null;
g_message_buffer = new Array();

g_more_mode = null;

class G {
  constructor() {
    this.DSPL_X = 80;
    this.DSPL_Y = 25;
    this.MAP_X = 80;
    this.MAP_Y = 24;

    this.dead = false;

    this.map = new Map(this.MAP_X, this.MAP_Y);
    this.level = new Level(this.MAP_X, this.MAP_Y);
    this.pager = new Pager(this.MAP_X, this.MAP_Y);

    this.more_waiting_for_space = false;

    this.pager_last = false;
    this.pager_waiting_for_space = false;

    this.u_turn = 0;
  }
};


