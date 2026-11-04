(function () {
  var b = document.getElementById('built');
  if (b && window.FAMILY) b.textContent = 'הנתונים עודכנו ב־' + window.FAMILY.built;
})();
