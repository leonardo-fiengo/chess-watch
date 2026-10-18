(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OrbitEngine = factory();
}(this, function () {
  'use strict';
  function Engine(workerFactory) {
    this.createWorker = workerFactory || function () { return new Worker('vendor/stockfish.js'); };
    this.worker = null;
    this.ready = false;
    this.pending = null;
    this.timer = null;
  }
  Engine.prototype.cancel = function () {
    clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
    this.ready = false;
    if (this.worker) this.worker.terminate();
    this.worker = null;
  };
  Engine.prototype.fail = function (message) {
    var pending = this.pending;
    this.cancel();
    if (pending) pending.error(message);
  };
  Engine.prototype.search = function (position, level, done, error) {
    if (this.pending) this.cancel();
    this.pending = {position:position,level:level,done:done,error:error};
    var self = this;
    this.timer = setTimeout(function () { self.fail('Stockfish took too long to respond.'); },20000);
    if (this.worker && this.ready) { this.begin(); return; }
    try {
      var worker = this.createWorker();
      this.worker = worker;
      worker.onmessage = function (event) {
        if (self.worker !== worker) return;
        String(event.data).split('\n').forEach(function (line) { self.receive(line.trim()); });
      };
      worker.onerror = function (event) {
        if (self.worker !== worker) return;
        if (event.preventDefault) event.preventDefault();
        self.fail('Stockfish could not start on this device.');
      };
      worker.postMessage('uci');
    } catch (err) { this.fail('This browser could not start the chess worker.'); }
  };
  Engine.prototype.receive = function (line) {
    if (!this.worker) return;
    if (line === 'uciok') {
      this.worker.postMessage('setoption name Hash value 8');
      this.worker.postMessage('setoption name Ponder value false');
      this.worker.postMessage('ucinewgame');
      this.worker.postMessage('isready');
    } else if (line === 'readyok') {
      this.ready = true;
      this.begin();
    } else if (line.indexOf('bestmove ') === 0 && this.pending) {
      var move = line.split(/\s+/)[1];
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
        this.fail('Stockfish did not return a playable move.'); return;
      }
      var done = this.pending.done;
      this.pending = null;
      clearTimeout(this.timer);
      this.timer = null;
      done(move);
    }
  };
  Engine.prototype.begin = function () {
    if (!this.ready || !this.pending) return;
    var request = this.pending;
    this.worker.postMessage('setoption name Skill Level value ' + request.level.skill);
    this.worker.postMessage(request.position);
    this.worker.postMessage('go depth ' + request.level.depth + ' movetime ' + request.level.time);
  };
  return Engine;
}));
