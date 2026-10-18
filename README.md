# Orbit Chess

A standalone HTML/CSS/JavaScript chess app for a **round Tizen watch**, with a larger browser layout for development and play. Built for 360 × 360 displays (including the 45 mm Galaxy Watch3) and scaled to other square sizes. Requires Tizen 4.0 or later. Wear OS watches require a different package format.

## Play locally

The `vendor/` folder already contains the runtime dependencies. No installation or internet connection is needed to run the app:

```powershell
node tools/serve.mjs
```

Open **http://localhost:4173**. Choose **Watch preview** to interact with a circular 360 × 360 version. Its saved game is separate from the main game. A direct watch view is available at `http://localhost:4173/?watch=1`; resize that viewport to 360 × 360 or 450 × 450.

Use an HTTP server for desktop development; browsers commonly block workers opened directly from `file://`. The installed Tizen widget uses packaged local assets and works offline, including on first launch. The browser version has no service worker: the local server must remain running, and reopening a remote-hosted copy offline is not supported.

## Controls

- **Play the bot:** play Stockfish as White or Black. The bot opens when you choose Black.
- **Play solo:** control both sides for practice, or pass the watch between two players.
- Choose a mode/color, then select **New game**. Replacing an ongoing game asks for confirmation. Difficulty changes apply immediately, restarting a pending search if needed.
- Tap a piece and then a highlighted legal destination. Castling, en passant, promotion to queen/rook/bishop/knight, checkmate and draws are handled by chess.js.
- **Undo** takes back one move in solo mode, or your last turn and the bot reply in bot mode. **Flip** changes board orientation.
- Games and complete move history save automatically in local storage. Saved repetition state and undo history survive app restarts. Desktop **Export PGN** downloads the game.
- Keyboard: Tab into the board, arrow keys to move focus, Enter/Space to select, Escape to close or deselect.

On the watch:

- The three lower controls are Undo, Flip, and Menu.
- Turn the bezel to highlight movable pieces. Tap the text **above the board** to select. Turn again to highlight a legal destination and tap the text again to move. Touch-only selection also works.
- In menus and dialogs, the bezel scrolls. Touch scrolling is also available.
- The hardware Back key closes a dialog/menu, then clears a selection; from the unselected board it saves and exits.
- If the engine fails, tap the status above the board to retry. Solo play remains available through Menu → Play solo → New game.

## Tizen build and installation

An unsigned W3C widget is generated at **`dist/orbit-chess-unsigned.wgt`**. It **must be signed with a valid Tizen/Samsung certificate profile before device installation**. No signing identity or device was configured in this workspace.

