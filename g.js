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

g_more_mode = null;

var G_DSPL_X = 80;

class G {
  constructor() {
    this.DSPL_X = 80;
    this.DSPL_Y = 24;
    this.MAP_X = 80;
    this.MAP_Y = 21;

    this.MESSAGE_Y = 0;
    this.MAP_TOP_Y = 1;
    this.STATUS1_Y = 22;
    this.STATUS2_Y = 23;    

    this.status1 = new Status1();
    this.status2 = new Status2();

    this.dead = false;

    this.draw_set = null;
    this.draw_sets = new DrawSets();
    this.draw_set = this.draw_sets.sets[0];

    this.map = new Map(this.MAP_X, this.MAP_Y);
    this.level = new Level(this.MAP_X, this.MAP_Y);
    this.pager = new Pager(this.MAP_X, this.MAP_Y);

    this.more_waiting_for_space = false;

    this.pager_last = false;
    this.pager_waiting_for_space = false;

    this.u_turn = 0;

    this.monsters = new Array();

    this.message = null;
    this.messages = null;
    this.message_buffer = new Array();

    this.status1_buffer = new Array();
    this.status2_buffer = new Array();

    this.screen = null;

    this.map_dirty = null;
  }
  DSPL_X_() { return 80; }
};


