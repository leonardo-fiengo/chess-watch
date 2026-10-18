(function () {
  'use strict';
  function el(id) { return document.getElementById(id); }
  function text(id, value) { el(id).textContent = value; }
  function on(id, callback) { el(id).addEventListener('click',callback); }
  var game = new OrbitGame.Game();
  var engine = new OrbitEngine();
  var dialog = OrbitDialog;
  var storageKey = /[?&]preview=1/.test(location.search) ? 'orbit-preview-v1' : 'orbit-chess-v1';
  var selected = null, bezelSquare = null, thinking = false, engineError = '', toastTimer;
  var lastResult = '', storageAvailable = true;
  try {
    var saved = localStorage.getItem(storageKey);
    if (saved && !game.restore(JSON.parse(saved))) localStorage.removeItem(storageKey);
  } catch (error) { storageAvailable = false; }
  var draft = {mode:game.mode,color:game.color,level:game.level};
  var board = new OrbitBoard(el('board'),selectSquare);

  function isWatch() { return document.documentElement.className.indexOf('watch') !== -1; }
  function toast(message) {
    clearTimeout(toastTimer);
    text('toast',message); el('toast').hidden = false;
    toastTimer = setTimeout(function () { el('toast').hidden = true; },2600);
  }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(game.snapshot())); storageAvailable = true; }
    catch (error) { storageAvailable = false; }
    document.querySelector('.autosave').textContent = storageAvailable ? 'Saved on this device' : 'Storage unavailable · keep this app open';
  }
  function active(id, value) {
    el(id).classList.toggle('active',value);
    el(id).setAttribute('aria-pressed',String(value));
  }
  function renderSettings() {
    active('mode-bot',draft.mode === 'bot'); active('mode-solo',draft.mode === 'solo');
    active('color-white',draft.color === 'w'); active('color-black',draft.color === 'b');
    el('bot-settings').hidden = draft.mode !== 'bot';
    el('solo-note').hidden = draft.mode !== 'solo';
    text('mode-description',draft.mode === 'bot' ? 'A thinking partner for every level.' : 'Your board. Both sides. All the possibilities.');
    el('level').value = draft.level;
    text('level-value',draft.level); text('level-name',OrbitGame.levels[draft.level-1].name);
    el('level-down').disabled = draft.level === 1; el('level-up').disabled = draft.level === 8;
    var changed = draft.mode !== game.mode || draft.color !== game.color;
    text('settings-note',changed ? 'Start a new game to apply your choices.' : 'No clock. Play at your own pace.');
  }
  function renderHistory() {
    var moves = game.chess.history();
    var count = Math.ceil(moves.length / 2);
    text('move-count',count + (count === 1 ? ' move' : ' moves'));
    var container = el('move-history');
    if (!moves.length) {
      container.innerHTML = '<div class="empty-history"><span class="mini-board" aria-hidden="true"></span><p>Every game starts with a possibility.<br><span>Make your first move.</span></p></div>';
      return;
    }
    var html = '';
    for (var i = 0; i < moves.length; i += 2) html += '<div class="move-row"><span>'+ (i / 2 + 1) +'.</span><span>'+moves[i]+'</span><span>'+(moves[i+1] || '…')+'</span></div>';
    if (container.innerHTML !== html) { container.innerHTML = html; container.scrollTop = container.scrollHeight; }
  }
  function render() {
    board.render(game,selected,bezelSquare);
    var chess = game.chess, result = game.result();
    var turn = chess.turn() === 'w' ? 'White' : 'Black';
    var status = result ? result.title + ' ' + result.text.split('. ')[0] : turn + ' to move' + (chess.in_check() ? ' · Check' : '');
    if (!result && thinking) status = 'Stockfish is thinking…';
    if (engineError) status = 'Bot unavailable. Retry to continue.';
    text('status-text',status);
    text('watch-status',bezelSquare ? bezelSquare.toUpperCase() + ' · Tap here to select' : engineError ? 'Bot unavailable · tap to retry' : status);
    el('game-status').classList.toggle('error',!!engineError);
    el('retry-engine').hidden = !engineError;
    var bottom = game.flipped ? 'b' : 'w', top = bottom === 'w' ? 'b' : 'w';
    var topBot = game.mode === 'bot' && top !== game.color;
    var bottomBot = game.mode === 'bot' && bottom !== game.color;
    text('opponent-name',topBot ? 'Stockfish' : game.mode === 'bot' ? 'You' : top === 'w' ? 'White' : 'Black');
    text('opponent-detail',topBot ? 'Level ' + game.level + ' · ' + OrbitGame.levels[game.level-1].name : 'At your own pace');
    el('opponent-avatar').innerHTML = '<svg class="icon" aria-hidden="true"><use xlink:href="#i-'+(topBot ? 'bot' : 'solo')+'"/></svg>';
    text('opponent-color',top === 'w' ? 'White pieces' : 'Black pieces');
    document.querySelector('.player-color .color-dot').className = 'color-dot ' + (top === 'w' ? 'white-dot' : 'black-dot');
    text('self-name',bottomBot ? 'Stockfish' : game.mode === 'bot' ? 'You' : bottom === 'w' ? 'White' : 'Black');
    text('self-detail',bottomBot ? 'Level '+game.level+' · '+OrbitGame.levels[game.level-1].name : 'A fresh perspective');
    text('turn-badge',result ? 'Game complete' : thinking ? 'Thinking…' : game.mode === 'solo' ? turn + "’s turn" : game.isBotTurn() ? 'Bot’s turn' : 'Your turn');
    var count = chess.history().length;
    el('undo').disabled = count === 0 || (game.mode === 'bot' && game.color === 'b' && count <= 1);
    el('export').disabled = count === 0;
    renderHistory();
    renderSettings();
  }
  function cancelEngine() { engine.cancel(); thinking = false; }
  function maybeBot() {
    if (!game.isBotTurn() || thinking || document.hidden || !el('preview-backdrop').hidden || engineError) return;
    thinking = true; render();
    var expectedFen = game.chess.fen();
    engine.search(game.positionCommand(),OrbitGame.levels[game.level-1],function (uci) {
      thinking = false;
      if (game.chess.fen() !== expectedFen || !game.isBotTurn()) return;
      var move = game.move(uci.slice(0,2),uci.slice(2,4),uci.slice(4));
      if (!move) { engineError = 'The engine returned an illegal move.'; engine.cancel(); render(); return; }
      afterMove();
    },function (message) { thinking = false; engineError = message; render(); });
  }
  function afterMove() {
    selected = null; bezelSquare = null;
    save(); render();
    var result = game.result();
    if (result) {
      cancelEngine();
      if (lastResult !== game.chess.fen()) {
        lastResult = game.chess.fen();
        dialog.show(result.title,'<p>'+result.text+'</p>',[{label:'View board'},{label:'Play again',primary:true,run:startGame}]);
      }
    } else maybeBot();
  }
  function selectSquare(square) {
    if (game.chess.game_over() || game.isBotTurn() || dialog.isOpen()) return;
    board.setFocus(square,false);
    var piece = game.chess.get(square);
    if (selected === square) { selected = null; bezelSquare = null; render(); return; }
    if (selected) {
      var candidates = game.chess.moves({square:selected,verbose:true}).filter(function (move) { return move.to === square; });
      if (candidates.length) {
        var from = selected;
        if (candidates[0].flags.indexOf('p') !== -1) {
          showPromotion(from,square,game.chess.turn()); return;
        }
        game.move(from,square); afterMove(); return;
      }
    }
    selected = piece && piece.color === game.chess.turn() ? square : null;
    bezelSquare = null;
    render();
  }
  function showPromotion(from,to,color) {
    var choices = ['q','r','b','n'];
    var html = '<p>Choose your pawn’s next chapter.</p><div class="promotion-options">';
    choices.forEach(function (type) {
      html += '<button class="promotion-choice" data-promotion="'+type+'" aria-label="Promote to '+ChessPieces.names[type]+'">'+ChessPieces.svg({type:type,color:color})+'</button>';
    });
    dialog.show('A well-earned promotion.',html+'</div>',[],function () { selected = null; render(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-promotion]'),function (button) {
      button.addEventListener('click',function () { dialog.hide(); game.move(from,to,button.getAttribute('data-promotion')); afterMove(); });
    });
  }
  function closeSettings() { el('sidebar').classList.remove('open'); el('watch-menu').setAttribute('aria-expanded','false'); }
  function startGame() {
    cancelEngine(); engineError = ''; lastResult = ''; selected = null; bezelSquare = null;
    game.reset(draft); closeSettings(); save(); render(); maybeBot();
  }
  function changeLevel(value) {
    draft.level = OrbitGame.levelNumber(value);
    game.level = draft.level;
    if (thinking) cancelEngine();
    save(); render(); maybeBot();
  }
  on('mode-bot',function () { draft.mode = 'bot'; renderSettings(); });
  on('mode-solo',function () { draft.mode = 'solo'; renderSettings(); });
  on('color-white',function () { draft.color = 'w'; renderSettings(); });
  on('color-black',function () { draft.color = 'b'; renderSettings(); });
  on('level-up',function () { changeLevel(draft.level + 1); });
  on('level-down',function () { changeLevel(draft.level - 1); });
  el('level').addEventListener('change',function () { changeLevel(this.value); });
  el('level').addEventListener('input',function () { text('level-value',this.value); text('level-name',OrbitGame.levels[Number(this.value)-1].name); });
  on('new-game',function () {
    if (!game.chess.history().length || game.chess.game_over()) { startGame(); return; }
    dialog.show('A fresh start?','<p>This will replace your current game. A whole new set of possibilities awaits.</p>',[{label:'Keep playing'},{label:'New game',primary:true,run:startGame}]);
  });
  on('undo',function () {
    cancelEngine(); engineError = ''; selected = null; bezelSquare = null; lastResult = '';
    game.undo(); save(); render(); maybeBot();
  });
  on('flip',function () { game.flipped = !game.flipped; bezelSquare = null; save(); render(); });
  function retry() { engineError = ''; cancelEngine(); maybeBot(); render(); }
  on('retry-engine',retry);
  on('watch-status',function () { if (bezelSquare) selectSquare(bezelSquare); else if (engineError) retry(); });
  on('watch-menu',function () { el('sidebar').classList.add('open'); el('sidebar').scrollTop = 0; el('watch-menu').setAttribute('aria-expanded','true'); el('settings-close').focus(); });
  on('settings-close',function () { closeSettings(); el('watch-menu').focus(); });
  on('help-open',function () {
    dialog.show('A little room to think.','<ul><li><strong>Tap, then move.</strong> Select your piece, then a highlighted square. All standard chess rules apply.</li><li><strong>Choose your company.</strong> Play both sides in solo mode, or take on Stockfish at one of eight levels.</li><li><strong>Make it yours.</strong> Difficulty changes immediately. Mode and color apply when you start a new game.</li><li><strong>On your watch.</strong> Turn the bezel to highlight a piece or destination, then tap the text above the board to select it. Back closes a menu or clears a selection.</li><li><strong>Pick up where you left off.</strong> Your game is saved on this device. Undo takes back your last turn.</li></ul>',[{label:'Let’s play',primary:true}]);
  });
  on('preview-open',function () {
    cancelEngine(); render(); el('preview-backdrop').hidden = false;
    el('watch-preview').src = 'index.html?watch=1&preview=1'; el('preview-close').focus();
  });
  function closePreview() { el('preview-backdrop').hidden = true; el('watch-preview').removeAttribute('src'); el('preview-open').focus(); maybeBot(); }
  on('preview-close',closePreview);
  on('export',function () {
    var result = game.result();
    game.chess.header('Event','Orbit Chess','White',game.mode === 'bot' && game.color === 'b' ? 'Stockfish' : 'Player','Black',game.mode === 'bot' && game.color === 'w' ? 'Stockfish' : 'Player','Result',result ? result.pgn : '*');
    var blob = new Blob([game.chess.pgn()],{type:'application/x-chess-pgn'});
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'orbit-chess.pgn'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); },1000);
    toast('Your game, ready to keep.');
  });
  function back(hardware) {
    if (dialog.isOpen()) { dialog.hide(); return; }
    if (!el('preview-backdrop').hidden) { closePreview(); return; }
    if (el('sidebar').classList.contains('open')) { closeSettings(); return; }
    if (selected || bezelSquare) { selected = null; bezelSquare = null; render(); return; }
    if (hardware && window.tizen) {
      save(); cancelEngine();
      try { window.tizen.application.getCurrentApplication().exit(); }
      catch (error) { toast('Use your watch’s Home button to leave.'); }
    }
  }
  document.addEventListener('tizenhwkey',function (event) { if (event.keyName === 'back') back(true); });
  document.addEventListener('keydown',function (event) { if (event.key === 'Escape') { event.preventDefault(); back(false); } });
  document.addEventListener('rotarydetent',function (event) {
    var direction = event.detail.direction === 'CW' ? 1 : -1;
    if (dialog.isOpen()) { el('dialog').scrollTop += direction * 45; return; }
    if (el('sidebar').classList.contains('open')) { el('sidebar').scrollTop += direction * 50; return; }
    if (!isWatch() || game.isBotTurn() || game.chess.game_over()) return;
    var moves = game.chess.moves({verbose:true});
    var squares = [];
    moves.forEach(function (move) {
      var square = selected ? (move.from === selected ? move.to : null) : move.from;
      if (square && squares.indexOf(square) === -1) squares.push(square);
    });
    squares.sort(function (a,b) { return board.order.indexOf(a)-board.order.indexOf(b); });
    if (!squares.length) return;
    var index = squares.indexOf(bezelSquare);
    bezelSquare = squares[index === -1 ? (direction > 0 ? 0 : squares.length-1) : (index + direction + squares.length) % squares.length];
    render();
  });
  document.addEventListener('visibilitychange',function () { if (document.hidden) { save(); cancelEngine(); render(); } else maybeBot(); });
  window.addEventListener('pagehide',function () { save(); cancelEngine(); });
  Array.prototype.forEach.call(document.querySelectorAll('.icon'),function (icon) { icon.setAttribute('aria-hidden','true'); });
  save(); render(); maybeBot();
}());
