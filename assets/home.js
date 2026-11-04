/* דף הבית · numbers come from window.FAMILY (assets/data.js) */
(function () {
  'use strict';
  var F = window.FAMILY, T = F.tree;
  var grands = 0, great = 0;
  T.forEach(function (b) { grands += b.grands.length; b.grands.forEach(function (g) { great += g.kids.length; }); });
  var rows = [
    { g: 1, label: 'אברהם וסלמה', n: 2       },
    { g: 2, label: 'ילדים',        n: T.length },
    { g: 3, label: 'נכדים',        n: grands   },
    { g: 4, label: 'נינים',        n: great    }
  ];

  var DOT = 14, GAP = 6;
  var childMaxW = T.length * (DOT + GAP) - GAP;

  var box = document.getElementById('gens');
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', 'ארבעה דורות: ' + rows.map(function (r) { return r.n + ' ' + r.label; }).join(', '));

  rows.forEach(function (r) {
    var row = document.createElement('div');
    row.className = 'pyr-row pyr-g' + r.g;

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'pyr-dots';
    dotsWrap.style.maxWidth = (r.g === 1 ? 'none' : childMaxW + 'px');
    var cap = Math.min(r.n, 80);
    for (var i = 0; i < cap; i++) {
      var dot = document.createElement('i');
      dot.className = 'pyr-dot';
      dotsWrap.appendChild(dot);
    }
    if (r.n > cap) {
      var more = document.createElement('span');
      more.className = 'pyr-more';
      more.textContent = '+' + (r.n - cap);
      dotsWrap.appendChild(more);
    }

    var lbl = document.createElement('div');
    lbl.className = 'pyr-lbl';
    lbl.textContent = r.label;

    row.appendChild(lbl);
    row.appendChild(dotsWrap);
    box.appendChild(row);
  });

  var ev = F.events, years = ev.map(function (e) { return e.y; });
  var conf = ev.filter(function (e) { return e.t === 'conference' && !e.postponed; });
  var setText = function (id, s) { var n = document.getElementById(id); if (n) n.textContent = s; };
  setText('st-timeline', ev.length + ' אירועים מ־' + Math.min.apply(null, years) + ' עד ' + Math.max.apply(null, years) + ', ועוד לידות של נכדים ונינים');
  setText('st-tree', T.length + ' ענפים · ' + grands + ' נכדים · ' + great + ' נינים');
  setText('st-meet', conf.map(function (e) { return e.tx + ' (' + e.y + ')'; }).join(' · '));
  setText('built', 'הנתונים עודכנו ב־' + F.built);
})();