**Installation prerequisite, checked 18 October 2026:** A [20 May 2026 reply on Samsung's developer forum](https://forum.developer.samsung.com/t/detail?id=10203-Request-a-Tizen-development-certificate-%E2%80%93-SM-R800) states that official Tizen wearable certificate generation is no longer available and that the extended support ended in March 2026. Installing Tizen Studio does not establish that you can obtain a new wearable certificate. For the standard physical-device workflow below, first confirm that you already have a valid Samsung signing profile whose distributor certificate includes your watch. This project does not provide one. Downloading the unsigned widget directly onto the watch will not install it.

Community installers do not currently establish an installation path for this unsigned project. The [TizenInstaller author's September/October 2026 guide and replies](https://xdaforums.com/t/guide-tool-release-new-method-installing-apps-watch-faces-on-all-tizen-watches-easier-than-ever.4803298/) distinguish previously Samsung-signed Galaxy Store packages from newly created apps; the author confirms that newly created Tizen Studio apps still fail. Reports of restored Store apps should not be treated as proof that this widget can be installed. No working certificate-free installation of Orbit Chess has been verified.

Rebuild the widget (Node.js and Python 3 required):

```powershell
node tools/build.mjs
```

This copies only runtime files, licenses and the Stockfish source archive into `dist/`, and creates the unsigned ZIP-format `.wgt`. It does not include development dependencies or tests. `config.xml` declares the wearable profile, Tizen 4.0 minimum and hardware-key support. There is no internet privilege, background service, account or network endpoint.

To install using Tizen Studio **if you already have a valid certificate profile for the watch**:

1. Install the wearable web tooling and the appropriate certificate extension; import/select your existing valid signing profile.
2. Import `dist/` as an existing Tizen Web project (or create a Wearable Web Basic project and replace its contents with the files in `dist/`, excluding the unsigned `.wgt`).
3. Select a round wearable emulator or connect a supported Tizen watch with debugging enabled. For physical devices, configure the distributor certificate for that device as required by your tooling.
4. Build/package with the selected certificate profile, then Run As → Tizen Web Application.

With a configured Tizen CLI, package the copied web project using your existing signing profile:

```powershell
tizen package -t wgt -s YOUR_PROFILE -- dist
```

Install the resulting **signed** widget using Tizen Studio Device Manager. Certificate validity and device registration must be confirmed before attempting this route; legacy documentation describing fresh wearable certificate issuance is not evidence that the service remains available.

## Watch performance and compatibility

- Native DOM board: 64 reusable buttons and inline SVG pieces. No React, UI framework, animation loop, remote fonts or image downloads.
- The board occupies 68% of the display diameter, keeping all four corners inside the circle. At 360 px, squares are about 31 px; bezel selection provides an alternative to tapping these small squares. Surrounding watch buttons are at least 44 px.
- App scripts use ES5 syntax. Watch layout uses flexbox and explicit dimensions instead of CSS grid or `aspect-ratio`.
- Bundled **Stockfish.js 10.0.2** is a single-threaded asm.js worker with an upstream 32 MB memory cap; Hash is set to 8 MB. This older engine and chess.js 0.10.3 are intentional compatibility choices.
- Bot work runs off the UI thread. Search stops on either depth or time limit; a 20-second watchdog handles startup/search failure. A completed worker stays idle for reuse. Undo, a new game, app hiding, and exit terminate the worker so stale replies cannot alter the board.
- Skill levels are relative difficulty settings, **not Elo estimates**. Time/depth caps favor responsiveness and battery life; level 8 is not unrestricted Stockfish strength.

| Level | Name | Stockfish skill | Max depth | Move budget |
|---|---|---:|---:|---:|
| 1 | First steps | 0 | 1 | 100 ms |
| 2 | Easygoing | 2 | 2 | 150 ms |
| 3 | Casual | 5 | 3 | 200 ms |
| 4 | Thoughtful | 8 | 5 | 350 ms |
| 5 | Challenging | 11 | 7 | 500 ms |
| 6 | Advanced | 14 | 9 | 700 ms |
| 7 | Expert | 17 | 11 | 950 ms |
| 8 | Masterful | 20 | 13 | 1300 ms |

## Development and checks

Runtime dependencies are pinned, copied without modification, and committed in `vendor/`. To restore development dependencies or refresh the copies:

```powershell
npm ci --ignore-scripts
npm run vendor
npm test
npm run test:browser
npm run build
```

Browser tests use a locally available Playwright Chromium on Windows when present. Otherwise run `npx playwright install chromium`, or set `CHROMIUM_PATH` to a compatible Chromium executable. The server listens on loopback only.

Unit tests cover move validation, castling, en passant, underpromotion, draws, history restoration, bot-turn undo and engine cancellation/failure. Browser tests exercise the real Stockfish worker, difficulty/color selection, persistence, offline engine play after worker initialization, retry, promotion, checkmate, the circular safe area, and bezel/Back events. Desktop and watch screenshots are generated in `test-results/`.

**Validation limit:** Browser tests simulate the display and Tizen events in Chromium. Physical-watch frame rate, memory, battery consumption, signing and on-device execution must still be checked with your watch or Tizen emulator; no device or Tizen SDK was available here.

## Source layout

- `js/game.js`: chess.js adapter, rules state, saved history, level definitions.
- `js/engine.js`: asynchronous UCI worker lifecycle.
- `js/board.js`, `js/pieces.js`: board rendering and original vector pieces.
- `js/app.js`, `js/dialog.js`: interaction, persistence, menus and lifecycle.
- `js/layout.js`, `css/`: responsive desktop/watch presentation.
- `config.xml`: Tizen wearable manifest.
- `vendor/`: chess.js, Stockfish, licenses and matching engine source.

See [THIRD_PARTY.md](THIRD_PARTY.md) for the open-source notices and matching source archive. Orbit Chess is licensed under GPL-3.0-or-later.

Implementation references: [chess.js API](https://github.com/jhlywa/chess.js/tree/v0.10.3), [Stockfish.js](https://github.com/lichess-org/stockfish.js), [Samsung rotary events](https://developer.samsung.com/sdp/blog/en/2019/10/08/use-tizen-to-enable-galaxy-watch-rotary-events), and [Tizen configuration reference](https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/reference/config-xml.md).
