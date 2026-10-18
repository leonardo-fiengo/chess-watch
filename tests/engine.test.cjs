const { test } = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../js/engine.js');
function fakeWorker() {
  return {sent:[],terminated:false,postMessage(message){this.sent.push(message);},terminate(){this.terminated=true;},emit(line){this.onmessage({data:line});}};
}
const level = {skill:5,depth:3,time:200};
test('UCI handshake precedes search; level and budget reach engine', () => {
  const worker = fakeWorker(), engine = new Engine(()=>worker);
  let returned;
  engine.search('position startpos',level,m=>returned=m,assert.fail);
  assert.deepEqual(worker.sent,['uci']);
  worker.emit('uciok');
  assert.ok(worker.sent.includes('setoption name Hash value 8'));
  worker.emit('readyok');
  assert.deepEqual(worker.sent.slice(-3),['setoption name Skill Level value 5','position startpos','go depth 3 movetime 200']);
  worker.emit('bestmove e2e4 ponder e7e5');
  assert.equal(returned,'e2e4');
  assert.equal(engine.timer,null);
  engine.cancel();
});
test('canceling a search terminates its worker and ignores late replies', () => {
  const first = fakeWorker(), second = fakeWorker();
  let created = 0, called = 0;
  const engine = new Engine(()=>++created === 1 ? first : second);
  engine.search('position startpos',level,()=>called++,assert.fail);
  engine.cancel();
  assert.equal(first.terminated,true);
  engine.search('position startpos moves d2d4',level,()=>called++,assert.fail);
  first.emit('bestmove e2e4');
  assert.equal(called,0);
  second.emit('uciok');second.emit('readyok');second.emit('bestmove d7d5');
  assert.equal(called,1);
  engine.cancel();
});
test('worker failure is recoverable and does not substitute a fake bot', () => {
  const worker = fakeWorker(), engine = new Engine(()=>worker);
  let error = '';
  engine.search('position startpos',level,assert.fail,m=>error=m);
  worker.onerror({preventDefault(){}});
  assert.match(error,/could not start/);
  assert.equal(engine.worker,null);
  assert.equal(engine.pending,null);
});
