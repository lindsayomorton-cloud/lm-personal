# Vibes Candy — Homepage

Static homepage with two versions (A and B), switchable from the bar at the top of the page.

## Run locally
Serve the folder with any static server (opening the file directly may block local assets):

```
npx serve .
# or
python3 -m http.server
```

Then open http://localhost:3000 (or :8000).

## Deploy on GitHub Pages
1. Push this folder's contents to a repo.
2. Settings → Pages → Source: `main` branch, `/ (root)`.
3. The site is served from `index.html`.

## Structure
- `index.html` — the page
- `support.js` — page runtime (required)
- `assets/` — images
- `_ds/` — design-system stylesheet and bundle

## Notes
- Fonts load from Google Fonts (Lilita One, Figtree).
- Set the Amazon link by editing `amazonUrl` in `index.html`.
- "Find in Stores", "Read our story", "Learn more" and footer links are placeholders (`#`).
