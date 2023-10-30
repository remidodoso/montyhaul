/*
 * Object representing the screen displayed in browser
 */

class Screen {
  constructor() {
    /*
     * The lowest level drawing mechanism is the update of text elements
     * in an HTML table. Each element is a single character with attributes.
     * 
     * This lowest level construct is called the "SCREEN."
     * 
     * screen_table is a 2d array whose elements are the individual text
     * elements of the DOM table. Characters on screen are displayed and changed by
     * altering these individual elements.
     * 
     * screen_table_el is the DOM object for the table. It is not accessed
     * directly.
     * 
     * \u2007 is "FIGURE SPACE", which is a space equal to the "tabular width of a
     * font," particularly relevant to monospaced fonts. This is the character
     * initially used in all cells.
     * 
     * TBD that might not really be the best approach, as I don't think it prevents
     * vertical cell collapse. Later on we use "~" with a "black" text attribute,
     * and I think this might be the right way to initialize the screen.
     */
    this.screen_table = null;
    this.screen_table_el = null;

    /*
     * Drawing in the game involves writing to a SCREEN BACKING, which is then
     * used to update the SCREEN.
     * 
     * screen_backing is a 2d array.
     * screen_backing_dirty is a 2d array indicating whether the particular element
     *   addressed is "dirty" and has changed since the last time the screen was
     *   refreshed.
     * screen_backing_attr is a 2d array containing text node attributes to be
     *   applied to the character when displayed on the screen. TBD currently this
     *   is only "color" but it is likely to eventually indicate blinking.
     * screen_backing_dirty_a is a list of dirty cells. Generally, updates of
     *   screen from backing traverse this list.
     * 
     * The actual mechanism that finally makes updates from backing to screen is
     * "DrawSet," which is implemented in draw.js. Upcoming updates are queued in
     * one or more DrawSets, then at an appropriate time, applied.
     */
    this.screen_backing = null;
    this.screen_backing_dirty = null;
    this.screen_backing_attr = null;
    this.screen_backing_dirty_a = null;

    this.create_screen_table();
    this.create_screen_backing();
  }
  

  create_screen_table() {
    this.screen_table = new_2d(G.DSPL_X, G.DSPL_Y, null);
    this.screen_table_el = document.createElement('table');
    this.screen_table_el.id = 'map';
    for (var col = 0; col < G.DSPL_X; col++) {
      var col_el = document.createElement('col');
      col_el.setAttribute('width', '5px');
      this.screen_table_el.appendChild(col_el);
    }
    for (var row = 0; row < G.DSPL_Y; row++) {
      var tr = document.createElement('tr');
      for (var col = 0; col < G.DSPL_X; col++) {
        var td = document.createElement('td');
        var text = document.createTextNode("\u2007");
        this.screen_table[col][row] = text;
        td.appendChild(text);
        tr.appendChild(td);
      }
      this.screen_table_el.appendChild(tr);
    }
    var map = document.getElementById('map');
    map.parentNode.replaceChild(this.screen_table_el, map);
  }
  
  create_screen_backing() {
    this.screen_backing = new_2d(G.DSPL_X, G.DSPL_Y, '*');
    this.screen_backing_dirty = new_2d(G.DSPL_X, G.DSPL_Y, 1);
    this.screen_backing_attr = new_2d(G.DSPL_X, G.DSPL_Y, null);
    this.screen_backing_dirty_a = new Array();
    for (var x = 0; x < G.DSPL_X; x++) {
      for (var y = 0; y < G.DSPL_Y; y++) {
        this.screen_backing_dirty_a.push([x, y]);
      }
    }
  }
  
  set_screen_backing_dirty(x, y) {
    if (this.screen_backing_dirty[x][y] == 0) {
      this.screen_backing_dirty[x][y] = 1;
      this.screen_backing_dirty_a.push([x, y]);
    }
  }
  
  update_screen() {
    for (let i in this.screen_backing_dirty_a) {
      let [x, y] = this.screen_backing_dirty_a[i];
      let parent = this.screen_table[x][y].parentNode;
      G.draw_set.add_action([x, y, this.screen_backing[x][y], parent, this.screen_backing_attr[x][y]]);
      this.screen_backing_dirty[x][y] = 0;
    }
    this.screen_backing_dirty_a = new Array();
  }
  
  update_from_dirty() {
    for (let i in this.screen_backing_dirty_a) {
      let [x, y] = this.screen_backing_dirty_a[i];
      let parent = this.screen_table[x][y].parentNode;
      G.draw_set.add_action([x, y, this.screen_backing[x][y], parent, this.screen_backing_attr[x][y]]);
      this.screen_backing_dirty[x][y] = 0;
    }
    this.screen_backing_dirty_a = new Array();
  }

  update_message_on_screen_backing() {
    for (let x = 0; x < G.message_buffer.length; x++) {
      if (G.message_buffer[x] != this.screen_backing[x][0]) {
        this.screen_backing[x][0] = G.message_buffer[x];
        this.set_screen_backing_dirty(x, 0);
      }
    }
  }

  update_status_on_screen_backing() {
    for (let x = 0; x < G.status1_buffer.length; x++) {
      if (G.status1_buffer[x] != this.screen_backing[x][22]) {
        this.screen_backing[x][22] = G.status1_buffer[x];
        this.set_screen_backing_dirty(x, 22);
      }
    }
  }

  //
  // Update the screen backing -
  // The main elements here are the map dspl and the status
  // line (and whatever else TBD), all of which are handled 
  // separately.
  //
  update_screen_backing() {
    G.map.update_map_to_screen_backing();
    this.update_message_on_screen_backing();
    this.update_status_on_screen_backing();
    this.update_screen();
  }

}
  
