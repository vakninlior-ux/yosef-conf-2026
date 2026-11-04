/* כנס יוסף השני 2026 — RSVP per person, stored in localStorage */
(function () {
  'use strict';
  var F = window.FAMILY;
  if (!F) return;
  var root = document.getElementById('conf2026');
  if (!root) return;

  var KEY = 'yosef-conf-2026';
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var totalEl = document.getElementById('conf2026-total');

  /* collect all RSVP keys for a branch (living people only) */
  function branchAllKeys(br) {
    var bpfx = br.child + '::';
    var keys = [];
    if (!br.childDead) keys.push(bpfx + 'ch');
    if (br.spouse && !br.spouseDead) keys.push(bpfx + 'sp');
    br.grands.forEach(function (g) {
      var gpfx = bpfx + g.name + '::';
      if (!g.dead) keys.push(gpfx + 'g');
      if (g.spouse) keys.push(gpfx + 'gsp');
      g.kids.forEach(function (k) {
        if (!k.dead) {
          var kn = (k.unknown || k.ph) ? 'ילד/ה' : k.name;
          keys.push(gpfx + 'k::' + kn + (k.year || ''));
        }
      });
    });
    return keys;
  }

  function skipBranch(br) {
    return br.childDead && !br.spouse && br.grands.length === 0;
  }

  function branchTitle(br) {
    /* אם בן הזוג נפטר והילד בחיים — מציגים את שם בן הזוג ראשון (חנניה ושושנה) */
    if (br.spouseDead && !br.childDead && br.spouse) {
      return 'משפחת ' + br.spouse + ' ו' + br.child;
    }
    return 'משפחת ' + br.child + (br.spouse ? ' ו' + br.spouse : '');
  }

  function countFor(keys) {
    var yes = 0, no = 0;
    keys.forEach(function (k) { if (st[k] === 'yes') yes++; else if (st[k] === 'no') no++; });
    return { yes: yes, no: no, pending: keys.length - yes - no, total: keys.length };
  }

  function updateTotalEl() {
    if (!totalEl) return;
    var allKeys = [];
    F.tree.forEach(function (br) { allKeys = allKeys.concat(branchAllKeys(br)); });
    var c = countFor(allKeys);
    totalEl.textContent = c.yes + ' מגיעים · ' + c.no + ' לא מגיעים · ' + c.pending + ' ממתינים לאישור  (מתוך ' + c.total + ')';
  }

  /* ── Branch list view ── */
  function showList() {
    root.innerHTML = '';
    var grid = document.createElement('div'); grid.className = 'branch-grid';
    F.tree.forEach(function (br, idx) {
      if (skipBranch(br)) return;
      var keys = branchAllKeys(br);
      var c = countFor(keys);
      var a = document.createElement('a');
      a.href = '#' + idx;
      a.className = 'branch-card';
      var title = document.createElement('strong'); title.textContent = branchTitle(br);
      var sum   = document.createElement('span');   sum.className = 'bc-sum';
      sum.textContent = c.yes + ' מגיעים · ' + c.no + ' לא מגיעים · ' + c.pending + ' ממתינים';
      a.appendChild(title); a.appendChild(sum);
      grid.appendChild(a);
    });
    root.appendChild(grid);
    updateTotalEl();
  }

  /* ── Branch RSVP view ── */
  function showBranch(idx) {
    var br = F.tree[idx];
    if (!br) { showList(); return; }
    root.innerHTML = '';

    var back = document.createElement('a');
    back.href = '#'; back.className = 'back-btn'; back.textContent = '← חזרה לרשימת הענפים';
    root.appendChild(back);

    var h2 = document.createElement('h2'); h2.className = 'bhd';
    h2.textContent = branchTitle(br);
    root.appendChild(h2);

    var ul = document.createElement('ul'); ul.className = 'rul';
    var brKeys = [];
    var sumEl = document.createElement('p'); sumEl.className = 'bsum';

    function updBranch() {
      var c = countFor(brKeys);
      sumEl.textContent = c.yes + ' מגיעים · ' + c.no + ' לא מגיעים · ' + c.pending + ' ממתינים';
      updateTotalEl();
    }

    var bpfx = br.child + '::';

    function addRow(name, key, dead, lvl) {
      if (dead) return;
      var li = document.createElement('li');
      li.className = 'rr l' + lvl;
      var nm = document.createElement('span'); nm.className = 'rnm'; nm.textContent = name;
      li.appendChild(nm);
      if (!dead && key) {
        brKeys.push(key);
        var btns = document.createElement('span'); btns.className = 'rbtns';
        var yb = document.createElement('button'); yb.type = 'button'; yb.textContent = 'מגיע';
        var nb = document.createElement('button'); nb.type = 'button'; nb.textContent = 'לא מגיע';
        function ref() {
          yb.className = 'ry' + (st[key] === 'yes' ? ' on' : '');
          nb.className = 'rn' + (st[key] === 'no'  ? ' on' : '');
        }
        ref();
        yb.addEventListener('click', function () { st[key] = st[key] === 'yes' ? '' : 'yes'; save(); ref(); updBranch(); });
        nb.addEventListener('click', function () { st[key] = st[key] === 'no'  ? '' : 'no';  save(); ref(); updBranch(); });
        btns.appendChild(yb); btns.appendChild(nb); li.appendChild(btns);
      }
      ul.appendChild(li);
    }

    addRow(br.child,  bpfx + 'ch', br.childDead,  0);
    if (br.spouse) addRow(br.spouse, bpfx + 'sp', br.spouseDead, 0);

    br.grands.forEach(function (g) {
      var gpfx = bpfx + g.name + '::';
      addRow(g.name, gpfx + 'g', g.dead, 1);
      if (g.spouse) addRow(g.spouse, gpfx + 'gsp', false, 1);
      g.kids.forEach(function (k) {
        var kn = (k.unknown || k.ph) ? 'ילד/ה' : k.name;
        addRow(kn, gpfx + 'k::' + kn + (k.year || ''), !!k.dead, 2);
      });
    });

    root.appendChild(ul);
    updBranch();
    root.appendChild(sumEl);
  }

  /* ── Router ── */
  function route() {
    var hash = location.hash.slice(1);
    if (hash !== '' && /^\d+$/.test(hash)) showBranch(parseInt(hash, 10));
    else showList();
  }

  window.addEventListener('hashchange', route);
  route();
})();
