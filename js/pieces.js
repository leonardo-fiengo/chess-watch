/* Original vector pieces; no font or network dependency. */
(function (root) {
  'use strict';
  var shapes = {
    p: '<circle cx="24" cy="13" r="6"/><path d="M20 19h8l-1 7 5 10H16l5-10z"/><path d="M15 37h18v4H15z"/>',
    r: '<path d="M12 8h6v6h4V8h4v6h4V8h6v12l-5 4 1 13H16l1-13-5-4z"/><path d="M14 37h20v4H14z"/><path d="M17 22h14M18 27h12" fill="none"/>',
    n: '<path d="M15 36c1-7 5-10 10-14l-7 1-6 4-5-6 8-11 8-3 1-4 5 5c9 3 12 15 9 28z"/><path d="m14 15 7-5M28 12c4 5 5 10 2 16" fill="none"/><circle cx="19" cy="16" r="1.6" class="piece-eye"/><path d="M13 36h25v5H13z"/>',
    b: '<path d="M24 5c-2 4-10 10-10 15 0 5 4 7 10 7s10-2 10-7c0-5-8-11-10-15z"/><path d="m27 12-6 8" fill="none"/><path d="M20 27h8l3 9H17zM14 36h20v5H14z"/><circle cx="24" cy="5" r="2"/>',
    q: '<path d="m11 14 6 7 7-12 7 12 6-7-6 20H17z"/><path d="M16 34h16v4H16zM13 38h22v4H13z"/><circle cx="10" cy="12" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="38" cy="12" r="3"/><path d="M18 29h12" fill="none"/>',
    k: '<path d="M21 12V8h-4V4h4V1h6v3h4v4h-4v4"/><path d="M24 16c-9-11-20-1-13 8l6 8h14l6-8c7-9-4-19-13-8z"/><path d="M24 16v13M17 32h14v5H17zM14 37h20v5H14z"/>'
  };
  root.ChessPieces = {
    names: {p:'pawn',r:'rook',n:'knight',b:'bishop',q:'queen',k:'king'},
    svg: function (piece) {
      var fill = piece.color === 'w' ? '#faf7e9' : '#304335';
      var stroke = piece.color === 'w' ? '#52634b' : '#172f23';
      return '<svg class="piece" viewBox="0 0 48 48" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">'+shapes[piece.type]+'</g></svg>';
    }
  };
}(window));
