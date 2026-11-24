// ¡Palabrones! · Escala de la interfaz. Todo el CSS va en rem: el tamaño base sale del ancho y
// el alto VISIBLES (innerWidth/innerHeight), así que se ve igual con la ventana virtual de
// Safari, con la barra inferior del iPhone o con la escala de Windows.
(function () {
  var html = document.documentElement;
  function medir() {
    var w = window.innerWidth, h = window.innerHeight;
    var vertical = h > w * 1.1;
    // Diseño de referencia: 26 rem de ancho en vertical y 44 rem de alto en horizontal.
    var base = vertical ? Math.min(w / 24.5, h / 41) : Math.min(w / 46, h / 34);
    base = Math.max(10, Math.min(base, 24));
    html.style.fontSize = base.toFixed(2) + 'px';
    html.style.setProperty('--alto', h + 'px');
    html.style.setProperty('--ancho', w + 'px');
    html.classList.toggle('vertical', vertical);
    html.classList.toggle('horizontal', !vertical);
    html.classList.toggle('bajo', !vertical && h < 520);
    var tactil = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    html.classList.toggle('tactil', tactil);
  }
  medir();
  window.addEventListener('resize', medir);
  window.addEventListener('orientationchange', function () { setTimeout(medir, 250); });
})();
