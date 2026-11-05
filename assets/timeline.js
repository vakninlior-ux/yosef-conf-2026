/* ציר זמן · reads window.FAMILY (assets/data.js, generated from the Excel file) */
(function () {
  'use strict';
  var F = window.FAMILY, TREE = F.tree;

  var TYPES = {
    birth:      { label: 'ילדים',      glyph: '●', cls: 'c-birth' },
    grand:      { label: 'נכדים',      glyph: '▲', cls: 'c-grand' },
    great:      { label: 'נינים',      glyph: '○', cls: 'c-great' },
    death:      { label: 'פטירות',     glyph: '■', cls: 'c-death' },
    milestone:  { label: 'אבני דרך',   glyph: '◆', cls: 'c-milestone' },
    conference: { label: 'כנסים',      glyph: '★', cls: 'c-conference' }
  };

  /* events written in the "SAVE THE DATE" tab */
  var BASE = F.events.map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; return c; });
  var born = {};
  BASE.forEach(function (e) { if (e.t === 'birth' && e.p) born[e.p] = e.y; });
  BASE.forEach(function (e) {
    if (e.t === 'death' && e.p && born[e.p]) { e.note = 'בגיל כ־' + (e.y - born[e.p]); e.noteTitle = 'מחושב לפי שנות הלידה והפטירה בלבד'; }
  });

  /* births from the names tab: one card per year and generation (people who already have their own event are skipped) */
  var ALREADY = {};
  BASE.forEach(function (e) { if (e.ref) ALREADY[e.ref] = 1; });
  var g3 = {}, g4 = {};
  function branchLabel(b) { return b.child + (b.spouse ? ' ו' + b.spouse : ''); }
  var WEDS = [];
  TREE.forEach(function (b) {
    if (b.wed) WEDS.push({ y: b.wed, t: 'milestone', tx: branchLabel(b) + ' מתחתנים', note: b.wedText && /\D/.test(b.wedText) ? 'תאריך: ' + b.wedText : '' });
    b.grands.forEach(function (g) {
      if (g.wed) WEDS.push({ y: g.wed, t: 'milestone', tx: g.name + (g.spouse ? ' ו' + g.spouse : '') + ' מתחתנים', note: (g.wedText && /\D/.test(g.wedText) ? 'תאריך: ' + g.wedText + ' · ' : '') + 'ענף ' + branchLabel(b) });
      if (g.year && !ALREADY[g.name + '|' + g.year]) {
        /* the card is about the grandchild: the year is his or her birth year, and the spouse is listed only as the spouse */
        (g3[g.year] = g3[g.year] || []).push({ nm: g.name, pr: 'ענף ' + branchLabel(b), sp: g.spouse ? (g.spouseGender === 'M' ? 'בן הזוג' : g.spouseGender === 'F' ? 'בת הזוג' : 'בן/בת זוג') + ': ' + g.spouse : '', dead: g.dead, tl: g.tl || 999 });
      }
      g.kids.forEach(function (k) {
        if (!k.year) return;
        var par = 'הורה: ' + g.name + (k.mother ? ' · האם ' + k.mother : '');
        (g4[k.year] = g4[k.year] || []).push({ nm: k.unknown ? 'ללא שם' : k.name, pr: par, dead: k.dead });
      });
    });
  });
  WEDS.forEach(function (w) { if (!w.note) delete w.note; });
  var EV = BASE.concat(WEDS);
  Object.keys(g3).forEach(function (y) { g3[y].sort(function (a, b) { return a.tl - b.tl; }); EV.push({ y: +y, t: 'grand', tx: 'נכדים', chips: g3[y], tl: g3[y][0].tl }); });
  Object.keys(g4).forEach(function (y) { EV.push({ y: +y, t: 'great', tx: 'נינים', chips: g4[y] }); });
  EV = EV.map(function (e, i) { e.o = i; return e; }).sort(function (a, b) { return a.y - b.y || (a.tl || 999) - (b.tl || 999) || a.o - b.o; });

  var COUNT = {};
  Object.keys(TYPES).forEach(function (k) { COUNT[k] = 0; });
  EV.forEach(function (e) { COUNT[e.t] += e.chips ? e.chips.length : 1; });

  var START = EV[0].y, END = EV[EV.length - 1].y;
  var PPY = 30, TOP = 40, BOTTOM = 60, GAP = 10, BREAK_MIN = 10;

  var active = {};
  Object.keys(TYPES).forEach(function (k) { active[k] = true; });

  var stage = document.getElementById('stage');
  var art = document.getElementById('art');
  var list = document.getElementById('events');
  var chips = document.getElementById('chips');
  var empty = document.getElementById('empty');
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function zl(s) { return esc(s).split('ז&quot;ל').join('<span class="dec">ז״ל</span>'); }

  document.getElementById('lede').textContent = 'מ־' + START + ' ועד ' + END + ', כולל לידות הנכדים והנינים. אפשר לסנן לפי סוג אירוע.';

  Object.keys(TYPES).forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('data-t', k); b.setAttribute('aria-pressed', 'true');
    b.innerHTML = '<span class="g" aria-hidden="true">' + TYPES[k].glyph + '</span> <span class="l">' + TYPES[k].label + '</span> <span class="n">' + COUNT[k] + '</span>';
    b.addEventListener('click', function () {
      active[k] = !active[k];
      b.setAttribute('aria-pressed', String(active[k]));
      layout(false);
    });
    chips.appendChild(b);
  });
  var lg = document.createElement('span');
  lg.className = 'legend';
  lg.innerHTML = '<i aria-hidden="true"></i>רקע זהוב: סומן בצבע בגיליון';
  chips.appendChild(lg);

  var cards = EV.map(function (e, i) {
    var li = document.createElement('li');
    li.className = 'ev t-' + e.t + (e.hl ? ' hl' : '') + (e.postponed ? ' postponed' : '');
    li.tabIndex = 0;
    var h = '<div class="top"><span class="g" aria-hidden="true">' + TYPES[e.t].glyph + '</span> ' +
            '<span class="when">' + e.y + '</span> <span class="tx">' + esc(e.tx) + '</span>' +
            (e.tag ? ' <span class="tag">' + esc(e.tag) + '</span>' : '') + '</div>';
    if (e.chips) {
      h += '<div class="chips">' + e.chips.map(function (c) {
        return '<span class="c' + (c.dead ? ' dead' : '') + '"' + '><span class="nm">' + zl(c.nm) + '</span> <span class="pr">' + zl(c.pr) + '</span>' + (c.sp ? ' <span class="pr">' + zl(c.sp) + '</span>' : '') + '</span>';
      }).join('') + '</div>';
    }
    if (e.note) h += '<p class="note"' + (e.noteTitle ? ' title="' + esc(e.noteTitle) + '"' : '') + '>' + esc(e.note) + '</p>';
    li.innerHTML = h;
    function on(v) {
      var els = art.querySelectorAll('[data-i="' + i + '"]');
      for (var k = 0; k < els.length; k++) els[k].classList.toggle('on', v);
    }
    li.addEventListener('mouseenter', function () { on(true); });
    li.addEventListener('mouseleave', function () { on(false); });
    li.addEventListener('focus', function () { on(true); });
    li.addEventListener('blur', function () { on(false); });
    list.appendChild(li);
    return li;
  });

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function starPoints(cx, cy, R, r) {
    var pts = [];
    for (var k = 0; k < 10; k++) {
      var a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r : R;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }

  /* proportional to time, except that a year with many cards gets room for them,
     and a long stretch with nothing in it is shortened (dashed) */
  function layout(animate) {
    var W = stage.clientWidth;
    var narrow = W < 560;
    var RULER = narrow ? 56 : 78;
    var CARD_R = narrow ? 98 : 150;
    var CARD_W = Math.min(600, W - CARD_R - 6);

    var vis = [];
    cards.forEach(function (c, i) {
      var show = active[EV[i].t];
      c.hidden = !show;
      if (show) { c.style.width = CARD_W + 'px'; c.style.right = CARD_R + 'px'; vis.push(i); }
    });
    empty.hidden = vis.length > 0;
    while (art.firstChild) art.removeChild(art.firstChild);
    if (!vis.length) { stage.style.height = '40px'; return; }

    var byYear = {};
    vis.forEach(function (i) { (byYear[EV[i].y] = byYear[EV[i].y] || []).push(i); });
    var years = Object.keys(byYear).map(Number).sort(function (a, b) { return a - b; });
    var s0 = years[0], s1 = years[years.length - 1];
    var breaks = {};
    for (var k = 0; k < years.length - 1; k++) if (years[k + 1] - years[k] >= BREAK_MIN) breaks[years[k]] = years[k + 1];

    var yAt = {}, cut = {}, pos = {}, cur = TOP, yr = s0;
    while (yr <= s1) {
      var arr = byYear[yr];
      if (arr) {
        var y = cur;
        arr.forEach(function (i) { var h = cards[i].offsetHeight; pos[i] = { top: y, h: h, cy: y + Math.min(h / 2, 24) }; y += h + GAP; });
        yAt[yr] = pos[arr[0]].cy;
        cur += Math.max(PPY, y - cur);
      } else { yAt[yr] = cur; cur += PPY; }
      if (breaks[yr]) {
        var b = breaks[yr], n = b - yr, px = 70 + 2 * n;
        for (var q = 1; q < n; q++) { yAt[yr + q] = cur + px * q / n; cut[yr + q] = 1; }
        cur += px; yr = b;
      } else yr++;
    }
    var H = cur + BOTTOM;
    vis.forEach(function (i) { cards[i].style.top = pos[i].top + 'px'; });
    stage.style.height = H + 'px';

    art.setAttribute('width', W); art.setAttribute('height', H);
    art.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    art.setAttribute('class', animate ? 'draw' : '');
    var sx = W - RULER, ex = W - CARD_R;

    var seg = [], from = s0;
    Object.keys(breaks).map(Number).sort(function (a, b) { return a - b; }).forEach(function (a) {
      seg.push([from, a, false]); seg.push([a, breaks[a], true]); from = breaks[a];
    });
    seg.push([from, s1, false]);
    seg.forEach(function (s) {
      el('line', { x1: sx, x2: sx, y1: yAt[s[0]], y2: yAt[s[1]], class: 'spine' + (s[2] ? ' cut' : '') }, art);
      if (s[2]) { var t = el('text', { x: sx + 12, y: (yAt[s[0]] + yAt[s[1]]) / 2 + 4, class: 'gap' }, art); t.textContent = (s[1] - s[0]) + ' שנים'; }
    });

    for (var yy = s0; yy <= s1; yy++) {
      if (cut[yy]) continue;
      var ty = yAt[yy], dec = yy % 10 === 0, five = yy % 5 === 0;
      el('line', { x1: sx, x2: sx - (dec ? 18 : five ? 11 : 6), y1: ty, y2: ty, class: 'tick' + (dec ? ' d' : '') }, art);
      if (dec || byYear[yy]) { var tt = el('text', { x: sx + 14, y: ty + 5, class: dec ? 'dec' : 'yr' }, art); tt.textContent = yy; }
    }

    vis.forEach(function (i, n) {
      var e = EV[i], col = 'var(--' + TYPES[e.t].cls + ')', cy = pos[i].cy;
      var p = el('path', { d: 'M' + sx + ' ' + cy + ' H ' + ex, pathLength: 1, class: 'cn' + (e.hl ? ' hl' : ''), stroke: col, 'data-i': i }, art);
      p.style.setProperty('--i', n);
      var r = e.hl ? 7 : 5.5, dot;
      if (e.t === 'birth') dot = el('circle', { cx: sx, cy: cy, r: r }, art);
      else if (e.t === 'grand') dot = el('polygon', { points: [sx, cy - r * 1.25, sx + r * 1.2, cy + r * 0.85, sx - r * 1.2, cy + r * 0.85].join(',') }, art);
      else if (e.t === 'great') dot = el('circle', { cx: sx, cy: cy, r: r - 0.8 }, art);
      else if (e.t === 'death') dot = el('rect', { x: sx - r, y: cy - r, width: 2 * r, height: 2 * r }, art);
      else if (e.t === 'milestone') dot = el('polygon', { points: [sx, cy - r * 1.4, sx + r * 1.4, cy, sx, cy + r * 1.4, sx - r * 1.4, cy].join(',') }, art);
      else dot = el('polygon', { points: starPoints(sx, cy, r + 3, (r + 3) * 0.45) }, art);
      dot.setAttribute('class', 'dot'); dot.setAttribute('data-i', i);
      if (e.t === 'great') { dot.setAttribute('fill', 'var(--paper)'); dot.setAttribute('stroke', col); dot.setAttribute('stroke-width', 2.2); }
      else { dot.setAttribute('fill', col); dot.setAttribute('stroke', 'var(--paper)'); dot.setAttribute('stroke-width', 1.5); }
    });
  }

  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(function () { layout(false); }, 120); });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = false;
  function start() { if (started) return; started = true; layout(!reduce); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); setTimeout(start, 1500); } else { start(); }
  window.addEventListener('beforeprint', function () { if (started) layout(false); });
})();
