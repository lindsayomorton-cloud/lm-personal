# Lindsay Morton — personal site

A whimsical, single-page personal and résumé site.

- `index.html` is the built site. Open it directly or serve the folder (`python3 -m http.server`).
- `src/` holds the source: CSS in numbered layers, the page markup (`page.html`), project data (`60-data.js`), and behavior (`70-main.js`, `80-resume-bot.js`).
- `python3 build.py` rebuilds `index.html` from `src/`.
- `assets/` holds images and sounds; the project folders (`pollinate/`, `vans-cove/`, `wildkind/`, `sanctuary/`, and others) are the live previews and sub-sites the main page links to.

## Rainbow Solitaire (bottom of the page)
- Engine: `src/90-sol-engine.js` (pure Klondike rules, rules v1; the top of a pile is the last array element; round-robin triangular deal; stock = deck[28..51]).
- Deals: `src/91-sol-deals.js` ships 185 Easy, 186 Medium (draw 1) and 204 Expert (draw 3) starting decks. Every one was generated with mulberry32 + Fisher-Yates, solved under the exact rules, and its winning path replayed through the engine. Full records with solutions and metrics: `solitaire-deals.json`. Easy/Medium is a difficulty *estimate* from solver metrics, not a guarantee.
- UI: `src/92-solitaire.js` + `src/55-solitaire.css`. Hints and the rescue shuffle run the solver in a Web Worker (falls back to a small in-page search).
- Regenerate deals: `node tools/solitaire-generate-deals.js`. Run engine tests: `node tools/solitaire-engine-tests.js`.
- Not done yet (vs. the full brief): 1,000 deals per mode, a calibrated difficulty model from human playtests, a broader rescue that touches waste order, an IndexedDB history.
