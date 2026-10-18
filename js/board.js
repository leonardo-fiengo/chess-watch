(function (root) {
  'use strict';
  var files = 'abcdefgh';
  function Board(element, onSquare) {
    this.element = element;
    this.buttons = {};
    this.order = [];
    this.orientation = null;
    this.focus = 'e2';
    element.addEventListener('click', function (event) {
      var button = event.target;
      while (button && button !== element && !button.getAttribute('data-square')) button = button.parentNode;
      if (button && button !== element) onSquare(button.getAttribute('data-square'));
    });
    var self = this;
    element.addEventListener('keydown', function (event) {
      var offsets = {ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8};
      if (!offsets[event.key]) return;
      event.preventDefault();
      var index = self.order.indexOf(event.target.getAttribute('data-square'));
      var next = Math.max(0,Math.min(63,index + offsets[event.key]));
      self.setFocus(self.order[next],true);
    });
  }
  Board.prototype.setFocus = function (square, focus) {
    if (this.buttons[this.focus]) this.buttons[this.focus].tabIndex = -1;
    this.focus = square;
    if (this.buttons[square]) {
      this.buttons[square].tabIndex = 0;
      if (focus) this.buttons[square].focus();
    }
  };
  Board.prototype.build = function (flipped) {
    this.orientation = flipped;
    this.element.innerHTML = '';
    this.buttons = {};
    this.order = [];
    var rankLabels = '', fileLabels = '';
    for (var row = 0; row < 8; row++) {
      var rank = flipped ? row + 1 : 8 - row;
      rankLabels += '<span>' + rank + '</span>';
      fileLabels += '<span>' + files[flipped ? 7-row : row] + '</span>';
      for (var col = 0; col < 8; col++) {
        var file = flipped ? 7-col : col;
        var square = files[file] + rank;
        var button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-square',square);
        button.tabIndex = square === this.focus ? 0 : -1;
        this.buttons[square] = button;
        this.order.push(square);
        this.element.appendChild(button);
      }
    }
    document.getElementById('rank-labels').innerHTML = rankLabels;
    document.getElementById('file-labels').innerHTML = fileLabels;
  };
  Board.prototype.render = function (game, selected, bezelSquare) {
    if (this.orientation !== game.flipped) this.build(game.flipped);
    var chess = game.chess;
    var legal = selected ? chess.moves({square:selected,verbose:true}) : [];
    var history = chess.history({verbose:true});
    var last = history.length ? history[history.length-1] : null;
    var inCheck = chess.in_check();
    for (var i = 0; i < this.order.length; i++) {
      var square = this.order[i];
      var button = this.buttons[square];
      var piece = chess.get(square);
      var key = piece ? piece.color + piece.type : '';
      if (button.getAttribute('data-piece') !== key) {
        button.innerHTML = piece ? root.ChessPieces.svg(piece) : '';
        button.setAttribute('data-piece',key);
      }
      var classes = ['square'];
      if ((files.indexOf(square[0]) + Number(square[1])) % 2 === 1) classes.push('dark');
      if (last && (last.from === square || last.to === square)) classes.push('last-move');
      if (selected === square) classes.push('selected');
      if (bezelSquare === square) classes.push('bezel-focus');
      var destination = legal.some(function (move) { return move.to === square; });
      if (destination) classes.push(piece ? 'capture' : 'legal');
      if (inCheck && piece && piece.type === 'k' && piece.color === chess.turn()) classes.push('checked');
      button.className = classes.join(' ');
      var name = piece ? (piece.color === 'w' ? 'White ' : 'Black ') + root.ChessPieces.names[piece.type] : 'Empty';
      button.setAttribute('aria-label',square + ', ' + name + (destination ? ', legal move' : '') + (selected === square ? ', selected' : ''));
      button.setAttribute('aria-pressed',selected === square ? 'true' : 'false');
    }
  };
  root.OrbitBoard = Board;
}(window));
