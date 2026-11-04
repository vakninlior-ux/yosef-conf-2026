(function () {
  var box = document.getElementById('meets'), F = window.FAMILY;
  if (!box || !F) return;
  var HREFS = { 'כנס יוסף הראשון': 'meetings-2010.html', 'כנס יוסף השני': 'meetings-2026.html' };
  var confs = F.events.filter(function (e) { return e.t === 'conference'; });
  confs.sort(function (a, b) { return b.y - a.y; });
  confs.forEach(function (e) {
    var d = document.createElement('div'); d.className = 'doc'; d.style.borderInlineStartColor = 'var(--c-conference)';
    var h = document.createElement('h3');
    var label = e.tx + ' · ' + e.y;
    var href = HREFS[e.tx];
    if (href && !e.postponed) {
      var a = document.createElement('a'); a.href = href; a.textContent = label; h.appendChild(a);
      if (href === 'meetings-2026.html') {
        var arr = document.createElement('strong');
        arr.textContent = ' ← כנסו לאישורי הגעה';
        arr.style.cssText = 'margin-inline-start:10px;color:var(--c-conference)';
        h.appendChild(arr);
      }
    } else { h.textContent = label; }
    if (e.tag) { var s = document.createElement('span'); s.textContent = e.tag; s.style.cssText = 'font-family:var(--sans);font-size:13px;border:1px solid var(--c-conference);color:var(--c-conference);border-radius:999px;padding:0 9px;margin-inline-start:8px'; h.appendChild(document.createTextNode(' ')); h.appendChild(s); }
    d.appendChild(h);
    if (e.note) { var p = document.createElement('p'); p.textContent = e.note; d.appendChild(p); }
    box.appendChild(d);
  });
})();
