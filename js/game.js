(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../vendor/chess.js').Chess);
  else root.OrbitGame = factory(root.Chess);
}(this, function (Chess) {
  'use strict';
  var levels = [
    {name:'First steps',skill:0,depth:1,time:100},
    {name:'Easygoing',skill:2,depth:2,time:150},
    {name:'Casual',skill:5,depth:3,time:200},
    {name:'Thoughtful',skill:8,depth:5,time:350},
    {name:'Challenging',skill:11,depth:7,time:500},
    {name:'Advanced',skill:14,depth:9,time:700},
    {name:'Expert',skill:17,depth:11,time:950},
    {name:'Masterful',skill:20,depth:13,time:1300}
  ];
  function levelNumber(value) { return Math.max(1, Math.min(8, Math.round(Number(value) || 3))); }
  function Game(options) { this.reset(options || {}); }
  Game.prototype.reset = function (options) {
    this.chess = new Chess();
    this.mode = options.mode === 'solo' ? 'solo' : 'bot';
    this.color = options.color === 'b' ? 'b' : 'w';
    this.level = levelNumber(options.level);
    this.flipped = this.color === 'b';
  };
  Game.prototype.isBotTurn = function () {
    return this.mode === 'bot' && this.chess.turn() !== this.color && !this.chess.game_over();
  };
  Game.prototype.move = function (from, to, promotion) {
    if (this.chess.game_over()) return null;
    return this.chess.move({from:from,to:to,promotion:promotion || 'q'});
  };
  Game.prototype.undo = function () {
    // Never undo the bot's opening alone when the human chose Black.
    var count = this.chess.history().length;
    if (this.mode === 'bot' && this.color === 'b' && count <= 1) return false;
    if (!this.chess.undo()) return false;
    if (this.mode === 'bot' && this.chess.turn() !== this.color) this.chess.undo();
    return true;
  };
  Game.prototype.uciMoves = function () {
    return this.chess.history({verbose:true}).map(function (move) { return move.from + move.to + (move.promotion || ''); });
  };
  Game.prototype.positionCommand = function () {
    var moves = this.uciMoves();
    return 'position startpos' + (moves.length ? ' moves ' + moves.join(' ') : '');
  };
  Game.prototype.snapshot = function () {
    return {version:1,mode:this.mode,color:this.color,level:this.level,flipped:this.flipped,moves:this.uciMoves()};
  };
  Game.prototype.restore = function (saved) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.moves) || saved.moves.length > 5000) return false;
    var candidate = new Game(saved);
    for (var i = 0; i < saved.moves.length; i++) {
      var move = saved.moves[i];
      if (typeof move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return false;
      if (!candidate.move(move.slice(0,2),move.slice(2,4),move.slice(4))) return false;
    }
    this.chess = candidate.chess;
    this.mode = candidate.mode;
    this.color = candidate.color;
    this.level = candidate.level;
    this.flipped = typeof saved.flipped === 'boolean' ? saved.flipped : candidate.flipped;
    return true;
  };
  Game.prototype.result = function () {
    var chess = this.chess;
    if (chess.in_checkmate()) return {title:'Checkmate.',text:(chess.turn() === 'w' ? 'Black' : 'White') + ' wins. A good game, a new lesson.',pgn:chess.turn() === 'w' ? '0-1' : '1-0'};
    if (chess.in_stalemate()) return {title:'A balanced ending.',text:'Draw by stalemate. No legal moves remain.',pgn:'1/2-1/2'};
    if (chess.insufficient_material()) return {title:'A peaceful finish.',text:'Draw. Neither side has enough material to checkmate.',pgn:'1/2-1/2'};
    if (chess.in_threefold_repetition()) return {title:'We have been here before.',text:'Draw by threefold repetition.',pgn:'1/2-1/2'};
    if (chess.in_draw()) return {title:'Honors shared.',text:'Draw by the fifty-move rule.',pgn:'1/2-1/2'};
    return null;
  };
  return {Game:Game,levels:levels,levelNumber:levelNumber};
}));
