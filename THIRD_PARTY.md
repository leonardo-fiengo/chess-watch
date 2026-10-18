# Third-party software

Orbit Chess is distributed under GPL-3.0-or-later; see `LICENSE`.

## chess.js 0.10.3

- Jeff Hlywa and contributors, BSD-2-Clause.
- Source: https://github.com/jhlywa/chess.js/tree/v0.10.3
- License: `vendor/chess-LICENSE.txt`.
- The complete, unmodified JavaScript source is `vendor/chess.js`.
- This ES5-compatible release is pinned deliberately for older Tizen web runtimes.

## Stockfish.js 10.0.2

- Stockfish by Tord Romstad, Marco Costalba, Joona Kiiski, Gary Linscott and contributors; multi-variant port by Daniel Dugovic; JavaScript compilation by Niklas Fiekas.
- License: GNU GPL v3, `vendor/stockfish-LICENSE.txt`.
- Source project: https://github.com/lichess-org/stockfish.js
- npm package: https://www.npmjs.com/package/stockfish.js/v/10.0.2
- Exact published git revision: `e105072e84cf8ee5dd5219e2c5be29c3b8bf8a5a`.
- Corresponding source, build script and Dockerfile: `vendor/source/stockfish-10.0.2.tar.gz` (included in the widget).
- Source URL and SHA-256: `vendor/source/README.txt`.
- `vendor/stockfish.js` is the unmodified asm.js worker from that npm release. It is intentionally used in preference to modern, larger NNUE/WASM engines for compatibility with older Tizen watches. It is not the latest Stockfish release.

All interface icons and chess piece SVGs were created for this project. System fonts are used; there are no remote font or image dependencies.
