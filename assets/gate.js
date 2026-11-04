/* Password gate. The family data is encrypted (AES-GCM, key from the password with PBKDF2) inside assets/data.js.
   Nothing is readable without the password; the page scripts start only after the data is decrypted in the browser. */
(function () {
  'use strict';
  var ENC = window.FAMILY_ENC, SCRIPTS = window.PAGE_SCRIPTS || [], KEY = 'yosef_family_key';
  var enc = new TextEncoder();

  function fromB64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function toB64(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function readKey() { var k = null; ['sessionStorage', 'localStorage'].forEach(function (n) { var s = store(n); try { if (!k && s) k = s.getItem(KEY); } catch (e) {} }); return k; }
  function clearKey() { ['sessionStorage', 'localStorage'].forEach(function (n) { var s = store(n); try { if (s) s.removeItem(KEY); } catch (e) {} }); }
  function saveKey(b64, remember) { var s = store(remember ? 'localStorage' : 'sessionStorage'); try { if (s) s.setItem(KEY, b64); } catch (e) {} }

  function decryptRaw(raw) {
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(ENC.iv) }, key, fromB64(ENC.ct));
    }).then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
  }
  function deriveRaw(pass) {
    return crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']).then(function (km) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromB64(ENC.salt), iterations: ENC.iter, hash: 'SHA-256' }, km, 256);
    }).then(function (bits) { return new Uint8Array(bits); });
  }

  function start(data) {
    window.FAMILY = data;
    var g = document.getElementById('gate'); if (g) g.remove();
    document.documentElement.classList.remove('locked');
    if (window.MODULES) { window.MODULES.forEach(function (m) { m(); }); return; }
    var i = 0;
    (function next() {
      if (i >= SCRIPTS.length) return;
      var s = document.createElement('script'); s.src = SCRIPTS[i++]; s.onload = next; document.body.appendChild(s);
    })();
  }

  var lock = document.getElementById('lock');
  if (lock) lock.addEventListener('click', function () { clearKey(); location.reload(); });

  function prompt(msg) {
    var g = document.createElement('div'); g.id = 'gate'; g.className = 'gate';
    g.innerHTML = '<form class="box" autocomplete="off"><h1>משפחת יוסף</h1><p>האתר מוגן בסיסמה משפחתית.</p>' +
      '<label class="pw" for="gpw">סיסמה</label><input id="gpw" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required>' +
      '<label class="rem"><input type="checkbox" id="gshow"> הצגת הסיסמה</label>' +
      '<label class="rem"><input type="checkbox" id="grem"> זכרו אותי במכשיר הזה</label>' +
      '<button class="go" type="submit">כניסה</button><p class="err" id="gerr" role="alert"></p></form>';
    document.body.appendChild(g);
    var form = g.querySelector('form'), pw = g.querySelector('#gpw'), err = g.querySelector('#gerr');
    if (msg) err.textContent = msg;
    pw.focus();
    g.querySelector('#gshow').addEventListener('change', function (e) { pw.type = e.target.checked ? 'text' : 'password'; });
    function variants(raw) {
      var clean = raw.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').replace(/[\u2010-\u2015\u2212\u05BE]/g, '-').trim();
      var bare = clean.replace(/^["'“”‘’«»`]+/, '').replace(/["'“”‘’«»`.\s]+$/, '');
      var list = [raw, clean, bare, clean.toLowerCase(), bare.toLowerCase()], seen = {}, out = [];
      list.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
      return { list: out, clean: clean };
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = variants(pw.value), remember = g.querySelector('#grem').checked;
      if (/[\u0590-\u05FF]/.test(v.clean)) { err.textContent = 'נראה שהמקלדת בעברית. עברו לאנגלית ונסו שוב.'; return; }
      err.textContent = 'בודק…';
      var k = 0;
      (function attempt() {
        if (k >= v.list.length) { err.textContent = 'הסיסמה לא נכונה. נסו שוב (אפשר לסמן ״הצגת הסיסמה״ כדי לראות מה הוקלד).'; pw.select(); return; }
        deriveRaw(v.list[k++]).then(function (raw) {
          return decryptRaw(raw).then(function (data) { saveKey(toB64(raw), remember); start(data); });
        }).catch(attempt);
      })();
    });
  }

  if (!ENC || !window.crypto || !crypto.subtle) {
    document.documentElement.classList.remove('locked');
    var m = document.createElement('div'); m.className = 'gate';
    m.innerHTML = '<div class="box"><h1>משפחת יוסף</h1><p>הדפדפן לא תומך בפתיחת האתר המוגן. נסו Chrome, Edge, Firefox או Safari עדכניים, ופתחו את הקישור המלא (https).</p></div>';
    document.body.appendChild(m); return;
  }
  var saved = readKey();
  if (saved) {
    decryptRaw(fromB64(saved)).then(start).catch(function () { clearKey(); prompt(''); });
  } else prompt('');
})();
