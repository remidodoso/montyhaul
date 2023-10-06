//
// ===========================================================
// Pager
// ===========================================================
//
class Pager {
  constructor(x_dim, y_dim) {
    this.overlay = new_2d(this.x_dim, this.y_dim, null);
    this.attr = new_2d(this.x_dim, this.y_dim, null);
    this.text = new String();
  }
  write(text) {
    this.text += text;
    return;
  }
  writeln(text) {
    this.text += text + "\n";
  }
  show() {
    let max_width = 0;
    let lines = this.text.split("\n");
    if (lines[lines.length - 1] == '') {
      lines.pop();
    }
    lines.push("-- end --");
    lines.forEach((line) => {
      if (line.length > max_width) { max_width = line.length; }
    });
    max_width++;
    for (let y = 0; y < lines.length; y++) {
      let line = lines[y] + ' ';
      let x;
      for (x = 0; x < line.length; x++) {
        if (x >= this.x_dim) { break; }
        G.map.write_cell(x, y, line.charAt(x), 'yellow');
        G.map.set_overlay(x, y);
      }
      for (; x < max_width; x++) {
        G.map.write_cell(x, y, ' ', 'yellow');
        G.map.set_overlay(x, y);
      }
    }
    this.text = new String();
    G.pager_last = true;
    G.pager_waiting_for_space = true;
    G.map.update_map_to_screen_backing();
    G.screen.update_screen();
  }
}

