import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('vendor', { recursive: true });
await copyFile('node_modules/chess.js/chess.js', 'vendor/chess.js');
await copyFile('node_modules/chess.js/LICENSE', 'vendor/chess-LICENSE.txt');
await copyFile('node_modules/stockfish.js/stockfish.js', 'vendor/stockfish.js');
await copyFile('node_modules/stockfish.js/Copying.txt', 'vendor/stockfish-LICENSE.txt');
await copyFile('node_modules/stockfish.js/Copying.txt', 'LICENSE');
console.log('Pinned chess.js and Stockfish bundled for offline use.');
