import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const files = ['index.html','config.xml','css','js','assets','vendor','LICENSE','THIRD_PARTY.md'];
await mkdir('dist', { recursive: true });
for (const file of files) await cp(file, 'dist/' + file, { recursive: true });
const hashes = {};
for (const file of ['vendor/chess.js','vendor/stockfish.js']) {
  hashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
}
await writeFile('dist/integrity.json', JSON.stringify(hashes, null, 2) + '\n');
const result = spawnSync('python', ['tools/package.py'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
console.log('Built dist/ and dist/orbit-chess-unsigned.wgt. Sign with Tizen Studio to install.');
