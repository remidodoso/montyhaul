
function sign(x) {
    if (x < 0) { return -1; }
    if (x > 0) { return 1; }
    return 0;
  }
  function distance(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  
  function shuffle(a) {
    if (a.length == 1) { return; }
    for (let i = 0; i < a.length - 1; i++) {
      let n = Math.floor(Math.random() * (a.length - i)) + i;
      let t = a[i];
      a[i] = a[n];
      a[n] = t;
    }
    return a;
  };
  
  