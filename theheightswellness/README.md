# Heights Wellness & Aesthetics — website

Static site. No build step. Open `index.html` or serve the folder with any static host (GitHub Pages, Netlify, Vercel).

## Run locally
```
npx serve .
# or
python3 -m http.server 8000
```
Pages must be served over http(s) (not opened as `file://`) so shared components load.

## Deploy to GitHub Pages
1. Push this folder to a repo.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Site loads at `https://<user>.github.io/<repo>/`.

## Pages
| File | Page |
| --- | --- |
| `Heights Wellness v2.dc.html` | Home (`index.html` redirects here) |
| `About.dc.html` | About / founder |
| `Services.dc.html` | All treatments |
| `Service.dc.html?s=<slug>` | Service detail — `iv`, `peptides`, `nad`, `vitamins`, `red-light`, `pelvic-floor`, `body-sculpting`, `aesthetics` |
| `Memberships.dc.html` | IV memberships |
| `FAQ.dc.html` | FAQ |
| `Book.dc.html?service=<slug>` | Booking request |
| `Contact.dc.html` | Contact, hours, map |
| `Policies.dc.html?p=appointment\|privacy\|terms` | Policies |

## Shared files
- `HWHeader.dc.html`, `HWFooter.dc.html` — header/footer used by all inner pages
- `hw-services.js` — all service content, images, icons (edit copy here)
- `hw-polish.js` — grain texture, pale guide lines, scroll float-in animations
- `support.js` — component runtime
- `image-slot.js` — image component
- `_ds/` — base design tokens (Organic)

## Before launch
- [ ] Connect Book, Contact and newsletter forms to a real backend / booking tool (they currently show a confirmation only)
- [ ] Clinical/legal review of all service copy (especially peptides, NAD+, vitamin boosts)
- [ ] Confirm hours (homepage hours used: Mon–Thu 9–6, Fri 9–3, Sat 10–4, Sun 11–3)
- [ ] Confirm membership pricing and inclusions
- [ ] Add real testimonials (homepage carousel has placeholders)
- [ ] Replace Privacy/Terms summaries with full legal text (currently link to existing site)
- [ ] Images load from the Squarespace CDN — download and self-host before the old site is shut down
- [ ] Optional: rename `Heights Wellness v2.dc.html` → `index.html` and update links for cleaner URLs
