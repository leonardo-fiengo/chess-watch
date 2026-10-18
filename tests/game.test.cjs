const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Game, levels } = require('../js/game.js');

test('legal move validation and position history sent to Stockfish', () => {
  const game = new Game();
  assert.equal(game.move('e2','e5'),null);
  assert.ok(game.move('e2','e4'));
  assert.equal(game.isBotTurn(),true);
  game.move('e7','e5');
  assert.equal(game.positionCommand(),'position startpos moves e2e4 e7e5');
});
test('undo restores the human turn both during search and after a reply', () => {
  const game = new Game();
  game.move('e2','e4');
  assert.ok(game.undo());
  assert.equal(game.chess.history().length,0);
  game.move('e2','e4'); game.move('e7','e5');
  game.undo();
  assert.equal(game.chess.history().length,0);
});
test('Black can undo their turn but cannot undo the bot opening alone', () => {
  const game = new Game({color:'b'});
  assert.equal(game.isBotTurn(),true);
  game.move('e2','e4');
  assert.equal(game.undo(),false);
  game.move('e7','e5'); game.move('g1','f3');
  game.undo();
  assert.deepEqual(game.chess.history(),['e4']);
  assert.equal(game.chess.turn(),'b');
});
test('solo undo takes back one ply and both sides remain human controlled', () => {
  const game = new Game({mode:'solo'});
  game.move('e2','e4'); game.move('e7','e5');
  game.undo();
  assert.deepEqual(game.chess.history(),['e4']);
  assert.equal(game.isBotTurn(),false);
});
test('castling moves the rook and en passant removes the captured pawn', () => {
  const game = new Game({mode:'solo'});
  ['e4','e5','Nf3','Nc6','Bc4','Nf6'].forEach(m=>game.chess.move(m));
  assert.ok(game.move('e1','g1'));
  assert.equal(game.chess.get('f1').type,'r');
  game.reset({mode:'solo'});
  ['e4','a6','e5','d5'].forEach(m=>game.chess.move(m));
  assert.ok(game.move('e5','d6'));
  assert.equal(game.chess.get('d5'),null);
});
test('underpromotion is passed through to the rules engine', () => {
  const game = new Game({mode:'solo'});
  game.chess.load('7k/P7/8/8/8/8/8/7K w - - 0 1');
  assert.ok(game.move('a7','a8','n'));
  assert.equal(game.chess.get('a8').type,'n');
});
test('checkmate, stalemate, insufficient material and repetition produce results', () => {
  const game = new Game({mode:'solo'});
  ['f3','e5','g4','Qh4#'].forEach(m=>game.chess.move(m));
  assert.equal(game.result().pgn,'0-1');
  assert.equal(game.move('e2','e3'),null);
  game.chess.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.match(game.result().text,/stalemate/);
  game.chess.load('7k/8/8/8/8/8/8/K7 w - - 0 1');
  assert.match(game.result().text,/material/);
  game.reset({mode:'solo'});
  ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'].forEach(m=>game.chess.move(m));
  assert.match(game.result().text,/threefold/);
  const restored = new Game();
  assert.ok(restored.restore(game.snapshot()));
  assert.match(restored.result().text,/threefold/);
});
test('saved games restore exact position, settings and undo history', () => {
  const game = new Game({mode:'solo',level:8,color:'b'});
  ['e4','c5','Nf3','d6'].forEach(m=>game.chess.move(m));
  const restored = new Game();
  assert.ok(restored.restore(game.snapshot()));
  assert.equal(restored.chess.fen(),game.chess.fen());
  assert.equal(restored.level,8);
  assert.equal(restored.flipped,true);
  assert.deepEqual(restored.chess.history(),game.chess.history());
});
test('corrupt save does not partially replace a valid game', () => {
  const game = new Game();
  game.move('d2','d4');
  const before = game.chess.fen();
  assert.equal(game.restore({version:1,moves:['e2e4','e7e3']}),false);
  assert.equal(game.chess.fen(),before);
  assert.equal(game.restore({version:20,moves:[]}),false);
});
test('difficulty has eight increasing skill levels and bounded watch search budgets', () => {
  assert.equal(levels.length,8);
  levels.forEach((level,i)=>{
    assert.ok(level.time <= 1300);
    if(i) assert.ok(level.skill > levels[i-1].skill);
  });
});
