(function () {
  'use strict';
  function layout() {
    var watch = /[?&]watch=1/.test(location.search) || (window.innerWidth <= 480 && window.innerHeight <= 520);
    document.documentElement.className = watch ? 'watch' : '';
    if (watch) {
      var size = Math.min(window.innerWidth, window.innerHeight);
      document.documentElement.style.fontSize = (size / 360 * 16) + 'px';
    } else {
      document.documentElement.style.fontSize = '';
    }
  }
  layout();
  window.addEventListener('resize', layout);
}());
