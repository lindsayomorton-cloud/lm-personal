# Lindsay Morton — personal site

A whimsical, single-page personal and résumé site.

- `index.html` is the built site. Open it directly or serve the folder (`python3 -m http.server`).
- `src/` holds the source: CSS in numbered layers, the page markup (`page.html`), project data (`60-data.js`), and behavior (`70-main.js`, `80-resume-bot.js`).
- `python3 build.py` rebuilds `index.html` from `src/`.
- `assets/` holds images and sounds; the project folders (`pollinate/`, `vans-cove/`, `wildkind/`, `sanctuary/`, and others) are the live previews and sub-sites the main page links to.
