/*
 * los.js
 *
 * Line of sight, visibility, shading, etc., related routines.
 */

//
// Bresenham's Line Algorithm, more or less, redux
//
// +---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+
// |   |   |   |   | 4 |   |   |
// +---+---+---+---+---+---+---+
// |   |   | 1 | 2 | 3 |   |   |
// +---+---+---+---+---+---+---+
// | @ |   |###|###|###|   |   |
// +---+---+---+---+---+---+---+
// 
//

function los(x1, y1, x2, y2, r) {
  let xdel = x2 - x1;
  let ydel = y2 - y1;
  if (r != null && Math.sqrt(xdel * xdel + ydel * ydel) + .01 > r) { return false; }
  let xsign = xdel < 0 ? -1 : 1;
  let ysign = ydel < 0 ? -1 : 1;
  xdel *= xsign;
  ydel *= ysign;

  if (xdel == ydel) {
    let x = x1 + xsign;
    let y = y1 + ysign;
    while (--xdel > 0) {
      if (G.level.is_opaque(x, y)) { return false; }
      x += xsign;
      y += ysign;
    }
    return true;
  } else if (xdel == 0) {
    let y = y1 + ysign;
    while (--ydel > 0) {
      if (G.level.is_opaque(x1, y)) { return false; }
      y += ysign;
    }
    return true;
  } else if (ydel == 0) {
    let x = x1 + xsign;
    while (--xdel > 0) {
      if (G.level.is_opaque(x, y1)) { return false; }
      x += xsign;
    }
    return true;
  }

  if (xdel > ydel) {
    let scale = xdel * ydel * 2;
    let xincr = scale / ydel;
    let yincr = scale / xdel;
    let xx = xincr / 2;
    let yy = xincr / 2;
    let xend = xx + xincr * (xdel - 1);
    let x = x1;
    let y = y1;
    while (xx < xend) {
      x += xsign;
      xx += xincr;
      yy += yincr;
      if (G.level.is_opaque(x, y)) { return false; }
      if (yy > xincr) {
        yy -= xincr;
        y += ysign;
        if (G.level.is_opaque(x, y)) { return false; }
      } else if (yy == xincr) {
        yy -= xincr;
        y += ysign;
      }
    }
    return true;
  } else {  // y is the major axis
    let scale = xdel * ydel * 2;
    let xincr = scale / ydel;
    let yincr = scale / xdel;
    let xx = yincr / 2;
    let yy = yincr / 2;
    let yend = yy + yincr * (ydel - 1);
    let x = x1;
    let y = y1;
    while (yy < yend) {
      y += ysign;
      yy += yincr;
      xx += xincr;
      if (G.level.is_opaque(x, y)) { return false; }
      if (xx > yincr) {
        xx -= yincr;
        x += xsign;
        if (G.level.is_opaque(x, y)) { return false; }
      } else if (xx == yincr) {
        xx -= yincr;
        x += xsign;
      }
    }
    return true;
  }
}