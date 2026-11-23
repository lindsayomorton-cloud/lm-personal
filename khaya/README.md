# Khaya Biosciences — website (v2)

Static, single-file build of the Khaya Biosciences homepage.

## Deploy on GitHub Pages
1. Create a repo and add the contents of this folder (`index.html` at the root).
2. Settings → Pages → Deploy from branch → `main` / root.

## Notes
- `index.html` is self-contained (runtime, styles and local backgrounds are inlined).
- Product, team, partner and icon images, plus the hero video, load from khaya.bio and its existing media storage. Copy them into an `assets/` folder and update the URLs if you want the site fully independent.
- The contact section links to info@khaya.bio; there is no form backend.
