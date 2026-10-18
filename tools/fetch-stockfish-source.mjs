// Exact gitHead published with stockfish.js@10.0.2; retained for GPL source delivery.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const revision = 'e105072e84cf8ee5dd5219e2c5be29c3b8bf8a5a';
const url = 'https://codeload.github.com/lichess-org/stockfish.js/tar.gz/' + revision;
const response = await fetch(url);
if (!response.ok) throw new Error('Source download failed: ' + response.status);
const bytes = Buffer.from(await response.arrayBuffer());
await mkdir('vendor/source', {recursive:true});
await writeFile('vendor/source/stockfish-10.0.2.tar.gz',bytes);
await writeFile('vendor/source/README.txt','Stockfish.js 10.0.2 corresponding source, including build.sh and Dockerfile.\nRevision: '+revision+'\nSource: '+url+'\nSHA-256: '+createHash('sha256').update(bytes).digest('hex')+'\n');
console.log('Stockfish corresponding source bundled: '+bytes.length+' bytes');
